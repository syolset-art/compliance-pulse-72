/**
 * Registry som binder en QuestionnaireId til konkrete spørsmål.
 * Gjenbruker eksisterende spørsmålssett — vi lager ikke nye.
 */
import type { QuestionnaireId } from "./serviceCatalog";
import { MATURITY_AREAS } from "./trustMaturityQuestions";
import { MSP_ASSESSMENT_QUESTIONS, ASSESSMENT_CATEGORIES } from "./mspAssessmentQuestions";

export interface QuestionnaireItem {
  /** Stabil nøkkel — brukt som svarnøkkel i lagret state. */
  key: string;
  text: string;
  /** Kort referanse, f.eks. "GDPR Art. 30" eller "ISO 27001 A.5.1". */
  reference?: string;
  /** Forslag til oppfølgingstjeneste-ID hvis kunden svarer "nei". */
  suggestedServiceId?: string;
}

export interface QuestionnaireSection {
  id: string;
  title: string;
  items: QuestionnaireItem[];
}

export interface QuestionnaireDefinition {
  id: QuestionnaireId;
  title: string;
  intro: string;
  sections: QuestionnaireSection[];
  totalQuestions: number;
}

/** Gap → tjeneste-forslag. Brukes til å la Lara foreslå oppfølgingssalg. */
const KEY_TO_SUGGESTED_SERVICE: Record<string, string> = {
  // GDPR maturity
  "gov.dpo": "dpo",
  "gov.records": "dpia",
  "pri.rights": "dpo",
  "tp.dpa": "tpl-dpa-review",
  "tp.inventory": "tpl-dpa-review",
  "ops.encryption": "m365-hardening",
  "ops.mfa": "m365-hardening",
  "ops.breach": "incident-response",
  "ops.backup": "managed-backup",
  // ISO / NIS2
  risk_assessment_approved: "iso27001",
  security_policy: "vciso",
  incident_handling: "incident-response",
  backup_testing_documented: "managed-backup",
  security_training: "awareness",
  access_control: "m365-hardening",
  dpa_with_vendors: "tpl-dpa-review",
  vendor_risk_assessment: "tpl-dpa-review",
  processing_records: "dpo",
  dpia_conducted: "dpia",
  uses_ai_systems: "ai-governance",
  critical_infrastructure: "nis2",
};

function buildGdprMaturity(): QuestionnaireDefinition {
  const sections = MATURITY_AREAS.map((area) => ({
    id: area.id,
    title: area.title,
    items: area.questions.map<QuestionnaireItem>((q) => ({
      key: q.id,
      text: q.text,
      reference: q.article,
      suggestedServiceId: KEY_TO_SUGGESTED_SERVICE[q.id],
    })),
  }));
  return {
    id: "gdpr_maturity",
    title: "GDPR-helsesjekk",
    intro:
      "Svar ja, nei eller usikker på hvert spørsmål. Tar ca. 15 minutter. Du kan lagre og fortsette senere.",
    sections,
    totalQuestions: sections.reduce((n, s) => n + s.items.length, 0),
  };
}

function buildFromMspAssessment(
  id: QuestionnaireId,
  title: string,
  intro: string,
  filter: (q: (typeof MSP_ASSESSMENT_QUESTIONS)[number]) => boolean,
): QuestionnaireDefinition {
  const grouped = (Object.keys(ASSESSMENT_CATEGORIES) as Array<keyof typeof ASSESSMENT_CATEGORIES>).map(
    (cat) => {
      const items = MSP_ASSESSMENT_QUESTIONS.filter((q) => q.category === cat && filter(q)).map<QuestionnaireItem>(
        (q) => ({
          key: q.key,
          text: q.question_no,
          reference: q.iso_reference,
          suggestedServiceId: KEY_TO_SUGGESTED_SERVICE[q.key],
        }),
      );
      return {
        id: cat,
        title: ASSESSMENT_CATEGORIES[cat].label,
        items,
      };
    },
  ).filter((s) => s.items.length > 0);

  return {
    id,
    title,
    intro,
    sections: grouped,
    totalQuestions: grouped.reduce((n, s) => n + s.items.length, 0),
  };
}

export const QUESTIONNAIRES: Record<QuestionnaireId, QuestionnaireDefinition> = {
  gdpr_maturity: buildGdprMaturity(),
  nis2_scope: buildFromMspAssessment(
    "nis2_scope",
    "NIS2-scoping",
    "Kort skjema (~8 min) som avklarer om dere er omfattet av NIS2 og hvor styringsmessig moden organisasjonen er.",
    (q) => q.framework_triggers?.includes("nis2") ?? false,
  ),
  iso_gap: buildFromMspAssessment(
    "iso_gap",
    "ISO 27001 mini gap-analyse",
    "Komplett selvevaluering (~20 min) på tvers av styring, drift, personvern og tredjepart.",
    () => true,
  ),
};

export function getQuestionnaire(id: QuestionnaireId): QuestionnaireDefinition {
  return QUESTIONNAIRES[id];
}
