import { Class } from "./Class";
import { ClassMapperMiddleware } from "./Context";

export type Middleware<T> = Class<T> & {
  classMapperMW: ClassMapperMiddleware;
  middlewareFor: Class<T>;
};

export function Middleware<T>(Class: Class<T>): Middleware<T> {
  const MW = (() => class extends (Class as any) {} as Middleware<T>)();
  MW.middlewareFor = Class;
  MW.classMapperMW = function(requestedClass, next) {
    const ConcretedClass = next(requestedClass);
    if (Class === requestedClass) {
      // Fall:
      // 1. Begär Storage, får Storage. MW: Storage.
      // 2. Begär IDBStorage, for IDBStorage, MW: Storage.
      // 3. Begär Storage, får IDBStorage, MW: Storage.
      // 4. Begär Storage, for IDBStorage, MW: IDBStorage.
      // 5. Begär IDBStorage, får IDBStorageMW2, MW: Storage.
    }
    if (this.prototype instanceof ConcretedClass) return MW;
    if ((ConcretedClass as Middleware<any>).middlewareFor === Class) {
      const props = Object.getOwnPropertyDescriptors(this.prototype);
      const ConcreteMW = class extends (ConcretedClass as any) {};
      for (const [propName, descriptor] of Object.entries(props)) {
        Object.defineProperty(ConcreteMW.prototype, propName, descriptor);
      }
      return ConcreteMW;
    }
    return ConcretedClass;
  };
  return MW;
}
