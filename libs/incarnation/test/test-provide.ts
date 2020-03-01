import { entryPoint } from "../src/entryPoint";
import { provide } from "../src/provide";
import { inject } from "../src/inject";

describe("provide", () => {
  it("should be possible to provide an alternate implementation of the service itself when invoked using entryPoint", async () => {
    class MyService {
      sayHi() {
        return "Hi!";
      }
    }

    class MyAlternateService {
      sayHi() {
        return "Ho!";
      }
    }

    const myService = inject(MyService);
    provide(myService).with((requestedClass, mappedClass, next) =>
      next(
        requestedClass,
        requestedClass === MyService ? MyAlternateService : mappedClass
      )
    );
    expect(myService.sayHi()).toBe("Ho!");
  });

  /*it("should be possible to provide an alternate implementation for a dependency when main class invoked using entryPoint", async () => {
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
    provide(myService).with((Class, next) =>
      Class === MyDep ? AlternateDep : next(Class)
    );

    const resultPromise = myService.sayHi(1);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe("bohow 1");
  });*/
});
