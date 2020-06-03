import { suspendify, suspendifyMethodOrGetter } from "./suspendify";
import { Suspendified } from "./Suspendified";
import { PROVIDER } from "./symbols/PROVIDER";
import { ProviderFn } from "./Provider";
import { refDeterministic } from "./utils/refDeterministic";
import { AbstractClass, Class } from "./Class";
import { getWrappedProps } from "./utils/getWrappedProps";

export abstract class DataStore<TMutation> {
  /*static get [PROVIDER](): ProviderFn {
    return createDataStoreProvider(this as any);
  }*/
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
  abstract mutate(mutations: TMutation[]): Promise<any[]>;
}

function suspendifyDataStore<T extends DataStore<any>>(ds: T) {
  // TODO: Suspend this explicitely.
  const suspendifyingProps = getWrappedProps(
    ds,
    (fn, propName, type) =>
      propName === "mutate"
        ? suspendifyActionMethod(fn) //
        : suspendifyMethodOrGetter(fn),
    true
  );
  return Object.create(ds, suspendifyingProps) as Suspendified<T>;
}

type DataStoreFlavor<T> = {
  orig: T;
  suspense: SuspendifiedDataStore<T>;
  promise: T;
};

type SuspendifiedDataStore<T> = Suspendified<T>; // TODO: Define this explicitely!

/*function _createDataStoreProvider(
  ConcreteDataStore: Class<DataStore<any>>
): ProviderFn {
  return (next) => (_, WantedClass) => {
    return next(
      _,
      ConcreteDataStore.prototype instanceof WantedClass ||
        ConcreteDataStore === WantedClass
        ? createDataStoreClass(ConcreteDataStore)
        : WantedClass
    );
  };
}
const createDataStoreProvider = refDeterministic(_createDataStoreProvider);

function createDataStoreClass(ConcreteDataStore: Class) {
  class WrappedDataStore extends ConcreteDataStore {
    mutate(mutations: any[]): Promise<any[]> {
      // TODO: Invalidera cache.
      return super.mutate(mutations);
    }
  }
  // TODO: enumrera alla parent metoder utom mutate och gör det som suspendify gör cachningsmässigt.
  // ELLER NU VET JAG! Ta bort all denna kod och gör allt i suspendify istället!
  return WrappedDataStore;
}
*/

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
