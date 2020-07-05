import { ResultReducerSet, Mutation } from "../DataStoreTypes";
import { invalidate } from "../invalidate";

export function reduceResult(
  result: any,
  reducers: ResultReducerSet | undefined,
  mutations: Mutation[],
  mutationResults?: PromiseSettledResult<any>[]
) {
  if (!reducers) return invalidate(result);
  if (mutationResults) {
    for (let i = 0, l = mutations.length; i < l; ++i) {
      const mutRes = mutationResults[i];
      if (mutRes.status === "rejected") continue;
      const m = mutations[i];
      const reducer = reducers[m.type];
      result = reducer ? reducer(result, m, mutRes.value) : invalidate(result);
    }
  } else {
    for (let i = 0, l = mutations.length; i < l; ++i) {
      const m = mutations[i];
      const reducer = reducers[m.type];
      result = reducer ? reducer(result, m) : invalidate(result);
    }
  }
  return result;
}
