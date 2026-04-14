export interface MSPAssessmentQuestion {
  key: string;
  question_no: string;
  question_en: string;
  category: "governance" | "operations" | "privacy" | "thirdparty";
  impact_area: string;
  iso_reference?: string;
  framework_triggers?: string[];
}

export const ASSESSMENT_CATEGORIES = {
  governance: { label: "Styring og ledelse", icon: "Shield" },
  operations: { label: "Drift og sikkerhet", icon: "Server" },
  privacy: { label: "Personvern og datahåndtering", icon: "Lock" },
  thirdparty: { label: "Tredjepartstyring", icon: "Users" },
} as const;

export const MSP_ASSESSMENT_QUESTIONS: MSPAssessmentQuestion[] = [
  // Governance
  {
    key: "risk_assessment_approved",
    question_no: "Har virksomheten en styregodkjent risikovurdering?",
    question_en: "Does the organization have a board-approved risk assessment?",
    category: "governance",
    impact_area: "risk_module",
    iso_reference: "ISO 27001 A.6.1",
    framework_triggers: ["iso27001", "nsm_grunnprinsipper"],
  },
  {
    key: "security_policy",
    question_no: "Finnes det en dokumentert sikkerhetspolicy?",
    question_en: "Is there a documented security policy?",
    category: "governance",
    impact_area: "policy_management",
    iso_reference: "ISO 27001 A.5.1",
    framework_triggers: ["iso27001"],
  },
  {
    key: "roles_responsibilities",
    question_no: "Er roller og ansvar for informasjonssikkerhet formelt tildelt?",
    question_en: "Are roles and responsibilities for information security formally assigned?",
    category: "governance",
    impact_area: "organization",
    iso_reference: "ISO 27001 A.6.1.1",
    framework_triggers: ["iso27001", "nis2"],
  },
  {
    key: "critical_infrastructure",
    question_no: "Leverer virksomheten tjenester til kritisk infrastruktur?",
    question_en: "Does the organization provide services to critical infrastructure?",
    category: "governance",
    impact_area: "nis2_scope",
    framework_triggers: ["nis2"],
  },

  // Operations
  {
    key: "backup_testing_documented",
    question_no: "Har virksomheten dokumentert og testet backup-rutiner?",
    question_en: "Does the organization have documented and tested backup routines?",
    category: "operations",
    impact_area: "acronis_backup",
    iso_reference: "ISO 27001 A.12.3",
    framework_triggers: ["iso27001"],
  },
  {
    key: "incident_handling",
    question_no: "Finnes det en hendelseshåndteringsrutine?",
    question_en: "Is there an incident handling procedure?",
    category: "operations",
    impact_area: "deviation_module",
    iso_reference: "ISO 27001 A.16.1",
    framework_triggers: ["iso27001", "nis2"],
  },
  {
    key: "security_training",
    question_no: "Får ansatte opplæring i informasjonssikkerhet?",
    question_en: "Do employees receive information security training?",
    category: "operations",
    impact_area: "mynder_me_courses",
    iso_reference: "ISO 27001 A.7.2.2",
    framework_triggers: ["iso27001"],
  },
  {
    key: "access_control",
    question_no: "Er tilgangsstyring dokumentert med minst-mulig-tilgang-prinsippet?",
    question_en: "Is access control documented following the least privilege principle?",
    category: "operations",
    impact_area: "access_management",
    iso_reference: "ISO 27001 A.9.1",
    framework_triggers: ["iso27001", "nsm_grunnprinsipper"],
  },

  // Privacy
  {
    key: "processing_records",
    question_no: "Har virksomheten en behandlingsprotokoll (ROPA)?",
    question_en: "Does the organization have a record of processing activities (ROPA)?",
    category: "privacy",
    impact_area: "gdpr_checklist",
    iso_reference: "GDPR Art. 30",
    framework_triggers: ["gdpr", "personopplysningsloven"],
  },
  {
    key: "dpia_conducted",
    question_no: "Er det gjennomført vurdering av personvernkonsekvenser (DPIA)?",
    question_en: "Has a data protection impact assessment (DPIA) been conducted?",
    category: "privacy",
    impact_area: "gdpr_dpia",
    iso_reference: "GDPR Art. 35",
    framework_triggers: ["gdpr", "iso27701"],
  },
  {
    key: "data_subject_rights",
    question_no: "Har virksomheten rutiner for håndtering av innsynskrav?",
    question_en: "Does the organization have procedures for handling data subject requests?",
    category: "privacy",
    impact_area: "gdpr_rights",
    iso_reference: "GDPR Art. 15-22",
    framework_triggers: ["gdpr", "personopplysningsloven"],
  },
  {
    key: "uses_ai_systems",
    question_no: "Bruker virksomheten KI-systemer i beslutningsprosesser?",
    question_en: "Does the organization use AI systems in decision-making?",
    category: "privacy",
    impact_area: "ai_governance",
    framework_triggers: ["eu_ai_act"],
  },

  // Third-party
  {
    key: "dpa_with_vendors",
    question_no: "Har virksomheten databehandleravtaler med alle leverandører?",
    question_en: "Does the organization have DPAs with all vendors?",
    category: "thirdparty",
    impact_area: "vendor_management",
    iso_reference: "GDPR Art. 28",
    framework_triggers: ["gdpr"],
  },
  {
    key: "vendor_risk_assessment",
    question_no: "Gjennomfører virksomheten risikovurdering av leverandører?",
    question_en: "Does the organization conduct vendor risk assessments?",
    category: "thirdparty",
    impact_area: "vendor_risk",
    iso_reference: "ISO 27001 A.15.1",
    framework_triggers: ["iso27001", "nis2"],
  },
  {
    key: "supply_chain_security",
    question_no: "Er det krav til sikkerhet i hele leverandørkjeden?",
    question_en: "Are there security requirements throughout the supply chain?",
    category: "thirdparty",
    impact_area: "supply_chain",
    framework_triggers: ["nis2", "dora"],
  },
];

