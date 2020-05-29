import { Topic } from "./Topic";

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
