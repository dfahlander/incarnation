import { Class, AbstractClass } from "../Class";
import { Context, runInContext, resolveClass, bindToContext } from "../Context";
import { getWrappedProps } from "./getWrappedProps";
import { refDeterministic } from "./refDeterministic";
import { IsLazy } from "../IsLazy";

/** Gets or creates a contextually bound instance for given context and class.
 *
 * @param ctx Bound context
 * @param Class Class to instanciate. The result can be a subclass of given class depending on context.
 */
export const getOrCreateBoundInstance = refDeterministic(
  _getOrCreateBoundInstance
);

function _getOrCreateBoundInstance(ctx: Context, Class: AbstractClass) {
  // Resolve class
  const ConcreteClass = resolveClass(ctx, Class);
  const instance = runInContext(() => new ConcreteClass(), ctx);
  instance.$flavors = { orig: instance, promise: null, suspense: null };
  instance[IsLazy] = true;
  const wrappedProps = getWrappedProps(
    instance,
    (origFn) => bindToContext(origFn, ctx, instance),
    false
  );
  Object.defineProperties(instance, wrappedProps);
  return instance;
}
