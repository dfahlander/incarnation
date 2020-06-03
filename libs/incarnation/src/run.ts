import { promisifyMethodOrGetter } from "./promisifier";
import { Context, deriveContext, runInContext } from "./Context";
import { ProviderFn } from "./Provider";

const dummyProvider: ProviderFn = (next) => (orig, mapped) =>
  next(orig, mapped);

export function run<TResult>(fn: () => TResult): Promise<TResult> {
  const ctx = deriveContext(Context.current, dummyProvider);
  return runInContext(promisifyMethodOrGetter(fn), ctx);
}
