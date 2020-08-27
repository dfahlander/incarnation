import { Class, AbstractClass } from "../Class.js";
import {
  Context,
  runInContext,
  resolveClass,
  bindToContext,
  construct,
} from "../Context";
import { getWrappedProps } from "./getWrappedProps.js";
import { refDeterministic } from "./refDeterministic.js";
import { IsLazy } from "../IsLazy.js";
import { BOUND_CONTEXT } from "../symbols/BOUND_CONTEXT.js";

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
  const instance = construct(ConcreteClass, ctx);
  if (!instance.$flavors) {
    instance.$flavors = { orig: instance, promise: null, suspense: null };
  }
  instance[IsLazy] = true;
  instance[BOUND_CONTEXT] = ctx;
  const wrappedProps = getWrappedProps(
    instance,
    (origFn) => bindToContext(origFn, ctx, instance),
    false
  );
  Object.defineProperties(instance, wrappedProps);
  return instance;
}
