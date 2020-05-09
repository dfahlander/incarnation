import { Class } from "./Class";

//export type ClassMapper = (requestedClass: Class) => Class;
export type MWNextFunction = (requestedClass: Class, mappedClass: Class) => Class;
export type MWFunction = (requestedClass: Class, mappedClass: Class, next: MWNextFunction) => Class;

export interface Context {
  //readonly getImpl: ClassMapper;
  //readonly mwNextFn: MWNextFunction;
  readonly mwFunction: MWFunction;
  children: null | WeakMap<MWFunction | Context, Context>;
  classMemo?: null | WeakMap<Class<any>, Class<any>>;
  cachedSingletons?: null | WeakMap<Class<any>, any>;
  internalProxies?: null | WeakMap<any, any>;
}

export interface StaticContext {
  readonly root: Context;
  readonly generic: Context;
  readonly current: Context;
}

const defaultMwFunction: MWFunction = (requestedClass, mappedClass, next) => mappedClass;
const defaultMwNextFn: MWNextFunction = (requestedClass, mappedClass) => mappedClass;

export const rootContext: Context = {
  //getImpl: requestedClass => requestedClass,
  //mwNextFn: (requestedClass, mappedClass) => mappedClass,
  mwFunction: defaultMwFunction,
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
//Object.freeze(Context); // Don't allow root or generic to be changed.

export function runWithMWFunction<R>(
  fn: ()=>R,
  mwFunction: MWFunction
): R {
  if (!mwFunction) return fn();
  const prevCtx = current;
  const ctx: Context = deriveContext(prevCtx, mwFunction);
  try {
    current = ctx;
    return fn();
  } finally {
    current = prevCtx;
  }
}

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
  result = mwFunction === ctx.mwFunction ? ctx : {
    //mwNextFn: (requestedClass, mappedClass) => mwFunction(requestedClass, mappedClass, ctx.mwNextFn),
    mwFunction: (requestedClass, mappedClass) => mwFunction(requestedClass, mappedClass, (rc, mc) => ctx.mwFunction(rc, mc, defaultMwNextFn)),
    children: null
  };
  if (!ctx.children) ctx.children = new WeakMap<MWFunction | Context, Context>();
  ctx.children.set(mwFunction, result);
  return result;
}

export function resolveClass (ctx: Context, requestedClass: Class): Class {
  const classMemo = ctx.classMemo || (ctx.classMemo = new WeakMap<Class, Class>());
  let result = classMemo.get(requestedClass);
  if (result) return result;
  result = ctx.mwFunction(requestedClass, requestedClass, (rc, mc)=>mc);
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