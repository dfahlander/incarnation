import { llDelete } from "./utils/ll";
import { ActiveQuery } from "./ActiveQuery";

export class ActiveQueries<
  FN extends (...args: TArgs) => TResult = any,
  TArgs extends any[] = any,
  TResult = any
> {
  firstQuery: ActiveQuery | null = null;
  *[Symbol.iterator]() {
    // @ts-ignore
    const { firstQuery } = this;
    if (firstQuery) {
      let node = firstQuery;
      do {
        yield node;
        node = node.next;
      } while (node !== firstQuery);
    }
  }
  startManagingCleanup(query: ActiveQuery, timeout = 100) {
    if (query.topic.hasSubscribersChanged !== null)
      throw new TypeError( // Todo: Replace with an InternalError and a code. Or an assert function.
        `startManagingCleanup() has already been called for this query.`
      );
    let timer: any;
    const cleanup = () => {
      if (!query.topic.hasSubscribers) {
        console.debug("Deleting query", query);
        this.firstQuery = llDelete(this.firstQuery, query);
        // @ts-ignore
        query.next = query.prev = null; // Free up mem faster?
      }
    };
    const scheduleOrStopCleanup = () => {
      if (query.topic.hasSubscribers) {
        timer && clearTimeout(timer);
      } else {
        timer = setTimeout(cleanup, timeout);
      }
    };
    query.topic.hasSubscribersChanged = scheduleOrStopCleanup;
    scheduleOrStopCleanup();
  }
}
