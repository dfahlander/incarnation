/** Symbol that are put on proxies so that
 * when providing middlewares to a proxy,
 * it is actually provided to the backing instance
 * instead of the proxy.
 *
 * The symbol should be a property of the proxy
 * and refer to the backing instance object.
 */
export const ProvideTarget = Symbol();
export type ProvideTarget = { [ProvideTarget]?: object };
