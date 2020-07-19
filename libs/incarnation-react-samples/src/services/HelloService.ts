import { use } from "incarnation";
import { KeyValueStore } from "../stores/KeyValueStore";

export class HelloService {
  getName() {
    return (use(KeyValueStore).get("name") || "") as string;
  }
  getAge() {
    return (use(KeyValueStore).get("age") ?? -1) as number;
  }
  setName(value: string) {
    use(KeyValueStore).mutate([{ type: "set", key: "name", value }]);
  }
  setAge(value: number) {
    use(KeyValueStore).mutate([{ type: "set", key: "age", value }]);
  }
  incrementAge() {
    const currentAge = this.getAge();
    this.setAge(currentAge + 1);
  }
}
