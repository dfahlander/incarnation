import { MWFunction } from "./Context";
import { PROVIDER } from "./symbols/PROVIDER";
import { Class } from "./Class";
import { refDeterministic1 } from "./utils/refDeterministic";

export type Provider = MWFunction | ImplicitProvider | Class;

export interface ImplicitProvider {
  readonly [PROVIDER]: MWFunction;
}

export function resolveProvider(provider: Provider): MWFunction {
  return PROVIDER in provider
    ? // A class that extends Middleware(SomeAPI) or a Context
      provider[PROVIDER]
    : (provider as any).prototype &&
      Object.getPrototypeOf((provider as any).prototype) !== Object.prototype
    ? // A class that extends something
      getClassProvider(provider as Class)
    : // A plain function (ClassMapperMiddleware):
      (provider as MWFunction);
}

const getClassProvider = refDeterministic1((ConcreteClass: Class) => {
  const mw: MWFunction = (requestedClass, mappedClass, next) =>
    next(
      requestedClass,
      ConcreteClass.prototype instanceof mappedClass
        ? ConcreteClass
        : mappedClass
    );
  return mw;
});
