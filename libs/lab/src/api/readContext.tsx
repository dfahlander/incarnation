import { ReactSharedInternals } from "./ReactSharedInternals";

const { ReactCurrentDispatcher } = ReactSharedInternals;

export function readContext(ctx: any, observedBits?: number) {
  return ReactCurrentDispatcher.current.readContext(ctx, observedBits);
}
