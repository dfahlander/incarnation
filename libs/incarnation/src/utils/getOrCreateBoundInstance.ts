import { Class } from "../Class";
import { Context, runInContext, resolveClass, bindToContext } from "../Context";
import { getWrappedProps } from "./getWrappedProps";

/** Gets or creates a contextually bound instance for given context and class.
 *
 * @param ctx Bound context
 * @param Class Class to instanciate. The result can be a subclass of given class depending on context.
 */
export function getOrCreateBoundInstance(ctx: Context, Class: Class) {
  // Find cached singleton
  const cachedSingletons =
    ctx.cachedSingletons || (ctx.cachedSingletons = new WeakMap<Class, any>());
  let instance = cachedSingletons.get(Class);
  if (instance) {
    return instance;
  }
  // Resolve class
  const ConcreteClass = resolveClass(ctx, Class);
  // Create instance within context, so that if its constructor calls inject(),
  // it will inject from the correct context.
  instance = runInContext(() => new ConcreteClass(), ctx);
  const wrappedProps = getWrappedProps(instance, (origFn) =>
    bindToContext(origFn, ctx, instance)
  );
  Object.defineProperties(instance, wrappedProps);
  cachedSingletons.set(Class, instance);
  return instance;
}
