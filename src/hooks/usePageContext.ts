import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  steps?: {
    instruction: string;
    selector?: string;
  }[];
}

export interface PageContext {
  currentRoute: string;
  pageName: string;
  availableActions: string[];
  pageDescription: string;
  demoScenarios: DemoScenario[];
}

// Demo scenarios with full details
const DEMO_SCENARIOS: Record<string, DemoScenario> = {
  "add-asset": {
    id: "add-asset",
    title: "Legg til en eiendel",
    description: "Lær hvordan du registrerer systemer, leverandører og andre eiendeler",
    steps: [
      { instruction: "Klikk på '+ Ny eiendel' knappen", selector: "[data-demo='add-asset-button']" },
      { instruction: "Velg type eiendel du vil legge til", selector: "[data-demo='asset-type-select']" },
      { instruction: "Fyll inn navn og beskrivelse", selector: "[data-demo='asset-form']" },
      { instruction: "Klikk 'Lagre' for å fullføre", selector: "[data-demo='save-button']" }
    ]
  },
  "gdpr-gap": {
    id: "gdpr-gap",
    title: "GDPR Gap-analyse",
    description: "Forstå hvordan du identifiserer mangler i GDPR-etterlevelsen",
    steps: [
      { instruction: "Se oversikt over compliance-status", selector: "[data-demo='compliance-widget']" },
      { instruction: "Klikk for å se detaljer om GDPR", selector: "[data-demo='gdpr-card']" },
      { instruction: "Gjennomgå identifiserte gap", selector: "[data-demo='gap-list']" }
    ]
  },
  "compliance-report": {
    id: "compliance-report",
    title: "Generer etterlevelsesrapport",
    description: "Lag en rapport for styret eller tilsyn",
    steps: [
      { instruction: "Gå til Rapporter-siden", selector: "[data-demo='reports-nav']" },
      { instruction: "Velg rapporttype", selector: "[data-demo='report-type']" },
      { instruction: "Konfigurer rapporten", selector: "[data-demo='report-config']" },
      { instruction: "Last ned eller del rapporten", selector: "[data-demo='report-download']" }
    ]
  },
  "work-areas": {
    id: "work-areas",
    title: "Organiser arbeidsområder",
    description: "Strukturer organisasjonen for bedre oversikt",
    steps: [
      { instruction: "Se eksisterende arbeidsområder", selector: "[data-demo='work-areas-list']" },
      { instruction: "Legg til et nytt arbeidsområde", selector: "[data-demo='add-work-area']" },
      { instruction: "Tilknytt systemer og prosesser", selector: "[data-demo='work-area-systems']" }
    ]
  },
  "getting-started": {
    id: "getting-started",
    title: "Kom i gang med Mynder",
    description: "En rask introduksjon til plattformen",
    steps: [
      { instruction: "Dette er dashbordet - din oversikt over alt", selector: "[data-demo='dashboard']" },
      { instruction: "Her ser du compliance-status", selector: "[data-demo='compliance-section']" },
      { instruction: "Sidemenyen gir tilgang til alle funksjoner", selector: "[data-demo='sidebar']" }
    ]
  }
};

