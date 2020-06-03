import { include } from "../src/include";
import { use } from "../src/use";
import { inject } from "../src/inject";
import { run } from "../src/run";

describe("imperativity", () => {
  var log: string[] = [];

  class Actions {
    foo(msg: string) {
      //console.log("Foo", msg);
      log.push("Foo " + msg);
    }
    bar(msg: string) {
      //console.log("Bar", msg);
      log.push("Bar " + msg);
    }
    async getSomething(wierd: any) {
      log.push("G" + wierd);
      return "something " + wierd;
    }
  }

  class Caller {
    call1() {
      const actions = use(Actions);
      const something1 = actions.getSomething("1");
      actions.foo(something1);
      const something2 = actions.getSomething("2");
      actions.foo(something2);
    }

    recu(num: number) {
      const actions = use(Actions);
      const something = actions.getSomething(num);
      actions.foo(something);
      if (num > 0) {
        this.recu(num - 1);
      }
    }
  }

  it("should be possible to invoke an action", async () => {
    log = [];
    const caller = use(Caller);
    await caller.call1();
    expect(log).toEqual(["G1", "Foo something 1", "G2", "Foo something 2"]);
    log = [];
    await caller.recu(3);
    expect(log).toEqual([
      "G3",
      "Foo something 3",
      "G2",
      "Foo something 2",
      "G1",
      "Foo something 1",
      "G0",
      "Foo something 0",
    ]);
    log = [];
    const potta = await run(() => {
      caller.recu(3);
      caller.call1();
      return "potta";
    });
    expect(potta).toEqual("potta");
    expect(log).toEqual([
      "G3",
      "Foo something 3",
      "G2",
      "Foo something 2",
      "G1",
      "Foo something 1",
      "G0",
      "Foo something 0",
      "G1",
      "Foo something 1",
      "G2",
      "Foo something 2",
    ]);
  });

  it("should throw if arguments are non-repeatable", async () => {
    let error: Error | null = null;
    log = [];
    let num = 1;
    try {
      await run(() => {
        const actions = use(Actions);
        const msg = actions.getSomething(++num);
        actions.foo(msg);
      });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(Error);
    expect(error!.message).toMatch(/Non-repeatable arguments/i);
  });

  it("should throw if code paths are non-deterministic", async () => {
    let error: Error | null = null;
    log = [];
    let num = 1;
    try {
      await run(() => {
        const actions = use(Actions);
        if (num === 1) {
          actions.foo("1");
        } else {
          actions.bar("2");
        }
        ++num;
        const msg = actions.getSomething(num);
        actions.foo(msg);
      });
    } catch (err) {
      error = err;
    }
    expect(error!.message).toMatch(/Non-deterministic code path/i);
  });
});
