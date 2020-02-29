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

export interface PropertyInfo {
  propName: string;
  descriptor: PropertyDescriptor;
  isMethod: boolean;
}

export function getEffectiveProps2(instance: Object): PropertyInfo[] {
  const effectiveProps: { [propName: string]: PropertyInfo } = {};
  for (
    let obj = instance;
    obj && obj !== Object.prototype;
    obj = Object.getPrototypeOf(obj)
  ) {
    for (const propName of Object.getOwnPropertyNames(obj)) {
      const descriptor = Object.getOwnPropertyDescriptor(obj, propName)!;
      if (!(propName in effectiveProps)) {
        effectiveProps[propName] = {
          propName,
          descriptor,
          isMethod:
            /*obj !== instance &&*/ typeof descriptor.value === "function"
        };
      }
    }
  }
  return Object.values(effectiveProps);
}
