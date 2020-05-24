/* Review comments:
 Seems not to be correct.
*/

import { IsAdaptive } from "./IsAdaptive";
import { IsLazy } from "./IsLazy";
import { Orig } from "./Orig";
import { Suspendified } from "./Suspendified";

export type PromisifiedMethodOrGetter<T> = T extends (
  ...args: infer TArgs
) => infer R // It's a method!
  ? R extends IsLazy // Return value is a lazy-type value, like a Collection
    ? (...args: TArgs) => PromisifiedIfAdaptive<R> // Don't promisify directly but if return value is adaptive, promisify it!
    : R extends Promise<infer P> // Return value is already a promise
    ? (...args: TArgs) => Promise<PromisifiedIfAdaptive<P>> // Don't promisify directly but if return value is adaptive, promisify it!
    : (...args: TArgs) => Promise<PromisifiedIfAdaptive<R>> // Return promisified and recursively promisify result
  : PromisifiedIfAdaptive<T>;

export type PromisifiedIfAdaptive<T> = T extends IsAdaptive
  ? {
      [M in keyof T]: PromisifiedMethodOrGetter<T[M]>;
    }
  : T;

export type Promisified<T> = {
  [M in keyof T]: PromisifiedMethodOrGetter<T[M]>;
} & {
  $flavors: {
    orig: Orig<T>;
    suspense: Suspendified<T>;
  };
};
