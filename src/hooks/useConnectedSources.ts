import { useCallback, useSyncExternalStore } from "react";

/**
 * Enkel prototypelagring av hvilke datakilder kunden har koblet på seg selv.
 * Samme mønster som useActivatedServices (localStorage + useSyncExternalStore).
 */
const STORAGE_KEY = "mynder-connected-sources";

type ConnectedEntry = { connectedAt: string };
type ConnectedMap = Record<string, ConnectedEntry>;

let listeners: Array<() => void> = [];
let cachedSnapshot: ConnectedMap = readFromStorage();

function readFromStorage(): ConnectedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConnectedMap) : {};
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

function getSnapshot(): ConnectedMap {
  return cachedSnapshot;
}

function write(map: ConnectedMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* kun prototypelagring */
  }
  emitChange();
}

export function useConnectedSources() {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const connectSource = useCallback((id: string) => {
    write({ ...cachedSnapshot, [id]: { connectedAt: new Date().toISOString() } });
  }, []);

  const disconnectSource = useCallback((id: string) => {
    const next = { ...cachedSnapshot };
    delete next[id];
    write(next);
  }, []);

  const isSourceConnected = useCallback((id: string) => !!map[id], [map]);

  return {
    connectedSources: map,
    connectedCount: Object.keys(map).length,
    hasConnectedSource: Object.keys(map).length > 0,
    connectSource,
    disconnectSource,
    isSourceConnected,
  };
}
