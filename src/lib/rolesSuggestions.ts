export interface SuggestedRole {
  name: string;
  description: string;
  responsibilities: string[];
  roleKey?: string;
}

export interface CompanyContext {
  industry?: string;
  employees?: string;
  use_cases?: string[];
  team_size?: string;
}

export const suggestRolesForCompany = (context: CompanyContext): SuggestedRole[] => {
  const roles: SuggestedRole[] = [];
  
  if (context.team_size === "bare-meg") {
    return [];
  }
  
  const useCases = context.use_cases || [];
  
  if (useCases.includes("personvern")) {
    roles.push({
      name: "Personvernombud (DPO)",
      description: "Ansvarlig for GDPR-etterlevelse og personvern",
      roleKey: "dpo",
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
      roleKey: "ciso",
      responsibilities: [
        "Risikostyring og -vurdering",
        "Utarbeide sikkerhetspolicyer",
        "Hendelseshåndtering og respons",
        "Sikkerhetsrevisjoner"
      ]
    });
    roles.push({
      name: "Hendelsesansvarlig",
      description: "Håndterer sikkerhets- og personvernhendelser",
      roleKey: "incident_manager",
      responsibilities: [
        "Mottak og klassifisering av hendelser",
        "Koordinere respons og eskalering",
        "NIS2 72-timers rapportering",
        "Hendelseslogg og oppfølging"
      ]
    });
  }
  
  if (useCases.includes("ai-styring")) {
    roles.push({
      name: "AI Governance-ansvarlig",
      description: "Ansvarlig for styring av AI-systemer",
      roleKey: "ai_governance",
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
      roleKey: "esg_officer",
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
      name: "Risikoeier",
      description: "Overordnet ansvar for risikostyring",
      roleKey: "risk_owner",
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
      roleKey: "ciso",
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
      roleKey: "dpo",
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
      roleKey: "compliance_officer",
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
    const hasComplianceRole = roles.some(r => 
      r.name.toLowerCase().includes("compliance") || 
      r.name.toLowerCase().includes("etterlevelse")
    );
    
    if (!hasComplianceRole) {
      roles.push({
        name: "Compliance Manager",
        description: "Overordnet ansvar for etterlevelse",
        roleKey: "compliance_officer",
        responsibilities: [
          "Koordinere compliance-arbeid",
          "Rapportere til ledelsen",
          "Oppfølging av eksterne revisjoner",
          "Policyer og prosedyrer"
        ]
      });
    }

    roles.push({
      name: "Internrevisor",
      description: "Utfører interne revisjoner og kontroller",
      roleKey: "internal_auditor",
      responsibilities: [
        "Planlegge og gjennomføre interne revisjoner",
        "Rapportere funn og anbefalinger",
        "Oppfølging av korrigerende tiltak",
        "ISO 27001 / SOC 2 kontroller"
      ]
    });

    roles.push({
      name: "Leverandøransvarlig",
      description: "Tredjepartsstyring og leverandørvurderinger",
      roleKey: "vendor_manager",
      responsibilities: [
        "DPA-oppfølging",
        "Leverandørvurderinger og due diligence",
        "Kontraktsoppfølging",
        "Underleverandørstyring"
      ]
    });
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
