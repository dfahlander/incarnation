import { Signal } from "./Signal.js";
import { ConstructionContext } from "./Context.js";
import { CurrentExecution } from "./CurrentExecution.js";

export interface State<T = any> {
  value: T;
  signal: Signal;
  read(): T;
  set(newValue: T): void;
}

export interface StateConstructor {
  <T>(getInitialValue: () => T): State<T>;
  new <T>(getInitialValue: () => T): State<T>;
}

export const State = function (this: State, getInitialValue: () => any) {
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
  this.signal = new Signal();
} as StateConstructor;

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
      CurrentExecution.current.signals.push(this.signal);
    }
    return this.value;
  },
  set(this: State, value: any) {
    this.value = value;
    this.signal.notify();
  },
};
