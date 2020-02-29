import { providedClassMapperMiddleware } from "./inject";
import { ProvideTarget } from "./ProvideTarget";
import { ClassMapperMiddleware } from "./Context";
import { Middleware } from "./Middleware";
import { Class } from "./Class";

export function provide(instance: object) {
  while (instance[ProvideTarget]) instance = instance[ProvideTarget];
  return {
    with(provider: ClassMapperMiddleware | Middleware<any> | Class<any>) {
      // TODO: Also accept Middlewares (class Middlewares etc)
      if ("classMapperMW" in provider)
        providedClassMapperMiddleware.set(instance, provider.classMapperMW);
      else if (
        provider.prototype &&
        Object.getPrototypeOf(provider.prototype) !== Object.prototype
      )
        providedClassMapperMiddleware.set(
          instance,
          getClassProvider(provider as Class<any>)
        );
      else
        providedClassMapperMiddleware.set(
          instance,
          provider as ClassMapperMiddleware
        );
    }
  };
}

function getClassProvider(ConcreteClass: Class<any>) {
  // TODO: memoize result?
  const mw: ClassMapperMiddleware = (Class, next) =>
    ConcreteClass.prototype instanceof Class ? ConcreteClass : next(Class);
  return mw;
}
