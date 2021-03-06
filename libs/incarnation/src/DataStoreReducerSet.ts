import { DataStore } from "./DataStore.js";

type DataStoreReducerSpec<TMutation extends { type: string | number }, R> = {
  [MutationTypeString in TMutation["type"]]?: (
    prev: R,
    op: TMutation extends { type: MutationTypeString } ? TMutation : never,
    opResult?: any
  ) => R;
};

export type DataStoreReducerSet<T = DataStore> = T extends {
  mutate(mutations: Array<infer TMutation>): Promise<any>;
}
  ? TMutation extends { type: string | number }
    ? {
        [P in Exclude<keyof T, keyof DataStore>]?: T[P] extends (
          ...args: infer A
        ) => Promise<infer R>
          ? (...args: A) => DataStoreReducerSpec<TMutation, R>
          : never;
      }
    : never
  : never;

/*export function OptimisticUpdater<T extends DataStore>(
  Class: AbstractClass<T>,
  declaration: OptimisticUpdater<T>
): Class<OptimisticUpdater<T>>;
export function OptimisticUpdater<T extends DataStore>(
  Class: AbstractClass<T>
): OptimisticUpdater<T>;
export function OptimisticUpdater(DataStoreClass, declaration?) {
  if (typeof this === "object") return; // Constructed via new
  if (!declaration) {
    // Caller wants to inject an instance
    return inject(getSpecificGenericType(OptimisticUpdater, DataStoreClass));
  }
  // Caller declares a provider of the specific generic type OptimisticUpdater(DataStoreClass)
  const RClass = class extends getSpecificGenericType(
    OptimisticUpdater,
    DataStoreClass
  ) {};
  Object.assign(RClass.prototype, declaration);
  return RClass;
}*/

/*
//
// Below is just type-testing:
//

interface BollMutation {
  type: "boll";
  id: string;
}
interface HyllaMutation {
  type: "hylla";
  key: number;
}
type Mut = BollMutation | HyllaMutation;

class MyDataStore extends DataStore {
  async query(name: string, age: number): Promise<string[]> {
    return [];
  }
  async count(name: string): Promise<number> {
    return 3;
  }
  async ulla(gugu: number): Promise<boolean> {
    return false;
  }
  async mutate(mutations: Mut[]) {
    return Promise.allSettled(mutations.map((mut) => fetch(mut.type)));
  }
}

const opu = OptimisticUpdater(MyDataStore);
const opuHej = opu.count!("hej");

import { invalidate } from "./invalidate";

export const DBStoreOU = OptimisticUpdater(MyDataStore, {
  query: (name, number) => ({
    boll: (result, op) => [""],
    hylla: (result, op) => {
      if (op.key === 1) {
        // We don't know how to derive a result from this operation
        return invalidate(result);
      }
      if (op.key === 2) return result;
      return result.concat([op.type]);
    },
  }),

  ulla: (x) => ({
    boll: (result, op) => result,
    hylla: (result, op) => true,
  }),

  count(name: string) {
    return {
      boll(result, op) {
        return op.id, result + 1;
      },
      hylla(result, op) {
        return result + op.key;
      },
    };
  },
});
*/
