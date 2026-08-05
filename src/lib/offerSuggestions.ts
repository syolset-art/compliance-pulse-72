import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";

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
