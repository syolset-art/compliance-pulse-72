import { AppRole } from "@/hooks/useUserRole";

export interface WidgetConfig {
  id: string;
  component: string;
  size: 'small' | 'medium' | 'large' | 'full';
  priority: number;
  showInRoles: AppRole[];
  isPrimary?: boolean;
}

export interface DashboardLayout {
  role: AppRole;
  title: string;
  description: string;
  primaryWidgets: string[];
  secondaryWidgets: string[];
  hiddenWidgets: string[];
}

// All available widgets in the system
export const ALL_WIDGETS: WidgetConfig[] = [
  // Executive widgets
  { id: 'executive-summary', component: 'ExecutiveSummaryWidget', size: 'full', priority: 1, showInRoles: ['daglig_leder'], isPrimary: true },
  { id: 'roi', component: 'ROIWidget', size: 'large', priority: 2, showInRoles: ['daglig_leder'], isPrimary: true },
  { id: 'activity-report', component: 'ActivityReportWidget', size: 'large', priority: 3, showInRoles: ['daglig_leder', 'compliance_ansvarlig'] },
  
  // Privacy widgets
  { id: 'gdpr-health', component: 'GDPRHealthWidget', size: 'full', priority: 1, showInRoles: ['personvernombud'], isPrimary: true },
  { id: 'ropa-status', component: 'ROPAStatusWidget', size: 'medium', priority: 2, showInRoles: ['personvernombud', 'compliance_ansvarlig'] },
  { id: 'ropa-gap', component: 'ROPAGapWidget', size: 'medium', priority: 3, showInRoles: ['personvernombud'] },
  { id: 'third-party', component: 'ThirdPartyWidget', size: 'medium', priority: 4, showInRoles: ['personvernombud', 'compliance_ansvarlig'] },
  { id: 'data-transfer', component: 'DataTransferWidget', size: 'medium', priority: 5, showInRoles: ['personvernombud'] },
  
  // Security widgets
  { id: 'security-posture', component: 'SecurityPostureWidget', size: 'full', priority: 1, showInRoles: ['sikkerhetsansvarlig'], isPrimary: true },
  { id: 'inherent-risk', component: 'InherentRiskWidget', size: 'medium', priority: 2, showInRoles: ['sikkerhetsansvarlig', 'compliance_ansvarlig'] },
  { id: 'controls', component: 'ControlsWidget', size: 'medium', priority: 3, showInRoles: ['sikkerhetsansvarlig'] },
  { id: 'sla', component: 'SLAWidget', size: 'medium', priority: 4, showInRoles: ['sikkerhetsansvarlig', 'daglig_leder'] },
  
  // AI Governance widgets
  { id: 'ai-governance', component: 'AIGovernanceWidget', size: 'full', priority: 1, showInRoles: ['ai_governance'], isPrimary: true },
  { id: 'ai-usage-overview', component: 'AIUsageOverviewWidget', size: 'large', priority: 2, showInRoles: ['ai_governance', 'compliance_ansvarlig'] },
  { id: 'ai-act-compliance', component: 'AIActComplianceWidget', size: 'medium', priority: 3, showInRoles: ['ai_governance', 'compliance_ansvarlig'] },
  
  // Compliance widgets (shared)
  { id: 'domain-compliance', component: 'DomainComplianceWidget', size: 'large', priority: 1, showInRoles: ['compliance_ansvarlig'], isPrimary: true },
  { id: 'status-overview', component: 'StatusOverviewWidget', size: 'medium', priority: 2, showInRoles: ['compliance_ansvarlig', 'daglig_leder', 'operativ_bruker'] },
  { id: 'critical-processes', component: 'CriticalProcessesWidget', size: 'medium', priority: 3, showInRoles: ['compliance_ansvarlig', 'personvernombud'] },
  { id: 'my-regulations', component: 'MyRegulationsWidget', size: 'medium', priority: 4, showInRoles: ['compliance_ansvarlig'] },
  
  // Task widgets (all roles)
  { id: 'critical-tasks', component: 'CriticalTasksWidget', size: 'medium', priority: 5, showInRoles: ['daglig_leder', 'personvernombud', 'sikkerhetsansvarlig', 'compliance_ansvarlig', 'ai_governance', 'operativ_bruker'] },
  { id: 'upcoming-tasks', component: 'UpcomingTasksWidget', size: 'medium', priority: 6, showInRoles: ['operativ_bruker', 'compliance_ansvarlig'] },
  { id: 'task-progress', component: 'TaskProgressWidget', size: 'small', priority: 7, showInRoles: ['daglig_leder', 'compliance_ansvarlig'] },
  
  // System widgets
  { id: 'system-library', component: 'SystemLibraryWidget', size: 'medium', priority: 8, showInRoles: ['sikkerhetsansvarlig', 'compliance_ansvarlig'] },
  { id: 'systems-in-use', component: 'SystemsInUseWidget', size: 'small', priority: 9, showInRoles: ['sikkerhetsansvarlig'] },
  
  // Other widgets
  { id: 'new-features', component: 'NewFeaturesWidget', size: 'small', priority: 10, showInRoles: ['daglig_leder', 'compliance_ansvarlig'] },
];

