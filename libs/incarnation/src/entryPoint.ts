import { Class } from "./Class";
import { Promisified } from "./Promisified";
import { Context } from "./Context";
import { inject } from "./inject";
import { promisify } from "./promisifier";
import { provide } from "./provide";

export function entryPoint<T extends object>(Class: Class<T>): Promisified<T> {
  if (Context.current !== Context.root)
    throw new Error(
      `entryPoint() can only be used in global context. Use async() or use() instead from context based code`
    );

  const proxy = inject(Class);
  return promisify(proxy);
}
