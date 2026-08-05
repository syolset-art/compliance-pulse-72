import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import type { CustomerEntryTarget } from "@/lib/customerEntryRoutes";
import {
  EXTRA_FRAMEWORK_PRICE_KR,
  TRUST_CENTER_PRICE_KR,
  getFrameworkMonthlyPrice,
  isFrameworkFree,
} from "@/lib/planConstants";

// ===== Anbefalte produkter og tjenester (salgbare forslag) =====
export interface OfferSuggestion {
  id: string;
  label: string;
  kind: "framework" | "service" | "module";
  hours: number;
  activatable: boolean;
  frameworkId?: string;
  moduleKey?: string;
  price?: number | null;
}

// Suggested services Lara recommends — MUST match titles used in MSPMaturityServiceMatrix
// (Anbefalte tjenester på kundens TP-detaljside) slik at klikk fra tabellen lander på riktig kort.
export function deriveNeededServices(c: any): string[] {
  const services: string[] = [];
  const score = c.compliance_score || 0;
  const frameworks: string[] = c.active_frameworks || [];
  const ind = c.industry || "";
  const highCritIndustries = new Set(["Energi", "Helse", "Finans"]);

  if (highCritIndustries.has(ind) || ind === "Energi" || ind === "Transport" || ind === "Helse" || ind === "Finans") {
    services.push("NIS2-klargjøring");
  }

  if (score < 60 || ind === "Finans" || ind === "Teknologi") {
    services.push("AI Governance-rammeverk");
  }

  if (frameworks.includes("ISO 27001") || score >= 50) {
    services.push("Penetrasjonstest");
  }

  if (services.length === 0) {
    services.push("NIS2-klargjøring", "AI Governance-rammeverk");
  }

  return Array.from(new Set(services)).slice(0, 3);
}

// Aktive (leverte) tjenester for denne kunden — vises grønt.
export function deriveActiveServices(c: any): string[] {
  const delivered = getOffersForCustomer(c.id).filter((o) => o.status === "delivered");
  const names = new Set<string>();
  for (const o of delivered) {
    for (const tid of o.templateIds || []) {
      const tpl = SERVICE_LIBRARY.find((t) => t.id === tid);
      names.add(tpl ? tpl.name : tid);
    }
    for (const key of o.serviceKeys || []) {
      const tpl = SERVICE_LIBRARY.find((t) => normalizeServiceKey(t.name) === key);
      names.add(tpl ? tpl.name : key);
    }
  }
  return Array.from(names);
}

export function deriveOfferSuggestions(c: any): OfferSuggestion[] {
  const toLabel = (f: any): string => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""));
  const active: string[] = (c.active_frameworks || []).map(toLabel).filter(Boolean);
  const recommended: string[] = (c.recommended_frameworks || [])
    .map(toLabel)
    .filter((f: string) => f && !active.includes(f));
  const score = c.compliance_score || 0;
  const modules: string[] = c.active_modules || [];

  const out: OfferSuggestion[] = [];

  // Regelverk som bør aktiveres
  for (const f of recommended) {
    out.push({
      id: `fw-${f}`,
      label: f,
      kind: "framework",
      hours: 6,
      activatable: true,
      frameworkId: f,
      price: 490,
    });
  }

  // Mynder-moduler som ikke er aktivert
  const moduleCandidates: { key: string; label: string; price: number; hours: number }[] = [
    { key: "core", label: "Mynder Core", price: 995, hours: 4 },
    { key: "vendors", label: "Leverandørmodul", price: 1089, hours: 5 },
    { key: "assets", label: "Assets", price: 490, hours: 3 },
  ];
  for (const m of moduleCandidates) {
    if (modules.includes(m.key)) continue;
    out.push({
      id: `mod-${m.key}`,
      label: m.label,
      kind: "module",
      hours: m.hours,
      activatable: true,
      moduleKey: m.key,
      price: m.price,
    });
  }

  // Partnerens egne tjenester
  const activeServices = new Set(deriveActiveServices(c));
  const serviceHours: Record<string, number> = {
    Modenhetsvurdering: 8,
    "Gap-analyse": 10,
    Penetrasjonstest: 24,
    "NIS2-klargjøring": 16,
    "AI Governance-rammeverk": 12,
  };
  const serviceNames: string[] = [];
  if (!score) serviceNames.push("Modenhetsvurdering");
  if (score > 0 && score < 60) serviceNames.push("Gap-analyse");
  for (const s of deriveNeededServices(c)) serviceNames.push(s);

  for (const name of Array.from(new Set(serviceNames))) {
    if (activeServices.has(name)) continue;
    out.push({
      id: `svc-${normalizeServiceKey(name)}`,
      label: name,
      kind: "service",
      hours: serviceHours[name] ?? 8,
      activatable: false,
    });
  }

  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

