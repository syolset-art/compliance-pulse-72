import { useEffect, useState, useCallback } from "react";

/**
 * Persistert register over tilbud partneren har levert.
 * Prototype: lagres i localStorage. Brukes til å markere og låse
 * tjenester som inngår i minst ett levert tilbud, slik at de ikke
 * kan fjernes eller nullstilles ved et uhell.
 */

export interface SavedOffer {
  id: string;
  offerNumber: string;
  name: string;
  customerId?: string;
  customerName?: string;
  createdAt: string; // ISO
  /** Kilde-nøkler for tjenester som inngår i tilbudet. */
  templateIds: string[];
  /** Fallback-nøkler når templateId ikke finnes (normalisert navn). */
  serviceKeys: string[];
}

const STORAGE_KEY = "msp-customer-offers-v1";
const EVENT_NAME = "msp-offers-updated";

export function normalizeServiceKey(label: string): string {
  return label.trim().toLowerCase();
}

function readAll(): SavedOffer[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedOffer[]) : [];
  } catch {
    return [];
  }
}

function writeAll(offers: SavedOffer[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function saveOffer(offer: Omit<SavedOffer, "id" | "createdAt"> & { id?: string; createdAt?: string }): SavedOffer {
  const all = readAll();
  const record: SavedOffer = {
    id: offer.id ?? `offer-${Date.now()}`,
    createdAt: offer.createdAt ?? new Date().toISOString(),
    offerNumber: offer.offerNumber,
    name: offer.name,
    customerId: offer.customerId,
    customerName: offer.customerName,
    templateIds: Array.from(new Set(offer.templateIds ?? [])),
    serviceKeys: Array.from(new Set((offer.serviceKeys ?? []).map(normalizeServiceKey))),
  };
  writeAll([...all, record]);
  return record;
}

export interface LockInfo {
  offerNumber: string;
  name: string;
  customerName?: string;
  createdAt: string;
  count: number; // antall tilbud som inneholder denne
}

function buildLockIndex(offers: SavedOffer[]): {
  byTemplate: Map<string, LockInfo>;
  byKey: Map<string, LockInfo>;
} {
  const byTemplate = new Map<string, LockInfo>();
  const byKey = new Map<string, LockInfo>();
  const add = (map: Map<string, LockInfo>, id: string, o: SavedOffer) => {
    const existing = map.get(id);
    if (existing) {
      map.set(id, { ...existing, count: existing.count + 1 });
    } else {
      map.set(id, {
        offerNumber: o.offerNumber,
        name: o.name,
        customerName: o.customerName,
        createdAt: o.createdAt,
        count: 1,
      });
    }
  };
  for (const o of offers) {
    o.templateIds.forEach((t) => add(byTemplate, t, o));
    o.serviceKeys.forEach((k) => add(byKey, k, o));
  }
  return { byTemplate, byKey };
}

export function useSavedOffers() {
  const [offers, setOffers] = useState<SavedOffer[]>(() => readAll());

  useEffect(() => {
    const refresh = () => setOffers(readAll());
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) refresh();
    };
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const index = buildLockIndex(offers);

  const getLockInfo = useCallback(
    (opts: { templateId?: string | null; name?: string | null }): LockInfo | null => {
      if (opts.templateId) {
        const hit = index.byTemplate.get(opts.templateId);
        if (hit) return hit;
      }
      if (opts.name) {
        const hit = index.byKey.get(normalizeServiceKey(opts.name));
        if (hit) return hit;
      }
      return null;
    },
    [index],
  );

  const isLocked = useCallback(
    (opts: { templateId?: string | null; name?: string | null }): boolean => {
      return getLockInfo(opts) !== null;
    },
    [getLockInfo],
  );

  const save = useCallback((offer: Parameters<typeof saveOffer>[0]) => saveOffer(offer), []);

  return { offers, getLockInfo, isLocked, saveOffer: save };
}
