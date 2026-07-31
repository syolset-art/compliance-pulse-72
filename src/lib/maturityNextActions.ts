/**
 * Bygger prioriterte «neste tiltak for økt modenhet» per regelverk.
 *
 * Kilder (alle eksisterende):
 *  - status på regelverket (aktivert / bekreftet / AI-anbefalt)
 *  - modenhetsvurderingen (svar per spørsmål, se useCustomerBaseline)
 *  - dokumenter lastet opp per kontrollområde (se useBaselineDocuments)
 *  - tjenester i partnerens katalog / Mynder-biblioteket
 *
 * Rene funksjoner uten UI slik at de kan testes isolert.
 */

import {
  MATURITY_AREAS,
  type MaturityAnswers,
  type MaturityAnswer,
} from "@/lib/trustMaturityQuestions";
import { getTypicalDocumentation } from "@/lib/requirementDocumentationHints";

export type RegulationStatus = "active" | "confirmed" | "recommended";

export type NextActionKind =
  | "confirm"
  | "activate"
  | "assessment"
  | "documentation"
  | "service";

export interface NextAction {
  id: string;
  kind: NextActionKind;
  /** Kort tekst vist i tabellen. */
  text: string;
  /** Valgfri utdypning (tooltip / drawer). */
  detail?: string;
  /** True for tjenester som allerede finnes i partnerens egen katalog. */
  inCatalog?: boolean;
  /** Referanse til kontrollområde når tiltaket gjelder ett område. */
  areaId?: string;
}

export interface ServiceRef {
  id: string;
  name: string;
  inCatalog: boolean;
}

/** Hvilke kontrollområder i modenhetsvurderingen et regelverk primært berører. */
export const FRAMEWORK_AREA_MAP: Record<string, string[]> = {
  gdpr: ["privacy", "governance", "vendor"],
  nis2: ["operations", "identityAccess", "governance"],
  iso27001: ["governance", "operations", "identityAccess", "privacy", "vendor"],
  dora: ["operations", "vendor", "governance"],
  aiact: ["governance", "privacy"],
  transparency: ["vendor", "governance"],
};

const DEFAULT_AREAS = ["governance", "operations"];

export function areasForFramework(frameworkId: string): string[] {
  return FRAMEWORK_AREA_MAP[frameworkId.toLowerCase()] ?? DEFAULT_AREAS;
}

const isDone = (a: MaturityAnswer | undefined) => a === "done" || a === "not_relevant";
const isAnswered = (a: MaturityAnswer | undefined) =>
  a === "done" || a === "in_progress" || a === "not_relevant";

export interface AreaGap {
  areaId: string;
  areaTitle: string;
  /** Spørsmål som ikke er besvart i det hele tatt. */
  unanswered: number;
  /** Besvarte spørsmål som ikke er fullført (påbegynt / ikke på plass). */
  open: number;
  total: number;
  /** Antall dokumenter partneren har lastet opp på området. */
  documents: number;
}

/** Beregner hull per kontrollområde for et gitt regelverk. */
export function getAreaGaps(
  frameworkId: string,
  answers: MaturityAnswers,
  documentCountByArea: Record<string, number>,
): AreaGap[] {
  const areaIds = areasForFramework(frameworkId);
  return MATURITY_AREAS.filter((a) => areaIds.includes(a.id)).map((area) => {
    const unanswered = area.questions.filter((q) => !isAnswered(answers[q.id])).length;
    const open = area.questions.filter(
      (q) => isAnswered(answers[q.id]) && !isDone(answers[q.id]),
    ).length;
    return {
      areaId: area.id,
      areaTitle: area.title,
      unanswered,
      open,
      total: area.questions.length,
      documents: documentCountByArea[area.id] ?? 0,
    };
  });
}

export interface DocumentStatusRow {
  name: string;
  areaId: string;
  areaTitle: string;
  articleLabel: string;
  present: boolean;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[æ]/g, "ae")
    .replace(/[ø]/g, "o")
    .replace(/[å]/g, "a")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Enkel «har vi denne?»-match mellom anbefalt dokumentnavn og opplastede filnavn. */
function matchesUploaded(docName: string, uploadedNames: string[]): boolean {
  const target = normalize(docName);
  const words = target.split(" ").filter((w) => w.length > 4);
  return uploadedNames.some((raw) => {
    const file = normalize(raw);
    if (file.includes(target) || target.includes(file)) return true;
    // Treff når minst to karakteristiske ord fra dokumentnavnet finnes i filnavnet
    const hits = words.filter((w) => file.includes(w)).length;
    return words.length > 1 ? hits >= 2 : hits >= 1;
  });
}

/**
 * Anbefalte dokumenter for et regelverk, med Har/Mangler-status.
 * Utledes fra artiklene som spørsmålene i modenhetsvurderingen peker på.
 */
