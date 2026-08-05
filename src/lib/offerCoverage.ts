/**
 * Dekning for et tilbud: hvilke krav (Regelverk › Krav) de valgte tjenestene
 * treffer, hvilken dokumentasjon som kan produseres, og om kravets regelverk
 * er aktivert hos kunden.
 *
 * Rene funksjoner — ingen UI, ingen persistens.
 * Kilder: serviceMappingSuggester (krav), requirementDocumentationHints
 * (dokumenter) og documentDeliverables (Lara-utkast).
 */

import { suggestControlPoints, type MatchConfidence } from "./serviceMappingSuggester";
import { getTypicalDocumentation } from "./requirementDocumentationHints";
import { getDeliverableProfile } from "./documentDeliverables";

export interface CoverageRequirement {
  frameworkId: string;
  frameworkLabel: string;
  frameworkShortName: string;
  controlId: string;
  controlLabel: string;
  confidence: MatchConfidence;
  /** Er regelverket aktivert hos kunden? */
  active: boolean;
}

export interface CoverageDocument {
  name: string;
  /** Kan Lara lage et førsteutkast? */
  laraDraft: boolean;
}

export interface ServiceCoverage {
  serviceLabel: string;
  requirements: CoverageRequirement[];
  documents: CoverageDocument[];
  /** Regelverk som treffes, men som ikke er aktivert hos kunden. */
  inactiveFrameworks: { id: string; label: string }[];
}

export interface OfferCoverage {
  services: ServiceCoverage[];
  requirementCount: number;
  documentCount: number;
  /** Unike, ikke-aktiverte regelverk på tvers av alle tjenester. */
  inactiveFrameworks: { id: string; label: string }[];
}

const norm = (s: string) => s.trim().toLowerCase();

/** Matcher fritekst-etiketter ("Aktiver NIS2", "NIS2") mot en frameworkId/label. */
function isFrameworkActive(
  fw: { id: string; label: string; shortName: string },
  activeLabels: string[],
): boolean {
  const candidates = [fw.id, fw.label, fw.shortName].map(norm);
  return activeLabels.some((a) => {
    const v = norm(a);
    if (!v) return false;
    return candidates.some((c) => c === v || v.includes(c) || c.includes(v));
  });
}

export function buildServiceCoverage(
  serviceLabel: string,
  activeFrameworks: string[],
): ServiceCoverage {
  const suggestions = suggestControlPoints({ name: serviceLabel })
    .filter((s) => s.confidence !== "low")
    .slice(0, 4);

  const requirements: CoverageRequirement[] = suggestions.map((s) => ({
    frameworkId: s.frameworkId,
    frameworkLabel: s.frameworkLabel,
    frameworkShortName: s.frameworkShortName,
    controlId: s.controlId,
    controlLabel: s.controlLabel,
    confidence: s.confidence,
    active: isFrameworkActive(
      { id: s.frameworkId, label: s.frameworkLabel, shortName: s.frameworkShortName },
      activeFrameworks,
    ),
  }));

  const docNames = new Set<string>();
  requirements.forEach((r) => {
    getTypicalDocumentation(r.controlId, r.frameworkId).typicalDocs
      .slice(0, 2)
      .forEach((d) => docNames.add(d));
  });

  const documents: CoverageDocument[] = Array.from(docNames)
    .slice(0, 4)
    .map((name) => ({ name, laraDraft: getDeliverableProfile(name).laraDraft }));

  const inactiveMap = new Map<string, string>();
  requirements
    .filter((r) => !r.active)
    .forEach((r) => inactiveMap.set(r.frameworkId, r.frameworkShortName));

  return {
    serviceLabel,
    requirements,
    documents,
    inactiveFrameworks: Array.from(inactiveMap, ([id, label]) => ({ id, label })),
  };
}

export function buildOfferCoverage(
  serviceLabels: string[],
  activeFrameworks: string[],
): OfferCoverage {
  const services = serviceLabels
    .map((label) => buildServiceCoverage(label, activeFrameworks))
    .filter((s) => s.requirements.length > 0);

  const inactiveMap = new Map<string, string>();
  services.forEach((s) =>
    s.inactiveFrameworks.forEach((f) => inactiveMap.set(f.id, f.label)),
  );

  return {
    services,
    requirementCount: services.reduce((n, s) => n + s.requirements.length, 0),
    documentCount: services.reduce((n, s) => n + s.documents.length, 0),
    inactiveFrameworks: Array.from(inactiveMap, ([id, label]) => ({ id, label })),
  };
}

/** Kort, kommersiell begrunnelse for å ta med regelverksaktivering i tilbudet. */
export function inactiveFrameworkPitch(labels: string[]): string {
  if (labels.length === 0) return "";
  const list =
    labels.length === 1
      ? labels[0]
      : `${labels.slice(0, -1).join(", ")} og ${labels[labels.length - 1]}`;
  return `Uten ${list} aktivert får kunden tiltakene — men ingen modenhetsscore eller rapport som viser hvor de står. Legg til ${list} for målbar effekt.`;
}

/** Timeestimat for å aktivere og sette opp et regelverk i Mynder. */
export const FRAMEWORK_ACTIVATION_HOURS = 6;
