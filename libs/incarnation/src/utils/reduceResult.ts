import { ResultReducerSet, Mutation } from "../DataStoreTypes.js";
import { invalidate } from "../invalidate.js";

export function reduceResult(
  result: any,
  reducers: ResultReducerSet | undefined,
  mutations: Mutation[],
  mutationResults?: any[]
) {
  if (!reducers) return invalidate(result);
  if (mutationResults) {
    for (let i = 0, l = mutations.length; i < l; ++i) {
      const mutRes = mutationResults[i];
      const m = mutations[i];
      const reducer = reducers[m.type];
      result = reducer ? reducer(result, m, mutRes) : invalidate(result);
      //console.debug("Got reduced result", reducer, result, m);
    }
  } else {
    for (let i = 0, l = mutations.length; i < l; ++i) {
      const m = mutations[i];
      const reducer = reducers[m.type];
      result = reducer ? reducer(result, m) : invalidate(result);
      //console.debug("Got reduced result", reducer, result, m);
    }
  }
  return result;
}
