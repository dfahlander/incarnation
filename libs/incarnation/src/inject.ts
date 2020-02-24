import { Context, ContextMiddleware, runInContext } from "./Context";
import { Class } from "./Class";
import { createProxy } from "./utils/createProxy";

export const providedContextMiddlewares = new WeakMap<any, ContextMiddleware>();

export const cachedSingletons = new WeakMap<Class, object>();

export const cachedInnerProxyMaps = new WeakMap<any, WeakMap<any, any>>();

export function inject<T extends object>(Class: Class<T>): T {
  const proxy = createProxy(
    Class.prototype, // Here we should provide something that will find properties declared as class Friend { name = Type(String) }
    origFn => {
      return function(...args: any[]) {
        // External call comes in here
        const outerCtx = Context.current;
        // Apply context middlewares to maybe create a derivated context before calling origFn
        const ctxMiddleware = providedContextMiddlewares.get(proxy);
        const ctx = ctxMiddleware ? ctxMiddleware(outerCtx) : outerCtx;
        // Find implementation class
        const ConcreteClass = ctx.getImpl(Class);
        // Find or create instance
        let instance = cachedSingletons.get(ConcreteClass);
        if (!instance) {
          instance = new ConcreteClass();
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
              return runInContext(origFn, instance, args, ctx);
            };
          });
          // ...and cache it bound to instance and innerCtx
          if (!cachedInnerProxies) {
            cachedInnerProxies = new WeakMap<any, WeakMap<any, any>>();
            cachedInnerProxyMaps.set(instance, cachedInnerProxies);
          }
          cachedInnerProxies.set(ctx, innerProxy);
        }
        return runInContext(origFn, innerProxy, args, ctx);
      };
    }
  );
  return proxy;
}