const PAGE_CONTEXTS: Record<string, Omit<PageContext, "currentRoute">> = {
  "/": {
    pageName: "Dashboard",
    availableActions: [
      "view-compliance",
      "open-tasks",
      "add-asset",
      "view-risk-overview",
      "generate-report"
    ],
    pageDescription: "Hovedoversikt med widgets for compliance-status, oppgaver, risiko og systemoversikt",
    demoScenarios: [
      DEMO_SCENARIOS["getting-started"],
      DEMO_SCENARIOS["add-asset"],
      DEMO_SCENARIOS["compliance-report"],
      DEMO_SCENARIOS["gdpr-gap"]
    ]
  },
  "/assets": {
    pageName: "Eiendeler",
    availableActions: [
      "add-asset",
      "filter-assets",
      "view-asset-details",
      "delete-asset",
      "export-assets"
    ],
    pageDescription: "Oversikt over alle eiendeler (systemer, leverandører, lokasjoner, etc.) med filtrering og sortering",
    demoScenarios: [DEMO_SCENARIOS["add-asset"]]
  },
  "/work-areas": {
    pageName: "Mine arbeidsområder",
    availableActions: [
      "add-work-area",
      "edit-work-area",
      "view-work-area-systems",
      "view-work-area-protocols"
    ],
    pageDescription: "Organisasjonsstruktur med arbeidsområder som grupperer systemer, protokoller og prosesser",
    demoScenarios: [DEMO_SCENARIOS["work-areas"]]
  },
  "/protocols": {
    pageName: "Behandlingsprotokoller",
    availableActions: [
      "add-protocol",
      "edit-protocol",
      "view-protocol-details",
      "generate-ropa-report"
    ],
    pageDescription: "ROPA - Record of Processing Activities for GDPR-dokumentasjon",
    demoScenarios: [DEMO_SCENARIOS["gdpr-gap"]]
  },
  "/systems": {
    pageName: "Systemer",
    availableActions: [
      "add-system",
      "edit-system",
      "view-system-profile",
      "view-system-vendors"
    ],
    pageDescription: "IT-systemer i bruk med risikovurdering og compliance-status",
    demoScenarios: [DEMO_SCENARIOS["add-asset"]]
  },
  "/tasks": {
    pageName: "Oppgaver",
    availableActions: [
      "view-tasks",
      "filter-tasks",
      "mark-task-complete",
      "assign-task"
    ],
    pageDescription: "Oppgaveliste med prioritering, status og AI-håndtering",
    demoScenarios: []
  },
  "/reports": {
    pageName: "Rapporter",
    availableActions: [
      "generate-gdpr-report",
      "generate-iso-report",
      "generate-nis2-report",
      "export-report"
    ],
    pageDescription: "Generering av rapporter for etterlevelse av ulike standarder",
    demoScenarios: [DEMO_SCENARIOS["compliance-report"], DEMO_SCENARIOS["gdpr-gap"]]
  },
  "/ai-setup": {
    pageName: "AI-oppsett",
    availableActions: [
      "configure-autonomy",
      "view-ai-policies",
      "set-risk-classification"
    ],
    pageDescription: "Konfigurasjon av AI-agentens autonominivå og retningslinjer",
    demoScenarios: []
  },
  "/transparency": {
    pageName: "Åpenhetsloven",
    availableActions: [
      "view-transparency-status",
      "configure-autopilot"
    ],
    pageDescription: "Dokumentasjon for Åpenhetsloven",
    demoScenarios: []
  },
  "/sustainability": {
    pageName: "Bærekraft",
    availableActions: [
      "view-sustainability-mapping",
      "configure-sustainability"
    ],
    pageDescription: "Bærekraftskartlegging og ESG-rapportering",
    demoScenarios: []
  },
  "/onboarding": {
    pageName: "Onboarding",
    availableActions: [
      "complete-onboarding-step",
      "skip-step"
    ],
    pageDescription: "Veiledning for å komme i gang med Mynder",
    demoScenarios: [DEMO_SCENARIOS["getting-started"]]
  },
  "/company-settings": {
    pageName: "Innstillinger",
    availableActions: [
      "edit-company-profile",
      "manage-integrations",
      "view-audit-log"
    ],
    pageDescription: "Bedriftsinnstillinger og konfigurasjon",
    demoScenarios: []
  }
};

export function usePageContext(): PageContext {
  const location = useLocation();
  
  return useMemo(() => {
    const route = location.pathname;
    const contextData = PAGE_CONTEXTS[route] || PAGE_CONTEXTS["/"];
    
    return {
      currentRoute: route,
      ...contextData
    };
  }, [location.pathname]);
}

export function getPageContextForRoute(route: string): PageContext {
  const contextData = PAGE_CONTEXTS[route] || PAGE_CONTEXTS["/"];
  return {
    currentRoute: route,
    ...contextData
  };
}

export function getDemoScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS[id];
}
