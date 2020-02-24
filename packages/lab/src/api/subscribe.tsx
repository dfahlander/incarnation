import React, { useState } from "react";
import { readContext } from "./readContext";
import { addEffect } from "./addEffect";

/**
 * Flöde:
 * 1. myService.querySomething()
 * 2. Om inte klar, suspenda.
 * 3. Om har värde, så har vi också en observable, o.
 * 4. readContext(IncarnationContext) för DI env främst, men här också för slot-poolen.
 * 5. slotPool.getSlot(o). Om observable o är känd, returneras befintlig slot. Annars hämtas ny ur pool.
 * 6. readContext(SignalContext, slot.observedBits) - för att kunna bli signallerad.
 * 7. addhocEffect(()=>{
 *      const listenerNode = slot.listen(o);
 *      return ()=>slot.unlisten(listenerNode);
 *    });
 *
 *
 *  PROBLEM! Om en render inte anropar addhocEffect() så körs inte förra destroy!
 *  Verkar inte kunna gå förbi.
 *
 *  Alternativplan: Vi har ju alltid "Plan B" som är att kräva observer(component). Kan ju få
 *  en LRU cache om man kör anrop utanför observer.
 *
 *  Men säg att vi letar en annan "plan B". Idéer:
 *
 * 1. Använd adhocEffect() men bara för att köra kod efter successful mount.
 * 2. Spara undan observerade observables i parent Observer.
 * 3. Skräpsampla regelbundet:
 *    1. Gå igenom listan med observerade observables.
 *    2. Titta på deras FiberNode där de senast observerade.
 *    3. Är den inte längre mounted (ser man det) så ignoreras den.
 *    4. I dess updateQueue, finns vår effekt där? Har den använts i senaste mount? Om inte, ignorera den.
 *    5. Alla mounted's observables med vår effect tas bort från Set av observables.
 *    6. Kvar är de som ska bort.
 *
 */

export const IncarnationContext = React.createContext(
  {
    changedBits: 0,
    signal: (bit => {
      throw new Error("Cannot signal outside context");
    }) as (bit: number) => void,
    clearBit: (bit => {
      throw new Error("fdkfdsff");
    }) as (bit: number) => void
  },
  (prev, next) => next.changedBits
);

let nextBit = 1;
function getNextBit() {
  const rv = nextBit;
  nextBit <<= 1;
  if (!nextBit) nextBit = 1;
  return rv;
}

const observableBit = new WeakMap();

export function subscribe(observable: any) {
  const bit = getNextBit();
  const ctx = readContext(IncarnationContext, bit);
  observableBit.set(observable, bit);
  let subscription: any = null;
  addEffect(
    () => {
      subscription = observable.subscribe(() => {
        ctx.signal(bit);
      });
    },
    () => {
      if (subscription) subscription.unsubscribe();
    }
  );
}

export function IncarnationSignal({ children }) {
  const [changedBits, setChangedBits] = useState(0);
  return (
    <IncarnationContext.Provider
      value={{
        changedBits,
        signal: bit => {
          setChangedBits(changedBits | bit);
        },
        clearBit: bit => {
          setChangedBits(changedBits & ~bit);
        }
      }}
    >
      {children}
    </IncarnationContext.Provider>
  );
}
