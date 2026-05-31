import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "msp-service-defaults-v1";
const EVENT = "msp-service-defaults-changed";
const DEFAULT_RATE = 1500;

interface ServiceDefaults {
  defaultHourlyRate: number;
}

function read(): ServiceDefaults {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { defaultHourlyRate: DEFAULT_RATE };
    const parsed = JSON.parse(raw) as Partial<ServiceDefaults>;
    return {
      defaultHourlyRate:
        typeof parsed.defaultHourlyRate === "number" && parsed.defaultHourlyRate > 0
          ? parsed.defaultHourlyRate
          : DEFAULT_RATE,
    };
  } catch {
    return { defaultHourlyRate: DEFAULT_RATE };
  }
}

function write(v: ServiceDefaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useServiceDefaults() {
  const [state, setState] = useState<ServiceDefaults>(() => read());

  useEffect(() => {
    const handler = () => setState(read());
    window.addEventListener("storage", handler);
    window.addEventListener(EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(EVENT, handler);
    };
  }, []);

  const setDefaultHourlyRate = useCallback((rate: number) => {
    const next = { ...read(), defaultHourlyRate: Math.max(0, Math.round(rate)) };
    write(next);
    setState(next);
  }, []);

  return { ...state, setDefaultHourlyRate };
}
