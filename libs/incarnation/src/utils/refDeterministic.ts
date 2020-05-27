function refDeterministic1<FN extends (arg: object) => any>(fn: FN): FN {
  const weakMap = new WeakMap();
  return ((arg) => {
    const cachedResult = weakMap.get(arg);
    if (cachedResult !== undefined) return cachedResult;
    const result = fn(arg);
    weakMap.set(arg, result);
    return result;
  }) as FN;
}

function refDeterministic2<FN extends (arg1: object, arg2: object) => any>(
  fn: FN
): FN {
  const weakMap1 = new WeakMap();
  return ((arg1, arg2) => {
    let weakMap2 = weakMap1.get(arg1);
    if (!weakMap2) {
      weakMap2 = new WeakMap();
      weakMap1.set(arg1, weakMap2);
    }
    const cachedResult = weakMap2.get(arg2);
    if (cachedResult !== undefined) return cachedResult;
    const result = fn(arg1, arg2);
    weakMap2.set(arg2, result);
    return result;
  }) as FN;
}

function refDeterministicN<FN extends (...args: any[]) => any>(fn): FN {
  const weakMap1 = new WeakMap();
  let noArgsRes;
  return function () {
    let weakMap = weakMap1;
    const stop = arguments.length - 1;
    if (stop < 0) {
      return noArgsRes !== undefined ? noArgsRes : (noArgsRes = fn());
    }
    for (let i = 0; i < stop; ++i) {
      const arg = arguments[i];
      let nextWeakMap = weakMap.get(arg);
      if (!nextWeakMap) {
        nextWeakMap = new WeakMap();
        weakMap.set(arg, nextWeakMap);
      }
      weakMap = nextWeakMap;
    }
    const cachedResult = weakMap.get(arguments[stop]);
    if (cachedResult !== undefined) return cachedResult;
    const result = fn.apply(null, arguments);
    weakMap.set(arguments[stop], result);
    return result;
  } as FN;
}

export function refDeterministic<FN extends (...args: any[]) => any>(
  fn: FN
): FN {
  return fn.length === 1
    ? refDeterministic1(fn) // Optimization of common case
    : fn.length === 2
    ? refDeterministic2(fn) // Optimization of common case
    : refDeterministicN(fn);
}
