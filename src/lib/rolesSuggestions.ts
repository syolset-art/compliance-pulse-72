export interface SuggestedRole {
  name: string;
  description: string;
  responsibilities: string[];
}

export interface CompanyContext {
  industry?: string;
  employees?: string;
  use_cases?: string[];
  team_size?: string;
}

export const suggestRolesForCompany = (context: CompanyContext): SuggestedRole[] => {
  const roles: SuggestedRole[] = [];
  
  // If single user, no roles needed
  if (context.team_size === "bare-meg") {
    return [];
  }
  
  const useCases = context.use_cases || [];
  
  // Based on use cases
  if (useCases.includes("personvern")) {
    roles.push({
      name: "Personvernombud (DPO)",
      description: "Ansvarlig for GDPR-etterlevelse og personvern",
      responsibilities: [
        "Håndtere personvernforespørsler (innsyn, sletting)",
        "Utføre DPIA for nye behandlinger",
        "Rapportere avvik til Datatilsynet",
        "Opplæring av ansatte i personvern"
      ]
    });
  }
  
  if (useCases.includes("sikkerhet")) {
    roles.push({
      name: "IT-sikkerhetsansvarlig (CISO)",
      description: "Ansvarlig for informasjonssikkerhet",
      responsibilities: [
        "Risikostyring og -vurdering",
        "Utarbeide sikkerhetspolicyer",
        "Hendelseshåndtering og respons",
        "Sikkerhetsrevisjoner"
      ]
    });
  }
  
  if (useCases.includes("ai-styring")) {
    roles.push({
      name: "AI Governance-ansvarlig",
      description: "Ansvarlig for styring av AI-systemer",
      responsibilities: [
        "Overvåke AI-risiko og etterlevelse",
        "Dokumentere AI-systemer iht. AI Act",
        "Vurdere høyrisiko AI-bruk",
        "Etablere retningslinjer for AI-bruk"
      ]
    });
  }
  
  if (useCases.includes("barekraft")) {
    roles.push({
      name: "Bærekraftsansvarlig (ESG)",
      description: "Ansvarlig for bærekraft og ESG-rapportering",
      responsibilities: [
        "ESG-rapportering",
        "Bærekraftsmål og tiltak",
        "Interessentdialog",
        "CSRD-compliance"
      ]
    });
  }
  
  if (useCases.includes("risikostyring")) {
    roles.push({
      name: "Risiko-eier",
      description: "Overordnet ansvar for risikostyring",
      responsibilities: [
        "Identifisere og vurdere risikoer",
        "Rapportere til ledelsen",
        "Følge opp risikoreduserende tiltak",
        "Opprettholde risikoregister"
      ]
    });
  }
  
  // Based on industry
  if (context.industry === "energi") {
    roles.push({
      name: "IKT-sikkerhetsansvarlig (OT)",
      description: "Ansvarlig for sikkerhet i operasjonelle systemer",
      responsibilities: [
        "SCADA- og OT-sikkerhet",
        "NVE-rapportering",
        "Kraftberedskap",
        "Sektorspesifikke krav"
      ]
    });
  }
  
  if (context.industry === "helse") {
    roles.push({
      name: "Personvernrådgiver Helse",
      description: "Spesialisert på helseopplysninger",
      responsibilities: [
        "Helseregisterloven",
        "Pasientjournalloven",
        "Samtykkeforvaltning",
        "Helseforskning og etikk"
      ]
    });
  }
  
  if (context.industry === "finans") {
    roles.push({
      name: "Compliance Officer",
      description: "Ansvarlig for finansiell compliance",
      responsibilities: [
        "Finanstilsynet-rapportering",
        "AML/KYC",
        "DORA-compliance",
        "Internkontroll"
      ]
    });
  }
  
  // Based on company size
  const largeCompany = context.employees === "201-500" || 
                       context.employees === "500-1000" || 
                       context.employees === "1000+" ||
                       context.employees === "established" ||
                       context.employees === "regulated";
  
  const mediumTeam = context.team_size === "middels" || context.team_size === "stort";
  
  if (largeCompany || mediumTeam) {
    // Only add if not already present
    const hasComplianceRole = roles.some(r => 
      r.name.toLowerCase().includes("compliance") || 
      r.name.toLowerCase().includes("etterlevelse")
    );
    
    if (!hasComplianceRole) {
      roles.push({
        name: "Compliance Manager",
        description: "Overordnet ansvar for etterlevelse",
        responsibilities: [
          "Koordinere compliance-arbeid",
          "Rapportere til ledelsen",
          "Oppfølging av eksterne revisjoner",
          "Policyer og prosedyrer"
        ]
      });
    }
  }
  
  return roles;
};

export const useCaseOptions = [
  { id: "personvern", name: "Personvern (GDPR)", description: "Håndtere personopplysninger og DPA-er" },
  { id: "sikkerhet", name: "Informasjonssikkerhet", description: "ISO 27001, NSM og sikkerhetsstyring" },
  { id: "ai-styring", name: "AI-styring", description: "AI Act og ansvarlig AI-bruk" },
  { id: "barekraft", name: "Bærekraft (ESG)", description: "ESG-rapportering og CSRD" },
  { id: "risikostyring", name: "Risikostyring", description: "Enterprise risk management" },
];

export const teamSizeOptions = [
  { id: "bare-meg", name: "Bare meg", description: "Én person bruker plattformen" },
  { id: "lite", name: "Lite team (2-5)", description: "Et lite team med definerte roller" },
  { id: "middels", name: "Middels team (6-20)", description: "Flere team og avdelinger" },
  { id: "stort", name: "Stort team (20+)", description: "Mange brukere og kompleks struktur" },
];
