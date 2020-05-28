import { include } from "../src/include";
import { run } from "../src/run";
import { use } from "../src/use";
import { inject } from "../src/inject";

describe("inject", () => {
  it("should be possible to use inject and include", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = include(MyService);

    const resultPromise = myService.getNumberPlus1(3);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe(4);

    const myService2 = inject(MyService);
    const result2 = myService2.getNumberPlus1(13);
    expect(result2).toBe(14);
  });
});
