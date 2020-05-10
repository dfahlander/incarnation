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
  <T>(def: T): {
    (val: T): Context; // When used in second arg of inject(). const mySvc = use(MySvc, CurrentUser("arne"));
    new(): T; // For typings of use(), include() and inject(). const currentUser = inject(CurrentUser);
  }
  readonly root: Context;
  readonly generic: Context;
  readonly current: Context;
}

const defaultMwFunction: MWFunction = (requestedClass, mappedClass, next) => mappedClass;
const defaultMwNextFn: MWNextFunction = (requestedClass, mappedClass) => mappedClass;

export const rootContext: Context = {
  mwFunction: defaultMwFunction,
  children: null,
  cachedSingletons: null
};

let current: Context = rootContext;

export const Context = (<T>(def: T) => {
  //const vals = [];//I was about to store all previous contexts here. Now I'm thinking of a weakmap? how to fix? or subscibeZ
  return (value: T) => {
    function CustomContext() {
      if (typeof this === 'object') {
        // Constructed by new()
        // Caller is getOrCreateBoundInstance() from inject().
        return value;
      }
      const mwFunction: MWFunction = function (requestedClass, mappedClass, next) {
        return next(requestedClass, mappedClass);
      }
      return {mwFunction, children: null};
    }
    // TODO: check if there is an structural identical value (use deepEquals() somehow? Store on current execution/"fiber" to get a cache that is auto-cleared?)
    // If so, return the cached CustomContext instead
    return CustomContext as any as {(val: T): Context; new(): T;}
  }
}) as unknown as StaticContext;

Object.defineProperties(Context, {
  root: {value: rootContext, writable: false},
  generic: {value: {...rootContext}, writable: false},
  current: {get() { return current }}
});

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

export function bindToContext<FN extends (...args: any[]) => any> (fn: FN, ctx: Context, target: any=null) {
  return function () {
    const prevCtx = current;
    try {
      current = ctx;
      return fn.apply(target, arguments);
    } finally {
      current = prevCtx;
    }  
  }
}

export function runInContext<FN extends () => any>(
  fn: FN,
  ctx: Context): ReturnType<FN>
{
  return bindToContext(fn, ctx)();
}

export function deriveContext(
  parent: Context,
  mwFunction: MWFunction
): Context {
  let result = parent.children?.get(mwFunction);
  if (result) return result;
  result = mwFunction === parent.mwFunction ? parent : {
    //mwNextFn: (requestedClass, mappedClass) => mwFunction(requestedClass, mappedClass, ctx.mwNextFn),
    mwFunction: (requestedClass, mappedClass) => mwFunction(requestedClass, mappedClass, (rc, mc) => parent.mwFunction(rc, mc, defaultMwNextFn)),
    children: null
  };
  if (!parent.children) parent.children = new WeakMap<MWFunction | Context, Context>();
  parent.children.set(mwFunction, result);
  return result;
}

export function resolveClass (ctx: Context, requestedClass: Class): Class {
  const classMemo = ctx.classMemo || (ctx.classMemo = new WeakMap<Class, Class>());
  let result = classMemo.get(requestedClass);
  if (result) return result;
  result = ctx.mwFunction(requestedClass, requestedClass, (rc, mc)=>mc);
  classMemo.set(requestedClass, result);
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