import { IsAdaptive } from "./IsAdaptive";
import { Suspendified } from "./Suspendified";
import { AbstractClass } from "./Class";
import { inject } from "./inject";
import { Provider } from "./Provider";
import { suspendify } from "./suspendify";
export function use<T extends object>(
  Class: AbstractClass<T>,
  ...providers: Provider[]
): Suspendified<T>;
export function use<T extends object>(): Suspendified<T> {
  return suspendify(inject.apply(this, arguments) as T & IsAdaptive);
}
