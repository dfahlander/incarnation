const isArray = Array.isArray;
const getProto = Object.getPrototypeOf;
const { toString: toStr } = {};
function toStringTag(val: any) {
  return toStr.call(val); //.slice(8, -1);
}

const getOwnPropNames = Object.getOwnPropertyNames;

const equalsByProto = {
  "Intl.Collator": (a: Intl.Collator, b: Intl.Collator) => {
    return deepEqualsImmutable(a.resolvedOptions(), b.resolvedOptions());
  },
};

const equalsByProtoMap = new Map<Object, (a: any, b: any) => boolean>(
  Object.keys(equalsByProto)
    .map((ns) => {
      const ctor = ns.split(".").reduce((p, c) => p && p[c], globalThis);
      return ctor && [ctor.prototype, equalsByProto[ns]];
    })
    .filter((x) => x) as [any, (a: any, b: any) => boolean][]
);

const equalsByType = {
  "[object Date]": (a: Date, b: Date) => a.getTime() === b.getTime(),
  "[object Uint8ClampedArray]": numberArrayEquals,
  "[object ArrayBuffer]": arrayBufferEquals,
  "[object SharedArrayBuffer]": numberArrayEquals,
  "[object DataView]": (a: DataView, b: DataView) =>
    numberArrayEquals(
      new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
      new Uint8Array(b.buffer, b.byteOffset, b.byteLength)
    ),
  "[object RegExp]": (a: RegExp, b: RegExp) =>
    propsEquals(
      a,
      b,
      "source",
      "global",
      "ignoreCase",
      "multiline",
      "sticky",
      "unicode"
    ),

  "[object Object]": (a: any, b: any) => {
    /* Right now, we accept custom class instances and compare them be accessing all their
     own properties. This is not perfect. If class has some private state that is not
     revealed through public properties, we might do a false positive, which would
     lead to a view not being updated. Very theorerically.
     
     The alternatives are:
      1) Throw if custom class. Don't accept custom instances as arguments, just plain objects with
         plain values, including Date, ArrayBuffer etc. A downside with this is of course that
         it would prevent OOP patterns, such as creating a query class. However, if it was me,
         I'd rather use an interface in that case.
      2) Throw unless object has equals() method. If so, use that one to compare.
      3) Don't throw but use the equals() method if present.

      Intl.Collator is one example that would always be true no matter the internal slots it has.
      Even if we'd stick to plain objects, they could consist of functions that, when called retrieved things from closures that would differ.
     */
    const proto = getProto(a);
    if (proto !== getProto(b)) return false;
    // Allow only explicitely listed types and POJO objects. Not custom classes:
    if (proto && proto !== Object.prototype) {
      const eqByProto = equalsByProtoMap.get(proto);
      if (!eqByProto) {
        throw new Error(
          `Invalid type for comparision${
            proto.constructor ? `: ${proto.constructor.name}` : ``
          }`
        );
      }
      return eqByProto(a, b);
    }
    const props = getOwnPropNames(a);
    if (!deepArrayEquals(props, getOwnPropNames(b))) return false;
    for (let i = 0, l = props.length; i < l; ++i) {
      const propName = props[i];
      if (!deepEqualsImmutable(a[propName], b[propName])) return false;
    }
    return true;
  },
};

["BigInt", "Number", "Boolean", "String"].forEach((otherType) => {
  equalsByType[`[object ${otherType}]`] = (a: any, b: any) => a === b;
});
["Uint", "Int"].forEach((intType) =>
  [8, 16, 32].forEach((bitLength) => {
    equalsByType[`[object ${intType}${bitLength}Array]`] = numberArrayEquals;
  })
);

const typeCompareMap = {
  string: () => false, // because we know that typeof a === 'string' && typeof b === 'string', and that (a === b) evaluated false.
  number: (a: number, b: number) => (isNaN(a) && isNaN(b) ? true : false),
  boolean: () => false,
  bigint: () => false,
  undefined: () => true, // Because typeof a === 'undefined' && typeof b === 'undefined'
  function: () => false,
  object: (a, b) =>
    a
      ? b
        ? isArray(a)
          ? isArray(b)
            ? deepArrayEquals(a, b) // Both are arrays
            : false // not same type
          : nonNullNonArrayObjectEquals(a, b) // None are arrays. Compare as objects
        : false // a === null but b is something else.
      : true, // Both are null
};

export function propsEquals<T>(a: T, b: T, ...props: Array<keyof T>) {
  for (let i = 0, l = props.length; i < l; ++i) {
    const propName = props[i];
    if (!deepEqualsImmutable(a[propName], b[propName])) return false;
  }
  return true;
}

export function arrayBufferEquals(a: ArrayBufferLike, b: ArrayBufferLike) {
  return numberArrayEquals(new Uint8Array(a), new Uint8Array(b));
}

export function numberArrayEquals(a: ArrayLike<number>, b: ArrayLike<number>) {
  const l = a.length;
  if (l !== b.length) return false;
  for (let i = 0; i < l; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function deepArrayEquals(a: any[], b: any[]) {
  const l = a.length;
  if (l !== b.length) return false;
  for (let i = 0; i < l; ++i) {
    if (!deepEqualsImmutable(a[i], b[i])) return false;
  }
  return true;
}

function nonNullNonArrayObjectEquals(a: any, b: any) {
  const type = toStringTag(a);
  if (type !== toStringTag(b)) return false;
  const specificEquals = equalsByType[type || "[object Object]"];
  if (!specificEquals) throw new Error(`Cannot determine equality for ${type}`);
  return specificEquals(a, b);
}

export function deepEqualsImmutable(a: any, b: any) {
  if (a === b) return true;
  const type = typeof a;
  if (type !== typeof b) return false;
  return typeCompareMap[type](a, b);
}
