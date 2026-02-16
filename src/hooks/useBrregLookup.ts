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

export interface BrregRolle {
  navn: string;
  rolletype: string;
}

interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  naeringskode1?: {
    kode: string;
    beskrivelse: string;
  };
  forretningsadresse?: {
    kommune: string;
    poststed: string;
  };
}

// Map Brønnøysund industry codes to our internal industry values
const mapNaeringskodeToIndustry = (kode: string, beskrivelse: string): { id: string; label: string } => {
  const lowerBeskrivelse = beskrivelse.toLowerCase();
  
  if (kode.startsWith("35") || lowerBeskrivelse.includes("energi") || lowerBeskrivelse.includes("kraft")) {
    return { id: "energi", label: "Energi" };
  }
  if (kode.startsWith("86") || kode.startsWith("87") || kode.startsWith("88") || 
      lowerBeskrivelse.includes("helse") || lowerBeskrivelse.includes("medisin")) {
    return { id: "helse", label: "Helse" };
  }
  if (kode.startsWith("64") || kode.startsWith("65") || kode.startsWith("66") ||
      lowerBeskrivelse.includes("finans") || lowerBeskrivelse.includes("bank") || 
      lowerBeskrivelse.includes("forsikring")) {
    return { id: "finans", label: "Finans" };
  }
  if (kode.startsWith("84") || lowerBeskrivelse.includes("offentlig") || 
      lowerBeskrivelse.includes("forvaltning") || lowerBeskrivelse.includes("kommune")) {
    return { id: "offentlig", label: "Offentlig sektor" };
  }
  if (kode.startsWith("62") || kode.startsWith("63") || kode.startsWith("58") ||
      lowerBeskrivelse.includes("programvare") || lowerBeskrivelse.includes("it-") ||
      lowerBeskrivelse.includes("data") || lowerBeskrivelse.includes("software")) {
    return { id: "saas", label: "Tech / SaaS" };
  }
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
  const [searchResults, setSearchResults] = useState<BrregSearchResult[]>([]);
  const [roles, setRoles] = useState<BrregRolle[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const lookupByOrgNumber = useCallback(async (orgNumber: string): Promise<BrregSuggestion | null> => {
    const cleanOrgNumber = orgNumber.replace(/[\s-]/g, "");
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

  const searchByName = useCallback(async (name: string): Promise<BrregSearchResult[]> => {
    if (!name || name.trim().length < 2) {
      setSearchResults([]);
      return [];
    }

    setIsLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(name.trim())}&size=5`
      );

      if (!response.ok) {
        setError("Kunne ikke søke i Brønnøysundregistrene");
        return [];
      }

      const data = await response.json();
      const results: BrregSearchResult[] = (data._embedded?.enheter || []).map((e: any) => ({
        organisasjonsnummer: e.organisasjonsnummer,
        navn: e.navn,
        naeringskode1: e.naeringskode1,
        forretningsadresse: e.forretningsadresse,
      }));

      setSearchResults(results);
      return results;
    } catch (err) {
      console.error("Error searching Brønnøysund:", err);
      setError("Nettverksfeil ved søk mot Brønnøysundregistrene");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const lookupRoller = useCallback(async (orgNumber: string): Promise<BrregRolle[]> => {
    const cleanOrgNumber = orgNumber.replace(/[\s-]/g, "");
    if (!/^\d{9}$/.test(cleanOrgNumber)) {
      setRolesError("Ugyldig organisasjonsnummer");
      return [];
    }

    setRolesLoading(true);
    setRolesError(null);
    setRoles([]);

    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter/${cleanOrgNumber}/roller`
      );

      if (!response.ok) {
        setRolesError("Kunne ikke hente roller fra Brønnøysundregistrene");
        return [];
      }

      const data = await response.json();
      const extractedRoles: BrregRolle[] = [];

      // Parse rollegrupper to find Daglig leder and Styrets leder
      for (const gruppe of data.rollegrupper || []) {
        for (const roller of gruppe.roller || []) {
          const roleType = roller.type?.beskrivelse || "";
          
          if (roleType === "Daglig leder/ adm. direktør" || roleType === "Daglig leder/adm.direktør" || roleType.toLowerCase().includes("daglig leder")) {
            const person = roller.person;
            if (person) {
              extractedRoles.push({
                navn: `${person.navn?.fornavn || ""} ${person.navn?.etternavn || ""}`.trim(),
                rolletype: "Daglig leder",
              });
            }
          }
          
          if (roleType === "Styrets leder" || roleType.toLowerCase().includes("styrets leder")) {
            const person = roller.person;
            if (person) {
              extractedRoles.push({
                navn: `${person.navn?.fornavn || ""} ${person.navn?.etternavn || ""}`.trim(),
                rolletype: "Styrets leder",
              });
            }
          }
        }
      }

      setRoles(extractedRoles);
      return extractedRoles;
    } catch (err) {
      console.error("Error fetching roles from Brønnøysund:", err);
      setRolesError("Nettverksfeil ved henting av roller");
      return [];
    } finally {
      setRolesLoading(false);
    }
  }, []);

  const clearSuggestion = useCallback(() => {
    setSuggestion(null);
    setRawData(null);
    setError(null);
    setSearchResults([]);
    setRoles([]);
    setRolesError(null);
  }, []);

  return {
    lookupByOrgNumber,
    searchByName,
    lookupRoller,
    clearSuggestion,
    suggestion,
    rawData,
    searchResults,
    roles,
    rolesLoading,
    rolesError,
    isLoading,
    error,
  };
}
