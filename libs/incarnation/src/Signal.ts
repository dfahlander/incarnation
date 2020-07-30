export interface SignalSubscription {
  signal: Signal;
  notify: NotifyFunction;
  prev: SignalSubscription;
  next: SignalSubscription;
}

export type NotifyFunction = (this: SignalSubscription) => void;

export class Signal {
  private lastSubscriber: SignalSubscription | null = null;
  hasSubscribersChanged: (() => void) | null = null;

  get hasSubscribers() {
    return this.lastSubscriber !== null;
  }

  subscribe(notify: NotifyFunction): SignalSubscription {
    const { lastSubscriber: lastListener } = this;
    if (lastListener) {
      const newNode: SignalSubscription = {
        prev: lastListener,
        next: lastListener.next,
        notify,
        signal: this,
      };
      lastListener.next = newNode;
      this.lastSubscriber = newNode;
      return newNode;
    } else {
      const newNode: SignalSubscription = {
        prev: (null as any) as SignalSubscription,
        next: (null as any) as SignalSubscription,
        notify,
        signal: this,
      };
      newNode.next = newNode.prev = newNode;
      this.lastSubscriber = newNode;
      this.hasSubscribersChanged?.();
      return newNode;
    }
  }

  notify() {
    const { lastSubscriber } = this;
    if (lastSubscriber) {
      const firstNode = lastSubscriber.next;
      let node = firstNode;
      do {
        let next = node.next; // Pick it here in case node.notify() calls unsubscribe().
        try {
          if (node.next)
            // If !node.next, this node has unsubscribed already (llDelete nulls prev & next)
            node.notify();
        } catch {}
        node = next;
      } while (node && node !== firstNode);
    }
  }

  unsubscribe(listener: SignalSubscription) {
    if (!listener || !listener.notify)
      throw new TypeError(`Given listener not a SignalSubscriber`);
    // Delete node:
    const { prev, next } = listener;
    if (prev) prev.next = next;
    if (next) next.prev = prev;
    // @ts-ignore
    listener.prev = listener.next = null; // Free upp mem.
    if (listener === this.lastSubscriber) {
      if (prev === next) {
        this.lastSubscriber = null;
        this.hasSubscribersChanged?.();
      } else {
        this.lastSubscriber = prev;
      }
    }
  }
}
