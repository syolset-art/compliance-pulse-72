import { useEffect, useState, useCallback } from "react";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";

/**
 * Persistert register over tilbud partneren har levert.
 * Prototype: lagres i localStorage. Brukes til å markere og låse
 * tjenester som inngår i minst ett levert tilbud, slik at de ikke
 * kan fjernes eller nullstilles ved et uhell.
 */

export type OfferStatus = "draft" | "sent" | "delivered";

export interface DeliveryImpact {
  /** Modenhet per kontrollområde før leveransen (fra baseline). */
  maturityBefore?: Record<string, number>;
  /** Modenhet per kontrollområde etter leveransen. */
  maturityAfter?: Record<string, number>;
}

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

  /** Livssyklus for tilbud → leveranse. */
  status?: OfferStatus;
  sentAt?: string;
  deliveredAt?: string;
  /** Regelverk denne leveransen skal styrke. */
  frameworkIds?: string[];
  /** Bevis-IDer (fra partnerEvidence-store) koblet til leveransen. */
  evidenceIds?: string[];
  /** Effekt-snapshot ved leveranse. */
  impact?: DeliveryImpact;
  /** Om rapport er sendt til kunden. */
  reportSentAt?: string;
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

export function saveOffer(
  offer: Omit<SavedOffer, "id" | "createdAt"> & { id?: string; createdAt?: string },
): SavedOffer {
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
    status: offer.status ?? "draft",
    frameworkIds: offer.frameworkIds,
    evidenceIds: offer.evidenceIds,
  };
  writeAll([record, ...all]);
  return record;
}

export function updateOffer(id: string, patch: Partial<SavedOffer>): SavedOffer | null {
  const all = readAll();
  const idx = all.findIndex((o) => o.id === id);
  if (idx < 0) return null;
  const next = { ...all[idx], ...patch };
  all[idx] = next;
  writeAll(all);
  return next;
}

export function markOfferSent(id: string): SavedOffer | null {
  return updateOffer(id, { status: "sent", sentAt: new Date().toISOString() });
}

export function markOfferDelivered(
  id: string,
  args: { frameworkIds: string[]; evidenceIds: string[]; impact?: DeliveryImpact },
): SavedOffer | null {
  return updateOffer(id, {
    status: "delivered",
    deliveredAt: new Date().toISOString(),
    frameworkIds: args.frameworkIds,
    evidenceIds: args.evidenceIds,
    impact: args.impact,
  });
}

export function markReportSent(id: string): SavedOffer | null {
  return updateOffer(id, { reportSentAt: new Date().toISOString() });
}

export function getOffersForCustomer(customerId: string): SavedOffer[] {
  return readAll().filter((o) => o.customerId === customerId);
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

/** Hook: alle tilbud for en gitt kunde (reaktiv). */
export function useCustomerOffers(customerId: string | undefined) {
  const [offers, setOffers] = useState<SavedOffer[]>(() =>
    customerId ? getOffersForCustomer(customerId) : [],
  );
  useEffect(() => {
    const refresh = () => setOffers(customerId ? getOffersForCustomer(customerId) : []);
    refresh();
    window.addEventListener(EVENT_NAME, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_NAME, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [customerId]);
  return offers;
}

/** Utled sannsynlige regelverk-IDer fra en liste tjeneste-templateIds. */
export function deriveFrameworkIdsFromTemplates(templateIds: string[]): string[] {
  // Import her (ikke top-of-file) for å unngå potensielle sirkulære referanser.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("@/lib/serviceLibrary") as typeof import("@/lib/serviceLibrary");
  const ids = new Set<string>();
  for (const t of mod.SERVICE_LIBRARY) {
    if (!templateIds.includes(t.id)) continue;
    for (const m of t.mappings) ids.add(m.frameworkId);
  }
  return Array.from(ids);
}
