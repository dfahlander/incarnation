import { provide } from "../src/provide";
import { inject } from "../src/inject";
import { Middleware } from "../src/Middleware";
import { entryPoint } from "../src/entryPoint";

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

  class MyStorageMiddleware extends Middleware(Storage) {
    load() {
      return super.load() + " and MyStorageMiddleware";
    }
  }

  class My2ndStorageMW extends Middleware(Storage) {
    load() {
      return super.load() + " and My2ndStorageMW";
    }
  }

  class MySpecializedStorageMiddleware extends Middleware(SpecializedStorage) {
    load() {
      return super.load() + " and MySpecializedStorageMiddleware";
    }
  }

  it("should be possible to inject middleware for a certain class", () => {
    const svc = entryPoint(MyService);
    expect(svc.sayHi()).toBe("Hi, value from Storage"); // Verify default value
    provide(svc).with(MyStorageMiddleware);
    expect(svc.sayHi()).toBe("Hi, value from Storage and MyStorageMiddleware"); // The real test.
  });

  it("should invoke middleware in front of Storage when a Storage is requested but specialized storage provided", () => {
    const svc = entryPoint(MyService);
    provide(svc).with(SpecializedStorage);
    expect(svc.sayHi()).toBe("Hi, value from SpecializedStorage"); // Verify default value
    provide(svc).with(MyStorageMiddleware);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MyStorageMiddleware"
    ); // The real test.
  });

  it("should invoke middleware in front of SpecializedStorage when Storage is requested but SpecializedStorage provided", () => {
    const svc = entryPoint(MyService);
    provide(svc).with(SpecializedStorage);
    expect(svc.sayHi()).toBe("Hi, value from SpecializedStorage"); // Verify default value
    provide(svc).with(MySpecializedStorageMiddleware);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MySpecializedStorageMiddleware"
    ); // The real test.
  });

  it("should invoke multiple middlewares in front of Storage when Storage is requested", () => {
    const svc = entryPoint(MyService);
    expect(svc.sayHi()).toBe("Hi, value from Storage"); // Verify default value
    provide(svc).with(MyStorageMiddleware);
    provide(svc).with(My2ndStorageMW);
    expect(svc.sayHi()).toBe(
      "Hi, value from Storage and MyStorageMiddleware and My2ndStorageMW"
    ); // The real test.
    provide(svc).with(MySpecializedStorageMiddleware); // Won't be invoked until SpecialStorage is provided.
    expect(svc.sayHi()).toBe(
      "Hi, value from Storage and MyStorageMiddleware and My2ndStorageMW"
    ); // Still same result as SpecialStorage wasn't used.
    provide(svc).with(SpecializedStorage);
    expect(svc.sayHi()).toBe(
      "Hi, value from SpecializedStorage and MyStorageMiddleware and My2ndStorageMW and MySpecializedStorageMiddleware"
    ); // The real test.
  });
});
