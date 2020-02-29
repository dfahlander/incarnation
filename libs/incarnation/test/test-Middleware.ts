import { provide } from "../src/provide";
import { inject } from "../src/inject";
import { Middleware } from "../src/Middleware";

describe("provide", () => {
  class MyService {
    sayHi() {
      return "Hi!";
    }
  }

  class MyServiceMiddleware extends Middleware(MyService) {
    sayHi() {
      return super.sayHi() + " MW was here";
    }
  }

  it("should be possible to inject middleware for a certain class", async () => {
    const myService = inject(MyService);
    provide(myService).with(MyServiceMiddleware);
    expect(myService.sayHi()).toBe("Hi! MW was here");
  });
});
