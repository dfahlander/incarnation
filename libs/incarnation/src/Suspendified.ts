import { IsAdaptive } from "./IsAdaptive";
import { Orig } from "./Orig";
import { Promisified } from "./Promisified";

export type SuspendifiedMethodOrGetter<T> = T extends (
  ...args: infer TArgs
) => infer R // It's a method!
  ? R extends Promise<infer P> // Return value is a promise
    ? (...args: TArgs) => SuspendifiedIfAdaptive<P>
    : (...args: TArgs) => SuspendifiedIfAdaptive<R>
  : SuspendifiedIfAdaptive<T>;

export type SuspendifiedIfAdaptive<T> = T extends IsAdaptive
  ? {
      [M in keyof T]: SuspendifiedMethodOrGetter<T[M]>;
    }
  : T;

export type Suspendified<T> = {
  [M in keyof T]: SuspendifiedMethodOrGetter<T[M]>;
} & {
  $flavors: {
    orig: Orig<T>;
    promise: Promisified<T>;
  };
};
