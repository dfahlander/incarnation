import { Class, AbstractClass } from "./Class.js";
import { Promisified } from "./Promisified.js";
import { promisify } from "./promisifier.js";
import { inject } from "./inject.js";
import { IsAdaptive } from "./IsAdaptive.js";
import { Provider } from "./Provider.js";

export function include<T extends object>(
  Class: AbstractClass<T>,
  ...providers: Provider[]
): Promisified<T>;
export function include<T extends object>(): Promisified<T> {
  return promisify(inject.apply(this, arguments) as T & IsAdaptive);
}
