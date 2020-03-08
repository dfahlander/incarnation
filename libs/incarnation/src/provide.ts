import { providedMWFunctions } from "./inject";
import { ProvideTarget } from "./ProvideTarget";
import { MWFunction } from "./Context";
import { Middleware } from "./Middleware";
import { Class } from "./Class";
import { getEffectiveProps } from "./utils/getEffectiveProps";

export function provide(instance: object) {
  const layeredInstances = [instance];
  while (instance[ProvideTarget]) {
    instance = instance[ProvideTarget];
    layeredInstances.push(instance);
  }
  return {
    with(provider: MWFunction | Middleware<any> | Class<any>) {
      const isDerivedClass =
        provider.prototype &&
        Object.getPrototypeOf(provider.prototype) !== Object.prototype;
      const mwFunction: MWFunction =
        "getMWFunction" in provider
          ? // A class that extends Middleware(SomeAPI)
            provider.getMWFunction()
          : isDerivedClass
          ? // A class that extends something
            getClassProvider(provider as Class<any>)
          : // A plain function (ClassMapperMiddleware):
            (provider as MWFunction);

      // Extend prototype for abstractClasses
      if (isDerivedClass) {
        const props = getEffectiveProps(instance);
        for (const [propName, prop] of Object.entries(props)) {
          for (const instance of layeredInstances) {
            if (!(propName in instance)) {
            }
          }
        }
      }

      const existingMW = providedMWFunctions.get(instance);
      const chainedMW: MWFunction = !existingMW
        ? mwFunction
        : (Class, mappedClass, next) =>
            mwFunction(Class, mappedClass, (Class, mappedClass) =>
              existingMW(Class, mappedClass, next)
            );

      providedMWFunctions.set(instance, chainedMW);
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
