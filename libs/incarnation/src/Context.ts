import { Class } from "./Class";

//export type ClassMapper = (requestedClass: Class) => Class;
export type MWNextFunction = (requestedClass: Class, mappedClass: Class) => Class;
export type MWFunction = (requestedClass: Class, mappedClass: Class, next: MWNextFunction) => Class;

export interface Context {
  //readonly getImpl: ClassMapper;
  readonly mwNextFn: MWNextFunction;
  children: null | WeakMap<MWFunction, Context>;
  classMemo?: null | WeakMap<Class<any>, Class<any>>;
  cachedSingletons?: null | WeakMap<Class<any>, any>;
}

export interface StaticContext {
  readonly root: Context;
  readonly generic: Context;
  readonly current: Context;
}

export const rootContext: Context = {
  //getImpl: requestedClass => requestedClass,
  mwNextFn: (requestedClass, mappedClass) => mappedClass,
  children: null,
  cachedSingletons: null
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
  mwFunction: MWFunction
): Context {
  let result = ctx.children?.get(mwFunction);
  if (result) return result;
  result = {
    mwNextFn: (requestedClass, mappedClass) => mwFunction(requestedClass, mappedClass, ctx.mwNextFn),
    children: null
  };
  if (!ctx.children) ctx.children = new WeakMap<MWFunction, Context>();
  ctx.children.set(mwFunction, result);
  return result;
}

export function resolveClass (ctx: Context, requestedClass: Class): Class {
  const classMemo = ctx.classMemo || (ctx.classMemo = new WeakMap<Class, Class>());
  let result = classMemo.get(requestedClass);
  if (result) return result;
  result = ctx.mwNextFn(requestedClass, requestedClass);
  return result;
}

/*export function memoizedSingleObjArgFn<A extends object,R>(fn: (arg: A) => R): (arg: A) => R  {
  const weakMap = new WeakMap<A,R>();
  return arg => {
    let result = weakMap.get(arg);
    if (result) return result;
    result = fn(arg);
    weakMap.set(arg, result);
    return result;
  }
}
*/