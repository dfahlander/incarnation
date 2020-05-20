//export const IsAdaptive = Symbol();
export type IsAdaptive = {
  $flavors: {
    orig: object;
    promise?: object;
    suspense?: object;
    observable?: object;
  };
};
