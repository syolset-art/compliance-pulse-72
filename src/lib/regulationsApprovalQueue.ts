// Godkjenningskø og arbeidsflate for regelverk (beta).
//
// Utledes deterministisk fra samme kravdata som kravlisten bruker, slik at
// tallene stemmer med det brukeren ser når hun åpner et regelverk.
// Når den lokale agenten Sara er installert, merkes en del av funnene som
// hentet av Sara (med dokument-ID, hash og agentversjon) i stedet for Lara.

import { useCallback, useEffect, useState } from "react";
import { getRequirementsByFramework, type ComplianceRequirement } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import { agentConfirmedRequirementIds, expectedDocLabel } from "@/lib/frameworkEvidenceExpectations";
import { demoUiStateFor, normalizeProgress } from "@/lib/requirementStatusModel";
import type { Framework } from "@/lib/frameworkDefinitions";

/* -------------------------------------------------------------------------- */
/* Hjelpere                                                                    */
/* -------------------------------------------------------------------------- */

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

function hex(s: string, len: number): string {
  const base = (hash(s) * 2654435761) >>> 0;
  return base.toString(16).padStart(8, "0").slice(0, len);
}

export function getFrameworkRequirements(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

/* -------------------------------------------------------------------------- */
/* Beslutninger — lagres lokalt (samme mønster som øvrig demo-status)          */
/* -------------------------------------------------------------------------- */

export type ApprovalDecision = "approved" | "deferred" | "rejected";

const DECISION_KEY = "mynder.regulations.approvals";
const DECISION_EVENT = "mynder-regulations-approvals";

function readDecisions(): Record<string, ApprovalDecision> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(DECISION_KEY) || "{}") as Record<string, ApprovalDecision>;
  } catch {
    return {};
  }
}

