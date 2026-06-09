// Maturity questions used by the Activate Trust Profile wizard and MSP baseline.
// Areas mirror the 5 canonical control areas defined in src/lib/controlAreas.ts
// (governance, operations, identityAccess, privacy, vendor). Mapped to GDPR
// articles for audit trail. The article is shown only via a tooltip / info icon
// — never inline in the question text.

import { Shield, Settings, KeyRound, Lock, Users, type LucideIcon } from "lucide-react";
import type { ControlAreaKey } from "@/lib/controlAreas";

export type MaturityAnswer = "not_started" | "in_progress" | "done" | "not_relevant";

export interface MaturityQuestion {
  id: string;
  text: string;
  article: string; // e.g. "Art. 30"
  /** Optional helper to derive a Lara-suggested default from the scan result. */
  laraSource?: string;
}

export interface MaturityArea {
  id: ControlAreaKey;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  questions: MaturityQuestion[];
}

export const MATURITY_AREAS: MaturityArea[] = [
  {
    id: "governance",
    title: "Styring og ansvar",
    subtitle: "Eierskap, roller, policy og ledelsesforankring",
    icon: Shield,
    questions: [
      { id: "gov.dpo", text: "Er det utpekt en person som er ansvarlig for personvern (DPO eller personvernkontakt)?", article: "Art. 24 / 37" },
      { id: "gov.privacy_policy", text: "Finnes det en publisert personvernerklæring tilgjengelig for kunder og besøkende?", article: "Art. 13" },
      { id: "gov.internal_policy", text: "Er det laget en intern policy eller rutine for personvern som ansatte kjenner til?", article: "Art. 24" },
      { id: "gov.records", text: "Er det laget en oversikt over behandlingsaktiviteter (behandlingsprotokoll, Art. 30)?", article: "Art. 30" },
      { id: "gov.training", text: "Får ansatte opplæring i personvern minst én gang i året?", article: "Art. 39" },
    ],
  },
  {
    id: "operations",
    title: "Drift og sikkerhet",
    subtitle: "Drift, hendelseshåndtering, logging og sikkerhetskopiering",
    icon: Settings,
    questions: [
      { id: "ops.encryption", text: "Krypteres personopplysninger både i hvile og i overføring?", article: "Art. 32" },
      { id: "ops.breach", text: "Finnes det en rutine for håndtering av personvernbrudd, inkludert varsling innen 72 timer (Art. 33)?", article: "Art. 33" },
      { id: "ops.logging", text: "Blir tilgang til personopplysninger logget og overvåket?", article: "Art. 32" },
      { id: "ops.backup", text: "Tas det regelmessige backups, og er det testet at de kan gjenopprettes?", article: "Art. 32" },
    ],
  },
  {
    id: "identityAccess",
    title: "Identitet og tilgang",
    subtitle: "Autentisering, tilgangsstyring, MFA og minste privilegium",
    icon: KeyRound,
    questions: [
      { id: "ia.mfa", text: "Kreves tofaktor-autentisering for tilgang til systemer med personopplysninger?", article: "Art. 32" },
      { id: "ia.rbac", text: "Er tilgang til personopplysninger styrt etter roller eller arbeidsoppgaver (rollebasert tilgangsstyring)?", article: "Art. 32" },
      { id: "ia.least_privilege", text: "Gjennomgås tilganger regelmessig for å sikre at ansatte kun har det de trenger (minste privilegium)?", article: "Art. 32" },
      { id: "ia.joiner_leaver", text: "Finnes det rutiner for å gi og fjerne tilganger når ansatte starter, bytter rolle eller slutter?", article: "Art. 32" },
    ],
  },
  {
    id: "privacy",
    title: "Personvern og datahåndtering",
    subtitle: "GDPR-kjernen: behandlingsgrunnlag, oppbevaring og rettigheter",
    icon: Lock,
    questions: [
      { id: "pri.legal_basis", text: "Finnes det et lovlig grunnlag for hver behandling av personopplysninger (samtykke, avtale, rettslig forpliktelse, etc.)?", article: "Art. 6" },
      { id: "pri.minimization", text: "Innhentes kun de personopplysningene som faktisk trengs (dataminimering)?", article: "Art. 5(1c)" },
      { id: "pri.retention", text: "Er det definerte oppbevaringsperioder, og slettes data automatisk når perioden utløper?", article: "Art. 5(1e)" },
      { id: "pri.rights", text: "Kan registrerte få innsyn, retting, sletting og dataportabilitet på forespørsel (Art. 15–20)?", article: "Art. 15–20" },
      { id: "pri.transfer", text: "Overføres personopplysninger utenfor EØS, og finnes det i så fall gyldig overføringsgrunnlag (SCC, adequacy, BCR)?", article: "Art. 44–49" },
    ],
  },
  {
    id: "vendor",
    title: "Tredjepart og verdikjede",
    subtitle: "Databehandlere, underleverandører og leverandøroppfølging",
    icon: Users,
    questions: [
      { id: "tp.inventory", text: "Er det laget en oversikt over alle databehandlere som behandler personopplysninger på virksomhetens vegne?", article: "Art. 30(1f)" },
      { id: "tp.dpa", text: "Er det signert databehandleravtale (DPA) med hver enkelt databehandler (Art. 28)?", article: "Art. 28" },
      { id: "tp.risk_assessment", text: "Vurderes personvernrisiko før nye databehandlere tas i bruk?", article: "Art. 28(1) / 35" },
      { id: "tp.subprocessor_notice", text: "Mottas varsel fra databehandlere ved endringer i underleverandører eller datalagringssted?", article: "Art. 28(2)" },
    ],
  },
];

