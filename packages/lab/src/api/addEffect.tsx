import { ReactSharedInternals } from "./ReactSharedInternals";
/** Funkar.
 *
 */
export function addEffect(create: () => void, destroy?: () => void) {
  const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;
  const isMounting = fiberNode.tag & 2;
  const effect = {
    tag: 5,
    create: () => {
      create();
      return destroy;
    },
    destroy: isMounting ? undefined : destroy,
    deps: null,
    next: null as any
  };
  const { updateQueue, memoizedState } = fiberNode;
  if (!updateQueue) {
    effect.next = effect;
    fiberNode.updateQueue = { lastEffect: effect };
  } else {
    const prevLastEffect = updateQueue.lastEffect;
    effect.next = prevLastEffect.next;
    prevLastEffect.next = effect;
    fiberNode.updateQueue.lastEffect = effect;
  }
  fiberNode.effectTag |= 516;
}
