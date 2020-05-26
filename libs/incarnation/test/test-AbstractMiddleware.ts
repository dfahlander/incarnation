import { inject } from "../src/inject";
import { Middleware, AbstractMiddleware } from "../src/Middleware";
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

  class MyStorageMiddleware extends AbstractMiddleware(Storage) {
    load() {
      return super.load() + " and MyStorageMiddleware";
    }
  }

  it("should be possible to inject a concrete storage", () => {
    let storage = inject(Storage, ConcreteStorageA);
    expect(storage.load()).toBe("value from ConcreteStorageA");
    storage = inject(Storage, ConcreteStorageB);
    expect(storage.load()).toBe("value from ConcreteStorageB");
  });

  it("should be possible to provide a middleware on an abstract class", () => {
    const storage = inject(Storage, ConcreteStorageA, MyStorageMiddleware);
    expect(storage.load()).toBe(
      "value from ConcreteStorageA and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class 2", () => {
    const env = new Environment();
    env.addProvider(ConcreteStorageA);
    env.addProvider(MyStorageMiddleware);
    const storage = inject(Storage, env);
    expect(storage.load()).toBe(
      "value from ConcreteStorageA and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class before a concrete class is provided", () => {
    const storage = inject(Storage, MyStorageMiddleware, ConcreteStorageB);
    expect(storage.load()).toBe(
      "value from ConcreteStorageB and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class before a concrete class is provided 2", () => {
    const env = new Environment();
    env.addProvider(MyStorageMiddleware);
    env.addProvider(ConcreteStorageB);
    const storage = inject(Storage, env);
    expect(storage.load()).toBe(
      "value from ConcreteStorageB and MyStorageMiddleware"
    );
  });
});
