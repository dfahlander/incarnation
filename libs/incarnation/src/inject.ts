import {
  Context,
  ClassMapperMiddleware,
  runInContext,
  deriveContext
} from "./Context";
import { Class } from "./Class";
import { createProxy } from "./utils/createProxy";

export const providedClassMapperMiddleware = new WeakMap<
  any,
  ClassMapperMiddleware
>();

export const cachedSingletons = new WeakMap<Class, object>();

export const cachedInnerProxyMaps = new WeakMap<any, WeakMap<any, any>>();

export function inject<T extends object>(Class: Class<T>): T {
  let genericInstance = cachedSingletons.get(Class);
  if (!genericInstance) {
    genericInstance = runInContext(() => new Class(), Context.generic);
    cachedSingletons.set(Class, genericInstance);
  }
  //const boundGetImpl = Context.current.getImpl;
  const proxy = createProxy(genericInstance, origFn => {
    return function(...args: any[]) {
      // External call comes in here
      const outerCtx = Context.current;
      // Apply context middlewares to maybe create a derivated context before calling origFn
      const cmMiddleware = providedClassMapperMiddleware.get(proxy);
      const ctx: Context = cmMiddleware
        ? deriveContext(outerCtx, cmMiddleware)
        : outerCtx;
      // Find implementation class
      const ConcreteClass = ctx.getImpl(Class);
      // Find or create instance
      let instance = cachedSingletons.get(ConcreteClass);
      if (!instance) {
        instance = runInContext(() => new ConcreteClass(), Context.generic);
        cachedSingletons.set(ConcreteClass, instance);
      }

      // Find a cached inner proxy:
      let innerProxy: any = null;
      let cachedInnerProxies = cachedInnerProxyMaps.get(instance);
      if (cachedInnerProxies) {
        innerProxy = cachedInnerProxies.get(ctx);
      }
      if (!innerProxy) {
        // Not found in cache. Create inner proxy here:
        innerProxy = createProxy(instance, origFn => {
          return function(...args) {
            return runInContext(origFn, ctx, instance, args);
          };
        });
        // ...and cache it bound to instance and innerCtx
        if (!cachedInnerProxies) {
          cachedInnerProxies = new WeakMap<any, WeakMap<any, any>>();
          cachedInnerProxyMaps.set(instance, cachedInnerProxies);
        }
        cachedInnerProxies.set(ctx, innerProxy);
      }
      return runInContext(origFn, ctx, innerProxy, args);
    };
  });
  return proxy as T;
}
