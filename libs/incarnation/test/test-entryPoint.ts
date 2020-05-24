import { entryPoint, asyncEntryPoint } from "../src/entryPoint";
import { include } from "../src/include";
import { run } from "../src/run";
import { use } from "../src/use";

describe("entryPoint", () => {
  it("should be possible to use entryPoint and asyncEntryPoint", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = asyncEntryPoint(MyService);

    const resultPromise = myService.getNumberPlus1(3);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe(4);

    const myService2 = entryPoint(MyService);
    expect(myService2["$async"]).toBe(myService["$async"]);

    const result2 = myService2.getNumberPlus1(13);
    expect(result2).toBe(14);
  });

  it("should convert adaptable props when switching btwn use() and include()", async () => {
    const FRIENDS = [
      {
        id: 1,
        name: "Foo",
      },
      {
        id: 2,
        name: "Bar",
      },
    ];
    debugger;

    class FriendCollection {
      async listFriends() {
        return FRIENDS.slice();
      }
    }
    class DB {
      friends = include(FriendCollection);
    }

    const db = asyncEntryPoint(DB);
    expect(db.friends.listFriends()).toBeInstanceOf(Promise);

    expect(await db.friends.listFriends()).toEqual(FRIENDS);

    function Injector() {
      return asyncEntryPoint(
        class Injector {
          run<R>(fn: () => R): R {
            return fn();
          }
        }
      ) as { run: <R>(fn: () => R) => Promise<R> };
    }

    const injector = Injector();
    await injector.run(() => {
      const db = use(DB);
      const friends = db.friends.listFriends();
      expect(friends).toEqual(FRIENDS);
    });
  });
});
