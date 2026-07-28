import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "msp-mynder-resell-v1";
const EVENT = "msp-mynder-resell-changed";

export interface ResellSetting {
  commissionPct: number; // 20–50
  setupFee: number;
  setupFeeEnabled: boolean;
}

export type ResellSettingsMap = Record<string, ResellSetting>;

const DEFAULT: ResellSetting = { commissionPct: 30, setupFee: 0, setupFeeEnabled: false };

function read(): ResellSettingsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ResellSettingsMap;
  } catch {
    return {};
  }
}

function write(map: ResellSettingsMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useMynderResellSettings() {
  const [map, setMap] = useState<ResellSettingsMap>(() => read());

  useEffect(() => {
    const handler = () => setMap(read());
    window.addEventListener("storage", handler);
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(EVENT, handler);
    };
  }, []);

  const get = useCallback(
    (productId: string): ResellSetting => map[productId] ?? DEFAULT,
    [map],
  );

  const update = useCallback((productId: string, patch: Partial<ResellSetting>) => {
    const current = read();
    const next: ResellSettingsMap = {
      ...current,
      [productId]: { ...DEFAULT, ...current[productId], ...patch },
    };
    // Clamp commission
    const c = next[productId].commissionPct;
    next[productId].commissionPct = Math.min(50, Math.max(20, Math.round(c)));
    next[productId].setupFee = Math.max(0, Math.round(next[productId].setupFee));
    write(next);
    setMap(next);
  }, []);

  return { get, update };
}