export function getDocumentStatus(
  frameworkId: string,
  uploadedFileNames: string[],
  documentsByArea?: Record<string, string[]>,
): DocumentStatusRow[] {
  const areaIds = areasForFramework(frameworkId);
  const rows: DocumentStatusRow[] = [];
  const seen = new Set<string>();

  MATURITY_AREAS.filter((a) => areaIds.includes(a.id)).forEach((area) => {
    const areaFiles = documentsByArea?.[area.id] ?? [];
    area.questions.forEach((q) => {
      const hint = getTypicalDocumentation(q.article ?? "", frameworkId);
      if (!hint.specific) return;
      hint.typicalDocs.forEach((docName) => {
        const key = normalize(docName);
        if (seen.has(key)) return;
        seen.add(key);
        rows.push({
          name: docName,
          areaId: area.id,
          areaTitle: area.title,
          articleLabel: hint.articleLabel,
          present: matchesUploaded(docName, [...uploadedFileNames, ...areaFiles]),
        });
      });
    });
  });

  return rows.sort((a, b) => Number(a.present) - Number(b.present));
}

export interface BuildNextActionsInput {
  frameworkId: string;
  label: string;
  status: RegulationStatus;
  answers: MaturityAnswers;
  documentCountByArea: Record<string, number>;
  uploadedFileNames: string[];
  services: ServiceRef[];
  /** Maks antall tiltak som returneres. */
  limit?: number;
}

/**
 * Prioritert liste med neste tiltak:
 *  1. Bekreft / aktiver regelverket (størst modenhetsløft)
 *  2. Fullfør modenhetsvurderingen på områdene regelverket berører
 *  3. Manglende dokumentasjon
 *  4. Tjeneste partneren kan levere
 */
export function buildNextActions(input: BuildNextActionsInput): NextAction[] {
  const {
    frameworkId,
    label,
    status,
    answers,
    documentCountByArea,
    uploadedFileNames,
    services,
    limit = 3,
  } = input;

  const actions: NextAction[] = [];

  if (status === "recommended") {
    actions.push({
      id: `${frameworkId}:confirm`,
      kind: "confirm",
      text: "Bekreft at regelverket gjelder",
      detail: `Lara foreslår ${label}. Bekreft for å få gap-analyse og modenhetsmåling.`,
    });
  } else if (status === "confirmed") {
    actions.push({
      id: `${frameworkId}:activate`,
      kind: "activate",
      text: "Aktiver regelverket for å måle modenhet",
      detail: `${label} er bekreftet, men ikke aktivert. Aktivering gir kravliste, oppgaver og måling.`,
    });
  }

  const gaps = getAreaGaps(frameworkId, answers, documentCountByArea);

  const unansweredTotal = gaps.reduce((s, g) => s + g.unanswered, 0);
  if (unansweredTotal > 0) {
    const worst = [...gaps].sort((a, b) => b.unanswered - a.unanswered)[0];
    actions.push({
      id: `${frameworkId}:assessment`,
      kind: "assessment",
      areaId: worst?.areaId,
      text:
        unansweredTotal === 1
          ? "1 spørsmål i modenhetsvurderingen gjenstår"
          : `${unansweredTotal} spørsmål i modenhetsvurderingen gjenstår`,
      detail: worst
        ? `Størst hull: ${worst.areaTitle} (${worst.unanswered} av ${worst.total} ubesvart).`
        : undefined,
    });
  }

  const openTotal = gaps.reduce((s, g) => s + g.open, 0);
  if (openTotal > 0) {
    const worst = [...gaps].sort((a, b) => b.open - a.open)[0];
    actions.push({
      id: `${frameworkId}:open-activities`,
      kind: "assessment",
      areaId: worst?.areaId,
      text: `${openTotal} ${openTotal === 1 ? "aktivitet" : "aktiviteter"} ikke fullført`,
      detail: worst ? `Flest åpne: ${worst.areaTitle}.` : undefined,
    });
  }

  const docs = getDocumentStatus(frameworkId, uploadedFileNames);
  const missing = docs.filter((d) => !d.present);
  if (missing.length > 0) {
    actions.push({
      id: `${frameworkId}:docs`,
      kind: "documentation",
      areaId: missing[0].areaId,
      text:
        missing.length === 1
          ? `Mangler ${missing[0].name.toLowerCase()}`
          : `Mangler ${missing.length} dokumenter — bl.a. ${missing[0].name.toLowerCase()}`,
      detail: missing
        .slice(0, 5)
        .map((d) => d.name)
        .join(", "),
    });
  }

  const service = services.find((s) => s.inCatalog) ?? services[0];
  if (service) {
    actions.push({
      id: `${frameworkId}:service:${service.id}`,
      kind: "service",
      inCatalog: service.inCatalog,
      text: `Tjeneste: ${service.name}`,
      detail: service.inCatalog
        ? "Finnes i din tjenestekatalog — klar til å tilbys."
        : "Forslag fra Mynders tjenestebibliotek. Legg den til i katalogen din først.",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: `${frameworkId}:ok`,
      kind: "assessment",
      text: "Ingen åpne tiltak — hold dokumentasjonen oppdatert",
    });
  }

  return actions.slice(0, limit);
}
