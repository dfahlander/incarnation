import { AbstractClass } from "../Class";

export type CallableClass<
  I = any,
  CallSignature = (...args: any[]) => any
> = (new (...args: any[]) => I) & CallSignature;

export function CallableClass<
  TClass extends AbstractClass,
  TArgs extends any[],
  TResult
>(
  Class: TClass,
  invoke: (...args: TArgs) => TResult,
  name?: string
): TClass & { (...args: TArgs): TResult } {
  return new Proxy(Class, {
    apply(target, thisArg, args) {
      return invoke.apply(thisArg, args);
    },
    get(target, prop, receiver) {
      return prop === "name" && name
        ? name
        : Reflect.get(target, prop, receiver);
    },
  }) as TClass & { (...args: TArgs): TResult };
}
