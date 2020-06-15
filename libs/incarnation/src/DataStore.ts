import { suspendify, suspendifyMethodOrGetter } from "./suspendify";
import { Suspendified } from "./Suspendified";
import { PROVIDER } from "./symbols/PROVIDER";
import { ProviderFn } from "./Provider";
import { refDeterministic } from "./utils/refDeterministic";
import { AbstractClass, Class } from "./Class";
import { getWrappedProps } from "./utils/getWrappedProps";
import { getEffectiveProps } from "./utils/getEffectiveProps";
import { State, Const } from "./State";
import { OptimisticUpdater } from "./OptimisticUpdater";
import { MutationQueue } from "./DataStoreTypes";
import { Topic } from "./Topic";

export abstract class DataStore<
  TMutation extends { type: string } = { type: string }
> {
  static get [PROVIDER](): ProviderFn {
    return createDataStoreProvider(this as any);
  }
  readonly $flavors: DataStoreFlavor<this>;
  abstract mutate(mutations: TMutation[]): Promise<PromiseSettledResult<any>[]>;
}

function suspendifyDataStore<T extends DataStore<any>>(
  ds: T,
  Interface: AbstractClass<DataStore>,
  ConcreteDataStore: Class<DataStore>
) {
  const suspendifyingProps = getWrappedProps(
    ds,
    (fn, propName, type) =>
      propName === "mutate"
        ? suspendifyMethodOrGetter(fn) // Could do something special here if want to return void.
        : suspendifyQueryMethod(
            fn,
            propName,
            (ds as unknown) as InternalDataStore,
            Interface,
            ConcreteDataStore
          ),
    true
  );
  return Object.create(ds, suspendifyingProps) as Suspendified<T>;
}

interface InternalDataStore extends DataStore<any> {
  $mque: MutationQueue;
}

function suspendifyQueryMethod(
  fn,
  propName: string,
  ds: InternalDataStore,
  Interface: AbstractClass<DataStore>,
  ConcreteDataStore: Class<DataStore>
) {
  const optimisticUpdater = OptimisticUpdater(Interface); // TODO: Make sure we are in the right context. See comments in use.ts
  return suspendifyMethodOrGetter(fn, ds.$mque, optimisticUpdater[propName]);
  /*const queries = suspFn.$queries;
  // TODO: memify the function so it doesnt have to compute the reduction every time.
  // NO: This is being handled within suspendifyMethodOrGetter!
  const mutationReducer = function (...args: any[]) {
    const result = suspFn.apply(this, args); // TODO: this could equally well be null?
    const [reducedResult, invalid] = reduce(result);
    if (invalid) 
  };
  return mutationReducer;
  */
}

type DataStoreFlavor<T> = {
  orig: T;
  suspense: SuspendifiedDataStore<T>;
  promise: T;
};

type SuspendifiedDataStore<T> = Suspendified<T>; // Could do something special if want mutate return void.

function _createDataStoreProvider(
  ConcreteDataStore: Class<DataStore<any>>
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

function getEmptyArray(): any[] {
  return [];
}
function getFalse() {
  return false;
}

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
    $mque = Const(() => ({
      beingSent: [],
      queued: [],
      topic: new Topic(),
    }));

    private $$flavors: any;

    get $flavors(): DataStoreFlavor<this> {
      return (
        this.$$flavors ||
        (this.$$flavors = {
          suspense: suspendifyDataStore(this, Interface, ConcreteDataStore),
          orig: this,
          promise: this,
        })
      );
    }

    /*$$flush() {
      const {$mque} = this;
      $mque.beingSent = $mque.beingSent.concat($mque.queued);
      $mque.queued = [];

      // Todo: Try finding an OptimisticUpdater(Interface)
      for (const propName of queryMethodPropNames) {
        const activeQueries = getActiveQueries(this as any, propName);
        if (activeQueries) {
          for (const query of activeQueries) {
            query.refresh(); // This is the default unless specified by optimisticupdater
          }
        }
      }
    }*/

    mutate(mutations: any[]): any {
      // @ts-ignore
      const res = super.mutate(mutations);
      if (res && typeof res.then === "function") {
        return res.then((res: any[]) => {
          this.$$applyMutations(mutations);
          return res;
        });
      }
      this.$$applyMutations(mutations);
      return res;
    }
  }

  return WrappedDataStore;
}

/*
class Apa extends DataStore<{ type: string }> {
  async mutate(mutations: { type: string }[]) {
    return [2];
  }
}
import { use } from "./use";
import { include } from "./include";
use(Apa).mutate([]);
include(Apa).mutate([]);
*/
