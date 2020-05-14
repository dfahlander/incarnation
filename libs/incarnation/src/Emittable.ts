import { llDelete } from "./utils/ll";

export const enum EmittableState {
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
  emittable: Emittable;
}

export class Emittable<T = any> {
  state: EmittableState;
  value: T | null;
  error: any | null;
  lastListener: ResultListenerNode | null = null;

  constructor(state: EmittableState, error: any);
  constructor(value: T);
  constructor() {
    if (arguments.length === 1) {
      this.state = EmittableState.SUCCESS;
      this.value = arguments[0];
      this.error = null;
    } else {
      this.state = arguments[0];
      this.value = null;
      this.error = arguments[1];
    }
  }

  emit(value: T) {
    if (value !== this.value) {
      this.value = value;
      this.error = null;
      this.state = EmittableState.SUCCESS;
      this.notify();
    }
  }

  emitError(error: any) {
    if (error !== this.error) {
      this.value = null;
      this.error = error;
      this.state = EmittableState.ERROR;
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
    const node = Emittable_listen(this, function () {
      return this.emittable.error
        ? observer.error?.(this.emittable.error)
        : observer.next(this.emittable.value);
    });
    return { unsubscribe: () => Emittable_unlisten(node.emittable, node) };
  }
}

export function Emittable_listen(
  emittable: Emittable,
  notify: NotifyFunction<any>
): ResultListenerNode {
  const { lastListener } = emittable;
  if (lastListener) {
    const newNode = {
      prev: lastListener,
      next: lastListener.next,
      notify,
      emittable,
    };
    lastListener.next = newNode;
    emittable.lastListener = newNode;
    return newNode;
  } else {
    const newNode = {
      prev: (null as any) as ResultListenerNode,
      next: (null as any) as ResultListenerNode,
      notify,
      emittable,
    };
    newNode.next = newNode.prev = newNode;
    emittable.lastListener = newNode;
    return newNode;
  }
}

export function Emittable_unlisten(
  result: Emittable,
  listener: ResultListenerNode
) {
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
