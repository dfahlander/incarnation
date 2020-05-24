import { promisifyMethodOrGetter } from "./promisifier";

export function run<TResult>(fn: () => TResult): Promise<TResult> {
  return promisifyMethodOrGetter(fn)();
}
