import { Mutation } from "./DataStoreTypes.js";
import { Signal } from "./Signal.js";

export interface MutationQueue {
  queued: Mutation[];
  beingSent: Mutation[];
  signal: Signal;
  rev: number;
  enqueMutations(mutations: Mutation[]): void;
  flush(): Promise<void>;
  count(): number;
}

export function MutationQueue(
  mutate: (mutations: any[]) => Promise<PromiseSettledResult<any>[]>,
  applyMutations: (
    res: PromiseSettledResult<any>[],
    mutations: Mutation[]
  ) => void
): MutationQueue {
  let timer: any = null;
  let flushOngoingPromise: Promise<any> | null = null;

  const que: MutationQueue = {
    queued: [],
    beingSent: [],
    signal: new Signal(),
    rev: 0,
    enqueMutations(mutations: Mutation[]) {
      console.debug(
        "Enquing mutations. Queued:",
        que.queued,
        "Being sent:",
        que.beingSent
      );
      que.queued.push(...mutations);
      que.rev++;
      que.signal.notify();
      scheduleFlush();
    },
    flush(): Promise<void> {
      if (!flushOngoingPromise) {
        if (timer) clearTimeout(timer);
        timer = null;
        flushOngoingPromise = _flush().then(() => (flushOngoingPromise = null));
      }
      return flushOngoingPromise;
    },
    count() {
      return this.queued.length + this.beingSent.length;
    },
  };

  function scheduleFlush() {
    if (!flushOngoingPromise && !timer) {
      timer = setTimeout(que.flush, 0);
    }
  }

  async function _flush(): Promise<void> {
    const mutations = (que.beingSent = que.queued);
    try {
      que.queued = [];
      const res = await mutate(mutations);
      que.beingSent = [];
      applyMutations(res, mutations);
    } catch (error) {
      // TODO: Where to put errors? For now on console. Need an error stream of some kind.
      console.warn("Unsuccessful mutate()", mutations, "Error:", error);
    }
    que.beingSent = [];
    que.rev++;
    que.signal.notify(); // Could notify after all flushes are done, but why not notify between also! Think through very-slow-network!
    if (que.queued.length > 0) return await _flush();
  }

  return que;
}
