import { include } from "../src/include";
import { run } from "../src/run";
import { use } from "../src/use";
import { inject } from "../src/inject";

describe("inject", () => {
  it("should be possible to use inject and include", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = include(MyService);

    const resultPromise = myService.getNumberPlus1(3);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe(4);

    const myService2 = inject(MyService);
    const result2 = myService2.getNumberPlus1(13);
    expect(result2).toBe(14);
  });

  // TODO: Move this part to a new module that tests adaptivity
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

    class FriendCollection {
      async listFriends() {
        return FRIENDS.slice();
      }
    }
    class DB {
      friends = include(FriendCollection);
    }

    const db = include(DB);
    expect(db.friends.listFriends()).toBeInstanceOf(Promise);

    expect(await db.friends.listFriends()).toEqual(FRIENDS);

    const injector = include(
      class {
        run(fn) {
          return fn();
        }
      }
    ) as { run: <R>(fn: () => R) => Promise<R> };

    await injector.run(() => {
      const db = use(DB);
      const friends = db.friends.listFriends();
      expect(friends).toEqual(FRIENDS);
    });
  });
});
