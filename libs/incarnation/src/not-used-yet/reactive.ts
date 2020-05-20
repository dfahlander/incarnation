import { IsLazy } from "../IsLazy";
import { IsAdaptive } from "../IsAdaptive";
import { getWrappedProps } from "../utils/getWrappedProps";
import {
  Observable,
  ObservableConstructor,
  SubscriptionObserver,
} from "./Observable";
import { CurrentExecution, Execution } from "../CurrentExecution";
import { ActiveQuery } from "../use";
import { CircularLinkedSubscriber, Topic } from "../Topic";

export type ReactiveMethodOrGetter<T> = T extends (
  ...args: infer TArgs
) => infer R // It's a method!
  ? R extends IsLazy // Return value is a lazy-type value, like a Collection
    ? (...args: TArgs) => ReactiveIfAdaptive<R> // Don't observify directly but if return value is adaptive, observify it!
    : R extends Observable<infer O> // Return value is already an observable
    ? (...args: TArgs) => Observable<ReactiveIfAdaptive<O>> // Don't observify directly but if return value is adaptive, observify it!
    : (...args: TArgs) => Observable<ReactiveIfAdaptive<R>> // Return promisified and recursively promisify result
  : ReactiveIfAdaptive<T>;

export type ReactiveIfAdaptive<T> = T extends IsAdaptive
  ? {
      [M in keyof T]: ReactiveMethodOrGetter<T[M]>;
    }
  : T;

export type Reactive<T> = {
  [M in keyof T]: ReactiveMethodOrGetter<T[M]>;
};

export function observifyMethodOrGetter(
  fn: (...args: any[]) => any,
  Observable: ObservableConstructor
) {
  function proxy(...args: any[]) {
    const thiz = this;
    let lastResult = null;
    let status: "pending" | "error" | "success" = "pending";
    let closed = false;
    const topic = new Topic();
    let innerSubscriptions: {
      query: ActiveQuery;
      node: CircularLinkedSubscriber;
    }[] = [];
    topic.hasSubscribersChanged = () => {
      if (!topic.hasSubscribers) {
        if (!closed) {
          innerSubscriptions.forEach(({ query, node }) =>
            query.topic.unsubscribe(node)
          );
          innerSubscriptions = [];
          closed = true;
        }
      }
    };
    run();

    function subscribe(observer: SubscriptionObserver<any>): () => void {
      const node = topic.subscribe(() => {
        if (status === "success") {
          observer.next(lastResult);
        } else {
          observer.error(lastResult);
        }
      });
      return () => topic.unsubscribe(node);
    }

    if (
      status === "pending" ||
      (status === "success" && (!lastResult || !lastResult[IsLazy]))
    ) {
      // Returning a non-lazy value or status is pending. Must return Observable.
      return new Observable(subscribe);
    } else if (status === "error") {
      // Error. Nothing is subscribed to yet. Just throw it.
      throw lastResult;
    } else {
      // Lazy value returned. Return it as is, or maybe convert the async flavour of it:
      return observifyIfAdaptive(lastResult, Observable);
    }

    function run() {
      if (closed) return;
      const rerunWhenPromiseResolves = (thenable: PromiseLike<any>) =>
        thenable.then(run, (error) =>
          // Allow also async methods to call suspending apis
          error && typeof error.then === "function"
            ? rerunWhenPromiseResolves(error)
            : Promise.reject(error)
        );

      let rv: any;
      const parentExecution = CurrentExecution.current;
      const { queries } = (CurrentExecution.current = {
        queries: [],
      } as Execution);
      try {
        rv = fn.apply(thiz, args);
        CurrentExecution.current = parentExecution;
      } catch (x) {
        CurrentExecution.current = parentExecution;
        if (x && typeof x.then === "function") {
          return rerunWhenPromiseResolves(x);
        }
        status = "error";
        lastResult = x;
        topic.notify();
        return;
      }
      const value = rv;
      if (status !== "success" || lastResult !== value) {
        status = "success";
        lastResult = value;
        topic.notify();
      }
      let reexecuted = false;
      const onNotify = function () {
        if (closed) return;
        innerSubscriptions.forEach(({ query, node }) =>
          query.topic.unsubscribe(node)
        );
        innerSubscriptions = [];
        if (!reexecuted) {
          reexecuted = true;
          run();
        }
      };
      innerSubscriptions = queries.map((query) => ({
        query,
        node: query.topic.subscribe(onNotify),
      }));
    }
  }
  return proxy;
}

export function observifyIfAdaptive(
  value: any,
  Observable: ObservableConstructor
) {
  if (value && value.$flavors) {
    return observify(value, Observable);
  }
  return value;
}

export function observify<T extends IsAdaptive>(
  obj: T,
  Observable: ObservableConstructor
): Reactive<T> {
  let reactiveInstance = obj.$flavors.observable as Reactive<T> | undefined;
  if (!reactiveInstance) {
    const observifyingProps = getWrappedProps(
      obj,
      (origFn) => observifyMethodOrGetter(origFn, Observable),
      true
    );
    reactiveInstance = Object.create(obj, observifyingProps) as Reactive<T>;
    obj.$flavors.observable = reactiveInstance;
  }
  return reactiveInstance;
}
