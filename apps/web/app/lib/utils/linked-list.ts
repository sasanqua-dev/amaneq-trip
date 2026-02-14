/**
 * Sort items using a linked-list structure where each item stores its predecessor's ID.
 * Items with prevItemId = null are heads (first in their chain).
 */
export function sortLinkedList<T extends { id: string; prevItemId: string | null }>(
  items: T[]
): T[] {
  if (items.length === 0) return [];

  // Map: prevItemId -> the item that comes after it
  const nextMap = new Map<string, T>();
  let head: T | undefined;

  for (const item of items) {
    if (item.prevItemId === null) {
      head = item;
    } else {
      nextMap.set(item.prevItemId, item);
    }
  }

  const result: T[] = [];
  const visited = new Set<string>();

  let current = head;
  while (current && !visited.has(current.id)) {
    result.push(current);
    visited.add(current.id);
    current = nextMap.get(current.id);
  }

  // Append any orphaned items not in the chain
  for (const item of items) {
    if (!visited.has(item.id)) {
      result.push(item);
    }
  }

  return result;
}
