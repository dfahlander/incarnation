/** Creates a proxy for something that may not yet exist and that may change any time.
 *
 * This function returns a Proxy with all traps redirected to the result of given get() function.
 * The given get() function is called on demand from every trap. This means that the reference can
 * exist before the target is created and that the target can change at any time.
 *
 * The user of this LazyRef will regard it as the resulting target.
 *
 */
export function LazyRef<T>(get: () => T): T {
  return new Proxy(
    {},
    {
      apply: (_, thisArg, args) => Reflect.apply(get() as any, thisArg, args),
      construct: (_, args, newTarget) =>
        Reflect.construct(get() as any, args, newTarget),
      defineProperty: (_, prop, descr) =>
        Reflect.defineProperty(get() as any, prop, descr),
      deleteProperty: (_, prop) => Reflect.deleteProperty(get() as any, prop),
      get: (_, p) => get()[p],
      getOwnPropertyDescriptor: (_, prop) =>
        Reflect.getOwnPropertyDescriptor(get() as any, prop),
      getPrototypeOf: () => Reflect.getPrototypeOf(get() as any),
      has: (_, prop) => Reflect.has(get() as any, prop),
      isExtensible: () => Reflect.isExtensible(get() as any),
      ownKeys: () => Reflect.ownKeys(get() as any),
      preventExtensions: () => Reflect.preventExtensions(get() as any),
      set: (_, prop, value) => {
        const target = get() as any;
        return Reflect.set(target, prop, value, target);
      },
      setPrototypeOf: (_, newProto) =>
        Reflect.setPrototypeOf(get() as any, newProto),
    }
  ) as T;
}
