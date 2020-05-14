export interface LLNode {
  prev: LLNode;
  next: LLNode;
}

export function llDelete<T extends LLNode>(
  lastNode: T | null,
  node: T
): T | null {
  const { prev, next } = node;
  if (prev) prev.next = next;
  if (next) next.prev = prev;
  // @ts-ignore
  node.prev = node.next = null; // Free upp memory early.
  return node === lastNode
    ? prev === next
      ? null
      : (prev as T)
    : (lastNode as T);
}
