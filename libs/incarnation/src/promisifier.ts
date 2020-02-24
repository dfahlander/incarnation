import { IsLazy } from "./IsLazy";
import { IsAdaptive } from "./IsAdaptive";
import { createProxy } from "./utils/createProxy";
import { Promisified } from "./Promisified";
import { ProvideTarget } from "./ProvideTarget";

export function promisifyMethodOrGetter(fn: (...args: any[]) => any) {
  function run() {
    const rerunWhenPromiseResolves = (p: Promise<any>) =>
      p.then(
        () => run.apply(this, arguments),
        error =>
          // Allow also async methods to call suspending apis
          error && typeof error.then === "function"
            ? rerunWhenPromiseResolves(error)
            : Promise.reject(error)
      );

    let rv;
    try {
      rv = fn.apply(this, arguments);
    } catch (x) {
      if (x && typeof x.then === "function") {
        return rerunWhenPromiseResolves(x);
      }
      throw x;
    }
    if (rv[IsLazy]) {
      return promisifyIfAdaptive(rv);
    } else {
      return Promise.resolve(rv).then(promisifyIfAdaptive);
    }
  }

  return run;
}

export function promisifyIfAdaptive(value: any) {
  if (value && value[IsAdaptive]) {
    return promisify(value);
  }
  return value;
}

export function promisify<T extends object>(value: T): Promisified<T> {
  const rv = createProxy(value, origFn =>
    promisifyMethodOrGetter(origFn)
  ) as Promisified<T>;
  rv[ProvideTarget] = value;
  return rv;
}
