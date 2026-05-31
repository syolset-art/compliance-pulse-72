import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "msp-service-defaults-v1";
const EVENT = "msp-service-defaults-changed";
const DEFAULT_RATE = 1500;

export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
  unitSuffix: string; // e.g. "kr/t", "$/h"
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: "NOK", symbol: "kr", label: "Norske kroner (NOK)", unitSuffix: "kr/t" },
  { code: "SEK", symbol: "kr", label: "Svenske kroner (SEK)", unitSuffix: "kr/t" },
  { code: "DKK", symbol: "kr", label: "Danske kroner (DKK)", unitSuffix: "kr/t" },
  { code: "EUR", symbol: "€", label: "Euro (EUR)", unitSuffix: "€/t" },
  { code: "GBP", symbol: "£", label: "Britiske pund (GBP)", unitSuffix: "£/h" },
  { code: "USD", symbol: "$", label: "US dollar (USD)", unitSuffix: "$/h" },
  { code: "CHF", symbol: "CHF", label: "Sveitsiske franc (CHF)", unitSuffix: "CHF/h" },
  { code: "PLN", symbol: "zł", label: "Polske zloty (PLN)", unitSuffix: "zł/h" },
];

function detectDefaultCurrency(): string {
  try {
    // Prefer i18next stored language
    const lng = (typeof localStorage !== "undefined" && localStorage.getItem("i18nextLng")) || "";
    const navLang =
      (typeof navigator !== "undefined" && (navigator.language || (navigator.languages?.[0] ?? ""))) || "";
    const candidate = (lng || navLang).toLowerCase();

    const region = candidate.includes("-") ? candidate.split("-")[1] : candidate;
    const langOnly = candidate.split("-")[0];

    const regionMap: Record<string, string> = {
      no: "NOK", nb: "NOK", nn: "NOK",
      se: "SEK", sv: "SEK",
      dk: "DKK", da: "DKK",
      gb: "GBP", uk: "GBP",
      us: "USD",
      ch: "CHF",
      pl: "PLN",
    };

    const eurRegions = new Set([
      "de","fr","es","it","nl","be","at","ie","fi","pt","gr","lu","ee","lv","lt","sk","si","mt","cy","hr",
    ]);
    if (regionMap[region]) return regionMap[region];
    if (eurRegions.has(region)) return "EUR";
    if (regionMap[langOnly]) return regionMap[langOnly];
    if (langOnly === "en") return "USD";
    return "NOK";
  } catch {
    return "NOK";
  }
}

interface ServiceDefaults {
  defaultHourlyRate: number;
  currency: string;
}

function read(): ServiceDefaults {
  const fallback: ServiceDefaults = { defaultHourlyRate: DEFAULT_RATE, currency: detectDefaultCurrency() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ServiceDefaults>;
    return {
      defaultHourlyRate:
        typeof parsed.defaultHourlyRate === "number" && parsed.defaultHourlyRate > 0
          ? parsed.defaultHourlyRate
          : DEFAULT_RATE,
      currency:
        typeof parsed.currency === "string" && SUPPORTED_CURRENCIES.some((c) => c.code === parsed.currency)
          ? parsed.currency
          : fallback.currency,
    };
  } catch {
    return fallback;
  }
}

function write(v: ServiceDefaults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getCurrencyOption(code: string): CurrencyOption {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code) ?? SUPPORTED_CURRENCIES[0];
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

  const setCurrency = useCallback((code: string) => {
    const next = { ...read(), currency: SUPPORTED_CURRENCIES.some((c) => c.code === code) ? code : read().currency };
    write(next);
    setState(next);
  }, []);

  return {
    ...state,
    currencyOption: getCurrencyOption(state.currency),
    setDefaultHourlyRate,
    setCurrency,
  };
}
