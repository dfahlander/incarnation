import { Context, MWFunction, deriveContext } from "./Context";
import { Class, AbstractClass } from "./Class";
import { getOrCreateBoundInstance } from "./utils/getOrCreateBoundInstance";
import { Middleware } from "./Middleware";
import { resolveProvider } from "./provide";

/** Get or create an instance of given class based on current context.
 *
 * @param Class Class to inject. A subclass of given class may be returned depending on current context.
 * @param context If provided, the current context will be combined with given context before injecting the class.
 * @example
 *   inject(FriendService) ==> An instance of FriendService bound to current context.
 *   inject(FriendService, MyContext({myProp: "myValue"})) ==> An instance of FriendService bound to
 *     current context married with given context.
 *   inject(FriendService, Context.combine(MyContext1({myProp: "myValue"}), MyContext2({foo: "bar"})) ==>
 *     An instance of FriendService bound to current context married with given combined contexts.
 */
export function inject<T extends object>(
  Class: AbstractClass<T>,
  ...contexts: MWFunction[]
);
export function inject<T extends object>(Class: AbstractClass<T>): T {
  let ctx = Context.current;
  if (arguments.length > 1) {
    for (let i = 1; i < arguments.length; ++i) {
      ctx = deriveContext(ctx, arguments[i] as MWFunction);
    }
  }
  return getOrCreateBoundInstance(ctx, Class);
}
