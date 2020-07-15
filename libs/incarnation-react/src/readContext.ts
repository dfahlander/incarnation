import { ReactSharedInternals } from "./ReactSharedInternals";
const { ReactCurrentDispatcher } = ReactSharedInternals;

export function readContext(ctx: any): any {
  const { current } = ReactCurrentDispatcher;
  return current ? current.readContext(ctx) : null;
}
