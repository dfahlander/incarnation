import { Class, AbstractClass } from "./Class";
import { getWrappedProps } from "./utils/getWrappedProps";
import { refDeterministic } from "./utils/refDeterministic";
import { PROVIDER } from "./symbols/PROVIDER";
import { Provider, ClassMapper, ProviderFn } from "./Provider";

export interface Context {
  readonly mapClass: ClassMapper;
  readonly [PROVIDER]: ProviderFn;
}

export interface StaticContext {
  <T>(def: T): {
    (val: T): ProviderFn; // When used in second arg of inject(). const mySvc = use(MySvc, CurrentUser("arne"));
    new (): T; // For typings of use(), include() and inject(). const currentUser = inject(CurrentUser);
  };
  readonly root: Context;
  readonly base: Context;
  readonly current: Context;
}

const defaultClassMapper: ClassMapper = (requestedClass, mappedClass) =>
  mappedClass;
const defaultProvider: ProviderFn = (next) => defaultClassMapper;

export const rootContext: Context = {
  mapClass: defaultClassMapper,
  [PROVIDER]: defaultProvider,
};

export const baseContext = { ...rootContext };

let current: Context = rootContext;

export const Context = ((<T>(def: T) => {
  return (value: T) => {
    function CustomContext(alternateValue?: T) {
      if (typeof this === "object") {
        // Constructed by new()
        // Caller is getOrCreateBoundInstance() from inject().
        return value;
      }
      // Caller wants a provider that will map context to an alternate value
      // TODO: check if there is an structural identical value (use deepEquals() somehow? Store on current execution/"fiber" to get a cache that is auto-cleared?)
      // If so, return the cached CustomContext instead
      const provider: ProviderFn = (next) => (requestedClass, mappedClass) => {
        if (requestedClass === CustomContext)
          return (function CustomContextValue() {
            return alternateValue;
          } as unknown) as Class;
        return next(requestedClass, mappedClass);
      };
      return provider;
    }
    return (CustomContext as any) as {
      (val: T): Provider;
      new (): T;
    };
  };
}) as unknown) as StaticContext;

Object.defineProperties(Context, {
  root: { value: rootContext, writable: false },
  base: { value: baseContext, writable: false },
  current: {
    get() {
      return current;
    },
  },
});

export function bindToContext<FN extends (...args: any[]) => any>(
  fn: FN,
  ctx: Context,
  target: any = null
): FN {
  return function () {
    const prevCtx = current;
    try {
      current = ctx;
      return fn.apply(target, arguments);
    } finally {
      current = prevCtx;
    }
  } as FN;
}

// This function isn't used yet. But it could possibly be used by
// for example Middleware.ts to bind each superclass to the context.
export function createBoundClass<T>(Class: Class<T>, ctx: Context): Class<T> {
  // @ts-ignore
  const rv = class extends Class {
    constructor(...args: any[]) {
      const parentCtx = current;
      try {
        current = ctx;
        super(...args);
      } finally {
        current = parentCtx;
      }
    }
  } as Class<T>;
  const wrappedProps = getWrappedProps(
    Class.prototype,
    (parentFn) =>
      function () {
        const prevCtx = current;
        try {
          current = ctx;
          return parentFn.apply(this, arguments);
        } finally {
          current = prevCtx;
        }
      },
    false
  );
  Object.defineProperties(rv.prototype, wrappedProps);
  return rv;
}

export function runInContext<FN extends () => any>(
  fn: FN,
  ctx: Context
): ReturnType<FN> {
  const prevCtx = current;
  try {
    current = ctx;
    return fn();
  } finally {
    current = prevCtx;
  }
}

function _deriveContext(parent: Context, providerFn: ProviderFn): Context {
  return {
    mapClass: providerFn(parent.mapClass),
    [PROVIDER]: (next) => providerFn(parent[PROVIDER](next)),
  };
}

export const deriveContext: (
  parent: Context,
  providerFn: ProviderFn
) => Context = refDeterministic(_deriveContext);

export const resolveClass = refDeterministic(
  (ctx: Context, requestedClass: AbstractClass) =>
    ctx.mapClass(requestedClass, requestedClass as Class)
);
