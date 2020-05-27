import { inject } from "../src/inject";
import { Middleware } from "../src/Middleware";
import { Environment } from "../src/Environment";

describe("Middleware", () => {
  class Storage {
    load() {
      return "value from Storage";
    }
  }

  class SpecializedStorage extends Storage {
    load() {
      return "value from SpecializedStorage";
    }
  }

  class MyService {
    sayHi() {
      const storage = inject(Storage);
      return "Hi, " + storage.load();
    }
  }

  const myStorageMiddleware = new Middleware(
    Storage,
    (DownStorge) =>
      class extends DownStorge {
        load() {
          return super.load() + " and MyStorageMiddleware";
        }
      }
  );

  const my2ndStorageMW = new Middleware(
    Storage,
    (SuperStorage) =>
      class extends SuperStorage {
        load() {
          return super.load() + " and My2ndStorageMW";
        }
      }
  );

  const mySpecializedStorageMiddleware = new Middleware(
    SpecializedStorage,
    (SuperSpecStorage) =>
      class extends SuperSpecStorage {
        load() {
          return super.load() + " and MySpecializedStorageMiddleware";
        }
      }
  );

  it("should be possible to inject middleware for a certain class", () => {
    let svc = inject(MyService);
    expect(svc.sayHi()).toBe("Hi, value from Storage"); // Verify default value
    svc = inject(MyService, myStorageMiddleware);
    expect(svc.sayHi()).toBe("Hi, value from Storage and MyStorageMiddleware"); // The real test.
  });

  it("should invoke middleware in front of Storage when a Storage is requested but specialized storage provided", () => {
    const env = new Environment();
    env.add(SpecializedStorage);
    let svc = inject(MyService, env);
    expect(svc.sayHi()).toBe("Hi, value from SpecializedStorage"); // Verify default value
    env.add(myStorageMiddleware);
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MyStorageMiddleware"
    ); // The real test.
  });

  it("should invoke middleware in front of SpecializedStorage when Storage is requested but SpecializedStorage provided", () => {
    const env = new Environment();
    let svc = inject(MyService);
    env.add(SpecializedStorage);
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe("Hi, value from SpecializedStorage"); // Verify default value
    env.add(mySpecializedStorageMiddleware);
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MySpecializedStorageMiddleware"
    ); // The real test.
  });

  it("should invoke multiple middlewares in front of Storage when Storage is requested", () => {
    let svc = inject(MyService);
    expect(svc.sayHi()).toBe("Hi, value from Storage"); // Verify default value
    const env = new Environment();
    env.add(myStorageMiddleware);
    env.add(my2ndStorageMW);
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe(
      "Hi, value from Storage and MyStorageMiddleware and My2ndStorageMW"
    ); // The real test.
    env.add(mySpecializedStorageMiddleware); // Won't be invoked until SpecialStorage is provided.
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe(
      "Hi, value from Storage and MyStorageMiddleware and My2ndStorageMW"
    ); // Still same result as SpecialStorage wasn't used.
    env.add(SpecializedStorage);
    svc = inject(MyService, env);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MyStorageMiddleware and My2ndStorageMW and MySpecializedStorageMiddleware"
    ); // The real test.
  });
});
