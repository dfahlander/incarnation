import { use } from "../src/use";
import { include } from "../src/include";

describe("DataStore", () => {
  type KeyValueMutation =
    | {
        type: "set";
        key: any;
        value: any;
      }
    | {
        type: "clear";
      };

  abstract class KeyValueStore extends DataStore<KeyValueMutation> {
    abstract async get(key: any): Promise<any>;
    abstract async count(): Promise<number>;
    abstract async mutate(mutations: KeyValueMutation[]): Promise<void>;
  }

  class MyService {
    store = use(KeyValueStore);
    get(key: string): string {
      const result = this.store.get(key) as string;
      return result + " from MyService";
    }
    set(key: string, value: string) {
      this.store.set(key, value);
    }
    clear() {
      this.store.clear();
    }
    count() {
      return this.store.count() + 1;
    }
  }

  const map = new Map();
  class MemKeyValueStore extends KeyValueStore {
    async get(key: any) {
      return map.get(key);
    }

    async count() {
      return map.size;
    }

    async mutate(mutations: KeyValueMutation[]) {
      for (const m of mutations) {
        if (m.type === "clear") {
          map.clear();
        } else if (m.type == "set") {
          map.set(m.key, m.value);
        }
      }
    }
  }

  it("should be possible to implement a DataStore", async () => {
    const svc = include(MyService, MemKeyValueStore);
    await svc.set("foo", "bar");
    const bar = await svc.get("foo");
    expect(bar).toBe("bar from MyService");
    const len = await svc.count();
    expect(len).toBe(2); // 1 + 1
    await svc.clear();
    expect(await svc.get("foo")).toBeUndefined();
    expect(await svc.count()).toBe(1); // 0 + 1
  });
});
