import { ReactSharedInternals } from "./ReactSharedInternals";

const idSymbol = Symbol();
const destrSymbol = Symbol();

/** Funkar inte. Verkar som att det kan bli en ny fiberNode ibland. */
export function adhocEffect(
  effect: () => void | (() => void),
  identifyer?: any
) {
  const fiberNode = ReactSharedInternals.ReactCurrentOwner.current;
  /*const isMounting = fiberNode.tag & 2;
  if (!isMounting) {
    debugger;
  }*/
  const lastAlternateEffect = fiberNode.alternate?.updateQueue?.lastEffect;
  const firstAlternateEffect = lastAlternateEffect?.next;
  let destroy = undefined as any;
  if (identifyer && firstAlternateEffect) {
    let effect = firstAlternateEffect;
    do {
      if (effect[idSymbol] === identifyer) {
        destroy = effect[destrSymbol];
        break;
      }
      effect = effect.next;
    } while (effect && effect !== firstAlternateEffect);
  }

  const newEffect = {
    //tag: 0b111,
    tag: 0b101,
    create: () => {
      const destroy = effect();
      newEffect[destrSymbol] = destroy;
      //newEffect.destroy = destroy;
      return destroy;
    },
    destroy,
    deps: null,
    next: null as any,
    [idSymbol]: identifyer,
    [destrSymbol]: undefined as any
  };
  const { updateQueue } = fiberNode;
  if (!updateQueue) {
    newEffect.next = newEffect;
    fiberNode.updateQueue = { lastEffect: newEffect };
  } else {
    const prevLastEffect = updateQueue.lastEffect;
    newEffect.next = prevLastEffect.next;
    prevLastEffect.next = newEffect;
    fiberNode.updateQueue.lastEffect = newEffect;
  }
  //fiberNode.effectTag |= 0b0001110100100;
  fiberNode.effectTag |= 0b0001000000100;
}
