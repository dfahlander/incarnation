import { Class, AbstractClass } from "../Class";

export function invokableClass<
  TClass extends AbstractClass,
  TArgs extends any[],
  TResult
>(
  Class: TClass,
  invoke: (...args: TArgs) => TResult
): TClass & { (...args: TArgs): TResult } {
  return new Proxy(Class, {
    apply(target, thisArg, args) {
      return invoke.apply(thisArg, args);
    },
  }) as TClass & { (...args: TArgs): TResult };
}
