import { Class } from "../Class";
import { getEffectiveProps } from "./getEffectiveProps";

export function createProxy<T extends object>(
  instance: T,
  wrapper: (fn: (...args: any[]) => any) => (...args: any[]) => any
): T {
  //const SubClass = class extends (Class as any) {};
  const fnProps = getEffectiveProps(instance);
  const externalProps: PropertyDescriptorMap = {};
  for (const [propName, { get, set, value, ...rest }] of Object.entries(
    fnProps
  )) {
    const externalProp: PropertyDescriptor = { ...rest };
    if (get) {
      externalProp.get = wrapper(get);
    }
    if (set) {
      externalProp.set = wrapper(set);
    }
    if (value) {
      if (typeof value === "function") {
        externalProp.value = wrapper(value);
      } else {
        // Convert value property to getter/setter that operates on the real instance:
        externalProp.get = () => instance[propName];
        externalProp.set = value => (instance[propName] = value);
      }
    }
    externalProps[propName] = externalProp;
  }

  return Object.create(instance, externalProps);
}
