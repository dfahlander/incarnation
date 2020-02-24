import { entryPoint } from "../src/entryPoint";

describe("entryPoint", () => {
  it("should be possible to use entryPoint", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = entryPoint(MyService);

    const resultPromise = myService.getNumberPlus1(3);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe(4);
  });
});
