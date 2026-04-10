import type { AppRole } from "@/hooks/useUserRole";

/** Which dashboard widgets are most relevant per role */
export const ROLE_WIDGET_DEFAULTS: Record<AppRole, { primary: string[]; hidden: string[] }> = {
  personvernombud: {
    primary: ["vendor-requests", "data-geography", "environment", "ai-docs"],
    hidden: ["vulnerability-map", "ai-dependencies", "ai-activity", "critical-processes"],
  },
  sikkerhetsansvarlig: {
    primary: ["security-foundations", "vulnerability-map", "critical-processes", "nis2", "business-risk-exposure"],
    hidden: ["ai-docs", "vendor-requests", "data-geography"],
  },
  compliance_ansvarlig: {
    primary: ["security-foundations", "nis2", "business-risk-exposure", "vendor-requests", "environment"],
    hidden: [],
  },
  daglig_leder: {
    primary: ["business-risk-exposure", "nis2", "environment"],
    hidden: ["vulnerability-map", "ai-dependencies", "ai-activity", "critical-processes", "ai-docs"],
  },
  ai_governance: {
    primary: ["ai-activity", "ai-dependencies", "ai-docs", "business-risk-exposure"],
    hidden: ["vendor-requests", "critical-processes", "data-geography"],
  },
  operativ_bruker: {
    primary: ["environment"],
    hidden: ["business-risk-exposure", "vulnerability-map", "ai-dependencies", "ai-activity", "ai-docs", "nis2", "critical-processes", "data-geography"],
  },
  risk_owner: {
    primary: ["business-risk-exposure", "vulnerability-map", "critical-processes", "nis2"],
    hidden: ["ai-docs", "ai-activity", "vendor-requests"],
  },
  internal_auditor: {
    primary: ["security-foundations", "nis2", "business-risk-exposure", "environment"],
    hidden: ["ai-activity", "ai-dependencies"],
  },
  esg_officer: {
    primary: ["environment", "data-geography", "vendor-requests"],
    hidden: ["vulnerability-map", "ai-dependencies", "ai-activity", "critical-processes"],
  },
  incident_manager: {
    primary: ["vulnerability-map", "critical-processes", "security-foundations"],
    hidden: ["ai-docs", "data-geography", "vendor-requests"],
  },
  system_owner: {
    primary: ["environment", "critical-processes", "vulnerability-map", "security-foundations"],
    hidden: ["ai-docs", "vendor-requests", "data-geography"],
  },
  training_officer: {
    primary: ["environment", "security-foundations"],
    hidden: ["vulnerability-map", "ai-dependencies", "ai-activity", "business-risk-exposure", "critical-processes"],
  },
  vendor_manager: {
    primary: ["vendor-requests", "data-geography", "environment"],
    hidden: ["vulnerability-map", "ai-dependencies", "ai-activity", "critical-processes"],
  },
  it_manager: {
    primary: ["environment", "critical-processes", "vulnerability-map", "security-foundations"],
    hidden: ["ai-docs", "ai-activity", "data-geography"],
  },
};

/** Sidebar nav routes that are "primary" (highlighted) per role */
export const ROLE_SIDEBAR_HIGHLIGHTS: Record<AppRole, string[]> = {
  personvernombud: ["/", "/vendors", "/deviations", "/customer-requests", "/regulations"],
  sikkerhetsansvarlig: ["/", "/systems", "/assets", "/deviations", "/tasks"],
  compliance_ansvarlig: ["/", "/regulations", "/tasks", "/deviations", "/vendors", "/systems"],
  daglig_leder: ["/", "/reports", "/work-areas", "/regulations"],
  ai_governance: ["/", "/ai-registry", "/systems", "/regulations"],
  operativ_bruker: ["/", "/tasks", "/systems", "/deviations"],
  risk_owner: ["/", "/deviations", "/systems", "/assets", "/reports"],
  internal_auditor: ["/", "/regulations", "/deviations", "/reports", "/tasks"],
  esg_officer: ["/", "/vendors", "/reports", "/regulations"],
  incident_manager: ["/", "/deviations", "/systems", "/tasks"],
  system_owner: ["/", "/systems", "/assets", "/tasks"],
  training_officer: ["/", "/work-areas", "/tasks"],
  vendor_manager: ["/", "/vendors", "/customer-requests", "/tasks"],
  it_manager: ["/", "/systems", "/assets", "/customer-requests", "/work-areas", "/reports"],
};

/** Role-specific critical tasks */
export interface RoleCriticalTask {
  id: string;
  labelNb: string;
  labelEn: string;
  route: string;
  urgency: "high" | "medium";
  roles: AppRole[]; // which roles see this task
}

