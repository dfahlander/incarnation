/* Idea:
 *   Have a corresponding way to memoize results from functions that takes value arguments rather than obect references.
 * Problem:
 *   refDeterministic use WeakMap that only works with object references as keys.
 *   If we would use an ordinary Map we could get heavy memory leakage.
 * Solution:
 *   Use CurrentExecution in some way.
 *   Push a Signal object that will never be signalled, but that we listen onSubscribersChanged on.
 *   When function is called, derive arguments to memoized value from a global Map --> Map --> .... At the end, the value lies together with the signal.
 *   The Signal could live with the value. If value not found, call function and store the Maps with a new signal.
 *   The Signal should be pushed to CurrentExecution whenever the function is called no matter if memoized or not.
 *   When Signal reaches no subscribers, it should cleanup the mapped result from the global map.
 * Use Cases:
 *   * Context() - memoize references to configuration-structures, so that every time CurrentUser({username: "foo", token: "x"})
 *     is called, we get the same resulting Context object out of the same value structure.
 *   * (Collection / QueryBuilder: db.friends.limit(10) will always return the same reference. This will make Collection
 *     references possible to sent to PureComponents.)
 */
