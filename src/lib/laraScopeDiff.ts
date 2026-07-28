// Klient-side "scope-diff" for Lara-veiviseren i tjenestekatalogen.
// Sammenligner tidligere og nye WizardAnswers, og foreslår hvordan
// eksisterende tjenester bør oppdateres.

import type { WizardAnswers } from "./serviceCatalog";
import { SERVICE_LIBRARY, type ServiceTemplate } from "./serviceLibrary";

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  security: ["sikkerhet", "security", "iso 27001", "soc"],
  gdpr: ["gdpr", "personvern", "privacy", "dpo"],
  iso: ["iso 27001", "iso 42001", "styringssystem"],
  nis2: ["nis2"],
  dora: ["dora"],
  ai: ["ai act", "ai governance", "iso 42001", "ai-"],
  transparency: ["åpenhet", "transparency", "leverandørkjede", "supply chain"],
};

const MARKET_TO_SCOPES: Record<string, string[]> = {
  no: ["NO", "EU", "global"],
  se: ["SE", "EU", "global"],
  dk: ["EU", "global"],
  fi: ["EU", "global"],
  eu: ["EU", "global"],
  uk: ["UK", "global"],
  au: ["AU", "global"],
  global: ["global"],
};

const MARKET_LABELS: Record<string, string> = {
  no: "Norge", se: "Sverige", dk: "Danmark", fi: "Finland",
  eu: "EU/EØS", uk: "UK", au: "Australia", global: "Globalt",
};

const DOMAIN_LABELS: Record<string, string> = {
  security: "IT-sikkerhet",
  gdpr: "Personvern / GDPR",
  iso: "ISO / styringssystemer",
  nis2: "NIS2",
  dora: "DORA",
  ai: "AI Act / AI-styring",
  transparency: "Åpenhetsloven",
};

export interface ScopeDiff {
  addedMarkets: string[];
  removedMarkets: string[];
  addedDomains: string[];
  removedDomains: string[];
  addedSegments: string[];
  removedSegments: string[];
}

const arrDiff = (a: string[], b: string[]) => a.filter((x) => !b.includes(x));

export function diffAnswers(prev: WizardAnswers | null, next: WizardAnswers): ScopeDiff {
  const p = prev ?? { markets: [], segments: [], domains: [], models: [], maturity: [] };
  return {
    addedMarkets: arrDiff(next.markets, p.markets),
    removedMarkets: arrDiff(p.markets, next.markets),
    addedDomains: arrDiff(next.domains, p.domains),
    removedDomains: arrDiff(p.domains, next.domains),
    addedSegments: arrDiff(next.segments, p.segments),
    removedSegments: arrDiff(p.segments, next.segments),
  };
}

export function hasScopeChange(d: ScopeDiff): boolean {
  return (
    d.addedMarkets.length + d.removedMarkets.length +
    d.addedDomains.length + d.removedDomains.length +
    d.addedSegments.length + d.removedSegments.length
  ) > 0;
}

function domainToKeywords(domains: string[]): string[] {
  const known = Object.keys(DOMAIN_KEYWORDS);
  return domains.flatMap((d) =>
    known.includes(d) ? DOMAIN_KEYWORDS[d] : [d.toLowerCase().trim()],
  ).filter(Boolean);
}

function templateMatchesKeywords(tpl: ServiceTemplate, keywords: string[]): boolean {
  if (keywords.length === 0) return false;
  const hay = `${tpl.name} ${tpl.shortDescription} ${tpl.mappings.map((m) => m.frameworkLabel).join(" ")}`.toLowerCase();
  return keywords.some((k) => hay.includes(k));
}

function allowedScopesFor(markets: string[]): Set<string> {
  const s = new Set<string>();
  markets.forEach((m) => (MARKET_TO_SCOPES[m] ?? ["global"]).forEach((x) => s.add(x)));
  if (s.size === 0) s.add("global");
  return s;
}

export interface AdoptedRef {
  id: string;                 // extras.id
  name: string;
  templateId?: string;
  mappingFrameworkIds: string[]; // fw-ids allerede i tjenesten
}

export interface AddRecommendation {
  kind: "add";
  templateId: string;
  templateCode: string;
  name: string;
  reason: string;
}

export interface ExtendRecommendation {
  kind: "extend";
  extraId: string;
  extraName: string;
  templateId: string;
  addedFrameworkLabels: string[]; // f.eks. ["NIS2"]
  reason: string;
}

export interface ReviewRecommendation {
  kind: "review";
  extraId: string;
  extraName: string;
  reason: string;
}

export interface ScopeRecommendations {
  toAdd: AddRecommendation[];
  toExtend: ExtendRecommendation[];
  toReview: ReviewRecommendation[];
}

