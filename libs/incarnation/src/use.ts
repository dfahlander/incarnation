import { getWrappedProps } from "./utils/getWrappedProps";
import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";
import { Topic } from "./Topic";
import { LLNode } from "./utils/ll";
import { deepEquals } from "./utils/deepEquals";

const enum Status {
  PENDING = 1,
  SUCCESS = 2,
  ERROR = 3,
}

class CircularLinkedQuery<TArgs extends any[] = any[], TResult = any>
  implements LLNode {
  args: TArgs;
  status: Status;
  loading: boolean;
  result: TResult;
  topic: Topic;
  next: CircularLinkedQuery<TArgs, TResult>;
  prev: CircularLinkedQuery<TArgs, TResult>;

  constructor(args: TArgs, result: TResult) {
    this.args = args;
    this.status = Status.PENDING;
    this.loading = true;
    this.result = result;
    this.topic = new Topic();
    this.next = this;
    this.prev = this;
  }
}

export class ActiveQueries<
  FN extends (...args: TArgs) => TResult = any,
  TArgs extends any[] = any,
  TResult = any
> {
  firstQuery: CircularLinkedQuery | null = null;

  *[Symbol.iterator]() {
    // @ts-ignore
    const { firstQuery } = this;
    if (firstQuery) {
      let node = firstQuery;
      do {
        yield node;
        node = node.next;
      } while (node !== firstQuery);
    }
  }
}

function findQuery(
  query: CircularLinkedQuery,
  args: any[],
  stop: CircularLinkedQuery
): CircularLinkedQuery | null {
  if (deepEquals(args, query.args)) return query;
  if (query === stop) return null;
  return findQuery(query.next, args, stop);
}

function suspendifyMethodOrGetter(fn: (...args: any[]) => any) {
  let bypass = false;
  const activeQueries = (run.$queries = new WeakMap<
    any,
    ActiveQueries<any, any, any>
  >());
  function run(...args: any[]) {
    if (bypass) return fn.apply(this, args);
    const queries: ActiveQueries =
      activeQueries.get(this) ||
      activeQueries.set(this, new ActiveQueries()).get(this)!;

    const { firstQuery } = queries;

    const query = firstQuery && findQuery(firstQuery, args, firstQuery.prev);
    if (query) {
      const { status, result } = query;
      if (status === Status.SUCCESS) return result;
      throw result; // Promise or error depending on status. In both cases we should throw it!
    }
    // Not cached. Call method to get it:
    let result = fn.apply(this, args);
    if (!result || typeof result.then !== "function") {
      // If the method, getter or setter ever returns a non-promise,
      // assume it will never in the future return a promise.
      // Stop intercepting.
      bypass = true;
      return result;
    }

    // Handle returned promise
    result = Promise.resolve(result).then(
      (result: any) => {
        newQuery.result = result;
        newQuery.status = Status.SUCCESS;
        newQuery.loading = false;
      },
      (error: any) => {
        newQuery.result = error;
        newQuery.status = Status.ERROR;
        newQuery.loading = false;
      }
    );

    const newQuery = new CircularLinkedQuery(args, result);

    if (firstQuery) {
      newQuery.prev = firstQuery.prev; // Connect new node to last node
      newQuery.next = firstQuery;
      firstQuery.prev.next = newQuery; // Connect last node to new node.
    } else {
      // Circular linked list is empty. Create first node:
      queries.firstQuery = newQuery;
    }
    throw result; // Suspend
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
