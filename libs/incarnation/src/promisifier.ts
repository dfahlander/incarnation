import { IsLazy } from "./IsLazy.js";
import { IsAdaptive } from "./IsAdaptive.js";
import { getWrappedProps } from "./utils/getWrappedProps.js";
import { Promisified } from "./Promisified.js";
import { promisifySuspenseCall } from "./suspendify.js";

export function promisifyMethodOrGetter(fn: (...args: any[]) => any) {
  return function (...args: any[]) {
    const rv = promisifySuspenseCall(this, args, fn);
    if (rv && rv[IsLazy]) {
      return promisifyIfAdaptive(rv);
    } else {
      return Promise.resolve(rv).then(promisifyIfAdaptive);
    }
  };
}
/*export function promisifyMethodOrGetter(fn: (...args: any[]) => any) {
  function preRun(...args: any[]) {
    const parentAction = currentAction;
    const rootAction: ActionState = {
      results: [],
      pointer: 0,
      subAction: null,
    };
    //const runAgain = bindToContext(run, Context.current);
    const rerunWhenPromiseResolves = (thenable: PromiseLike<any>) =>
      thenable.then(
        () => {
          return rerun();
        },
        (error) =>
          // Allow also async methods to call suspending apis
          error && typeof error.then === "function"
            ? rerunWhenPromiseResolves(error)
            : Promise.reject(error)
      );
    return rerun();
    function rerun() {
      let rv;
      try {
        setCurrentAction(rootAction);
        rootAction.pointer = 0;
        rv = fn.apply(this, args);
      } catch (x) {
        if (x && typeof x.then === "function") {
          return rerunWhenPromiseResolves(x);
        }
        throw x;
      } finally {
        setCurrentAction(parentAction);
      }
      if (rv && rv[IsLazy]) {
        return promisifyIfAdaptive(rv);
      } else {
        return Promise.resolve(rv).then(promisifyIfAdaptive);
      }
    }
  }

  return preRun;
}*/

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
      obj.$flavors.orig || obj,
      (origFn) => promisifyMethodOrGetter(origFn),
      true
    );
    promisified = Object.create(obj, promisifyingProps) as Promisified<T>;
    obj.$flavors.promise = promisified;
  }
  return promisified;
}
