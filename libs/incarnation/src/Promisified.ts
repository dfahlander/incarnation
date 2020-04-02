/* Review comments:
 Seems not to be correct.

 Problem: If we have
  {
    getClient1(id): FooClientSuspense
    getClient2(id): Promise<FooClientSuspense>;
  }
 ...we get
  {
    getClient1(id): Promise<FooClientPromised> // OK!
    getClient2(id): Promise<FooClientSuspense>
  }
  ... but we should get:
  {
    getClient1(id): Promise<FooClientPromised> // OK!
    getClient2(id): Promise<FooClientPromised>
  }
*/

import { IsAdaptive } from "./IsAdaptive";
import { IsLazy } from "./IsLazy";

export type PromisifiedMethodOrGetter<T> = T extends (
  ...args: infer TArgs
) => infer R // It's a method!
  ? R extends IsLazy // Return value is a lazy-type value, like a Collection
    ? (...args: TArgs) => PromisifiedIfAdaptive<R> // Don't promisify directly but if return value is adaptive, promisify it!
    : R extends Promise<any> // Return value is already a promise
    ? (...args: TArgs) => PromisifiedIfAdaptive<R> // Don't promisify directly but if return value is adaptive, promisify it!
    : (...args: TArgs) => Promise<PromisifiedIfAdaptive<R>> // Return promisified and recursively promisify result
  : PromisifiedIfAdaptive<T>;

export type PromisifiedIfAdaptive<T> = T extends IsAdaptive
  ? {
      [M in keyof T]: PromisifiedMethodOrGetter<T[M]>;
    }
  : T;

export type Promisified<T> = {
  [M in keyof T]: PromisifiedMethodOrGetter<T[M]>;
};
