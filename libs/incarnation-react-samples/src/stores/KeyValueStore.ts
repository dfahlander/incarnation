import {
  DataStore,
  Context,
  use,
  inject,
  OptimisticUpdater,
} from "incarnation";

interface SetMutation {
  type: "set";
  key: any;
  value: any;
}

interface ClearMutation {
  type: "clear";
}

type KeyValueMutation = SetMutation | ClearMutation;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class KeyValueStore extends DataStore {
  static Config = Context({ sleepTime: 0 });
  private data = new Map();

  async mutate(
    mutations: KeyValueMutation[]
  ): Promise<PromiseSettledResult<any>[]> {
    const { sleepTime } = inject(KeyValueStore.Config);
    console.debug("SleepTime:", sleepTime);
    if (sleepTime > 0) {
      await sleep(sleepTime);
    }
    for (const m of mutations) {
      if (m.type === "set") {
        this.data.set(m.key, m.value);
      } else if (m.type === "clear") {
        this.data.clear();
      }
    }
    return mutations.map((m) => ({ status: "fulfilled", value: undefined }));
  }

  async get(key: any) {
    return this.data.get(key);
  }

  async count() {
    return this.data.size;
  }
}

KeyValueStore.reducers = {
  get(key) {
    return {
      set: (result, m) => {
        //if (m.key === key) console.debug("get.set:", m.value, result);
        //else console.debug("get.set.not.found");
        return m.key === key ? m.value : result;
      },
      clear: (result, m) => undefined,
    };
  },
  count() {
    return {
      clear: (result, m) => 0,
    };
  },
} as OptimisticUpdater<KeyValueStore>;

/*
export const KeyValueStoreOptimisticUpdater = OptimisticUpdater(KeyValueStore, {
  get: (key) => ({
    set: (result, m) => {
      //if (m.key === key) console.debug("get.set:", m.value, result);
      //else console.debug("get.set.not.found");
      return m.key === key ? m.value : result;
    },
    clear: (result, m) => undefined,
  }),
  count: () => ({
    clear: (result, m) => 0,
  }),
});
*/