export const ROLE_CRITICAL_TASKS: RoleCriticalTask[] = [
  {
    id: "dpa-missing",
    labelNb: "3 leverandører mangler databehandleravtale (DPA)",
    labelEn: "3 vendors are missing a Data Processing Agreement (DPA)",
    route: "/vendors",
    urgency: "high",
    roles: ["personvernombud", "compliance_ansvarlig", "vendor_manager", "daglig_leder"],
  },
  {
    id: "work-area-responsible",
    labelNb: "Arbeidsområde «Regnskap» mangler ansvarlig person",
    labelEn: 'Work area "Accounting" is missing a responsible person',
    route: "/work-areas",
    urgency: "high",
    roles: ["daglig_leder", "compliance_ansvarlig", "operativ_bruker"],
  },
  {
    id: "nis2-assessment",
    labelNb: "NIS2 egenvurdering er ikke fullført",
    labelEn: "NIS2 self-assessment is not completed",
    route: "/compliance/nis2",
    urgency: "medium",
    roles: ["sikkerhetsansvarlig", "compliance_ansvarlig", "daglig_leder", "internal_auditor"],
  },
  {
    id: "dpia-overdue",
    labelNb: "2 behandlingsaktiviteter mangler DPIA",
    labelEn: "2 processing activities are missing DPIA",
    route: "/vendors",
    urgency: "high",
    roles: ["personvernombud"],
  },
  {
    id: "risk-assessment-pending",
    labelNb: "4 risikovurderinger venter godkjenning",
    labelEn: "4 risk assessments pending approval",
    route: "/tasks?filter=pending_approvals",
    urgency: "high",
    roles: ["risk_owner", "sikkerhetsansvarlig", "internal_auditor"],
  },
  {
    id: "systems-review-overdue",
    labelNb: "5 systemer har passert gjennomgangsfrist",
    labelEn: "5 systems are past review deadline",
    route: "/systems",
    urgency: "medium",
    roles: ["sikkerhetsansvarlig", "system_owner", "compliance_ansvarlig"],
  },
  {
    id: "ai-act-classification",
    labelNb: "2 AI-systemer mangler risikoklassifisering",
    labelEn: "2 AI systems are missing risk classification",
    route: "/ai-registry",
    urgency: "high",
    roles: ["ai_governance", "compliance_ansvarlig"],
  },
  {
    id: "incident-open",
    labelNb: "3 åpne sikkerhetshendelser krever oppfølging",
    labelEn: "3 open security incidents require follow-up",
    route: "/deviations",
    urgency: "high",
    roles: ["incident_manager", "sikkerhetsansvarlig"],
  },
  {
    id: "training-overdue",
    labelNb: "12 ansatte mangler obligatorisk opplæring",
    labelEn: "12 employees are missing mandatory training",
    route: "/work-areas",
    urgency: "medium",
    roles: ["training_officer", "daglig_leder"],
  },
];

/** Get up to 3 critical tasks for a given role */
export function getCriticalTasksForRole(role: AppRole): RoleCriticalTask[] {
  return ROLE_CRITICAL_TASKS
    .filter(t => t.roles.includes(role))
    .sort((a, b) => (a.urgency === "high" ? 0 : 1) - (b.urgency === "high" ? 0 : 1))
    .slice(0, 3);
}

/** Hero card CTA per role */
export interface RoleHeroCTA {
  labelNb: string;
  labelEn: string;
  route: string;
}

export const ROLE_HERO_CTAS: Record<AppRole, RoleHeroCTA[]> = {
  personvernombud: [
    { labelNb: "Ny behandlingsaktivitet", labelEn: "New processing activity", route: "/vendors" },
    { labelNb: "Se DPIA-oversikt", labelEn: "View DPIA overview", route: "/vendors" },
  ],
  sikkerhetsansvarlig: [
    { labelNb: "Se risikoer", labelEn: "View risks", route: "/systems" },
    { labelNb: "NIS2-status", labelEn: "NIS2 status", route: "/compliance/nis2" },
  ],
  compliance_ansvarlig: [
    { labelNb: "Regelverk & kontroller", labelEn: "Regulations & controls", route: "/regulations" },
    { labelNb: "Modenhetsvurdering", labelEn: "Maturity assessment", route: "/reports" },
  ],
  daglig_leder: [
    { labelNb: "Statusrapport", labelEn: "Status report", route: "/reports" },
    { labelNb: "Risikooversikt", labelEn: "Risk overview", route: "/systems" },
  ],
  ai_governance: [
    { labelNb: "AI-register", labelEn: "AI registry", route: "/ai-registry" },
    { labelNb: "AI Act-status", labelEn: "AI Act status", route: "/ai-registry" },
  ],
  operativ_bruker: [
    { labelNb: "Mine oppgaver", labelEn: "My tasks", route: "/tasks" },
    { labelNb: "Mine systemer", labelEn: "My systems", route: "/systems" },
  ],
  risk_owner: [
    { labelNb: "Risikovurderinger", labelEn: "Risk assessments", route: "/systems" },
    { labelNb: "Avviksoversikt", labelEn: "Deviations overview", route: "/deviations" },
  ],
  internal_auditor: [
    { labelNb: "Revisjonsoversikt", labelEn: "Audit overview", route: "/reports" },
    { labelNb: "Kontrollstatus", labelEn: "Control status", route: "/regulations" },
  ],
  esg_officer: [
    { labelNb: "Leverandørstatus", labelEn: "Vendor status", route: "/vendors" },
    { labelNb: "Miljørapporter", labelEn: "Environmental reports", route: "/reports" },
  ],
  incident_manager: [
    { labelNb: "Åpne hendelser", labelEn: "Open incidents", route: "/deviations" },
    { labelNb: "Hendelseslogg", labelEn: "Incident log", route: "/deviations" },
  ],
  system_owner: [
    { labelNb: "Systemoversikt", labelEn: "System overview", route: "/systems" },
    { labelNb: "Vedlikeholdsplan", labelEn: "Maintenance plan", route: "/tasks" },
  ],
  training_officer: [
    { labelNb: "Opplæringsstatus", labelEn: "Training status", route: "/work-areas" },
    { labelNb: "Kursadministrasjon", labelEn: "Course admin", route: "/work-areas" },
  ],
  vendor_manager: [
    { labelNb: "Leverandøroversikt", labelEn: "Vendor overview", route: "/vendors" },
    { labelNb: "Nye forespørsler", labelEn: "New requests", route: "/customer-requests" },
  ],
  it_manager: [
    { labelNb: "Systemoversikt", labelEn: "System overview", route: "/systems" },
    { labelNb: "Forespørsler", labelEn: "Requests", route: "/customer-requests" },
  ],
};
