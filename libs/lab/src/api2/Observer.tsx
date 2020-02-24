import React from "react";
import { FiberNode } from "../api/ReactSharedInternals";

/**  The Flow:
 * 1. Code hits an observable
 * 2. Associate fiberNode or alternate with a bitmask-slot.
 * 3.
 *
 */

let slotCounter = 3;
const slotMap = new WeakMap<FiberNode, number>();
export function getBitmaskSlot(fiber: FiberNode) {
  const mappedSlot =
    slotMap.get(fiber) || (fiber.alternate && slotMap.get(fiber.alternate));
  if (mappedSlot) return mappedSlot;
  const rv = slotCounter;
  slotCounter <<= 2;
  if (!slotCounter) slotCounter = 3;
  slotMap.set(fiber, rv);
  return rv;
}

export const ObserverContext = React.createContext({});

export function Observer({ children }) {
  return <div></div>;
}
