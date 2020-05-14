import { getWrappedProps } from "./utils/getWrappedProps";
import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";

function suspendifyMethodOrGetter(fn: (...args: any[]) => any) {
  function run(...args: any[]) {
    const result = fn.apply(this, args);
    if (!result) return result;
    if (typeof result === "object" && typeof result.then === "function") {
      // wait for this promise and store result in cache on query.
      // throw the final promise
    } else {
      return result;
    }
  }
  return run;
}

function suspendifyIfAdaptive(value: any) {
  if (value && value[IsAdaptive]) {
    return suspendify(value);
  }
  return value;
}

function suspendify<T extends object>(obj: T): Suspendified<T> {
  const promisifyingProps = getWrappedProps(obj, (origFn) =>
    suspendifyMethodOrGetter(origFn)
  );
  return Object.create(obj, promisifyingProps) as Suspendified<T>;
}
