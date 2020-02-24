import { Class } from "./Class";
import { Promisified } from "./Promisified";
import { inject } from "./inject";
import { promisify } from "./promisifier";
import { Context } from "./Context";

export function async<T extends object>(Class: Class<T>): Promisified<T> {
  if (Context.current === Context.root)
    throw new Error(
      `async() can only be used within a context. Use entryPoint() instead in global context.`
    );
  const instance = inject(Class);
  return promisify(instance);
}
