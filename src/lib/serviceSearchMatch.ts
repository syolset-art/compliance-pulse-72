/**
 * Tolker hva partneren skriver i søkefeltet på /msp-services:
 * et regelverk, et Mynder-produkt eller en vanlig tjeneste/oppgave.
 *
 * Rene funksjoner — ingen UI, ingen nettverk.
 */

import { frameworks, type Framework } from "@/lib/frameworkDefinitions";
import { MYNDER_PRODUCTS, type MynderProduct } from "@/lib/mynderProducts";

export type SearchKind = "service" | "framework" | "product";

const FRAMEWORK_ALIASES: Record<string, string[]> = {
  gdpr: ["gdpr", "personvernforordning", "personvern"],
  personopplysningsloven: ["personopplysningsloven", "popplyl"],
  iso27001: ["iso 27001", "iso27001", "27001"],
  iso27701: ["iso 27701", "iso27701", "27701"],
  nis2: ["nis2", "nis 2", "nis2-direktivet"],
  normen: ["normen"],
  nsm: ["nsm", "grunnprinsipper"],
  soc2: ["soc2", "soc 2"],
  "ai-act": ["ai act", "ai-act", "aiact", "kunstig intelligens-forordningen"],
};

const PRODUCT_ALIASES: Record<string, string[]> = {
  core: ["core", "mynder core"],
  vendors: ["leverandør", "leverandormodul", "leverandørmodul", "vendor"],
  assets: ["eiendel", "eiendeler", "assets"],
  trust: ["trust center", "trust", "tillitssenter"],
  frameworks: ["regelverk", "frameworks", "rammeverk"],
  deviations: ["avvik", "avviksregister", "avvikshåndtering", "deviations"],
};

const norm = (s: string) =>
  s.toLowerCase().trim().replace(/\s+/g, " ");

export function matchFramework(query: string): Framework | null {
  const q = norm(query);
  if (q.length < 2) return null;
  for (const fw of frameworks) {
    const aliases = FRAMEWORK_ALIASES[fw.id] ?? [fw.id.replace(/-/g, " ")];
    if (aliases.some((a) => q.includes(a) || a.includes(q))) return fw;
    if (norm(fw.name).includes(q)) return fw;
  }
  return null;
}

export function matchProduct(query: string): MynderProduct | null {
  const q = norm(query);
  if (q.length < 3) return null;
  for (const p of MYNDER_PRODUCTS) {
    const aliases = PRODUCT_ALIASES[p.id] ?? [p.id];
    if (aliases.some((a) => q.includes(a) || a.includes(q))) return p;
    if (norm(p.name).includes(q)) return p;
  }
  return null;
}

export function detectSearchKind(query: string): SearchKind {
  if (matchProduct(query)) return "product";
  if (matchFramework(query)) return "framework";
  return "service";
}

/** 1 time per krav — utgangspunktet for salgspotensialet. */
export function frameworkPotential(requirementCount: number, hourlyRate: number) {
  const hours = requirementCount;
  return { hours, amount: hours * hourlyRate };
}

export function annualPrice(monthlyPriceKr: number): number {
  return monthlyPriceKr * 12;
}
