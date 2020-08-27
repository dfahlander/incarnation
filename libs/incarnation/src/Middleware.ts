import { Class, AbstractClass } from "./Class.js";
import { PROVIDER } from "./symbols/PROVIDER.js";
import { HasProviderFn, ProviderFn } from "./Provider.js";

export class Middleware<T> implements HasProviderFn {
  [PROVIDER]: ProviderFn;
  constructor(
    Class: Class<T>,
    classFactory: (SuperClass: Class<T>) => Class<T>
  );
  constructor(
    AbstractClass: AbstractClass<T>,
    classFactory: (SuperClass: Class) => Class<T>
  );
  constructor(
    Class: AbstractClass<T>,
    classFactory: (SuperClass: Class) => Class<T>
  ) {
    this[PROVIDER] = (next) => (requestedClass, mappedClass) => {
      mappedClass = next(requestedClass, mappedClass);
      return mappedClass === Class || mappedClass.prototype instanceof Class
        ? classFactory(mappedClass)
        : mappedClass;
    };
  }
}
