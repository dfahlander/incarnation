import { Class, AbstractClass } from "./Class.js";
import { getWrappedProps } from "./utils/getWrappedProps.js";
import { refDeterministic } from "./utils/refDeterministic.js";
import { PROVIDER } from "./symbols/PROVIDER.js";
import { Provider, ClassMapper, ProviderFn } from "./Provider.js";
import { CREATE_CLASS } from "./symbols/CREATE_CLASS.js";

export interface Context {
  readonly mapClass: ClassMapper;
  readonly [PROVIDER]: ProviderFn;
  readonly type?: string; // For debugging.
}

export interface StaticContext {
  <T>(def: T): {
    (val: T): ProviderFn; // When used in second arg of inject(). const mySvc = use(MySvc, CurrentUser("arne"));
    new (): T; // For typings of use(), include() and inject(). const currentUser = inject(CurrentUser);
  };
  readonly root: Context;
  readonly base: Context;
  readonly current: Context;
  integrate(middleware: (fallbackGetter: () => Context) => () => Context): void;
  unintegrate(
    middleware: (fallbackGetter: () => Context) => () => Context
  ): void;
}

const defaultClassMapper: ClassMapper = (requestedClass, mappedClass) =>
  mappedClass[CREATE_CLASS]?.(requestedClass, mappedClass) ?? mappedClass;
const defaultProvider: ProviderFn = (next) => defaultClassMapper;

export const rootContext: Context = {
  mapClass: defaultClassMapper,
  [PROVIDER]: defaultProvider,
  type: "root",
};

export const baseContext = { ...rootContext, type: "base" };

let current: Context | null = null;

export const Context: StaticContext =
  globalThis._incarnationContext ||
  (globalThis._incarnationContext = ((<T>(def: T) => {
    function CustomContext(alternateValue?: T) {
      if (typeof this === "object") {
        // Constructed by new()
        // Caller is getOrCreateBoundInstance() from inject().
        return def;
      }
      // Caller wants a provider that will map context to an alternate value
      // TODO: check if there is an structural identical value (use deepEquals() somehow? Store on current execution/"fiber" to get a cache that is auto-cleared?)
      // If so, return the cached CustomContext instead
      const provider: ProviderFn = (next) => (requestedClass, mappedClass) => {
        console.debug("Provider xxx");
        const result: any = next(requestedClass, mappedClass);
        if (result === CustomContext)
          return (function CustomContextValue() {
            return alternateValue;
          } as unknown) as Class;
        return result; //next(requestedClass, mappedClass);
      };
      return provider;
    }
    return (CustomContext as any) as {
      (val: T): Provider;
      new (): T;
    };
  }) as unknown) as StaticContext);

const defaultFallbackGetter = () => rootContext;
let getFallback = defaultFallbackGetter;
let integrations: Array<(getFallback: () => Context) => () => Context> = [];

function computeFallbackGetter() {
  getFallback = integrations.reduce((p, c) => c(p), defaultFallbackGetter);
}

Object.defineProperties(Context, {
  root: { value: rootContext, writable: false },
  base: { value: baseContext, writable: false },
  current: {
    get() {
      return current || getFallback();
    },
  },
  integrate: {
    value: (middleware: (fallbackGetter: () => Context) => () => Context) => {
      integrations.push(middleware);
      computeFallbackGetter();
    },
  },
  unintegrate: {
    value: (middleware: (fallbackGetter: () => Context) => () => Context) => {
      integrations = integrations.filter((i) => i !== middleware);
      computeFallbackGetter();
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

/** ConstructionContext
 *
 * Used together with the State function/class to initialize stateful
 * services. As it is built now, stateful properties can also be put in private fields.
 * See also State.ts.
 */
export interface ConstructionContext {
  Type: Class;
  pos: number;
  values: any[];
}
const getConstructionContext = refDeterministic(
  (Type: Class) => ({ Type, pos: 0, values: [] } as ConstructionContext)
);
export let ConstructionContext: ConstructionContext | null = null;

export function construct(Type: Class, ctx: Context) {
  const cctx = getConstructionContext(Type);
  cctx.pos = 0;
  const prevCtx = current,
    prevCctx = ConstructionContext;
  try {
    current = ctx;
    ConstructionContext = cctx;
    return new Type();
  } finally {
    current = prevCtx;
    ConstructionContext = prevCctx;
  }
}

export function runInContext<FN extends (...args: any[]) => any>(
  fn: FN,
  ctx: Context,
  ...args: any[]
): ReturnType<FN> {
  const prevCtx = current;
  try {
    current = ctx;
    return fn.apply(this, args);
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
