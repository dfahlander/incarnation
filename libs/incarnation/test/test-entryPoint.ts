import { entryPoint, asyncEntryPoint } from "../src/entryPoint";

describe("entryPoint", () => {
  it("should be possible to use entryPoint and asyncEntryPoint", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = asyncEntryPoint(MyService);

    const resultPromise = myService.getNumberPlus1(3);
    expect(resultPromise).toBeInstanceOf(Promise);
    const result = await resultPromise;
    expect(result).toBe(4);

    const myService2 = entryPoint(MyService);
    expect(myService2["$async"]).toBe(myService["$async"]);

    const result2 = myService2.getNumberPlus1(13);
    expect(result2).toBe(14);
  });
});
