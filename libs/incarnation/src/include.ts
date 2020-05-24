import { Class, AbstractClass } from "./Class";
import { Promisified } from "./Promisified";
import { promisify } from "./promisifier";
import { Context, MWFunction } from "./Context";
import { inject } from "./inject";
import { IsAdaptive } from "./IsAdaptive";

export function include<T extends object>(
  Class: AbstractClass<T>,
  ...contexts: MWFunction[]
): Promisified<T>;
export function include<T extends object>(
  Class: AbstractClass<T>
): Promisified<T> {
  if (Context.current === Context.root)
    throw new Error(
      `include() can only be used within a context. Use entryPoint() instead in global context.`
    );
  const instance =
    arguments.length > 1 ? inject.apply(this, arguments) : inject(Class);
  return promisify(instance as T & IsAdaptive);
}
