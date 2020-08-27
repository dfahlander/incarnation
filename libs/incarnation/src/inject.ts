import { Context, deriveContext, rootContext, baseContext } from "./Context.js";
import { Class, AbstractClass } from "./Class.js";
import { getOrCreateBoundInstance } from "./utils/getOrCreateBoundInstance.js";
import { Provider, resolveProvider } from "./Provider.js";

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
  ...providers: Provider[]
): T extends new () => infer I ? I : T;
export function inject<T extends object>(Class: AbstractClass<T>): T {
  let ctx = Context.current === rootContext ? baseContext : Context.current;
  if (arguments.length > 1) {
    for (let i = 1; i < arguments.length; ++i) {
      ctx = deriveContext(ctx, resolveProvider(arguments[i] as Provider));
    }
  }
  return getOrCreateBoundInstance(ctx, Class);
}
