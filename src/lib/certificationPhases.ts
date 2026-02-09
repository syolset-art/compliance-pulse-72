// PECB-aligned Certification Phases for ISO Readiness Journey

export type CertificationPhase = 
  | 'foundation'
  | 'implementation'
  | 'operation'
  | 'audit'
  | 'certification';

export type SLACategory = 'systems_processes' | 'organization_governance' | 'roles_access';

export type MaturityLevel = 'initial' | 'defined' | 'implemented' | 'measured' | 'optimized';

export interface PhaseDefinition {
  id: CertificationPhase;
  name_no: string;
  name_en: string;
  description_no: string;
  description_en: string;
  percentageRange: [number, number];
  activities_no: string[];
  activities_en: string[];
}

export const CERTIFICATION_PHASES: PhaseDefinition[] = [
  {
    id: 'foundation',
    name_no: 'Fundament',
    name_en: 'Foundation',
    description_no: 'Etabler kontekst, scope og gap-analyse',
    description_en: 'Establish context, scope and gap analysis',
    percentageRange: [0, 15],
    activities_no: ['Kontekstanalyse', 'Scope-definisjon', 'Gap-analyse', 'Rollefordeling'],
    activities_en: ['Context analysis', 'Scope definition', 'Gap analysis', 'Role assignment']
  },
  {
    id: 'implementation',
    name_no: 'Implementering',
    name_en: 'Implementation',
    description_no: 'Utvikle policies, risikovurdering og kontrolltiltak',
    description_en: 'Develop policies, risk assessment and control measures',
    percentageRange: [15, 40],
    activities_no: ['Policy-utvikling', 'Risikovurdering', 'Risikobehandling', 'Målsetting'],
    activities_en: ['Policy development', 'Risk assessment', 'Risk treatment', 'Objective setting']
  },
  {
    id: 'operation',
    name_no: 'Drift',
    name_en: 'Operation',
    description_no: 'Implementer kontroller, dokumentasjon og opplæring',
    description_en: 'Implement controls, documentation and training',
    percentageRange: [40, 70],
    activities_no: ['Kontrollimplementering', 'Dokumentasjon', 'Awareness-trening', 'Overvåking'],
    activities_en: ['Control implementation', 'Documentation', 'Awareness training', 'Monitoring']
  },
  {
    id: 'audit',
    name_no: 'Intern Audit',
    name_en: 'Internal Audit',
    description_no: 'Internrevisjon, ledelsesgjennomgang og korrigering',
    description_en: 'Internal audit, management review and corrective actions',
    percentageRange: [70, 90],
    activities_no: ['Internrevisjon', 'Ledelsesgjennomgang', 'Korrigerende tiltak', 'Forbedring'],
    activities_en: ['Internal audit', 'Management review', 'Corrective actions', 'Improvement']
  },
  {
    id: 'certification',
    name_no: 'Sertifisering',
    name_en: 'Certification',
    description_no: 'Stage 1 og Stage 2 audit, vedlikehold',
    description_en: 'Stage 1 and Stage 2 audit, maintenance',
    percentageRange: [90, 100],
    activities_no: ['Stage 1 Audit', 'Stage 2 Audit', 'Sertifikat', 'Vedlikehold'],
    activities_en: ['Stage 1 Audit', 'Stage 2 Audit', 'Certificate', 'Maintenance']
  }
];

export const MATURITY_LEVELS: { level: MaturityLevel; name_no: string; name_en: string; range: [number, number] }[] = [
  { level: 'initial', name_no: 'Initial', name_en: 'Initial', range: [0, 15] },
  { level: 'defined', name_no: 'Definert', name_en: 'Defined', range: [15, 35] },
  { level: 'implemented', name_no: 'Implementert', name_en: 'Implemented', range: [35, 60] },
  { level: 'measured', name_no: 'Målt', name_en: 'Measured', range: [60, 85] },
  { level: 'optimized', name_no: 'Optimalisert', name_en: 'Optimized', range: [85, 100] },
];

export const DOMAIN_STANDARDS: Record<string, { primary: string; supporting: string[] }> = {
  privacy: { primary: 'ISO 27701 (PIMS)', supporting: ['GDPR (EU) 2016/679'] },
  security: { primary: 'ISO/IEC 27001:2022', supporting: ['ISO 27002', 'NSM'] },
  ai: { primary: 'ISO/IEC 42001 (AIMS)', supporting: ['EU AI Act (2024/1689)'] },
};

// Map each requirement to a certification phase based on its nature
// This uses sla_category + priority to assign phases heuristically
export function getPhaseForRequirement(
  category: string,
  priority: string,
  slaCategory?: string
): CertificationPhase {
  // Governance/organizational setup → foundation or implementation
  if (category === 'governance' || category === 'legal') {
    if (priority === 'critical') return 'foundation';
    return 'implementation';
  }
  
  // Organizational controls
  if (category === 'organizational') {
    if (slaCategory === 'organization_governance') {
      if (priority === 'critical') return 'foundation';
      return 'implementation';
    }
    if (slaCategory === 'roles_access') return 'foundation';
    return 'operation';
  }
  
  // People controls → foundation/implementation  
  if (category === 'people') return 'implementation';
  
  // Physical controls → operation
  if (category === 'physical') return 'operation';
  
  // Technological controls → operation
  if (category === 'technological') return 'operation';
  
  return 'implementation';
}

export function getMaturityLevel(percent: number): MaturityLevel {
  for (const m of MATURITY_LEVELS) {
    if (percent < m.range[1]) return m.level;
  }
  return 'optimized';
}

export function getPhaseStatus(
  phaseId: CertificationPhase,
  completedPercent: number
): 'completed' | 'in_progress' | 'not_started' {
  const phase = CERTIFICATION_PHASES.find(p => p.id === phaseId);
  if (!phase) return 'not_started';
  
  if (completedPercent >= phase.percentageRange[1]) return 'completed';
  if (completedPercent >= phase.percentageRange[0]) return 'in_progress';
  return 'not_started';
}
