import { providedMWFunctions } from "./inject";
import { ProvideTarget } from "./ProvideTarget";
import { MWFunction } from "./Context";
import { Middleware } from "./Middleware";
import { Class } from "./Class";

export function provide(instance: object) {
  while (instance[ProvideTarget]) instance = instance[ProvideTarget];
  return {
    with(provider: MWFunction | Middleware<any> | Class<any>) {
      if (typeof provider !== "function")
        throw new TypeError(`Given provider must a function or class`);
      const mwFunction =
        "getMWFunction" in provider
          ? // A class that extends Middleware(SomeAPI)
            provider.getMWFunction()
          : provider.prototype &&
            Object.getPrototypeOf(provider.prototype) !== Object.prototype
          ? // A class that extends something
            getClassProvider(provider as Class<any>)
          : // A plain function (ClassMapperMiddleware):
            (provider as MWFunction);

      const existingMWFunction = providedMWFunctions.get(instance);
      const chainedMWFunction: MWFunction = !existingMWFunction
        ? mwFunction
        : (Class, mappedClass, next) =>
            mwFunction(Class, mappedClass, (Class, mappedClass) =>
              existingMWFunction(Class, mappedClass, next)
            );

      providedMWFunctions.set(instance, chainedMWFunction);
    }
  };
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