// Alt kunden allerede har aktivert — regelverk, moduler og leverte tjenester.
export function deriveActivatedItems(c: any): string[] {
  const toLabel = (f: any): string => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""));
  const frameworks: string[] = (c.active_frameworks || []).map(toLabel).filter(Boolean);
  const moduleLabels: Record<string, string> = {
    core: "Mynder Core",
    vendors: "Leverandørmodul",
    assets: "Assets",
    trust: "Trust Profile",
    frameworks: "Regelverk",
  };
  const modules: string[] = (c.active_modules || []).map((m: string) => moduleLabels[m] || m);
  return Array.from(new Set([...frameworks, ...modules, ...deriveActiveServices(c)]));
}

// ===== Manuelle valg (overstyrer KI-anbefalingen) =====

/** Mynder-produkter partneren kan aktivere manuelt, uavhengig av anbefaling. */
export const MANUAL_PRODUCTS: { moduleKey: string; label: string; price: number; hours: number }[] = [
  { moduleKey: "core", label: "Mynder Core", price: 995, hours: 4 },
  { moduleKey: "vendors", label: "Leverandørmodul", price: 1089, hours: 5 },
  { moduleKey: "assets", label: "Eiendeler (Assets)", price: 690, hours: 3 },
  { moduleKey: "systems", label: "Systemer", price: 690, hours: 3 },
  { moduleKey: "trust", label: "Trust Center", price: 490, hours: 3 },
];

/** Lager et forslag for et manuelt valgt Mynder-produkt. */
export function buildManualProductSuggestion(moduleKey: string): OfferSuggestion | null {
  const p = MANUAL_PRODUCTS.find((m) => m.moduleKey === moduleKey);
  if (!p) return null;
  return {
    id: `mod-${p.moduleKey}`,
    label: p.label,
    kind: "module",
    hours: p.hours,
    activatable: true,
    moduleKey: p.moduleKey,
    price: p.price,
  };
}

/** Lager et forslag for en manuelt valgt tjeneste fra tjenestekatalogen. */
export function buildManualServiceSuggestion(name: string, hours = 8): OfferSuggestion {
  return {
    id: `svc-${normalizeServiceKey(name)}`,
    label: name,
    kind: "service",
    hours,
    activatable: false,
  };
}

/** Kategorier for manuelt valgbare regelverk. */
export type FrameworkCategory = "regulation" | "standard" | "guideline";

export const FRAMEWORK_CATEGORY_LABELS: Record<FrameworkCategory, string> = {
  regulation: "Regelverk (lovpålagt)",
  standard: "Standarder",
  guideline: "Retningslinjer og rammeverk",
};

export interface ManualFramework {
  id: string;
  label: string;
  category: FrameworkCategory;
  hours: number;
}

/** Regelverk, standarder og retningslinjer partneren kan legge til manuelt. */
export const MANUAL_FRAMEWORKS: ManualFramework[] = [
  { id: "gdpr", label: "GDPR", category: "regulation", hours: 6 },
  { id: "nis2", label: "NIS2", category: "regulation", hours: 8 },
  { id: "dora", label: "DORA", category: "regulation", hours: 10 },
  { id: "apenhetsloven", label: "Åpenhetsloven", category: "regulation", hours: 6 },
  { id: "ai-act", label: "EU AI Act", category: "regulation", hours: 10 },
  { id: "cra", label: "CRA (Cyber Resilience Act)", category: "regulation", hours: 8 },
  { id: "iso27001", label: "ISO 27001", category: "standard", hours: 12 },
  { id: "iso27701", label: "ISO 27701", category: "standard", hours: 10 },
  { id: "iso9001", label: "ISO 9001", category: "standard", hours: 10 },
  { id: "iso14001", label: "ISO 14001", category: "standard", hours: 8 },
  { id: "nsm-grunnprinsipper", label: "NSM grunnprinsipper for IKT-sikkerhet", category: "guideline", hours: 8 },
  { id: "cis-controls", label: "CIS Controls", category: "guideline", hours: 8 },
  { id: "normen", label: "Normen (helse og omsorg)", category: "guideline", hours: 8 },
];

