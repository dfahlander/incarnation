import { Class } from "./Class";

export type ClassMapper = (Class: Class) => Class;
export type ClassMapperMiddleware = (Class: Class, next: ClassMapper) => Class;

export interface Context {
  readonly getImpl: <T>(Class: Class<T>) => Class<T>;
  children: null | WeakMap<ClassMapperMiddleware, Context>;
  //cachedSingletons: null | WeakMap<Class<any>, any>;
}

export interface StaticContext {
  readonly root: Context;
  readonly generic: Context;
  readonly current: Context;
}

export const rootContext: Context = {
  getImpl: Class => Class,
  children: null
  //cachedSingletons: null
};

let current: Context = rootContext;

export const Context: StaticContext = {
  root: rootContext,
  generic: { ...rootContext },
  get current(): Context {
    return current;
  }
};

export function runInContext<FN extends (...args: any[]) => any>(
  fn: FN,
  ctx: Context,
  target: any = null,
  args: any[] = []
): ReturnType<FN> {
  const prevCtx = current;
  try {
    current = ctx;
    return fn.apply(target, args);
  } finally {
    current = prevCtx;
  }
}

export function deriveContext(
  ctx: Context,
  cmMiddleware: ClassMapperMiddleware
): Context {
  let result = ctx.children?.get(cmMiddleware);
  if (result) return result;
  result = {
    getImpl: Class => cmMiddleware(Class, ctx.getImpl),
    children: null
  };
  if (!ctx.children) ctx.children = new WeakMap<ClassMapperMiddleware, Context>();
  ctx.children.set(cmMiddleware, result);
  return result;
}
