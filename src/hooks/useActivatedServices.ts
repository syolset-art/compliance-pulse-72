import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mynder-activated-services";

type ActivatedEntry = { activatedBy: string; activatedAt: string };
type ActivatedMap = Record<string, ActivatedEntry>;

// Simple external store backed by localStorage so every component
// that calls the hook re-renders when a service is activated — even
// across different parts of the component tree.

let listeners: Array<() => void> = [];

function emitChange() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): ActivatedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivatedMap) : {};
  } catch {
    return {};
  }
}

function activateServiceInStore(id: string, activatedBy: string) {
  const current = getSnapshot();
  const updated: ActivatedMap = {
    ...current,
    [id]: { activatedBy, activatedAt: new Date().toISOString() },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  emitChange();
}

export function useActivatedServices() {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const activateService = useCallback((id: string, activatedBy: string) => {
    activateServiceInStore(id, activatedBy);
  }, []);

  const isServiceActive = useCallback(
    (id: string) => !!map[id],
    [map],
  );

  return { activatedServices: map, activateService, isServiceActive };
}
