import { Class } from "./Class";
import { MWFunction } from "./Context";
import { getEffectiveProps } from "./utils/getEffectiveProps";

export type Middleware<T> = Class<T> & {
  readonly mwFunction: MWFunction;
  middlewareFor: Class<T>;
};

export const middlewareParent = Symbol();

export function Middleware<T>(Class: Class<T>): Middleware<T> {
  const MW = (() =>
    class extends (Class as any) {
      static middlewareFor = Class;
      static get mwFunction() {
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
      }
      constructor(dynamicSuper: T) {
        super();
        // @ts-ignore
        this[middlewareParent] = dynamicSuper;
      }
    } as Middleware<T>)();
  const props = getEffectiveProps(Class.prototype);
  for (const [propName, { get, set, value }] of Object.entries(props)) {
    Object.defineProperty(
      MW.prototype,
      propName,
      get || set || typeof value !== "function"
        ? {
            get() {
              return this[middlewareParent][propName];
            },
            set(value) {
              this[middlewareParent][propName] = value;
            },
          }
        : {
            value() {
              const supr = this[middlewareParent];
              return supr[propName].apply(supr, arguments);
            },
          }
    );
  }

  return MW;
}
