import { entryPoint } from "../src/entryPoint";

describe("entryPoint", () => {
  it("should be possible to use entryPoint", async () => {
    class MyService {
      getNumberPlus1(num: number) {
        return num + 1;
      }
    }

    const myService = entryPoint(MyService);

    const result = await myService.getNumberPlus1(3);
    expect(result).toBe(4);
  });
});
