export interface LLNode {
  prev: LLNode;
  next: LLNode;
}

export function llDelete<T extends LLNode>(
  externalPointer: T | null,
  node: T
): T | null {
  const { prev, next } = node;
  if (prev) prev.next = next;
  if (next) next.prev = prev;
  // @ts-ignore
  node.prev = node.next = null; // Free upp memory early.
  return node === externalPointer
    ? prev === next
      ? null
      : (prev as T)
    : (externalPointer as T);
}
