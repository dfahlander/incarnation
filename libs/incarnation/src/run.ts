import { Context, bindToContext, baseContext, rootContext } from "./Context";
import { suspendifyMethodOrGetter } from "./suspendify";

export function run<TResult>(fn: () => TResult): Promise<TResult> {
  const ctx = Context.current === rootContext ? baseContext : Context.current;
  return suspendifyMethodOrGetter(bindToContext(fn, ctx))();
}
