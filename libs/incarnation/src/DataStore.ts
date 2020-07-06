import {
  suspendify,
  suspendifyMethodOrGetter,
  getActiveQueries,
  runImperativeAction,
  currentAction,
} from "./suspendify";
import { Suspendified } from "./Suspendified";
import { PROVIDER } from "./symbols/PROVIDER";
import { ProviderFn } from "./Provider";
import { refDeterministic } from "./utils/refDeterministic";
import { AbstractClass, Class } from "./Class";
import { getWrappedProps } from "./utils/getWrappedProps";
import { getEffectiveProps } from "./utils/getEffectiveProps";
import { State, Const } from "./State";
import { OptimisticUpdater } from "./OptimisticUpdater";
import { Mutation } from "./DataStoreTypes";
import { Topic } from "./Topic";
import { MutationQueue } from "./MutationQueue";
import { reduceResult } from "./utils/reduceResult";
import { invalidate } from "./invalidate";

export abstract class DataStore {
  static get [PROVIDER](): ProviderFn {
    return createDataStoreProvider(this as any);
  }
  readonly $flavors: DataStoreFlavor<this>;
  abstract mutate(mutations: Mutation[]): Promise<PromiseSettledResult<any>[]>;
}

function suspendifyDataStore(ds: DataStore) {
  const suspendifyingProps = getWrappedProps(
    ds,
    (fn, propName, type) =>
      propName === "mutate"
        ? suspendifyMutate((ds as unknown) as InternalDataStore)
        : suspendifyQueryMethod(
            fn,
            propName,
            (ds as unknown) as InternalDataStore
          ),
    true
  );
  return Object.create(ds, suspendifyingProps) as Suspendified<DataStore>;
}

interface InternalDataStore extends DataStore {
  $mque: MutationQueue;
  $optimisticUpdater: OptimisticUpdater;
  //$mutationMerger: MutationMerger; // Unmark when we have that type. Use it from suspendifyMutate.
}

function suspendifyMutate(
  //  mutate: (mutations: any[]) => Promise<PromiseSettledResult<any>>,
  ds: InternalDataStore
) {
  const { $mque } = ds;
  return function (mutations: any[]) {
    if (currentAction) {
      return runImperativeAction(
        currentAction,
        ds,
        [mutations],
        $mque.add, // add never touches `this` so don't have to be bound.
        $mque
      );
    } else {
      $mque.add(mutations);
    }
  };
}

function suspendifyQueryMethod(
  fn: (...args: any[]) => any,
  propName: string,
  ds: InternalDataStore
) {
  return suspendifyMethodOrGetter(
    fn,
    ds.$mque,
    ds.$optimisticUpdater?.[propName]
  );
}

type DataStoreFlavor<T> = {
  orig: T;
  suspense: SuspendifiedDataStore<T>;
  promise: T;
};

type SuspendifiedDataStore<T> = Suspendified<T>; // Could do something special if want mutate return void.

function _createDataStoreProvider(
  ConcreteDataStore: Class<DataStore>
): ProviderFn {
  return (next) => (_, WantedClass) => {
    return next(
      _,
      ConcreteDataStore.prototype instanceof WantedClass ||
        ConcreteDataStore === WantedClass
        ? createDataStoreClass(ConcreteDataStore, WantedClass)
        : WantedClass
    );
  };
}
const createDataStoreProvider = refDeterministic(_createDataStoreProvider);

function createDataStoreClass(
  ConcreteDataStore: Class,
  Interface: AbstractClass
) {
  const queryMethodPropDescs = getEffectiveProps(ConcreteDataStore.prototype);
  const queryMethodPropNames = new Set(
    Object.entries(queryMethodPropDescs)
      .filter(
        ([propName, { value, get }]) =>
          propName[0] !== "$" &&
          propName !== "mutate" &&
          typeof (value || get) === "function"
      )
      .map(([propName]) => propName)
  );

  class WrappedDataStore extends (ConcreteDataStore as new () => DataStore)
    implements InternalDataStore {
    $mque = MutationQueue(
      // @ts-ignore (TS believes super.mutate is abstract, but it is not.)
      super.mutate.bind(this),
      this.$$applyMutateResponse.bind(this)
    );
    $optimisticUpdater = OptimisticUpdater(Interface);

    private $$flavors: any;

    get $flavors(): DataStoreFlavor<this> {
      return (
        this.$$flavors ||
        (this.$$flavors = {
          suspense: suspendifyDataStore(this),
          orig: this,
          promise: this,
        })
      );
    }

    private $$applyMutateResponse(
      res: PromiseSettledResult<any>[],
      mutations: Mutation[]
    ) {
      const successfulMutations = mutations.filter(
        (m, i) => res[i].status === "fulfilled"
      );
      const mutationResults = (res.filter(
        (r) => r.status === "fulfilled"
      ) as PromiseFulfilledResult<any>[]).map((r) => r.value);
      for (const propName of queryMethodPropNames) {
        const activeQueries = getActiveQueries(this as any, propName);
        if (activeQueries) {
          for (const query of activeQueries) {
            if (!query.hasResult) {
              // A query may be ongoing. Need to resend it after mutations have been made.
              query.refresh();
            } else {
              // Reset static "invalid" flag. It can be set by reducers in case they are
              // unable to reduce an optimistic result.
              invalidate.invalid = false;
              const newResult = reduceResult(
                query.result,
                query.reducers,
                successfulMutations,
                mutationResults
              );
              query.setResult(newResult); // Set it regardless of invalid flag. It may partially have been reduced.
              if (invalidate.invalid) {
                query.refresh();
              }
            }
          }
        }
      }
    }

    async mutate(mutations: Mutation[]) {
      // @ts-ignore
      const res = await super.mutate(mutations);
      this.$$applyMutateResponse(res, mutations);
      return res;
    }
  }

  return WrappedDataStore;
}
