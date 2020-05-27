import { PROVIDER } from "./symbols/PROVIDER";
import { Class, AbstractClass } from "./Class";
import { refDeterministic } from "./utils/refDeterministic";

export type Provider = ProviderFn | HasProviderFn | Class;

export type ProviderFn = (next: ClassMapper) => ClassMapper;

export type ClassMapper = (
  requestedClass: AbstractClass,
  mappedClass: Class
) => Class;

export interface HasProviderFn {
  readonly [PROVIDER]: ProviderFn;
}

export function resolveProvider(provider: Provider): ProviderFn {
  if (!provider) throw TypeError(`Given provider is falsy`);
  if (PROVIDER in provider) {
    // An object that can return a provider.
    return provider[PROVIDER];
  }
  if (typeof provider !== "function")
    throw TypeError(
      `Given provider is neither function, class or {[PROVIDER]}`
    );
  if (
    (provider as any).prototype &&
    Object.getPrototypeOf((provider as any).prototype) !== Object.prototype
  ) {
    // A class that extends something
    return getClassProvider(provider as Class);
  }
  // A plain ProviderFunction
  return provider as ProviderFn;
}

export const getClassProvider = refDeterministic(_getClassProvider);

function _getClassProvider(ConcreteClass: Class): ProviderFn {
  return (next: ClassMapper) => (
    requestedClass: AbstractClass,
    mappedClass: Class
  ) =>
    next(
      requestedClass,
      ConcreteClass.prototype instanceof mappedClass
        ? ConcreteClass
        : mappedClass
    );
}