export type AssessmentAnswer = "yes" | "no" | "unsure";

export interface AssessmentResponse {
  question_key: string;
  answer: AssessmentAnswer;
  notes?: string;
}

export function calculateAssessmentScore(responses: AssessmentResponse[]): number {
  if (responses.length === 0) return 0;
  const yesCount = responses.filter((r) => r.answer === "yes").length;
  return Math.round((yesCount / MSP_ASSESSMENT_QUESTIONS.length) * 100);
}

export function getAssessmentGaps(responses: AssessmentResponse[]): MSPAssessmentQuestion[] {
  const noOrUnsure = new Set(
    responses.filter((r) => r.answer !== "yes").map((r) => r.question_key)
  );
  return MSP_ASSESSMENT_QUESTIONS.filter((q) => noOrUnsure.has(q.key));
}

export function getRecommendedFrameworks(
  responses: AssessmentResponse[],
  industry?: string | null
): string[] {
  const triggered = new Set<string>();

  // Always recommend GDPR + Personopplysningsloven
  triggered.add("gdpr");
  triggered.add("personopplysningsloven");

  // From assessment gaps
  const gaps = getAssessmentGaps(responses);
  for (const gap of gaps) {
    gap.framework_triggers?.forEach((f) => triggered.add(f));
  }

  // Industry-based recommendations
  if (industry) {
    const lower = industry.toLowerCase();
    if (lower.includes("helse") || lower.includes("health")) {
      triggered.add("iso27001");
      triggered.add("iso27701");
    }
    if (lower.includes("finans") || lower.includes("bank") || lower.includes("forsikring")) {
      triggered.add("dora");
      triggered.add("iso27001");
    }
    if (lower.includes("energi") || lower.includes("transport") || lower.includes("infrastruktur")) {
      triggered.add("nis2");
    }
  }

  return Array.from(triggered);
}
