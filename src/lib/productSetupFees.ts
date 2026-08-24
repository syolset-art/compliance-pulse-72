// Felles kilde for partnerens etableringskostnad per Mynder-produkt.
// Etableringskostnaden er en FAST engangspris partneren setter selv, med en
// valgfri beskrivelse av hva den dekker. Den vises som en egendefinert
// produktpakke ved FØRSTEGANGS aktivering av produktet hos en kunde —
// aldri ved nivåendring (flere systemer, leverandører osv.).
//
// Regelverk-rådgivning (timer ved aktivering) håndteres fortsatt av
// src/lib/activationHours.ts og er uavhengig av denne kilden.

import { useEffect, useState } from "react";
import { readProductSetupHours } from "./activationHours";

const STORAGE_KEY = "msp.productSetupFees.v1";
const EVENT = "msp-product-setup-fees-changed";
const MIGRATION_FLAG = "msp.productSetupFees.migrated";

export interface ProductSetupFee {
  /** Fast engangspris i kroner (eks. mva). */
  amountKr: number;
  /** Hva etableringen dekker — vist til partneren ved aktivering. */
  description: string;
}

export type ProductSetupFeeMap = Record<string, ProductSetupFee>;

function readRaw(): ProductSetupFeeMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<ProductSetupFee>>;
    const out: ProductSetupFeeMap = {};
    for (const [id, v] of Object.entries(parsed)) {
      const amountKr = Math.round(Number(v?.amountKr) || 0);
      if (amountKr > 0) {
        out[id] = { amountKr, description: String(v?.description ?? "").slice(0, 500) };
      }
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Engangsmigrering: tidligere ble oppstartskost lagret som timer × timepris
 * (msp.productSetupHours, ikke-regelverk). Konverter til fast kr-pris.
 */
function migrateLegacyHours(hourlyRate: number): void {
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    const legacy = readProductSetupHours();
    const current = readRaw();
    let changed = false;
    for (const [productId, hours] of Object.entries(legacy)) {
      if (productId === "frameworks") continue; // regelverk bruker timer fortsatt
      if (current[productId]) continue;
      const amount = Math.round((hours || 0) * hourlyRate);
      if (amount > 0) {
        current[productId] = { amountKr: amount, description: "" };
        changed = true;
      }
    }
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    localStorage.setItem(MIGRATION_FLAG, "1");
  } catch {
    /* noop */
  }
}

export function readProductSetupFees(hourlyRateForMigration = 1500): ProductSetupFeeMap {
  migrateLegacyHours(hourlyRateForMigration);
  return readRaw();
}

export function getProductSetupFee(
  productId: string,
  hourlyRateForMigration = 1500,
): ProductSetupFee | null {
  return readProductSetupFees(hourlyRateForMigration)[productId] ?? null;
}

export function writeProductSetupFee(productId: string, fee: ProductSetupFee | null): void {
  try {
    const all = readRaw();
    if (fee && fee.amountKr > 0) {
      all[productId] = {
        amountKr: Math.round(fee.amountKr),
        description: fee.description.trim().slice(0, 500),
      };
    } else {
      delete all[productId];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* noop */
  }
}

/** Reaktiv lesing av etableringskostnaden for ett produkt. */
export function useProductSetupFee(
  productId: string | null | undefined,
  hourlyRateForMigration = 1500,
): ProductSetupFee | null {
  const [fee, setFee] = useState<ProductSetupFee | null>(() =>
    productId ? getProductSetupFee(productId, hourlyRateForMigration) : null,
  );
  useEffect(() => {
    if (!productId) {
      setFee(null);
      return;
    }
    const sync = () => setFee(getProductSetupFee(productId, hourlyRateForMigration));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [productId, hourlyRateForMigration]);
  return fee;
}
