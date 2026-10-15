export function serializeDraft(value: unknown): string {
  return JSON.stringify(value, (_, entry) => entry instanceof Set ? [...entry].sort() : entry instanceof Map ? [...entry.entries()].sort() : entry);
}

const drafts = new Map<string, boolean>();
const listeners = new Set<() => void>();
export const hasUnsavedDrafts = () => [...drafts.values()].some(Boolean);
export function updateDraft(id: string, dirty: boolean) {
  if (drafts.get(id) === dirty) return;
  drafts.set(id, dirty);
  listeners.forEach(listener => listener());
}
export function removeDraft(id: string) {
  if (drafts.delete(id)) listeners.forEach(listener => listener());
}
export function subscribeDrafts(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