/** Månedspris for et manuelt valgt regelverk (null = ingen egen lisenspris). */
export function getManualFrameworkPrice(fw: ManualFramework): number | null {
  if (fw.category === "guideline") return null;
  if (isFrameworkFree(fw.id)) return 0;
  return getFrameworkMonthlyPrice(fw.id) || EXTRA_FRAMEWORK_PRICE_KR;
}

/** Lager et forslag for et manuelt valgt regelverk fra katalogen. */
export function buildManualFrameworkSuggestion(id: string): OfferSuggestion | null {
  const fw = MANUAL_FRAMEWORKS.find((f) => f.id === id);
  if (!fw) return null;
  return {
    id: `fw-${fw.id}`,
    label: fw.label,
    kind: "framework",
    hours: fw.hours,
    activatable: fw.category !== "guideline",
    frameworkId: fw.id,
    price: getManualFrameworkPrice(fw),
  };
}

/** Lager et forslag for et egendefinert regelverk/retningslinje (fritekst). */
export function buildCustomFrameworkSuggestion(name: string): OfferSuggestion {
  const slug = name.trim().toLowerCase().replace(/\s+/g, "-");
  return {
    id: `fw-custom-${slug}`,
    label: name.trim(),
    kind: "framework",
    hours: 8,
    activatable: false,
    frameworkId: slug,
    price: null,
  };
}

/** Førsteårs potensial for en vilkårlig liste med forslag. */
export function salesPotentialFor(items: OfferSuggestion[]): {
  total: number;
  services: number;
  recurring: number;
} {
  let services = 0;
  let recurring = 0;
  for (const s of items) {
    if (s.activatable) recurring += (s.price ?? 0) * 12;
    else services += (s.hours ?? 0) * DEFAULT_HOURLY_RATE;
  }
  return { total: services + recurring, services, recurring };
}

// ===== Delte selektorer: regelverk vs. produkter/tjenester =====


/** Kun regelverk som er anbefalt, men ikke aktivert. */
export function deriveFrameworkSuggestions(c: any): OfferSuggestion[] {
  return deriveOfferSuggestions(c).filter((s) => s.kind === "framework");
}

/** Mynder-produkter og partnerens egne tjenester (uten regelverk). */
export function deriveProductSuggestions(c: any): OfferSuggestion[] {
  return deriveOfferSuggestions(c).filter((s) => s.kind !== "framework");
}

/** Regelverk kunden allerede har aktivert. */
export function deriveActivatedFrameworks(c: any): string[] {
  const toLabel = (f: any): string => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""));
  return Array.from(new Set(((c.active_frameworks || []) as any[]).map(toLabel).filter(Boolean)));
}

/** Aktiverte moduler og leverte tjenester (uten regelverk). */
export function deriveActivatedProducts(c: any): string[] {
  const frameworks = new Set(deriveActivatedFrameworks(c));
  return deriveActivatedItems(c).filter((l) => !frameworks.has(l));
}

// ===== Salgspotensial =====
export const DEFAULT_HOURLY_RATE = 1500;

/** Førsteårs salgspotensial: tjenestetimer + 12 mnd abonnement på anbefalte produkter/regelverk. */
export function customerSalesPotential(c: any): { total: number; services: number; recurring: number } {
  const suggestions = deriveOfferSuggestions(c);
  let services = 0;
  let recurring = 0;
  for (const s of suggestions) {
    if (s.activatable) recurring += (s.price ?? 0) * 12;
    else services += (s.hours ?? 0) * DEFAULT_HOURLY_RATE;
  }
  return { total: services + recurring, services, recurring };
}

// ===== Inngang til arbeid hos kunden (driftspartner) =====

const ACTIVATED_LABEL_TO_MODULE: Record<string, string> = {
  "mynder core": "core",
  "leverandørmodul": "vendors",
  leverandører: "vendors",
  assets: "assets",
  "eiendeler (assets)": "assets",
  systemer: "systems",
  "trust profile": "trust",
  "trust center": "trust",
  avvikshåndtering: "deviations",
  avviksregister: "deviations",
  ropa: "ropa",
  behandlingsprotokoll: "ropa",
};

