export function getEffectiveProps(obj: Object): PropertyDescriptorMap {
  const effectiveProps: PropertyDescriptorMap = {};
  for (; obj && obj !== Object.prototype; obj = Object.getPrototypeOf(obj)) {
    for (const propName of Object.getOwnPropertyNames(obj)) {
      if (!(propName in effectiveProps)) {
        effectiveProps[propName] = Object.getOwnPropertyDescriptor(
          obj,
          propName
        )!;
      }
    }
  }
  return effectiveProps;
}
