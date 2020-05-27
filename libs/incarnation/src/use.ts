import { getWrappedProps } from "./utils/getWrappedProps";
import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";
import { Topic } from "./Topic";
import { deepEqualsImmutable } from "./utils/deepEqualsImmutable";
import { llDelete } from "./utils/ll";
import { CurrentExecution } from "./CurrentExecution";
import { AbstractClass } from "./Class";
import { inject } from "./inject";
import { Provider } from "./Provider";

const enum ActiveQueryStatus {
  PENDING = 1,
  SUCCESS = 2,
  ERROR = 3,
}

export class ActiveQuery<TArgs extends any[] = any[], TResult = any> {
  fn: (...args: TArgs) => Promise<TResult>;
  instance: any;
  args: TArgs;
  isLoading: boolean;
  hasResult: boolean;
  result: TResult | null;
  promise: Promise<TResult> | null;
  error: any;
  topic: Topic;
  next: ActiveQuery<TArgs, TResult>;
  prev: ActiveQuery<TArgs, TResult>;

  constructor(
    instance: any,
    fn: (...args: TArgs) => Promise<TResult>,
    args: TArgs,
    promise: Promise<TResult>
  ) {
    this.instance = instance;
    this.fn = fn;
    this.args = args;
    this.hasResult = false;
    this.isLoading = true;
    this.result = null;
    this.promise = promise;
    this.error = null;
    this.topic = new Topic();
    this.next = this;
    this.prev = this;
  }

  refresh() {
    if (!this.isLoading && this.topic.hasSubscribers) {
      this.isLoading = true;
      this.topic.notify();
      Promise.resolve(this.fn.apply(this.instance, this.args)).then(
        (result) => {
          this.hasResult = true;
          this.result = result;
          this.error = null;
          this.isLoading = false;
          this.topic.notify();
        },
        (error) => {
          this.error = error;
          this.isLoading = false;
          this.topic.notify();
        }
      );
    }
  }
}

export class ActiveQueries<
  FN extends (...args: TArgs) => TResult = any,
  TArgs extends any[] = any,
  TResult = any
> {
  firstQuery: ActiveQuery | null = null;

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

  startManagingCleanup(query: ActiveQuery) {
    if (query.topic.hasSubscribersChanged !== null)
      throw new TypeError( // Todo: Replace with an InternalError and a code. Or an assert function.
        `startManagingCleanup() has already been called for this query.`
      );
    let timer: any;
    const cleanup = () => {
      if (!query.topic.hasSubscribers) {
        this.firstQuery = llDelete(this.firstQuery, query);
        // @ts-ignore
        query.next = query.prev = null; // Free up mem faster?
      }
    };
    const scheduleOrStopCleanup = () => {
      if (query.topic.hasSubscribers) {
        timer && clearTimeout(timer);
      } else {
        timer = setTimeout(cleanup, 100);
      }
    };
    query.topic.hasSubscribersChanged = scheduleOrStopCleanup;
    scheduleOrStopCleanup();
  }
}

function findQuery(
  query: ActiveQuery,
  args: any[],
  stop: ActiveQuery
): ActiveQuery | null {
  if (deepEqualsImmutable(args, query.args)) return query;
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
    let promise = fn.apply(this, args);
    if (!promise || typeof promise.then !== "function") {
      // If the method, getter or setter ever returns a non-promise,
      // assume it will never in the future return a promise.
      // Stop intercepting.
      bypass = true;
      return promise;
    }

    // Handle returned promise
    promise = Promise.resolve(promise)
      .then(
        (result: any) => {
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

function suspendify<T extends IsAdaptive>(obj: T): Suspendified<T> {
  let suspendified = obj.$flavors.suspense as Suspendified<T> | undefined;
  if (!suspendified) {
    const suspendifyingProps = getWrappedProps(
      obj,
      (origFn) => suspendifyMethodOrGetter(origFn),
      true
    );
    suspendified = Object.create(obj, suspendifyingProps) as Suspendified<T>;
  }
  return suspendified;
}

export function use<T extends object>(
  Class: AbstractClass<T>,
  ...providers: Provider[]
): Suspendified<T>;
export function use<T extends object>(): Suspendified<T> {
  return suspendify(inject.apply(this, arguments) as T & IsAdaptive);
}
