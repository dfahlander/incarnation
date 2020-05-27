import { PROVIDER } from "./symbols/PROVIDER";
import { Class, AbstractClass } from "./Class";
import { refDeterministic } from "./utils/refDeterministic";

export type Provider = ChainableClassMapper | HasChainableClassMapper | Class;

export type ChainableClassMapper = (next: ClassMapper) => ClassMapper;

export type ClassMapper = (
  requestedClass: AbstractClass,
  mappedClass: Class
) => Class;

export interface HasChainableClassMapper {
  readonly [PROVIDER]: ChainableClassMapper;
}

// Decorate function with refDeterministic1, so that we
// always return same ProviderFunction, given the same Provider argument.
export const resolveProvider = refDeterministic(_resolveProvider);

function _resolveProvider(provider: Provider): ChainableClassMapper {
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
  return provider as ChainableClassMapper;
}

const getClassProvider = (ConcreteClass: Class) => (next: ClassMapper) => (
  requestedClass: AbstractClass,
  mappedClass: Class
) =>
  next(
    requestedClass,
    ConcreteClass.prototype instanceof mappedClass ? ConcreteClass : mappedClass
  );
