export interface MSPAssessmentQuestion {
  key: string;
  question_no: string;
  question_en: string;
  category: string;
  impact_area: string;
  iso_reference?: string;
}

export const MSP_ASSESSMENT_QUESTIONS: MSPAssessmentQuestion[] = [
  {
    key: "risk_assessment_approved",
    question_no: "Har dere styregodkjent risikovurdering?",
    question_en: "Do you have a board-approved risk assessment?",
    category: "risk",
    impact_area: "risk_module",
    iso_reference: "ISO 27001 A.6.1",
  },
  {
    key: "backup_testing_documented",
    question_no: "Har dere dokumentert backup-testing?",
    question_en: "Do you have documented backup testing?",
    category: "operations",
    impact_area: "acronis_backup",
    iso_reference: "ISO 27001 A.12.3",
  },
  {
    key: "processing_records",
    question_no: "Har dere behandlingsprotokoll (ROPA)?",
    question_en: "Do you have a record of processing activities (ROPA)?",
    category: "gdpr",
    impact_area: "gdpr_checklist",
    iso_reference: "GDPR Art. 30",
  },
  {
    key: "incident_handling",
    question_no: "Har dere hendelseshåndteringsrutine?",
    question_en: "Do you have an incident handling procedure?",
    category: "operations",
    impact_area: "deviation_module",
    iso_reference: "ISO 27001 A.16.1",
  },
  {
    key: "dpa_with_vendors",
    question_no: "Har dere databehandleravtaler med alle leverandører?",
    question_en: "Do you have data processing agreements with all vendors?",
    category: "gdpr",
    impact_area: "vendor_management",
    iso_reference: "GDPR Art. 28",
  },
  {
    key: "security_training",
    question_no: "Er ansatte opplært i informasjonssikkerhet?",
    question_en: "Are employees trained in information security?",
    category: "awareness",
    impact_area: "mynder_me_courses",
    iso_reference: "ISO 27001 A.7.2.2",
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
