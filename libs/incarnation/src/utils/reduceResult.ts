import { ResultReducerSet, Mutation } from "../DataStoreTypes";
import { invalidate } from "../invalidate";

export function reduceResult(
  result: any,
  reducers: ResultReducerSet | undefined,
  mutations: Mutation[]
) {
  if (!reducers) return invalidate(result);
  for (const m of mutations) {
    const reducer = reducers[m.type];
    result = reducer ? reducer(result, m) : invalidate(result);
  }
  return result;
}