export const ALL_MATURITY_QUESTIONS: MaturityQuestion[] = MATURITY_AREAS.flatMap((a) => a.questions);

export type MaturityAnswers = Record<string, MaturityAnswer>;

/** Migrerer gamle spørsmål-id-er som er endret i denne refaktoreringen. */
export function migrateLegacyAnswers(answers: MaturityAnswers): MaturityAnswers {
  if (!answers || typeof answers !== "object") return {};
  const migrated: MaturityAnswers = { ...answers };
  // ops.mfa flyttet til identityAccess som ia.mfa
  if (migrated["ops.mfa"] !== undefined && migrated["ia.mfa"] === undefined) {
    migrated["ia.mfa"] = migrated["ops.mfa"];
  }
  delete migrated["ops.mfa"];
  return migrated;
}

/** Build defaults from Lara scan. Anything not derivable defaults to "later".
 *  Only HIGH-CONFIDENCE signals from public sources trigger an answer — these
 *  are the ones Lara "svarer på" automatisk. Brukeren kan alltid overstyre.
 */
export function deriveDefaultAnswers(scan: {
  contacts?: { dpoName?: string; dpoEmail?: string };
  privacy?: { policyUrl?: string };
  security?: { encryption?: string; mfa?: string };
  dataStorage?: { subProcessors: string[] };
  documents?: { type: string }[];
} | null | undefined): MaturityAnswers {
  const answers: MaturityAnswers = {};
  for (const q of ALL_MATURITY_QUESTIONS) answers[q.id] = "later";
  if (!scan) return answers;

  if (scan.privacy?.policyUrl) answers["gov.privacy_policy"] = "yes";
  if (scan.contacts?.dpoEmail || scan.contacts?.dpoName) answers["gov.dpo"] = "yes";
  if ((scan.dataStorage?.subProcessors?.length ?? 0) > 0) answers["tp.inventory"] = "yes";

  const hasDpa = (scan.documents ?? []).some((d) => d.type === "dpa");
  if (hasDpa) answers["tp.dpa"] = "yes";

  const hasSecPolicy = (scan.documents ?? []).some((d) => d.type === "policy");
  if (hasSecPolicy) answers["gov.internal_policy"] = "yes";

  const subs = scan.dataStorage?.subProcessors ?? [];
  const hasNonEEA = subs.some((s) => /microsoft|google|aws|amazon|hubspot|slack|zoom|salesforce|stripe|openai/i.test(s));
  if (subs.length > 0 && !hasNonEEA) answers["pri.transfer"] = "n_a";

  return answers;
}

/** Returns map of questionId -> Lara source label, used to show an "i" tooltip. */
export function deriveLaraSources(scan: {
  contacts?: { dpoName?: string; dpoEmail?: string };
  privacy?: { policyUrl?: string };
  security?: { encryption?: string; mfa?: string };
  dataStorage?: { subProcessors: string[] };
  documents?: { type: string; title: string }[];
} | null | undefined): Record<string, string> {
  const sources: Record<string, string> = {};
  if (!scan) return sources;
  if (scan.privacy?.policyUrl) sources["gov.privacy_policy"] = "Personvernerklæring funnet på hjemmesiden";
  if (scan.contacts?.dpoEmail || scan.contacts?.dpoName) {
    sources["gov.dpo"] = `Personvernkontakt funnet${scan.contacts?.dpoName ? `: ${scan.contacts.dpoName}` : ""}`;
  }
  if ((scan.dataStorage?.subProcessors?.length ?? 0) > 0) sources["tp.inventory"] = `${scan.dataStorage!.subProcessors.length} underleverandører identifisert`;
  const dpa = (scan.documents ?? []).find((d) => d.type === "dpa");
  if (dpa) sources["tp.dpa"] = `Funnet i: ${dpa.title}`;
  const sec = (scan.documents ?? []).find((d) => d.type === "policy");
  if (sec) sources["gov.internal_policy"] = `Funnet i: ${sec.title}`;

  const subs = scan.dataStorage?.subProcessors ?? [];
  const hasNonEEA = subs.some((s) => /microsoft|google|aws|amazon|hubspot|slack|zoom|salesforce|stripe|openai/i.test(s));
  if (subs.length > 0 && !hasNonEEA) {
    sources["pri.transfer"] = "Ingen underleverandører utenfor EØS funnet i kartleggingen";
  }
  return sources;
}

export interface DocumentSlot {
  id: string;
  title: string;
  description: string;
  /** Question id to auto-flip to "yes" when this slot is uploaded. */
  resolvesQuestion?: string;
  /** Document type matching demoTrustActivation.documents[].type for "found" detection. */
  scanType?: string;
}

export const DOCUMENT_SLOTS: DocumentSlot[] = [
  { id: "privacy_policy", title: "Personvernerklæring", description: "Publisert erklæring som beskriver behandling av personopplysninger.", resolvesQuestion: "gov.privacy_policy", scanType: "privacy_policy" },
  { id: "dpa", title: "Databehandleravtale (mal)", description: "Standard DPA som brukes med kunder eller underleverandører.", resolvesQuestion: "tp.dpa", scanType: "dpa" },
  { id: "security_policy", title: "Informasjonssikkerhetspolicy", description: "Intern policy som dekker tilgang, kryptering, hendelseshåndtering.", resolvesQuestion: "gov.internal_policy", scanType: "policy" },
  { id: "incident_plan", title: "Hendelsesplan", description: "Rutine for å oppdage, varsle og håndtere personvernbrudd innen 72 timer.", resolvesQuestion: "ops.breach" },
];
