import { getWrappedProps } from "./utils/getWrappedProps";
import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";
import { CurrentExecution } from "./CurrentExecution";
import { ActiveQuery } from "./ActiveQuery";
import { ActiveQueries } from "./ActiveQueries";
import { deepEqualsImmutable } from "./utils/deepEqualsImmutable";
import { Context } from "./Context";

let currentAction: null | ActionState = null;
interface ActionState {
  pointer: number;
  results: { result: any; fn: Function; args: any[] }[];
  subAction: null | ActionState;
}

export function suspendifyMethodOrGetter(fn: (...args: any[]) => any) {
  let bypass = false;
  const activeQueries = (run.$queries = new WeakMap<
    any,
    ActiveQueries<any, any, any>
  >());

  function run(...args: any[]) {
    if (Context.current === Context.root) return rootGuard(this, args);
    if (currentAction) return runImperativeAction(currentAction, this, args);
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
      if (hasResult) return result;
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
          newQuery.result = suspendifyIfAdaptive(result);
          newQuery.promise = null;
          newQuery.error = null;
          newQuery.isLoading = false;
          // No need to notify(). When this promise resolves, the system will call us again and get the cached value.
          return newQuery.result;
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

  function runImperativeAction(action: ActionState, thiz: any, args: any[]) {
    if (action.pointer < action.results.length) {
      const memorizedResult = action.results[action.pointer++];
      if (memorizedResult.fn !== fn) {
        throw new Error(`Non-deterministic code path`);
      } else if (!deepEqualsImmutable(memorizedResult.args, args)) {
        throw new Error(`Non-repeatable arguments`);
      }
      return memorizedResult.result;
    }
    currentAction =
      action.subAction ||
      (action.subAction = { results: [], pointer: 0, subAction: null });
    action.subAction.pointer = 0;
    try {
      const result = suspendifyIfAdaptive(fn.apply(thiz, args));
      if (!result || typeof result.then !== "function") {
        action.results.push({ result, fn, args });
        action.pointer++;
        action.subAction.results = [];
        action.subAction.pointer = 0;
        return result;
      }
      // Handle returned promise
      throw Promise.resolve(result).then((result: any) => {
        action.results.push({ result, fn, args });
        action.pointer++;
        action.subAction = null;
      });
    } finally {
      currentAction = action;
    }
  }

  function rootGuard(thiz: any, args: any[]) {
    const action: ActionState = {
      results: [],
      pointer: 0,
      subAction: null,
    };
    return rerun(action);

    function rerun(action: ActionState) {
      currentAction = action;
      try {
        action.pointer = 0;
        return fn.apply(thiz, args);
      } catch (something) {
        if (something && typeof something.then === "function") {
          return Promise.resolve(something).then(() => rerun(action));
        } else {
          throw something;
        }
      } finally {
        currentAction = null;
      }
    }
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
      obj.$flavors.orig,
      (origFn) => suspendifyMethodOrGetter(origFn),
      true
    );
    suspendified = Object.create(obj, suspendifyingProps) as Suspendified<T>;
    obj.$flavors.suspense = suspendified;
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
