import { llDelete } from "./utils/ll";

export const enum ResultState {
  NOT_STARTED = 0,
  PENDING = 1,
  SUCCESS = 2,
  ERROR = 3,
}

export type NotifyFunction<T> = (this: ResultListenerNode) => void;

interface ResultListenerNode {
  prev: ResultListenerNode;
  notify: NotifyFunction<any>;
  next: ResultListenerNode;
  result: Result;
}

export class Result<T = any> {
  state: ResultState;
  value: T | null;
  error: any | null;
  lastListener: ResultListenerNode | null = null;

  constructor(state: ResultState, error: any);
  constructor(value: T);
  constructor() {
    if (arguments.length === 1) {
      this.state = ResultState.SUCCESS;
      this.value = arguments[0];
      this.error = null;
    } else {
      this.state = arguments[0];
      this.value = null;
      this.error = arguments[1];
    }
  }

  setValue(value: T) {
    if (value !== this.value) {
      this.value = value;
      this.error = null;
      this.state = ResultState.SUCCESS;
      this.notify();
    }
  }

  setError(error: any) {
    if (error !== this.error) {
      this.value = null;
      this.error = error;
      this.state = ResultState.ERROR;
      this.notify();
    }
  }

  notify() {
    if (this.lastListener) {
      notifyListeners(this.lastListener.next);
    }
  }

  subscribe(observer: {
    next: (x: T) => void;
    error?: (err: any) => void;
    complete?: (val: any) => void;
  }): { unsubscribe: () => void } {
    const node = Result_listen(this, function () {
      return this.result.error
        ? observer.error?.(this.result.error)
        : observer.next(this.result.value);
    });
    return { unsubscribe: () => Result_unlisten(node.result, node) };
  }
}

export function Result_listen(
  result: Result,
  notify: NotifyFunction<any>
): ResultListenerNode {
  const { lastListener } = result;
  if (lastListener) {
    const newNode = {
      prev: lastListener,
      next: lastListener.next,
      notify,
      result,
    };
    lastListener.next = newNode;
    result.lastListener = newNode;
    return newNode;
  } else {
    const newNode = {
      prev: (null as any) as ResultListenerNode,
      next: (null as any) as ResultListenerNode,
      notify,
      result,
    };
    newNode.next = newNode.prev = newNode;
    result.lastListener = newNode;
    return newNode;
  }
}

export function Result_unlisten(result: Result, listener: ResultListenerNode) {
  if (!listener || !listener.notify)
    throw new TypeError(`Given listener not valid type`);
  result.lastListener = llDelete(result.lastListener, listener);
}

export function notifyListeners(firstNode: ResultListenerNode) {
  let node = firstNode;
  do {
    try {
      node.notify();
    } catch {}
    node = node.next;
  } while (node !== firstNode);
}