/** Regelverk kunden har aktivert, som inngangspunkter. */
export function deriveActivatedFrameworkTargets(c: any): CustomerEntryTarget[] {
  const seen = new Set<string>();
  const out: CustomerEntryTarget[] = [];
  for (const f of (c?.active_frameworks || []) as any[]) {
    const label = typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? "");
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const frameworkId = typeof f === "string" ? f : (f?.frameworkId ?? f?.id ?? label);
    out.push({ id: `fw-${frameworkId}`, label, kind: "framework", frameworkId });
  }
  return out;
}

/** Aktiverte moduler og tjenester, som inngangspunkter for arbeid hos kunden. */
export function deriveActivatedProductTargets(c: any): CustomerEntryTarget[] {
  return deriveActivatedProducts(c).map((label) => {
    const moduleKey = ACTIVATED_LABEL_TO_MODULE[label.trim().toLowerCase()] ?? "core";
    const isModule = ACTIVATED_LABEL_TO_MODULE[label.trim().toLowerCase()] !== undefined;
    return {
      id: `${isModule ? "mod" : "svc"}-${normalizeServiceKey(label)}`,
      label,
      kind: isModule ? "module" : "service",
      moduleKey,
    } as CustomerEntryTarget;
  });
}

/** Alt kunden har aktivert (regelverk + produkter/tjenester) som inngangspunkter. */
export function deriveActivatedTargets(c: any): CustomerEntryTarget[] {
  return [...deriveActivatedFrameworkTargets(c), ...deriveActivatedProductTargets(c)];
}

// ===== Hva kunden betaler i dag =====

export interface LicenseLine {
  label: string;
  price: number;
}

export interface LicenseSummary {
  monthly: number;
  lines: LicenseLine[];
  billedToDate: number;
  months: number;
}

const MODULE_MONTHLY_PRICE: Record<string, { label: string; price: number }> = {
  core: { label: "Mynder Core", price: 995 },
  vendors: { label: "Leverandørmodul", price: 1089 },
  assets: { label: "Eiendeler (Assets)", price: 690 },
  systems: { label: "Systemer", price: 690 },
  trust: { label: "Trust Center", price: TRUST_CENTER_PRICE_KR },
  deviations: { label: "Avvikshåndtering", price: 290 },
  ropa: { label: "RoPA", price: 290 },
};

function frameworkKey(f: any): { id: string; label: string } {
  if (typeof f === "string") return { id: f, label: f };
  return { id: f?.frameworkId ?? f?.id ?? f?.label ?? "", label: f?.label ?? f?.frameworkId ?? "" };
}

/** Månedlig lisens kunden betaler i dag, og estimert fakturert beløp siden oppstart. */
export function customerLicenseSummary(c: any): LicenseSummary {
  const lines: LicenseLine[] = [];

  for (const m of (c?.active_modules || []) as string[]) {
    const entry = MODULE_MONTHLY_PRICE[m];
    if (entry) lines.push({ label: entry.label, price: entry.price });
  }

  const seen = new Set<string>();
  for (const f of (c?.active_frameworks || []) as any[]) {
    const { id, label } = frameworkKey(f);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    const key = String(id).toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
    const normalized =
      key.includes("gdpr") ? "gdpr"
      : key.includes("iso27001") ? "iso27001"
      : key.includes("nis2") ? "nis2"
      : key.includes("dora") ? "dora"
      : key.includes("aiact") ? "ai_act"
      : key.includes("cra") ? "cra"
      : key.includes("penhetslov") || key.includes("apenhetslov") ? "apenhetsloven"
      : String(id);
    if (isFrameworkFree(normalized)) continue;
    const price = getFrameworkMonthlyPrice(normalized) || EXTRA_FRAMEWORK_PRICE_KR;
    lines.push({ label, price });
  }

  const monthly = lines.reduce((sum, l) => sum + l.price, 0);

  const started = c?.created_at ? new Date(c.created_at) : null;
  let months = 0;
  if (started && !Number.isNaN(started.getTime())) {
    const now = new Date();
    months =
      (now.getFullYear() - started.getFullYear()) * 12 + (now.getMonth() - started.getMonth());
    if (now.getDate() < started.getDate()) months -= 1;
  }
  if (monthly > 0) months = Math.max(1, months);
  else months = Math.max(0, months);

  return { monthly, lines, billedToDate: monthly * months, months };
}
