// Maturity questions used by the Activate Trust Profile wizard (step 5).
// Mapped to GDPR articles for audit trail. The article is shown only via
// a tooltip / info icon — never inline in the question text.

import { Users, ShieldCheck, Lock, Globe, type LucideIcon } from "lucide-react";

export type MaturityAnswer = "yes" | "no" | "later" | "n_a";

export interface MaturityQuestion {
  id: string;
  text: string;
  article: string; // e.g. "Art. 30"
  /** Optional helper to derive a Lara-suggested default from the scan result. */
  laraSource?: string; // human-readable source label, e.g. "Personvernerklæring funnet"
}

export interface MaturityArea {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  questions: MaturityQuestion[];
}

export const MATURITY_AREAS: MaturityArea[] = [
  {
    id: "governance",
    title: "Styring",
    subtitle: "Eierskap, ansvar og dokumentasjon",
    icon: Users,
    questions: [
      { id: "gov.dpo", text: "Har dere utpekt en person som er ansvarlig for personvern (DPO eller personvernkontakt)?", article: "Art. 24 / 37" },
      { id: "gov.privacy_policy", text: "Har dere en publisert personvernerklæring tilgjengelig for kunder og besøkende?", article: "Art. 13" },
      { id: "gov.internal_policy", text: "Har dere en intern policy eller rutine for personvern som ansatte kjenner til?", article: "Art. 24" },
      { id: "gov.records", text: "Har dere oversikt over hvilke behandlingsaktiviteter dere utfører (behandlingsprotokoll, Art. 30)?", article: "Art. 30" },
      { id: "gov.training", text: "Får ansatte opplæring i personvern minst én gang i året?", article: "Art. 39" },
    ],
  },
  {
    id: "operations",
    title: "Drift og sikkerhet",
    subtitle: "Tekniske og organisatoriske tiltak",
    icon: ShieldCheck,
    questions: [
      { id: "ops.encryption", text: "Krypteres personopplysninger både i hvile og i overføring?", article: "Art. 32" },
      { id: "ops.mfa", text: "Krever dere tofaktor-autentisering for tilgang til systemer med personopplysninger?", article: "Art. 32" },
      { id: "ops.breach", text: "Har dere en rutine for håndtering av personvernbrudd, inkludert varsling innen 72 timer (Art. 33)?", article: "Art. 33" },
      { id: "ops.logging", text: "Logger og overvåker dere tilgang til personopplysninger?", article: "Art. 32" },
      { id: "ops.backup", text: "Tar dere regelmessige backups, og har dere testet at de kan gjenopprettes?", article: "Art. 32" },
    ],
  },
  {
    id: "privacy",
    title: "Personvern og datahåndtering",
    subtitle: "Selve GDPR-kjernen",
    icon: Lock,
    questions: [
      { id: "pri.legal_basis", text: "Har dere et lovlig grunnlag for hver behandling av personopplysninger (samtykke, avtale, rettslig forpliktelse, etc.)?", article: "Art. 6" },
      { id: "pri.minimization", text: "Innhenter dere kun de personopplysningene dere faktisk trenger (dataminimering)?", article: "Art. 5(1c)" },
      { id: "pri.retention", text: "Har dere definerte oppbevaringsperioder, og sletter dere data automatisk når perioden utløper?", article: "Art. 5(1e)" },
      { id: "pri.rights", text: "Kan registrerte få innsyn, retting, sletting og dataportabilitet på forespørsel (Art. 15–20)?", article: "Art. 15–20" },
      { id: "pri.transfer", text: "Overfører dere personopplysninger utenfor EØS, og har dere i så fall gyldig overføringsgrunnlag (SCC, adequacy, BCR)?", article: "Art. 44–49" },
    ],
  },
  {
    id: "third_party",
    title: "Tredjepartsstyring",
    subtitle: "Databehandlere og underleverandører",
    icon: Globe,
    questions: [
      { id: "tp.inventory", text: "Har dere en oversikt over alle databehandlere som behandler personopplysninger på deres vegne?", article: "Art. 30(1f)" },
      { id: "tp.dpa", text: "Har dere signert databehandleravtale (DPA) med hver enkelt databehandler (Art. 28)?", article: "Art. 28" },
      { id: "tp.risk_assessment", text: "Vurderer dere personvernrisiko før dere tar i bruk nye databehandlere?", article: "Art. 28(1) / 35" },
      { id: "tp.subprocessor_notice", text: "Får dere varsel fra databehandlere ved endringer i underleverandører eller datalagringssted?", article: "Art. 28(2)" },
    ],
  },
];

export const ALL_MATURITY_QUESTIONS: MaturityQuestion[] = MATURITY_AREAS.flatMap((a) => a.questions);

export type MaturityAnswers = Record<string, MaturityAnswer>;

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

  // HIGH-CONFIDENCE: publisert personvernerklæring funnet på domenet
  if (scan.privacy?.policyUrl) answers["gov.privacy_policy"] = "yes";

  // HIGH-CONFIDENCE: navngitt personvernkontakt / DPO i offentlig kilde
  if (scan.contacts?.dpoEmail || scan.contacts?.dpoName) answers["gov.dpo"] = "yes";

  // HIGH-CONFIDENCE: underleverandører listet offentlig (subprocessor page)
  if ((scan.dataStorage?.subProcessors?.length ?? 0) > 0) answers["tp.inventory"] = "yes";

  // HIGH-CONFIDENCE: DPA-mal funnet
  const hasDpa = (scan.documents ?? []).some((d) => d.type === "dpa");
  if (hasDpa) answers["tp.dpa"] = "yes";

  // HIGH-CONFIDENCE: publisert sikkerhets-/personvernpolicy
  const hasSecPolicy = (scan.documents ?? []).some((d) => d.type === "policy");
  if (hasSecPolicy) answers["gov.internal_policy"] = "yes";

  // HIGH-CONFIDENCE «ikke aktuelt»: ingen tredjepartsoverføringer indikert
  // i kartleggingen (ingen kjente underleverandører utenfor EØS, ingen
  // transfer-omtale). Brukeren kan overstyre om de likevel overfører data.
  const subs = scan.dataStorage?.subProcessors ?? [];
  const hasNonEEA = subs.some((s) => /microsoft|google|aws|amazon|hubspot|slack|zoom|salesforce|stripe|openai/i.test(s));
  if (subs.length > 0 && !hasNonEEA) answers["pri.transfer"] = "n_a";

  // Drift og sikkerhet: Lara skal ikke gjette basert på generelle nettside-omtaler.
  // ops.encryption / ops.mfa forblir "later" og settes kun via faktiske bevis.

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
  { id: "privacy_policy", title: "Personvernerklæring", description: "Publisert erklæring som beskriver hvordan dere behandler personopplysninger.", resolvesQuestion: "gov.privacy_policy", scanType: "privacy_policy" },
  { id: "dpa", title: "Databehandleravtale (mal)", description: "Standard DPA dere bruker med kunder eller underleverandører.", resolvesQuestion: "tp.dpa", scanType: "dpa" },
  { id: "security_policy", title: "Informasjonssikkerhetspolicy", description: "Intern policy som dekker tilgang, kryptering, hendelseshåndtering.", resolvesQuestion: "gov.internal_policy", scanType: "policy" },
  { id: "incident_plan", title: "Hendelsesplan", description: "Rutine for å oppdage, varsle og håndtere personvernbrudd innen 72 timer.", resolvesQuestion: "ops.breach" },
];
