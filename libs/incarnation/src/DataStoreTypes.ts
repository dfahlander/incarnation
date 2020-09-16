export type Mutation = { type: string | number };

export type ResultReducer<T = any> = (
  prevResult: T,
  op: Mutation,
  opResult?: any
) => T;

export type ResultReducerSet = {
  [mutationType: string]: ResultReducer;
};

export type GetResultReducers = (...args: any[]) => ResultReducerSet;
