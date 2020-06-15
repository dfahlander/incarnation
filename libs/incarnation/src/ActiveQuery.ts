import { Topic } from "./Topic";
import { MutationQueue, ResultReducerSet, Mutation } from "./DataStoreTypes";
import { CurrentExecution } from "./CurrentExecution";
import { invalidate } from "./invalidate";

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
  muts?: MutationQueue;
  reducers?: ResultReducerSet;
  rev: number;
  _reducedResult: TResult | null;

  constructor(
    instance: any,
    fn: (...args: TArgs) => Promise<TResult>,
    args: TArgs,
    promise: Promise<TResult>,
    muts?: MutationQueue,
    reducers?: ResultReducerSet
  ) {
    this.instance = instance;
    this.fn = fn;
    this.args = args;
    this.hasResult = false;
    this.isLoading = true;
    this.result = null;
    this.error = null;
    this.topic = new Topic();
    this.next = this;
    this.prev = this;
    this.promise = null;
    this.muts = muts;
    this.reducers = reducers;
    this.rev = -1;
    this._reducedResult = null;
    this.setResult(promise);
  }

  reducedResult() {
    if (!this.muts) return this.result;
    const { reducers, muts } = this;
    const { queued, beingSent, topic, rev } = muts;
    if (rev !== this.rev) {
      // Need to update reduced result
      invalidate.invalid = false;
      this._reducedResult = reduceResult(
        reduceResult(this._reducedResult, reducers, queued),
        reducers,
        beingSent
      );
      if (invalidate.invalid) {
        this.refresh();
      }
      this.rev = rev;
    }
    if (CurrentExecution.current) {
      CurrentExecution.current.topics.push(topic);
    }
    return this._reducedResult;
  }

  setResult(resultOrPromise: any) {
    if (resultOrPromise && typeof resultOrPromise.then === "function") {
      const ourPromise = (this.promise = Promise.resolve(resultOrPromise).then(
        (result: TResult) =>
          this.promise === ourPromise
            ? this.setResult(result) // No new emit has happened in between. Stop.
            : this.promise, // Joins the new promise (important when thrown)
        (error: any) =>
          this.promise === ourPromise
            ? Promise.reject(this.setError(error))
            : this.promise
      ));
      if (!this.isLoading) {
        this.isLoading = true;
        const debouncedLoadingNotif = setTimeout(() => {
          if (this.isLoading) {
            this.topic.notify(); // Notify that loading state has changed
          }
        }, 50);
        this.promise.finally(() => clearTimeout(debouncedLoadingNotif));
      }
      return;
    }
    if (
      !this.hasResult ||
      this.result !== resultOrPromise ||
      this.error ||
      this.isLoading
    ) {
      this.promise = null;
      this.hasResult = true;
      this.result = resultOrPromise;
      this._reducedResult = null;
      this.rev = -1;
      this.error = null;
      this.isLoading = false;
      this.topic.notify();
    }
    return resultOrPromise;
  }

  setError(error: any) {
    if (error !== this.error || this.isLoading) {
      this.promise = null;
      this.error = error;
      this.isLoading = false;
      this.topic.notify();
    }
    return error;
  }

  refresh() {
    if (this.topic.hasSubscribers) {
      this.setResult(this.fn.apply(this.instance, this.args));
    }
  }
}

function reduceResult(
  result: any,
  reducers: ResultReducerSet | undefined,
  mutations: Mutation[]
) {
  if (!reducers) return invalidate(result);
  for (const m of mutations) {
    const reducer = reducers[m.type];
    result = reducer ? reducer(result, m) : invalidate(result);
  }
  return result;
}