export function buildRecommendations(
  diff: ScopeDiff,
  next: WizardAnswers,
  adopted: AdoptedRef[],
): ScopeRecommendations {
  const adoptedTemplateIds = new Set(adopted.map((a) => a.templateId).filter(Boolean) as string[]);

  const addedKeywords = domainToKeywords(diff.addedDomains);
  const removedKeywords = domainToKeywords(diff.removedDomains);
  const nextKeywords = domainToKeywords(next.domains);
  const nextScopes = allowedScopesFor(next.markets);

  // 1) toAdd: maler i biblioteket som treffer nye fagområder + nytt marked, og som ikke er adoptert.
  const toAdd: AddRecommendation[] = [];
  if (addedKeywords.length > 0 || diff.addedMarkets.length > 0) {
    for (const tpl of SERVICE_LIBRARY) {
      if (adoptedTemplateIds.has(tpl.id)) continue;
      const inScope = tpl.scopes.some((s) => nextScopes.has(s));
      if (!inScope) continue;
      const domainHit = templateMatchesKeywords(tpl, addedKeywords);
      if (!domainHit) continue;
      const reasonParts: string[] = [];
      if (diff.addedDomains.length) reasonParts.push(`nytt fagområde: ${diff.addedDomains.map((d) => DOMAIN_LABELS[d] ?? d).join(", ")}`);
      if (diff.addedMarkets.length) reasonParts.push(`nytt marked: ${diff.addedMarkets.map((m) => MARKET_LABELS[m] ?? m).join(", ")}`);
      toAdd.push({
        kind: "add",
        templateId: tpl.id,
        templateCode: tpl.code,
        name: tpl.name,
        reason: reasonParts.join(" · ") || "matcher oppdatert scope",
      });
      if (toAdd.length >= 8) break;
    }
  }

  // 2) toExtend: adopterte tjenester der malen dekker nye regelverk som tjenesten enda ikke har.
  const toExtend: ExtendRecommendation[] = [];
  if (addedKeywords.length > 0) {
    for (const a of adopted) {
      if (!a.templateId) continue;
      const tpl = SERVICE_LIBRARY.find((t) => t.id === a.templateId);
      if (!tpl) continue;
      const currentFwIds = new Set(a.mappingFrameworkIds);
      const additions = tpl.mappings.filter((m) => {
        if (currentFwIds.has(m.frameworkId)) return false;
        const label = `${m.frameworkLabel}`.toLowerCase();
        return addedKeywords.some((k) => label.includes(k));
      });
      if (additions.length === 0) continue;
      toExtend.push({
        kind: "extend",
        extraId: a.id,
        extraName: a.name,
        templateId: a.templateId,
        addedFrameworkLabels: additions.map((m) => m.frameworkLabel),
        reason: `Malen dekker nye krav i ${additions.map((m) => m.frameworkLabel).join(", ")}`,
      });
    }
  }

  // 3) toReview: adopterte tjenester som ikke lenger treffer nytt scope,
  //    eller som kun matcher fjernede fagområder/markeder.
  const toReview: ReviewRecommendation[] = [];
  for (const a of adopted) {
    if (!a.templateId) continue;
    const tpl = SERVICE_LIBRARY.find((t) => t.id === a.templateId);
    if (!tpl) continue;

    const scopeStillOk = tpl.scopes.some((s) => nextScopes.has(s));
    if (!scopeStillOk && diff.removedMarkets.length > 0) {
      toReview.push({
        kind: "review",
        extraId: a.id,
        extraName: a.name,
        reason: `Tjenesten er knyttet til marked du ikke lenger dekker (${diff.removedMarkets.map((m) => MARKET_LABELS[m] ?? m).join(", ")}).`,
      });
      continue;
    }

    if (removedKeywords.length > 0) {
      const matchesRemoved = templateMatchesKeywords(tpl, removedKeywords);
      const matchesCurrent = nextKeywords.length > 0 && templateMatchesKeywords(tpl, nextKeywords);
      if (matchesRemoved && !matchesCurrent) {
        toReview.push({
          kind: "review",
          extraId: a.id,
          extraName: a.name,
          reason: `Dekker fagområde du har fjernet (${diff.removedDomains.map((d) => DOMAIN_LABELS[d] ?? d).join(", ")}).`,
        });
      }
    }
  }

  return { toAdd, toExtend, toReview };
}

export function summarizeDiff(d: ScopeDiff): string {
  const parts: string[] = [];
  if (d.addedMarkets.length) parts.push(`+${d.addedMarkets.map((m) => MARKET_LABELS[m] ?? m).join(", ")}`);
  if (d.removedMarkets.length) parts.push(`−${d.removedMarkets.map((m) => MARKET_LABELS[m] ?? m).join(", ")}`);
  if (d.addedDomains.length) parts.push(`+${d.addedDomains.map((x) => DOMAIN_LABELS[x] ?? x).join(", ")}`);
  if (d.removedDomains.length) parts.push(`−${d.removedDomains.map((x) => DOMAIN_LABELS[x] ?? x).join(", ")}`);
  return parts.join(" · ");
}

export const WIZARD_ANSWERS_STORAGE_KEY = "msp-lara-wizard-answers-v1";