export function useApprovalDecisions() {
  const [decisions, setDecisions] = useState<Record<string, ApprovalDecision>>(readDecisions);

  useEffect(() => {
    const sync = () => setDecisions(readDecisions());
    window.addEventListener(DECISION_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(DECISION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setDecision = useCallback((key: string, decision: ApprovalDecision | null) => {
    const next = readDecisions();
    if (decision === null) delete next[key];
    else next[key] = decision;
    window.localStorage.setItem(DECISION_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(DECISION_EVENT));
  }, []);

  const reset = useCallback(() => {
    window.localStorage.removeItem(DECISION_KEY);
    window.dispatchEvent(new Event(DECISION_EVENT));
  }, []);

  return { decisions, setDecision, reset };
}

/* -------------------------------------------------------------------------- */
/* Godkjenningskø                                                              */
/* -------------------------------------------------------------------------- */

export type ApprovalSource = "lara" | "sara";

export interface ApprovalItem {
  /** Stabil nøkkel: `${frameworkId}:${requirementId}` */
  key: string;
  frameworkId: string;
  frameworkName: string;
  requirementId: string;
  requirementName: string;
  /** Hva slags dokumentasjon dette gjelder */
  docLabel: string;
  source: ApprovalSource;
  /** Hvor dokumentasjonen kommer fra (kildesti eller datagrunnlag) */
  sourceDetail: string;
  /** Kort tidsangivelse for funnet */
  at: string;
  /** Kun for Sara: dokumentidentifikator hos kunden */
  documentId?: string;
  /** Kun for Sara: kort hash som bekrefter at dokumentet finnes og er uendret */
  hash?: string;
  /** Kun for Sara: versjon av den lokale agenten */
  agentVersion?: string;
}

const SARA_SOURCE_PATHS = [
  "Notion / Sikkerhet",
  "Notion / Compliance",
  "Notion / HR",
  "Notion / Styrende dokumenter",
];

const LARA_SOURCE_TEXTS_NB = [
  "Utledet fra registrerte data i plattformen",
  "Gjenbruk av dokumentasjon på beslektet krav",
  "Basert på svar dere har gitt tidligere",
];

/** Bygger hele godkjenningskøen på tvers av aktive regelverk. */
export function buildApprovalItems(activeFrameworks: Framework[], saraInstalled: boolean): ApprovalItem[] {
  const items: ApprovalItem[] = [];

  activeFrameworks.forEach((fw) => {
    const reqs = getFrameworkRequirements(fw.id);
    if (reqs.length === 0) return;
    const agentConfirmed = agentConfirmedRequirementIds(reqs, () => false);

    reqs.forEach((req) => {
      if (!agentConfirmed.has(req.requirement_id)) return;
      const h = hash(req.requirement_id);
      const fromSara = saraInstalled && h % 2 === 0;
      items.push({
        key: `${fw.id}:${req.requirement_id}`,
        frameworkId: fw.id,
        frameworkName: fw.name,
        requirementId: req.requirement_id,
        requirementName: req.name_no,
        docLabel: expectedDocLabel(req, true),
        source: fromSara ? "sara" : "lara",
        sourceDetail: fromSara
          ? `${SARA_SOURCE_PATHS[h % SARA_SOURCE_PATHS.length]} / ${expectedDocLabel(req, true)}`
          : LARA_SOURCE_TEXTS_NB[h % LARA_SOURCE_TEXTS_NB.length],
        at: h % 3 === 0 ? "I dag" : h % 3 === 1 ? "I går" : "Denne uken",
        documentId: fromSara ? `ntn-${hex(req.requirement_id, 6)}` : undefined,
        hash: fromSara ? `sha256:${hex(req.requirement_id + "h", 4)}…${hex(req.requirement_id + "t", 4)}` : undefined,
        agentVersion: fromSara ? "0.9.2" : undefined,
      });
    });
  });

  return items.sort((a, b) => a.frameworkName.localeCompare(b.frameworkName));
}

/* -------------------------------------------------------------------------- */
/* Arbeidsflate — filtrering på tvers av regelverk                             */
/* -------------------------------------------------------------------------- */

export type WorkFilter = "pending" | "waiting_you" | "lara" | "ok" | "gap";

/** Hva mangler egentlig: finnes dokumentet, men er ikke hentet inn — eller finnes det ikke? */
export type GapKind = "not_fetched" | "not_existing";

export interface WorkItem {
  key: string;
  frameworkId: string;
  frameworkName: string;
  requirementId: string;
  requirementName: string;
  docLabel: string;
  filter: Exclude<WorkFilter, "pending"> | "pending";
  /** Kun for gap */
  gapKind?: GapKind;
  source?: ApprovalSource;
}

export interface WorkBuildResult {
  items: WorkItem[];
  counts: Record<WorkFilter, number>;
}

export function buildWorkItems(
  activeFrameworks: Framework[],
  saraInstalled: boolean,
  decisions: Record<string, ApprovalDecision>,
): WorkBuildResult {
  const approvals = new Map(buildApprovalItems(activeFrameworks, saraInstalled).map((a) => [a.key, a]));
  const items: WorkItem[] = [];

  activeFrameworks.forEach((fw) => {
    getFrameworkRequirements(fw.id).forEach((req) => {
      const key = `${fw.id}:${req.requirement_id}`;
      const approval = approvals.get(key);
      const decision = decisions[key];
      const fulfilled = normalizeProgress(demoUiStateFor(req.requirement_id).progress) === "fulfilled";
      const docLabel = expectedDocLabel(req, true);
      const base = {
        key,
        frameworkId: fw.id,
        frameworkName: fw.name,
        requirementId: req.requirement_id,
        requirementName: req.name_no,
        docLabel,
        source: approval?.source,
      };

      if (approval && decision === "deferred") {
        items.push({ ...base, filter: "pending" });
        return;
      }
      if (approval && decision === "approved") {
        items.push({ ...base, filter: "ok" });
        return;
      }
      if (approval && !decision) {
        // Ubehandlet forslag fra Lara/Sara — agenten følger opp til du tar stilling.
        items.push({ ...base, filter: "lara" });
        return;
      }
      if (approval && decision === "rejected") {
        const hr = hash(req.requirement_id);
        items.push({
          ...base,
          filter: "gap",
          gapKind: saraInstalled && hr % 2 === 0 ? "not_fetched" : "not_existing",
        });
        return;
      }

      if (fulfilled) {
        items.push({ ...base, filter: "ok" });
        return;
      }
      if (req.agent_capability === "full") {
        items.push({ ...base, filter: "lara" });
        return;
      }
      const h = hash(req.requirement_id);
      const gapKind: GapKind = saraInstalled && h % 2 === 0 ? "not_fetched" : "not_existing";
      items.push({ ...base, filter: "gap", gapKind });
    });
  });

  const counts: Record<WorkFilter, number> = {
    pending: 0,
    waiting_you: 0,
    lara: 0,
    ok: 0,
    gap: 0,
  };
  items.forEach((i) => {
    counts[i.filter] += 1;
  });
  counts.waiting_you = counts.pending + counts.gap;

  return { items, counts };
}

/** Anbefalt neste steg for et gap-krav. */
export function nextStepFor(item: WorkItem, saraInstalled: boolean): {
  action: "upload" | "ask_sara" | "create_task" | "assess";
  labelNb: string;
  labelEn: string;
  meaningNb: string;
  meaningEn: string;
} {
  if (item.gapKind === "not_fetched" && saraInstalled) {
    return {
      action: "ask_sara",
      labelNb: "Be Sara hente",
      labelEn: "Ask Sara to fetch",
      meaningNb: "Dokumentasjonen finnes i en tilkoblet kilde, men er ikke hentet inn ennå.",
      meaningEn: "The documentation exists in a connected source but has not been collected yet.",
    };
  }
  if (item.gapKind === "not_existing") {
    return {
      action: "create_task",
      labelNb: "Opprett oppgave",
      labelEn: "Create task",
      meaningNb: "Vi finner ingen dokumentasjon som dekker dette kravet. Noen må lage den.",
      meaningEn: "We find no documentation covering this requirement. Someone needs to create it.",
    };
  }
  return {
    action: "upload",
    labelNb: "Last opp dokumentasjon",
    labelEn: "Upload documentation",
    meaningNb: "Sannsynligvis finnes dokumentet allerede — last det opp så kobles kravet.",
    meaningEn: "The document likely exists already — upload it and the requirement is linked.",
  };
}

/* -------------------------------------------------------------------------- */
/* Statistikk per regelverk (brukes av oversiktslisten)                        */
/* -------------------------------------------------------------------------- */

export interface FrameworkAgentStats {
  frameworkId: string;
  total: number;
  met: number;
  agentFollowUp: number;
  waitingYou: number;
  percent: number;
}

export function getFrameworkAgentStats(frameworkId: string): FrameworkAgentStats {
  const reqs = getFrameworkRequirements(frameworkId);
  const agentConfirmed = agentConfirmedRequirementIds(reqs, () => false);
  let met = 0;
  let agentFollowUp = 0;
  let waitingYou = 0;
  reqs.forEach((r) => {
    const isAgent = agentConfirmed.has(r.requirement_id);
    const progress = isAgent ? "fulfilled" : demoUiStateFor(r.requirement_id).progress;
    const fulfilled = normalizeProgress(progress) === "fulfilled";
    if (fulfilled) met++;
    if (isAgent) agentFollowUp++;
    else if (!fulfilled) waitingYou++;
  });
  return {
    frameworkId,
    total: reqs.length,
    met,
    agentFollowUp,
    waitingYou,
    percent: reqs.length > 0 ? Math.round((met / reqs.length) * 100) : 0,
  };
}

export function summarizeAgentWork(frameworkIds: string[]) {
  let analysed = 0;
  let confirmed = 0;
  let waitingYou = 0;
  frameworkIds.forEach((id) => {
    const s = getFrameworkAgentStats(id);
    analysed += s.total;
    confirmed += s.agentFollowUp;
    waitingYou += s.waitingYou;
  });
  return { frameworks: frameworkIds.length, analysed, confirmed, waitingYou };
}
