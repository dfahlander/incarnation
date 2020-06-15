const ActionResult = Symbol();
type ActionResult = { [ActionResult]?: true };

declare function action<T, M extends keyof T>(
  target: T,
  propertyKey: M,
  descriptor: TypedPropertyDescriptor<T[M]>
): TypedPropertyDescriptor<() => Promise<number> & ActionResult>;

class MittApi {
  @action
  async foo() {
    return 3;
  }
}

/*class MittApi {
  getThings(): Promise<any[]> {
    throw "";
  }
}

abstract class DatStor extends MittApi {
  mutate(...mutations: any[]): Promise<any> {
    throw "";
  }
  protected abstract submit(mutations: any[]): Promise<any>;
}

type Mut = { type: "a"; data: number } | { type: "b"; key: string };

class MinStore extends DatStor {
  protected submit(mutations: any[]): Promise<any> {
    throw new Error("Method not implemented.");
  }
  async mutate(mutations: Mut[]) {
    return super.mutate(mutations);
  }
}

// Nytt test:
abstract class MutStor<TMutation> {
  protected abstract mutate(
    ...mutations: TMutation[]
  ): Promise<PromiseSettledResult<any>[]>;
}

class MS extends MutStor<{}> {
  mutate(mutations: {}[]): Promise<PromiseSettledResult<any>[]> {
    return super.mutate(...mutations);
  }
}

declare function Mutable<T, TClass extends new () => any>(
  Class: TClass
): new () => InstanceType<TClass> & MutStor<T>;

class MyStotto extends Mutable<Mut>(MittApi) {}
*/
