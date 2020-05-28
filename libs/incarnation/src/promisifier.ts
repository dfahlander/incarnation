import { IsLazy } from "./IsLazy";
import { IsAdaptive } from "./IsAdaptive";
import { getWrappedProps } from "./utils/getWrappedProps";
import { Promisified } from "./Promisified";

export function promisifyMethodOrGetter(fn: (...args: any[]) => any) {
  function run(...args: any[]) {
    const rerunWhenPromiseResolves = (thenable: PromiseLike<any>) =>
      thenable.then(
        () => run.apply(this, args),
        (error) =>
          // Allow also async methods to call suspending apis
          error && typeof error.then === "function"
            ? rerunWhenPromiseResolves(error)
            : Promise.reject(error)
      );

    let rv;
    try {
      rv = fn.apply(this, args);
    } catch (x) {
      if (x && typeof x.then === "function") {
        return rerunWhenPromiseResolves(x);
      }
      throw x;
    }
    if (rv && rv[IsLazy]) {
      return promisifyIfAdaptive(rv);
    } else {
      return Promise.resolve(rv).then(promisifyIfAdaptive);
    }
  }

  return run;
}

export function promisifyIfAdaptive(value: any) {
  if (value && value.$flavors) {
    return promisify(value);
  }
  return value;
}

export function promisify<T extends IsAdaptive>(obj: T): Promisified<T> {
  let promisified = obj.$flavors.promise as Promisified<T> | undefined;
  if (!promisified) {
    const promisifyingProps = getWrappedProps(
      obj,
      (origFn) => promisifyMethodOrGetter(origFn),
      true
    );
    promisified = Object.create(obj, promisifyingProps) as Promisified<T>;
    obj.$flavors.promise = promisified;
    obj[IsLazy] = true;
  }
  return promisified;
}
