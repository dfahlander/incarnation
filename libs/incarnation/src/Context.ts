import { Class } from "./Class";

export interface Context {
  readonly getImpl: <T>(Class: Class<T>) => Class<T>;
  //cachedSingletons: null | WeakMap<Class<any>, any>;
}

export type ContextMiddleware = (ctx: Context) => Context;

export interface StaticContext {
  readonly root: Context;
  readonly current: Context;
}

export const rootContext: Context = {
  getImpl: Class => Class
  //cachedSingletons: null
};

let current: Context = rootContext;

export const Context: StaticContext = {
  root: rootContext,
  get current(): Context {
    return current;
  }
};

export function runInContext<FN extends (...args: any[]) => R, R>(
  fn: FN,
  target: any,
  args: any[],
  ctx: Context
): R {
  const prevCtx = current;
  try {
    current = ctx;
    return fn.apply(target, args);
  } finally {
    current = prevCtx;
  }
}
