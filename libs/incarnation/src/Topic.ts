import { llDelete, LLNode } from "./utils/ll";

export interface CircularLinkedSubscriber extends LLNode {
  topic: Topic;
  notify: NotifyFunction;
  prev: CircularLinkedSubscriber;
  next: CircularLinkedSubscriber;
}

export type NotifyFunction = (this: CircularLinkedSubscriber) => void;

export class Topic {
  private lastSubscriber: CircularLinkedSubscriber | null = null;
  hasSubscribersChanged: (() => void) | null = null;

  get hasSubscribers() {
    return this.lastSubscriber !== null;
  }

  subscribe(notify: NotifyFunction): CircularLinkedSubscriber {
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
      this.hasSubscribersChanged?.();
      return newNode;
    }
  }

  /*once(notify: NotifyFunction): CircularLinkedSubscriber {
    const topic = this;
    return topic.subscribe(function () {
      topic.unsubscribe(this);
      notify.apply(this);
    });
  }*/

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

  unsubscribe(listener: CircularLinkedSubscriber) {
    if (!listener || !listener.notify)
      throw new TypeError(`Given listener not a TopicListener`);
    this.lastSubscriber = llDelete(this.lastSubscriber, listener);
    if (!this.lastSubscriber && this.hasSubscribersChanged) {
      this.hasSubscribersChanged();
    }
  }
}
