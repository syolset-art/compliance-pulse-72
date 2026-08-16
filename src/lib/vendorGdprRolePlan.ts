// Laras plan for GDPR-rolle (v1) — regelbasert forslag som brukeren må godkjenne.
// Bygger på det vi vet om leverandøren: bransje, beskrivelse, bruksformål,
// personvernerklæring og om det behandles sensitive personopplysninger.

import { USAGE_TAGS, usageTagLabel } from "@/lib/vendorContextSuggestion";

export type GdprRoleValue = "databehandler" | "underdatabehandler" | "ingen_persondata";

export interface GdprRolePlanInput {
  vendorName?: string | null;
  vendorCategory?: string | null;
  description?: string | null;
  usagePurpose?: string | null;
  usageTags?: string[] | null;
  hasPrivacyPolicy?: boolean | null;
  hasDpa?: boolean | null;
  sensitive?: boolean | null;
  currentRole?: string | null;
}

export interface GdprRolePlanStep {
  id: string;
  labelNb: string;
  labelEn: string;
  /** Kan Lara utføre steget selv, eller trenger det en beslutning fra brukeren? */
  byLara: boolean;
}

export interface GdprRolePlan {
  role: GdprRoleValue;
  /** Hvor sikker Lara er på forslaget */
  confidence: "low" | "medium" | "high";
  /** Hva Lara har lagt til grunn */
  evidenceNb: string[];
  evidenceEn: string[];
  /** Hva som skjer når planen godkjennes */
  stepsNb: string[];
  stepsEn: string[];
  steps: GdprRolePlanStep[];
  /** Sant når forslaget er likt det som allerede er satt */
  matchesCurrent: boolean;
}

const roleLabels: Record<GdprRoleValue, { nb: string; en: string }> = {
  databehandler: { nb: "Databehandler", en: "Data processor" },
  underdatabehandler: { nb: "Underdatabehandler", en: "Sub-processor" },
  ingen_persondata: { nb: "Ingen persondata", en: "No personal data" },
};

export function gdprRoleLabel(role: GdprRoleValue | null | undefined, isNb: boolean): string {
  if (!role || !roleLabels[role]) return isNb ? "Ikke satt" : "Not set";
  return isNb ? roleLabels[role].nb : roleLabels[role].en;
}

export function buildGdprRolePlan(input: GdprRolePlanInput): GdprRolePlan {
  const haystack = [input.vendorCategory, input.description, input.usagePurpose, input.vendorName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tagValues = input.usageTags || [];
  const matchedTags = USAGE_TAGS.filter(
    (t) =>
      tagValues.includes(t.value) ||
      (t.keywords.length > 0 && t.keywords.some((k) => haystack.includes(k)))
  );

  const evidenceNb: string[] = [];
  const evidenceEn: string[] = [];
  let signals = 0;

  if (matchedTags.length > 0) {
    signals += 1;
    const nb = matchedTags.map((t) => usageTagLabel(t.value, true)).join(", ");
    const en = matchedTags.map((t) => usageTagLabel(t.value, false)).join(", ");
    evidenceNb.push(`Bruksformål: ${nb}`);
    evidenceEn.push(`Purpose of use: ${en}`);
  }
  if (input.vendorCategory) {
    signals += 1;
    evidenceNb.push(`Bransje: ${input.vendorCategory}`);
    evidenceEn.push(`Industry: ${input.vendorCategory}`);
  }
  if (input.hasPrivacyPolicy) {
    signals += 1;
    evidenceNb.push("Leverandøren har registrert personvernerklæring");
    evidenceEn.push("The vendor has a registered privacy policy");
  }
  if (input.description) {
    signals += 1;
    evidenceNb.push("Beskrivelse av hva leverandøren utfører for dere");
    evidenceEn.push("Description of what the vendor performs for you");
  }
  if (input.sensitive) {
    evidenceNb.push("Sensitive personopplysninger er registrert");
    evidenceEn.push("Sensitive personal data is registered");
  }
  if (evidenceNb.length === 0) {
    evidenceNb.push("Lite informasjon registrert – Lara foreslår forsiktig");
    evidenceEn.push("Little information registered – Lara suggests cautiously");
  }

  let role: GdprRoleValue = "ingen_persondata";
  if (matchedTags.some((t) => t.gdprRole === "databehandler")) role = "databehandler";
  else if (input.hasPrivacyPolicy || input.sensitive) role = "databehandler";
  else if (matchedTags.length > 0 && matchedTags.every((t) => t.gdprRole === "ingen_persondata")) {
    role = "ingen_persondata";
  }

  const confidence: GdprRolePlan["confidence"] = signals >= 3 ? "high" : signals >= 2 ? "medium" : "low";

  const steps: GdprRolePlanStep[] = [
    {
      id: "set_role",
      labelNb: `Sett GDPR-rolle til «${roleLabels[role].nb}» på leverandøren`,
      labelEn: `Set the GDPR role to "${roleLabels[role].en}" on the vendor`,
      byLara: true,
    },
  ];

  if (role === "databehandler" || role === "underdatabehandler") {
    if (!input.hasDpa) {
      steps.push({
        id: "dpa",
        labelNb: "Be leverandøren om signert databehandleravtale (DPA)",
        labelEn: "Request a signed data processing agreement (DPA) from the vendor",
        byLara: true,
      });
    }
    steps.push({
      id: "subprocessors",
      labelNb: "Hent oversikt over underdatabehandlere og overføringsgrunnlag",
      labelEn: "Collect the list of sub-processors and transfer basis",
      byLara: true,
    });
    steps.push({
      id: "categories",
      labelNb: "Bekreft hvilke personopplysninger som behandles",
      labelEn: "Confirm which personal data is processed",
      byLara: false,
    });
    if (input.sensitive) {
      steps.push({
        id: "dpia",
        labelNb: "Vurder DPIA fordi sensitive personopplysninger behandles",
        labelEn: "Assess a DPIA because sensitive personal data is processed",
        byLara: false,
      });
    }
  } else {
    steps.push({
      id: "document_no_pii",
      labelNb: "Dokumenter begrunnelsen for at det ikke behandles personopplysninger",
      labelEn: "Document the rationale for no personal data being processed",
      byLara: true,
    });
    steps.push({
      id: "recheck",
      labelNb: "Sett påminnelse om ny vurdering ved endret bruk",
      labelEn: "Set a reminder to reassess if usage changes",
      byLara: true,
    });
  }

  return {
    role,
    confidence,
    evidenceNb,
    evidenceEn,
    stepsNb: steps.map((s) => s.labelNb),
    stepsEn: steps.map((s) => s.labelEn),
    steps,
    matchesCurrent: (input.currentRole || "") === role,
  };
}
