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
  if (value && value[IsAdaptive]) {
    return promisify(value);
  }
  return value;
}

export function promisify<T extends object>(obj: T): Promisified<T> {
  const promisifyingProps = getWrappedProps(obj, (origFn) =>
    promisifyMethodOrGetter(origFn)
  );
  return Object.create(obj, promisifyingProps) as Promisified<T>;
}

export function promisified<T extends object>(instance: T): Promisified<T> {
  let promisified = instance["$async"];
  if (!promisified) {
    promisified = promisify(instance);
    instance["$async"] = promisified;
  }
  return promisified;
}
