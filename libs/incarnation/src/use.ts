import { IsAdaptive } from "./IsAdaptive.js";
import { Suspendified } from "./Suspendified.js";
import { AbstractClass } from "./Class.js";
import { inject } from "./inject.js";
import { Provider } from "./Provider.js";
import { suspendify } from "./suspendify.js";

export function use<T extends object>(
  Class: AbstractClass<T>,
  ...providers: Provider[]
): Suspendified<T>;

export function use<T extends object>(): Suspendified<T> {
  // TODO: Instead of sending arguments further, incorporate the resulting context if arguments are
  // given and call suspendify within that context. Why? Because when suspendify() is called on a DataStore,
  // it will try to get instance.$flavors.suspense. This getter will call suspendifyQueryMethod in DataStore.ts
  // which will call inject(OptimisticUpdater(Interface)). If that optimistic updater calls use() in its
  // constructor, contexts given to this use() will not propagate.
  // I know, this is a rare case, but think of an OptimisticUpdater that has a configurable
  // CollationConfig context and that would match strings differently depending on collation.
  // And someone does use(DataStore, CollactionConfig("sv-se")), then the DataStore would see the collaction
  // but not the OptimisticUpdater, and so compare strings differently.

  // If doing the suggested change here, we could let inject still work as it does
  // but we won't forward any args to inject.
  return suspendify(inject.apply(this, arguments) as T & IsAdaptive);
}
