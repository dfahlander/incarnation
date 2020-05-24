export type Orig<T> = T extends { $flavors: { orig: infer O } } ? O : T;
