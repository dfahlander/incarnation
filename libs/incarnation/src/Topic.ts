import { llDelete, LLNode } from "./utils/ll";

interface CircularLinkedSubscriber<T = any> extends LLNode {
  topic: Topic<T>;
  notify: NotifyFunction<T>;
  prev: CircularLinkedSubscriber<T>;
  next: CircularLinkedSubscriber<T>;
}

export type NotifyFunction<T> = (this: CircularLinkedSubscriber<T>) => void;

export class Topic<T = any> {
  lastSubscriber: CircularLinkedSubscriber<T> | null = null;

  subscribe(notify: NotifyFunction<T>): CircularLinkedSubscriber<T> {
    const { lastSubscriber: lastListener } = this;
    if (lastListener) {
      const newNode: CircularLinkedSubscriber = {
        prev: lastListener,
        next: lastListener.next,
        notify,
        topic: this,
      };
      lastListener.next = newNode;
      this.lastSubscriber = newNode;
      return newNode;
    } else {
      const newNode: CircularLinkedSubscriber = {
        prev: (null as any) as CircularLinkedSubscriber,
        next: (null as any) as CircularLinkedSubscriber,
        notify,
        topic: this,
      };
      newNode.next = newNode.prev = newNode;
      this.lastSubscriber = newNode;
      return newNode;
    }
  }

  notify() {
    const { lastSubscriber: lastListener } = this;
    if (lastListener) {
      const firstNode = lastListener.next;
      let node = firstNode;
      do {
        try {
          node.notify();
        } catch {}
        node = node.next;
      } while (node !== firstNode);
    }
  }

  unsubscribe(listener: CircularLinkedSubscriber<T>) {
    if (!listener || !listener.notify)
      throw new TypeError(`Given listener not a TopicListener`);
    this.lastSubscriber = llDelete(this.lastSubscriber, listener);
  }
}
