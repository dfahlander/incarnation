import { include } from "../src/include";
import { use } from "../src/use";
import { inject } from "../src/inject";
import { run } from "../src/run";

describe("suspendability", () => {
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
    numFriends = FRIENDS.length;
  }

  it("should be possible to inject db without async flavor", async () => {
    const db = inject(DB);
    expect(db.friends.listFriends()).toBeInstanceOf(Promise);
    expect(await db.friends.listFriends()).toEqual(FRIENDS);
    expect(db.numFriends).toEqual(FRIENDS.length);
  });

  it("should be possible to inject db using include()", async () => {
    const db = include(DB);
    expect(db.friends.listFriends()).toBeInstanceOf(Promise);
    expect(await db.friends.listFriends()).toEqual(FRIENDS);
    expect(db.numFriends).toBeInstanceOf(Promise);
    expect(await db.numFriends).toEqual(FRIENDS.length);
  });

  it("should convert adaptable props when switching btwn use() and include()", async () => {
    await run(() => {
      const db = use(DB);
      const friendColl = db.friends;
      const friends = db.friends.listFriends();
      expect(friends).toEqual(FRIENDS);
      const numFriends = db.numFriends;
      expect(numFriends).toEqual(FRIENDS.length);
    });
  });
});
