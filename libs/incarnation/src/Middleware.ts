import { Class, AbstractClass } from "./Class";
import { MWFunction } from "./Context";
import { getEffectiveProps } from "./utils/getEffectiveProps";

export type Middleware<T> = Class<T> & {
  readonly mwFunction: MWFunction;
  middlewareFor: Class<T>;
};

export const middlewareParent = Symbol();

export function AbstractMiddleware<T>(
  Class: AbstractClass<T>
): Middleware<any & { [P in keyof T]: T[P] }> {
  // Hard to type nicely!
  return Middleware<any>(Class as Class<T>);
}

export function Middleware<T>(Class: Class<T>): Middleware<T> {
  const superInstances = new WeakMap();
  function MW(dynamicSuper) {
    superInstances.set(this, dynamicSuper);
  }
  Object.setPrototypeOf(MW, Class);
  MW.middlewareFor = Class;
  Object.defineProperty(MW, "mwFunction", {
    get() {
      const ThisMW = this;
      const mwFunction: MWFunction = (requestedClass, mappedClass, next) => {
        const ConcreteClassOrMW = next(requestedClass, mappedClass);
        const ConcreteClass =
          (ConcreteClassOrMW as Middleware<any>).middlewareFor ||
          ConcreteClassOrMW;
        if (requestedClass === Class || ConcreteClass === Class) {
          const ConcreteMW = (() =>
            class extends (ThisMW as any) {
              static middlewareFor = ConcreteClass;
              constructor(...args: any[]) {
                super(new ConcreteClassOrMW(...args));
              }
            })();

          return ConcreteMW;
        }
        return ConcreteClassOrMW;
      };
      return mwFunction;
    },
  });
  MW.prototype = new Proxy(Class.prototype, {
    get(target, propName, receiver) {
      const supr = superInstances.get(receiver);
      if (!supr) return Reflect.get(target, propName, receiver);
      let rv = supr[propName];
      if (typeof rv === "function" && !supr.hasOwnProperty(propName)) {
        rv = supr[propName] = rv.bind(supr);
      }
      return rv;
    },
    set(_, propName, value, receiver) {
      const supr = superInstances.get(receiver);
      if (!supr) return false;
      supr[propName] = value;
      return true;
    },
  });
  return MW as any;
}
