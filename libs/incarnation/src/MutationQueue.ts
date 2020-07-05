import { Mutation } from "./DataStoreTypes";
import { Topic } from "./Topic";

export interface MutationQueue {
  queued: Mutation[];
  beingSent: Mutation[];
  topic: Topic;
  rev: number;
  add(mutations: Mutation[]): void;
}

export function MutationQueue(
  mutate: (mutations: any[]) => Promise<PromiseSettledResult<any>[]>,
  applyMutations: (
    res: PromiseSettledResult<any>[],
    mutations: Mutation[]
  ) => void
): MutationQueue {
  let timer: any = null;
  let isFlushing = false;

  const que: MutationQueue = {
    queued: [],
    beingSent: [],
    topic: new Topic(),
    rev: 0,
    add(mutations: Mutation[]) {
      que.queued.push(...mutations);
      que.rev++;
      que.topic.notify();
      scheduleFlush();
    },
  };

  function scheduleFlush() {
    if (!isFlushing && !timer) {
      timer = setTimeout(flush, 0);
    }
  }

  async function flush() {
    timer = null;
    isFlushing = true;
    try {
      const mutations = (que.beingSent = que.queued);
      que.queued = [];
      const res = await mutate(mutations);
      que.beingSent = [];
      applyMutations(res, mutations);
    } finally {
      que.beingSent = [];
      isFlushing = false;
      que.topic.notify(); // Could notify after all flushes are done, but why not notify between also! Think through very-slow-network!
      if (que.queued.length > 0) return await flush();
    }
  }

  return que;
}
