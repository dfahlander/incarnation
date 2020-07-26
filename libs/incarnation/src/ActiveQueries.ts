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
    if (query.signal.hasSubscribersChanged !== null)
      throw new TypeError( // Todo: Replace with an InternalError and a code. Or an assert function.
        `startManagingCleanup() has already been called for this query.`
      );
    let timer: any;
    const cleanup = () => {
      if (!query.signal.hasSubscribers) {
        console.debug("Deleting query", query);
        // Delete query:
        const { prev, next } = query;
        if (prev) prev.next = next;
        if (next) next.prev = prev;
        // @ts-ignore
        query.prev = query.next = null; // Free upp mem.
        if (query === this.firstQuery) {
          this.firstQuery = prev === next ? null : prev;
        }
      }
    };
    const scheduleOrStopCleanup = () => {
      if (query.signal.hasSubscribers) {
        timer && clearTimeout(timer);
      } else {
        timer = setTimeout(cleanup, timeout);
      }
    };
    query.signal.hasSubscribersChanged = scheduleOrStopCleanup;
    scheduleOrStopCleanup();
  }
}
