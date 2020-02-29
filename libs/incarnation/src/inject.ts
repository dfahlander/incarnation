import {
  Context,
  ClassMapperMiddleware,
  runInContext,
  deriveContext
} from "./Context";
import { Class } from "./Class";
import { createProxy, createProxy2 } from "./utils/createProxy";

export const providedClassMapperMiddleware = new WeakMap<
  any,
  ClassMapperMiddleware
>();

//export const cachedSingletons = new WeakMap<Class, object>();

export const cachedInnerProxyMaps = new WeakMap<any, WeakMap<any, any>>();

export function inject<T extends object>(Class: Class<T>): T {
  // WIP: Ändrar till att alltid cacha instanser på kontextet.
  // Kan det funka generiskt? Utan specialhantering av konstruction mode?
  let { cachedSingletons } = Context.current;
  if (!cachedSingletons) {
    Context.current.cachedSingletons = cachedSingletons = new WeakMap<
      Class<any>,
      any
    >();
  }
  let instance = cachedSingletons.get(Class);
  if (!instance) {
    // I det falled man gör use() i koden så vore det ok att här utgå från current context.
    // Ja, det vore fel att göra annat t.o.m.!
    // Men i fallet att man gör use() för att instanciera en prop, ja då
    // borde interna this-proxyn avgöra vad proppen ska representera!

    // Alltså: Om !Context.current.constructing, använd current ctx för att skapa instance
    // och skapa sedan en proxy mot den instansen.
    // Men: Om Context.current.constructing,
    instance = new Class(); //runInContext(() => new Class(), Context.generic);
    cachedSingletons.set(Class, instance);
  }

  const proxy = createProxy(instance, (fn, propName, type) => {
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
      let { cachedSingletons } = ctx;
      if (!cachedSingletons)
        cachedSingletons = ctx.cachedSingletons = new WeakMap<
          Class<any>,
          any
        >();
      let instance = cachedSingletons.get(ConcreteClass);
      if (!instance) {
        //instance = runInContext(() => new ConcreteClass(), Context.generic);
        instance = runInContext(() => new ConcreteClass(), ctx);
        cachedSingletons.set(ConcreteClass, instance);
      }
      let innerProxy: any = null;
      let cachedInnerProxies = cachedInnerProxyMaps.get(instance);
      if (cachedInnerProxies) {
        innerProxy = cachedInnerProxies.get(ctx);
      }
      if (!innerProxy) {
        // Not found in cache. Create inner proxy here:
        innerProxy = createProxy(
          instance,
          fn =>
            function(...args) {
              return runInContext(fn, ctx, innerProxy, args);
            }
        );
        // ...and cache it bound to instance and innerCtx
        if (!cachedInnerProxies) {
          cachedInnerProxies = new WeakMap<any, WeakMap<any, any>>();
          cachedInnerProxyMaps.set(instance, cachedInnerProxies);
        }
        cachedInnerProxies.set(ctx, innerProxy);
      }
      return type === "val"
        ? runInContext(instance[propName], ctx, innerProxy, args)
        : type === "get"
        ? runInContext(() => Reflect.get(instance, propName, innerProxy), ctx)
        : runInContext(
            value => Reflect.set(instance, propName, value, innerProxy),
            ctx
          );
    };
  });
  return proxy as T;
}
