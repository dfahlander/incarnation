import { getEffectiveProps } from "./getEffectiveProps.js";

const nil = Object.create(null);

export function getWrappedProps(
  instanceOrProto: any,
  wrapper: (
    fn: (...args: any[]) => any,
    propName: string,
    type: "get" | "set" | "value"
  ) => (...args: any[]) => any,
  wrapPlainValues: boolean
): PropertyDescriptorMap {
  const fnProps = getEffectiveProps(instanceOrProto);
  const externalProps: PropertyDescriptorMap = {};
  for (const [propName, { get, set, value, enumerable }] of Object.entries(
    fnProps
  )) {
    if (propName[0] === "$") continue;
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
      } else if (wrapPlainValues) {
        // Convert value property to getter/setter that operates on the real instance:
        // I know this feels wierd if instanceOrProto is a prototype,
        // but class prototypes never have.
        // Wrapping get of value prop is important
        // to convert Adaptive objects to requested flavor
        externalProp.get = wrapper(
          () => instanceOrProto[propName],
          propName,
          "get"
        );
        // Wrapping the setter is for completeness. Don't see a use case
        // other than possible rewriting an Adaptive object back to its
        // orignal value.
        externalProp.set = wrapper(
          (value) => (instanceOrProto[propName] = value),
          propName,
          "set"
        );
      }
    }
    externalProps[propName] = externalProp;
  }
  return externalProps;
}
