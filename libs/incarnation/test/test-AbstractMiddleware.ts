import { inject } from "../src/inject";
import { Middleware } from "../src/Middleware";
import { Environment } from "../src/Environment";

describe("AbstractMiddleware", () => {
  abstract class Storage {
    abstract load(): string;
  }

  class ConcreteStorageA extends Storage {
    load() {
      return "value from ConcreteStorageA";
    }
  }

  class ConcreteStorageB extends Storage {
    load() {
      return "value from ConcreteStorageB";
    }
  }

  const myStorageMiddleware = new Middleware(
    Storage,
    (DownStorage) =>
      class extends DownStorage {
        load() {
          return super.load() + " and MyStorageMiddleware";
        }
      }
  );

  it("should be possible to inject a concrete storage", () => {
    let storage = inject(Storage, ConcreteStorageA);
    expect(storage.load()).toBe("value from ConcreteStorageA");
    storage = inject(Storage, ConcreteStorageB);
    expect(storage.load()).toBe("value from ConcreteStorageB");
  });

  it("should be possible to provide a middleware on an abstract class", () => {
    const storage = inject(Storage, ConcreteStorageA, myStorageMiddleware);
    expect(storage.load()).toBe(
      "value from ConcreteStorageA and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class 2", () => {
    const env = new Environment();
    env.add(ConcreteStorageA);
    env.add(myStorageMiddleware);
    const storage = inject(Storage, env);
    expect(storage.load()).toBe(
      "value from ConcreteStorageA and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class before a concrete class is provided", () => {
    const storage = inject(Storage, myStorageMiddleware, ConcreteStorageB);
    expect(storage.load()).toBe(
      "value from ConcreteStorageB and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class before a concrete class is provided 2", () => {
    const env = new Environment();
    env.add(myStorageMiddleware);
    env.add(ConcreteStorageB);
    const storage = inject(Storage, env);
    expect(storage.load()).toBe(
      "value from ConcreteStorageB and MyStorageMiddleware"
    );
  });
});
