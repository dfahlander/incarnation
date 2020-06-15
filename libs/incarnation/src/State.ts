import { Topic } from "./Topic";
import { ConstructionContext } from "./Context";
import { CurrentExecution } from "./CurrentExecution";

export interface State<T = any> {
  value: T;
  topic: Topic;
  read(): T;
  set(newValue: T): void;
}

export interface StateConstructor {
  <T>(getInitialValue: () => T): State<T>;
  new <T>(getInitialValue: () => T): State<T>;
}

export const State = ((getInitialValue: () => any) => {
  if (typeof this !== "object") {
    // Called as function (without new)
    const cctx = ConstructionContext;
    if (!cctx)
      throw new TypeError(`State can only be initialized during construction`);
    if (cctx.pos < cctx.values.length) {
      return cctx.values[cctx.pos++];
    }
    return (cctx.values[cctx.pos++] = new State(getInitialValue));
  }
  this.value = getInitialValue();
  this.topic = new Topic();
}) as StateConstructor;

export const Const = <T = any>(getValue: () => T) => {
  const cctx = ConstructionContext;
  if (!cctx)
    throw new TypeError(`Const can only be initialized during construction`);
  if (cctx.pos < cctx.values.length) {
    return cctx.values[cctx.pos++] as T;
  }
  return (cctx.values[cctx.pos++] = getValue()) as T;
};

State.prototype = {
  read(this: State) {
    if (CurrentExecution.current) {
      CurrentExecution.current.topics.push(this.topic);
    }
    return this.value;
  },
  set(this: State, value: any) {
    this.value = value;
    this.topic.notify();
  },
};
