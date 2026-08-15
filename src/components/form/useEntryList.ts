import { useRef } from "react";
import { useResume } from "../../store/resumeStore";
import type { ListSectionKey } from "../../lib/types";

export function useEntryList<T extends { id: string }>(key: ListSectionKey, makeEmpty: () => T) {
  const { resume, dispatch } = useResume();
  const items = ((resume[key] as unknown as T[]) ?? []) as T[];
  const isEmpty = items.length === 0;

  const virtualRef = useRef<T | null>(null);
  if (virtualRef.current === null) virtualRef.current = makeEmpty();
  const virtual = virtualRef.current;

  const entry = isEmpty ? virtual : items[0];
  const rendered = isEmpty ? [virtual] : items;

  const update = (id: string, patch: Record<string, unknown>) => {
    if (isEmpty) {
      dispatch({ type: "ADD_ITEM", key, item: { ...virtual, ...patch } });
    } else {
      dispatch({ type: "UPDATE_ITEM", key, id, patch });
    }
  };

  const add = () => dispatch({ type: "ADD_ITEM", key });
  const remove = (id: string) => dispatch({ type: "REMOVE_ITEM", key, id });
  const move = (id: string, dir: -1 | 1) => dispatch({ type: "MOVE_ITEM", key, id, dir });

  return { items, entry, rendered, isEmpty, update, add, remove, move };
}
