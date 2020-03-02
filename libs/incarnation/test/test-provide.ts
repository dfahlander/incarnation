import { entryPoint } from "../src/entryPoint";
import { provide } from "../src/provide";
import { inject } from "../src/inject";

describe("provide", () => {
  class MyService {
    sayHi() {
      return "Hi!";
    }
  }

  class MyAlternateService extends MyService {
    sayHi() {
      return "Ho!";
    }
  }

  class MyAlternateService2 extends MyService {
    sayHi() {
      return "Hey!";
    }
  }

  class MyAlternativeToMyAlternateService extends MyAlternateService {
    sayHi() {
      return "Hohoho!";
    }
  }

  it("should be possible to provide an alternate implementation of the service itself when invoked using entryPoint", async () => {
    const myService = inject(MyService);
    provide(myService).with((requestedClass, mappedClass, next) =>
      next(
        requestedClass,
        requestedClass === MyService ? MyAlternateService : mappedClass
      )
    );
    expect(myService.sayHi()).toBe("Ho!");
  });

  it("should prioritize the latest provided implementation", () => {
    const myService = inject(MyService);
    provide(myService).with(MyAlternateService);
    expect(myService.sayHi()).toBe("Ho!");
    provide(myService).with(MyAlternateService2);
    expect(myService.sayHi()).toBe("Hey!");
  });

  it("should be possible to provide alternatives for concrete classes", () => {
    const myService = inject(MyService);
    provide(myService).with(MyAlternativeToMyAlternateService);
    provide(myService).with(MyAlternateService);
    expect(myService.sayHi()).toBe("Hohoho!");
  });

  it("should be possible to provide an alternate implementation for a dependency when main class invoked using entryPoint", async () => {
    class MyService {
      sayHi(num: number) {
        const myDep = inject(MyDep);
        return `${myDep.bark()} ${num}`;
      }
    }

    class MyDep {
      bark() {
        return "bowow";
      }
    }

    class AlternateDep extends MyDep {
      bark() {
        return "bohow";
      }
    }

    const myService = entryPoint(MyService);
    provide(myService).with(AlternateDep);

    const resultPromise = myService.sayHi(1);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe("bohow 1");
  });
});
