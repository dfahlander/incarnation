import { getEffectiveProps } from "./getEffectiveProps";

export function getWrappedProps(
  instance: any,
  wrapper: (
    fn: (...args: any[]) => any,
    propName: string,
    type: "get" | "set" | "value"
  ) => (...args: any[]) => any
): PropertyDescriptorMap {
  const fnProps = getEffectiveProps(instance);
  const externalProps: PropertyDescriptorMap = {};
  for (const [propName, { get, set, value, enumerable }] of Object.entries(
    fnProps
  )) {
    const externalProp: PropertyDescriptor = { enumerable };
    if (get) {
      externalProp.get = wrapper(get, propName, "get");
    }
    if (set) {
      externalProp.set = wrapper(set, propName, "set");
    }
    if (value) {
      if (typeof value === "function") {
        externalProp.value = wrapper(value, propName, "value");
      } else {
        // Convert value property to getter/setter that operates on the real instance:
        externalProp.get = () => instance[propName];
        externalProp.set = (value) => (instance[propName] = value);
      }
    }
    externalProps[propName] = externalProp;
  }
  return externalProps;
}
