/*import {
  Context,
  MWFunction,
  runInContext,
  deriveContext,
  resolveClass,
} from "./Context";
import { Class } from "./Class";
import { getEffectiveProps } from "./utils/getEffectiveProps";

const WrappedInstanceSymbol = Symbol(); // TODO: rename to WrappersPropSymbol

export const nullTarget = {};
Object.freeze(nullTarget);

export interface InstanceWrapper<T> {
  getter: (get: (this: T) => any) => (this: T) => any;
  setter: (set: (this: T, value: any) => any) => (this: T) => any;
  method: (
    call: (this: T, ...args: any[]) => any
  ) => (this: T, ...args: any[]) => any;
}

export function createContextualProxy<T extends object>(
  Class: Class<T>,
  wrapper?: InstanceWrapper<T>
): T {
  let boundCtx = Context.current;

  return createProxy(wrapper ? getWrappedInstance : getContextualInstance);

  function createProxy(getInstance: () => T) {
    return new Proxy<T>(nullTarget as T, {
      get(_, prop) {
        return getInstance()[prop];
      },
      set(_, prop, value: MWFunction) {
        if (prop !== ProvidedMWFunctionSymbol) return false;
        boundCtx = deriveContext(boundCtx, value);
        return true;
      },
      ownKeys() {
        return Reflect.ownKeys(getInstance());
      },
      has(_, key: string | number | symbol) {
        return (
          key === ProvidedMWFunctionSymbol || Reflect.has(getInstance(), key)
        );
      },
      getOwnPropertyDescriptor(_, prop) {
        return Reflect.getOwnPropertyDescriptor(getInstance(), prop);
      },
      getPrototypeOf() {
        return Reflect.getPrototypeOf(getInstance());
      },
    });
  }

  function getContextualInstance() {
    // Marry current context with bound context
    const ctx =
      Context.current === boundCtx
        ? boundCtx
        : deriveContext(Context.current, boundCtx.mwFunction);
    // Find cached singleton
    const cachedSingletons =
      ctx.cachedSingletons ||
      (ctx.cachedSingletons = new WeakMap<Class<any>, any>());
    let instance = cachedSingletons.get(Class);
    if (!instance) {
      // Resolve class
      const ConcreteClass = resolveClass(ctx, Class);
      // Create instance
      instance = runInContext(() => new ConcreteClass(), ctx) as T;
      instance[WrappedInstanceSymbol] = new WeakMap();
      cachedSingletons.set(Class, instance);
      // Create bound props that ties ever getter,setter and method to current context_
      const props = getEffectiveProps(instance);
      const contextifyingProps: PropertyDescriptorMap = {};
      for (const [propName, { get, set, value, enumerable }] of Object.entries(
        props
      )) {
        const contexifyingProp: PropertyDescriptor = { enumerable };
        if (get || set || typeof value === "function") {
          if (get) {
            contexifyingProp.get = () => runInContext(get, ctx, instance);
          }
          if (set) {
            contexifyingProp.set = (value) =>
              runInContext(set, ctx, instance, [value]);
          }
          if (value) {
            contexifyingProp.value = (...args: any[]) =>
              runInContext(value, ctx, instance, args);
          }
          contextifyingProps[propName] = contexifyingProp;
        }
      }
      Object.defineProperties(instance, contextifyingProps);
    }
    return instance;
  }

  function getWrappedInstance() {
    const instance = getContextualInstance();
    const wrapperMap = instance[WrappedInstanceSymbol];
    let wrappedInstance = wrapperMap.get(wrapper);
    if (wrappedInstance) return wrappedInstance;

    // Create bound props that ties ever getter,setter and method to current context_
    const props = getEffectiveProps(instance);
    const wrappedProps: PropertyDescriptorMap = {};
    for (const [propName, { get, set, value, enumerable }] of Object.entries(
      props
    )) {
      const contexifyingProp: PropertyDescriptor = { enumerable };
      const wrappedProp: PropertyDescriptor = { enumerable };
      if (get || set || typeof value === "function") {
        if (get) {
          wrappedProp.get = wrapper!.getter(get);
        }
        if (set) {
          wrappedProp.set = wrapper!.setter(set);
        }
        if (value) {
          wrappedProp.value = wrapper!.method(value);
        }
        wrappedProps[propName] = wrappedProp;
      }
    }
    wrappedInstance = Object.create(instance, wrappedProps);
    wrapperMap.set(wrapper, wrappedInstance);
    return wrappedInstance;
  }
}
*/
