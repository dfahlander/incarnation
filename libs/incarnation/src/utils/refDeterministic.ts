export function refDeterministic1<FN extends (arg: object) => any>(fn: FN): FN {
  const weakMap = new WeakMap();
  return ((arg) => {
    const cachedResult = weakMap.get(arg);
    if (cachedResult !== undefined) return cachedResult;
    const result = fn(arg);
    weakMap.set(arg, result);
    return result;
  }) as FN;
}
