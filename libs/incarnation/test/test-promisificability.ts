import { include } from "../src/include";
import { use } from "../src/use";
import { inject } from "../src/inject";

describe("promisificability", () => {
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

  class FriendQuery {
    listFriends() {
      return FRIENDS.slice();
    }
    numFriends = FRIENDS.length;
    get numFriendsPlus1() {
      return this.numFriends + 1;
    }
  }
  class DB {
    friends = inject(FriendQuery);
  }
  class DBFlavoured {
    friends = use(FriendQuery);
  }

  it("should be possible to inject db without async flavor", () => {
    const db = inject(DB);
    expect(db.friends.listFriends()).toEqual(FRIENDS);
    expect(db.friends.numFriends).toEqual(FRIENDS.length);
  });

  it("should be possible to inject db using use()", () => {
    // We don't need run() because we know the implementation never returns async values anywhere.
    const db = use(DB);
    const friends = db.friends.listFriends();
    expect(friends).toEqual(FRIENDS);
    const numFriends = db.friends.numFriends;
    expect(numFriends).toEqual(FRIENDS.length);
    const { numFriendsPlus1 } = db.friends;
    expect(numFriendsPlus1).toEqual(numFriends + 1);
  });

  it("should convert adaptable props when switching btwn use() and include()", async () => {
    const db = include(DBFlavoured);
    expect(db.friends.listFriends()).toBeInstanceOf(Promise);
    expect(await db.friends.listFriends()).toEqual(FRIENDS);
    expect(db.friends.numFriends).toBeInstanceOf(Promise);
    expect(await db.friends.numFriends).toEqual(FRIENDS.length);
    expect(db.friends.numFriendsPlus1).toBeInstanceOf(Promise);
    expect(await db.friends.numFriendsPlus1).toEqual(FRIENDS.length + 1);
  });
});
