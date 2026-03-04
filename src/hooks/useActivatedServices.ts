import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "mynder-activated-services";

type ActivatedEntry = { activatedBy: string; activatedAt: string };
type ActivatedMap = Record<string, ActivatedEntry>;

let listeners: Array<() => void> = [];
let cachedSnapshot: ActivatedMap = readFromStorage();

function readFromStorage(): ActivatedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ActivatedMap) : {};
  } catch {
    return {};
  }
}

function emitChange() {
  cachedSnapshot = readFromStorage();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot(): ActivatedMap {
  return cachedSnapshot;
}

function activateServiceInStore(id: string, activatedBy: string) {
  const current = cachedSnapshot;
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
