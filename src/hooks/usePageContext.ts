import { useLocation } from "react-router-dom";
import { useMemo } from "react";

export interface PageContext {
  currentRoute: string;
  pageName: string;
  availableActions: string[];
  pageDescription: string;
  demoScenarios: string[];
}

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
    demoScenarios: ["add-asset", "compliance-report", "gdpr-gap"]
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
    demoScenarios: ["add-asset"]
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
    demoScenarios: ["work-areas"]
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
    demoScenarios: ["gdpr-gap"]
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
    demoScenarios: ["add-asset"]
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
    pageDescription: "Generering av compliance-rapporter for ulike standarder",
    demoScenarios: ["compliance-report", "gdpr-gap"]
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
    demoScenarios: []
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
