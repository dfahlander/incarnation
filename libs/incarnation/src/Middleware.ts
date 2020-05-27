import { Class, AbstractClass } from "./Class";
import { PROVIDER } from "./symbols/PROVIDER";
import { HasProviderFn, ProviderFn } from "./Provider";

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
