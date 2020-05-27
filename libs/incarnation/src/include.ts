import { Class, AbstractClass } from "./Class";
import { Promisified } from "./Promisified";
import { promisify } from "./promisifier";
import { inject } from "./inject";
import { IsAdaptive } from "./IsAdaptive";
import { Provider } from "./Provider";

export function include<T extends object>(
  Class: AbstractClass<T>,
  ...providers: Provider[]
): Promisified<T>;
export function include<T extends object>(): Promisified<T> {
  return promisify(inject.apply(this, arguments) as T & IsAdaptive);
}
