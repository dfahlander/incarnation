import { use } from "../src/use";
import { include } from "../src/include";
import { DataStore } from "../src/DataStore";
import { run } from "../src/run";

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

  abstract class KeyValueStore extends DataStore {
    abstract get(key: any): Promise<any>;
    abstract count(): Promise<number>;
    abstract mutate(
      mutations: KeyValueMutation[]
    ): Promise<PromiseSettledResult<any>[]>;
  }

  class MyService {
    store = include(KeyValueStore);
    async get(key: string): Promise<string> {
      const result = await this.store.get(key);
      return result ? result + " from MyService" : result;
    }
    async set(key: string, value: string) {
      await this.store.mutate([{ type: "set", key, value }]);
    }
    async clear() {
      await this.store.mutate([{ type: "clear" }]);
    }
    async count() {
      return (await this.store.count()) + 1;
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
      debugger;
      for (const m of mutations) {
        if (m.type === "clear") {
          map.clear();
        } else if (m.type == "set") {
          map.set(m.key, m.value);
        }
      }
      return await Promise.allSettled(mutations.map((m) => null));
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

  class SuspenseService {
    store = use(KeyValueStore);
    get(key: string): string {
      const result = this.store.get(key);
      return result ? result + " from MyService" : result;
    }
    set(key: string, value: string) {
      debugger;
      this.store.mutate([{ type: "set", key, value }]);
    }
    clear() {
      this.store.mutate([{ type: "clear" }]);
    }
    count() {
      return this.store.count() + 1;
    }
  }

  it("should be possible to use a suspense version of DataStore (imperative)", async () => {
    await run(() => {
      const store = use(MemKeyValueStore);
      store.mutate([
        { type: "clear" },
        { type: "set", key: "foo", value: "bar" },
      ]);
      const bar = store.get("foo");
      expect(bar).toBe("bar");
      const len = store.count();
      expect(len).toBe(1);
      store.mutate([{ type: "clear" }]);
      expect(store.get("foo")).toBeUndefined();
      expect(store.count()).toBe(0); // 0 + 1
    });
  });

  it("should be possible to use a suspense version of DataStore through a service (imperative)", async () => {
    await run(() => {
      const svc = use(SuspenseService, MemKeyValueStore);
      svc.clear();
      svc.set("foo", "bar");
      const bar = svc.get("foo");
      expect(bar).toBe("bar from MyService");
      const len = svc.count();
      expect(len).toBe(2); // 1 + 1
      svc.clear();
      expect(svc.get("foo")).toBeUndefined();
      expect(svc.count()).toBe(1); // 0 + 1
    });
  });
});
