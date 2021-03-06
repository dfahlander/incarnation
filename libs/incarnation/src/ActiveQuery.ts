import { Signal } from "./Signal.js";
import { ResultReducerSet, Mutation } from "./DataStoreTypes.js";
import { CurrentExecution } from "./CurrentExecution.js";
import { invalidate } from "./invalidate.js";
import { MutationQueue } from "./MutationQueue.js";
import { reduceResult } from "./utils/reduceResult.js";

let idCounter = 0;
export class ActiveQuery<TArgs extends any[] = any[], TResult = any> {
  fn: (...args: TArgs) => Promise<TResult>;
  instance: any;
  args: TArgs;
  isLoading: boolean;
  hasResult: boolean;
  result: TResult | null;
  promise: Promise<TResult> | null;
  error: any;
  signal: Signal;
  next: ActiveQuery<TArgs, TResult>;
  prev: ActiveQuery<TArgs, TResult>;
  muts?: MutationQueue;
  reducers?: ResultReducerSet;
  rev: number;
  _reducedResult: TResult | null;
  _id = ++idCounter;

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
    this.signal = new Signal();
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
    const { queued, beingSent, signal, rev } = muts;

    if (rev !== this.rev) {
      // Need to update reduced result
      /*console.debug(
        "Need to update reduceResult. My Query ID:",
        this._id,
        "muts rev:",
        rev,
        "this.rev:",
        this.rev
      );*/
      invalidate.invalid = false; // Reset flag before calling reducers
      this._reducedResult =
        this.muts.count() === 0
          ? this.result
          : reduceResult(
              reduceResult(this.result, reducers, beingSent),
              reducers,
              queued
            );
      /*if (invalidate.invalid) {
        // A reducer invalidated the result. Refresh is needed.
        this.refresh();
      }*/
      this.rev = rev;
    }
    if (CurrentExecution.current) {
      CurrentExecution.current.signals.push(signal);
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
            this.signal.notify(); // Notify that loading state has changed
          }
        }, 50);
        this.promise.finally(() => clearTimeout(debouncedLoadingNotif));
      }
      return;
    }
    // Cannot be promise from here.
    const result = resultOrPromise;
    if (
      !this.hasResult ||
      this.result !== result ||
      this.error ||
      this.isLoading
    ) {
      this.promise = null;
      this.hasResult = true;
      this.result = result;
      this._reducedResult = null;
      this.rev = -1;
      this.error = null;
      this.isLoading = false;
      this.signal.notify();
    }
    return result;
  }

  setError(error: any) {
    if (error !== this.error || this.isLoading) {
      this.promise = null;
      this.error = error;
      this.isLoading = false;
      this.signal.notify();
    }
    return error;
  }

  refresh() {
    if (this.signal.hasSubscribers) {
      this.setResult(this.fn.apply(this.instance, this.args));
    }
  }
}
