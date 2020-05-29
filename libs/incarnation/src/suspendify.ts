import { getWrappedProps } from "./utils/getWrappedProps";
import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";
import { CurrentExecution } from "./CurrentExecution";
import { IsLazy } from "./IsLazy";
import { ActiveQuery } from "./ActiveQuery";
import { ActiveQueries } from "./ActiveQueries";
import { deepEqualsImmutable } from "./utils/deepEqualsImmutable";

function suspendifyMethodOrGetter(fn: (...args: any[]) => any) {
  let bypass = false;
  const activeQueries = (run.$queries = new WeakMap<
    any,
    ActiveQueries<any, any, any>
  >());
  function run(...args: any[]) {
    if (bypass) return suspendifyIfAdaptive(fn.apply(this, args));
    const queries: ActiveQueries =
      activeQueries.get(this) ||
      activeQueries.set(this, new ActiveQueries()).get(this)!;

    const { firstQuery } = queries;

    const query = firstQuery && findQuery(firstQuery, args, firstQuery.prev);
    if (query) {
      if (CurrentExecution.current) {
        CurrentExecution.current.queries.push(query);
      }
      const { hasResult, result } = query;
      // If we've ever got a result, return it here:
      // This holds true also if a refresh is happening, or if a refresh resulted in an error.
      if (hasResult) return suspendifyIfAdaptive(result);
      if (query.promise) throw query.promise;
      throw query.error;
    }
    // Not cached. Call method to get it:
    const result = fn.apply(this, args);
    if (!result || typeof result.then !== "function") {
      // If the method, getter or setter ever returns a non-promise,
      // assume it will never in the future return a promise.
      // Stop intercepting.
      bypass = true;
      return suspendifyIfAdaptive(result);
    }

    // Handle returned promise
    const promise = Promise.resolve(result)
      .then(
        (result: any) => {
          newQuery.hasResult = true;
          newQuery.result = result;
          newQuery.promise = null;
          newQuery.error = null;
          newQuery.isLoading = false;
          // No need to notify(). When this promise resolves, the system will call us again and get the cached value.
          return result;
        },
        (error: any) => {
          newQuery.promise = null;
          newQuery.error = error;
          newQuery.isLoading = false;
          return Promise.reject(error);
        }
      )
      .finally(() => {
        // Schedule a cleanup in case no one subscribes to the query.
        queries.startManagingCleanup(newQuery);
      });

    const newQuery = new ActiveQuery(this, fn, args, promise);

    if (firstQuery) {
      newQuery.prev = firstQuery.prev; // Connect new node to last node
      newQuery.next = firstQuery;
      firstQuery.prev.next = newQuery; // Connect last node to new node.
    } else {
      // Circular linked list is empty. Create first node:
      queries.firstQuery = newQuery;
    }
    throw promise; // Suspend
  }
  return run;
}

function suspendifyIfAdaptive(value: any) {
  if (value && value.$flavors) {
    return suspendify(value);
  }
  return value;
}

export function suspendify<T extends IsAdaptive>(obj: T): Suspendified<T> {
  let suspendified = obj.$flavors.suspense as Suspendified<T> | undefined;
  if (!suspendified) {
    const suspendifyingProps = getWrappedProps(
      obj,
      (origFn) => suspendifyMethodOrGetter(origFn),
      true
    );
    suspendified = Object.create(obj, suspendifyingProps) as Suspendified<T>;
    obj.$flavors.suspense = suspendified;
    obj[IsLazy] = true;
  }
  return suspendified;
}

export function findQuery(
  query: ActiveQuery,
  args: any[],
  stop: ActiveQuery
): ActiveQuery | null {
  if (deepEqualsImmutable(args, query.args)) return query;
  if (query === stop) return null;
  return findQuery(query.next, args, stop);
}
