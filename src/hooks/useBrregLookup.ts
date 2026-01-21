import { useState, useCallback } from "react";

interface BrregData {
  organisasjonsnummer: string;
  navn: string;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    kommune: string;
    poststed: string;
  };
}

interface BrregSuggestion {
  industry: string;
  industryLabel: string;
  employees: string;
  employeesLabel: string;
}

// Map Brønnøysund industry codes to our internal industry values
const mapNaeringskodeToIndustry = (kode: string, beskrivelse: string): { id: string; label: string } => {
  const lowerBeskrivelse = beskrivelse.toLowerCase();
  
  // Energy sector
  if (kode.startsWith("35") || lowerBeskrivelse.includes("energi") || lowerBeskrivelse.includes("kraft")) {
    return { id: "energi", label: "Energi" };
  }
  
  // Healthcare
  if (kode.startsWith("86") || kode.startsWith("87") || kode.startsWith("88") || 
      lowerBeskrivelse.includes("helse") || lowerBeskrivelse.includes("medisin")) {
    return { id: "helse", label: "Helse" };
  }
  
  // Finance
  if (kode.startsWith("64") || kode.startsWith("65") || kode.startsWith("66") ||
      lowerBeskrivelse.includes("finans") || lowerBeskrivelse.includes("bank") || 
      lowerBeskrivelse.includes("forsikring")) {
    return { id: "finans", label: "Finans" };
  }
  
  // Public sector
  if (kode.startsWith("84") || lowerBeskrivelse.includes("offentlig") || 
      lowerBeskrivelse.includes("forvaltning") || lowerBeskrivelse.includes("kommune")) {
    return { id: "offentlig", label: "Offentlig sektor" };
  }
  
  // Tech / SaaS
  if (kode.startsWith("62") || kode.startsWith("63") || kode.startsWith("58") ||
      lowerBeskrivelse.includes("programvare") || lowerBeskrivelse.includes("it-") ||
      lowerBeskrivelse.includes("data") || lowerBeskrivelse.includes("software")) {
    return { id: "saas", label: "Tech / SaaS" };
  }
  
  // Default
  return { id: "other", label: beskrivelse };
};

// Map employee count to our ranges
const mapEmployeesToRange = (antall: number): { id: string; label: string } => {
  if (antall <= 10) return { id: "1-10", label: "1-10 ansatte" };
  if (antall <= 50) return { id: "11-50", label: "11-50 ansatte" };
  if (antall <= 200) return { id: "51-200", label: "51-200 ansatte" };
  if (antall <= 500) return { id: "201-500", label: "201-500 ansatte" };
  if (antall <= 1000) return { id: "500-1000", label: "500-1000 ansatte" };
  return { id: "1000+", label: "Over 1000 ansatte" };
};

export function useBrregLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<BrregSuggestion | null>(null);
  const [rawData, setRawData] = useState<BrregData | null>(null);

  const lookupByOrgNumber = useCallback(async (orgNumber: string): Promise<BrregSuggestion | null> => {
    // Clean the org number (remove spaces and dashes)
    const cleanOrgNumber = orgNumber.replace(/[\s-]/g, "");
    
    // Validate org number format (9 digits for Norwegian org numbers)
    if (!/^\d{9}$/.test(cleanOrgNumber)) {
      setError("Ugyldig organisasjonsnummer");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrgNumber}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("Fant ikke organisasjon med dette nummeret");
        } else {
          setError("Kunne ikke hente data fra Brønnøysundregistrene");
        }
        return null;
      }

      const data: BrregData = await response.json();
      setRawData(data);

      // Map the data to our format
      const industryMapping = data.naeringskode1 
        ? mapNaeringskodeToIndustry(data.naeringskode1.kode, data.naeringskode1.beskrivelse)
        : { id: "other", label: "Ukjent" };

      const employeesMapping = data.antallAnsatte !== undefined
        ? mapEmployeesToRange(data.antallAnsatte)
        : { id: "", label: "" };

      const result: BrregSuggestion = {
        industry: industryMapping.id,
        industryLabel: industryMapping.label,
        employees: employeesMapping.id,
        employeesLabel: employeesMapping.label,
      };

      setSuggestion(result);
      return result;
    } catch (err) {
      console.error("Error fetching from Brønnøysund:", err);
      setError("Nettverksfeil ved oppslag mot Brønnøysundregistrene");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setRawData(null);
    setError(null);
  }, []);

  return {
    lookupByOrgNumber,
    clearSuggestion,
    suggestion,
    rawData,
    isLoading,
    error,
  };
}
