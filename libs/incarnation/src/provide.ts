import { MWFunction, deriveContext } from "./Context";
import { Middleware } from "./Middleware";
import { Class } from "./Class";
import { BoundContext } from "./symbols/BoundContext";

export function provide(entryPointObj: object) {
  if (!(BoundContext in entryPointObj)) {
    debugger;
    throw new TypeError(
      `Argument to provide() must be an object returned from entryPoint()`
    );
  }
  return {
    with(provider: MWFunction | Middleware<any> | Class<any>) {
      if (typeof provider !== "function")
        throw new TypeError(`Given provider must a function or class`);

      const mwFunction = resolveProvider(provider);

      entryPointObj[BoundContext] = deriveContext(
        entryPointObj[BoundContext],
        mwFunction
      );
    },
  };
}

export function resolveProvider(
  provider: MWFunction | Class<any> | Middleware<any>
) {
  return "getMWFunction" in provider
    ? // A class that extends Middleware(SomeAPI)
      provider.getMWFunction()
    : provider.prototype &&
      Object.getPrototypeOf(provider.prototype) !== Object.prototype
    ? // A class that extends something
      getClassProvider(provider as Class<any>)
    : // A plain function (ClassMapperMiddleware):
      (provider as MWFunction);
}

function getClassProvider(ConcreteClass: Class<any>) {
  const mw: MWFunction = (requestedClass, mappedClass, next) =>
    next(
      requestedClass,
      ConcreteClass.prototype instanceof mappedClass
        ? ConcreteClass
        : mappedClass
    );
  return mw;
}
