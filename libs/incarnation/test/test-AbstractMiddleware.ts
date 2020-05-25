import { provide } from "../src/to-remove/provide";
import { inject } from "../src/inject";
import { Middleware, AbstractMiddleware } from "../src/Middleware";
import { entryPoint } from "../src/to-remove/entryPoint";

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
    let storage = entryPoint(Storage);
    provide(storage).with(ConcreteStorageA);
    expect(storage.load()).toBe("value from ConcreteStorageA");
    storage = entryPoint(Storage);
    provide(storage).with(ConcreteStorageB);
    expect(storage.load()).toBe("value from ConcreteStorageB");
  });

  it("should be possible to provide a middleware on an abstract class", () => {
    let storage = entryPoint(Storage);
    provide(storage).with(ConcreteStorageA);
    provide(storage).with(MyStorageMiddleware);
    expect(storage.load()).toBe(
      "value from ConcreteStorageA and MyStorageMiddleware"
    );
  });

  it("should be possible to provide a middleware on an abstract class before a concrete class is provided", () => {
    let storage = entryPoint(Storage);
    provide(storage).with(MyStorageMiddleware);
    provide(storage).with(ConcreteStorageB);
    expect(storage.load()).toBe(
      "value from ConcreteStorageB and MyStorageMiddleware"
    );
  });
});
