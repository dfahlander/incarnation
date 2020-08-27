import { Context, bindToContext, baseContext, rootContext } from "./Context.js";
import { suspendifyMethodOrGetter } from "./suspendify.js";

export function run<TResult>(fn: () => TResult): Promise<TResult> {
  const ctx = Context.current === rootContext ? baseContext : Context.current;
  return suspendifyMethodOrGetter(bindToContext(fn, ctx))();
}
