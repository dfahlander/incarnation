export function getEffectiveProps(obj: Object): PropertyDescriptorMap {
  const effectiveProps: PropertyDescriptorMap = {};
  for (; obj && obj !== Object.prototype; obj = Object.getPrototypeOf(obj)) {
    for (const propName of Object.getOwnPropertyNames(obj)) {
      // It is intentional that we only list named properties and not symbols.
      // If we would use Object.getOwnPropertyDescriptors, we would need to ignore props that are symbols
      // because we whitelist properties starting with "$" as well as symbols.
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
