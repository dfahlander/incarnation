import { getEffectiveProps } from "./getEffectiveProps";

export function createProxy<T extends object>(
  instance: T,
  wrapper: (
    fn: (...args: any[]) => any,
    propName: string,
    type: "get" | "set" | "val"
  ) => (...args: any[]) => any
): T {
  //const SubClass = class extends (Class as any) {};
  const fnProps = getEffectiveProps(instance);
  const externalProps: PropertyDescriptorMap = {};
  for (const [propName, { get, set, value, ...rest }] of Object.entries(
    fnProps
  )) {
    const externalProp: PropertyDescriptor = { ...rest };
    if (get) {
      externalProp.get = wrapper(get, propName, "get");
    }
    if (set) {
      externalProp.set = wrapper(set, propName, "set");
    }
    if (value) {
      if (typeof value === "function") {
        externalProp.value = wrapper(value, propName, "val");
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