// Layout configurations per role
export const DASHBOARD_LAYOUTS: Record<AppRole, DashboardLayout> = {
  daglig_leder: {
    role: 'daglig_leder',
    title: 'Ledervisning',
    description: 'Overordnet status, KPI-er og beslutningspunkter',
    primaryWidgets: ['executive-summary', 'roi', 'status-overview', 'critical-tasks'],
    secondaryWidgets: ['activity-report', 'sla', 'task-progress', 'new-features'],
    hiddenWidgets: ['ropa-status', 'ropa-gap', 'controls', 'system-library']
  },
  personvernombud: {
    role: 'personvernombud',
    title: 'Personvernvisning',
    description: 'GDPR-status, behandlingsoversikt og personvernrisikoer',
    primaryWidgets: ['gdpr-health', 'ropa-status', 'ropa-gap', 'critical-tasks'],
    secondaryWidgets: ['third-party', 'data-transfer', 'critical-processes', 'ai-usage-overview'],
    hiddenWidgets: ['roi', 'controls', 'sla', 'activity-report']
  },
  sikkerhetsansvarlig: {
    role: 'sikkerhetsansvarlig',
    title: 'Sikkerhetsvisning',
    description: 'Sikkerhetshendelser, risikoer og kontrollstatus',
    primaryWidgets: ['security-posture', 'inherent-risk', 'controls', 'critical-tasks'],
    secondaryWidgets: ['system-library', 'systems-in-use', 'sla', 'status-overview'],
    hiddenWidgets: ['roi', 'ropa-status', 'third-party', 'activity-report']
  },
  compliance_ansvarlig: {
    role: 'compliance_ansvarlig',
    title: 'Compliance-visning',
    description: 'Balansert oversikt over alle domener og regelverk',
    primaryWidgets: ['domain-compliance', 'status-overview', 'my-regulations', 'critical-tasks'],
    secondaryWidgets: ['ropa-status', 'inherent-risk', 'ai-act-compliance', 'task-progress', 'third-party', 'activity-report'],
    hiddenWidgets: []
  },
  ai_governance: {
    role: 'ai_governance',
    title: 'AI Governance-visning',
    description: 'AI-systemer, risikovurdering og AI Act-etterlevelse',
    primaryWidgets: ['ai-governance', 'ai-usage-overview', 'ai-act-compliance', 'critical-tasks'],
    secondaryWidgets: ['status-overview', 'critical-processes', 'inherent-risk'],
    hiddenWidgets: ['roi', 'ropa-status', 'controls', 'sla']
  },
  operativ_bruker: {
    role: 'operativ_bruker',
    title: 'Min arbeidsflate',
    description: 'Dine oppgaver og relevante systemer',
    primaryWidgets: ['critical-tasks', 'upcoming-tasks', 'status-overview'],
    secondaryWidgets: [],
    hiddenWidgets: ['roi', 'activity-report', 'controls', 'domain-compliance']
  }
};

// Get widgets for a specific role
export function getWidgetsForRole(role: AppRole): {
  primary: WidgetConfig[];
  secondary: WidgetConfig[];
  all: WidgetConfig[];
} {
  const layout = DASHBOARD_LAYOUTS[role];
  const primaryWidgets = layout.primaryWidgets
    .map(id => ALL_WIDGETS.find(w => w.id === id))
    .filter(Boolean) as WidgetConfig[];
  
  const secondaryWidgets = layout.secondaryWidgets
    .map(id => ALL_WIDGETS.find(w => w.id === id))
    .filter(Boolean) as WidgetConfig[];

  return {
    primary: primaryWidgets,
    secondary: secondaryWidgets,
    all: [...primaryWidgets, ...secondaryWidgets]
  };
}

// Get all roles that can see a specific widget
export function getRolesForWidget(widgetId: string): AppRole[] {
  const widget = ALL_WIDGETS.find(w => w.id === widgetId);
  return widget?.showInRoles || [];
}
