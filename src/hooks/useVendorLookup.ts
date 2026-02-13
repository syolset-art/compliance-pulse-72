import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VendorSearchResult {
  source: "brreg" | "cvr" | "bolagsverket" | "internal" | "manual";
  name: string;
  orgNumber: string | null;
  country: string;
  industry: string | null;
  address: string | null;
  employees: number | null;
  url: string | null;
  existingId?: string;
}

// Demo data for Sweden
const swedishCompanies: VendorSearchResult[] = [
  { source: "bolagsverket", name: "Spotify AB", orgNumber: "556703-7485", country: "SE", industry: "Informationsteknik", address: "Stockholm", employees: 9000, url: "https://spotify.com" },
  { source: "bolagsverket", name: "Klarna AB", orgNumber: "556737-0431", country: "SE", industry: "Finansiell verksamhet", address: "Stockholm", employees: 5000, url: "https://klarna.com" },
  { source: "bolagsverket", name: "Ericsson AB", orgNumber: "556056-6258", country: "SE", industry: "Telekommunikation", address: "Stockholm", employees: 100000, url: "https://ericsson.com" },
  { source: "bolagsverket", name: "IKEA AB", orgNumber: "556074-7569", country: "SE", industry: "Detaljhandel", address: "Älmhult", employees: 160000, url: "https://ikea.com" },
];

// Demo data for Denmark
const danishCompanies: VendorSearchResult[] = [
  { source: "cvr", name: "Novo Nordisk A/S", orgNumber: "24256790", country: "DK", industry: "Farmaceutisk industri", address: "Bagsværd", employees: 60000, url: "https://novonordisk.com" },
  { source: "cvr", name: "A.P. Møller - Mærsk A/S", orgNumber: "22756214", country: "DK", industry: "Transport og logistik", address: "København", employees: 110000, url: "https://maersk.com" },
  { source: "cvr", name: "LEGO A/S", orgNumber: "54562519", country: "DK", industry: "Legetøjsfabrikation", address: "Billund", employees: 24000, url: "https://lego.com" },
  { source: "cvr", name: "Vestas Wind Systems A/S", orgNumber: "10403782", country: "DK", industry: "Energiteknologi", address: "Aarhus", employees: 29000, url: "https://vestas.com" },
];

interface BrregSearchResult {
  organisasjonsnummer: string;
  navn: string;
  naeringskode1?: { kode: string; beskrivelse: string };
  antallAnsatte?: number;
  forretningsadresse?: { kommune: string; poststed: string };
  hjemmeside?: string;
}

export function useVendorLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<VendorSearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchBrreg = useCallback(async (query: string): Promise<VendorSearchResult[]> => {
    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(query)}&size=5`
      );
      if (!response.ok) return [];
      const data = await response.json();
      const enheter: BrregSearchResult[] = data._embedded?.enheter || [];
      return enheter.map((e) => ({
        source: "brreg" as const,
        name: e.navn,
        orgNumber: e.organisasjonsnummer,
        country: "NO",
        industry: e.naeringskode1?.beskrivelse || null,
        address: e.forretningsadresse
          ? [e.forretningsadresse.poststed, e.forretningsadresse.kommune].filter(Boolean).join(", ")
          : null,
        employees: e.antallAnsatte ?? null,
        url: e.hjemmeside || null,
      }));
    } catch {
      return [];
    }
  }, []);

  const searchDemoCountry = useCallback((query: string, country: "SE" | "DK"): VendorSearchResult[] => {
    const list = country === "SE" ? swedishCompanies : danishCompanies;
    const q = query.toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, []);

  const searchInternal = useCallback(async (query: string): Promise<VendorSearchResult[]> => {
    try {
      const { data } = await supabase
        .from("assets")
        .select("id, name, country, url, org_number")
        .eq("asset_type", "vendor")
        .ilike("name", `%${query}%`)
        .limit(5);
      return (data || []).map((a) => ({
        source: "internal" as const,
        name: a.name,
        orgNumber: (a as any).org_number || null,
        country: a.country || "NO",
        industry: null,
        address: null,
        employees: null,
        url: a.url || null,
        existingId: a.id,
      }));
    } catch {
      return [];
    }
  }, []);

  const search = useCallback(
    async (query: string, country: "NO" | "SE" | "DK" | "other") => {
      if (!query.trim()) return;
      setIsLoading(true);
      setError(null);
      setResults([]);

      try {
        let registryResults: VendorSearchResult[] = [];

        if (country === "NO") {
          registryResults = await searchBrreg(query);
        } else if (country === "SE") {
          registryResults = searchDemoCountry(query, "SE");
        } else if (country === "DK") {
          registryResults = searchDemoCountry(query, "DK");
        }

        if (registryResults.length > 0) {
          setResults(registryResults);
        } else {
          // Fallback to internal search
          const internalResults = await searchInternal(query);
          setResults(internalResults);
          if (internalResults.length === 0) {
            setError("no_results");
          }
        }
      } catch {
        setError("network_error");
      } finally {
        setIsLoading(false);
      }
    },
    [searchBrreg, searchDemoCountry, searchInternal]
  );

  const searchInternalOnly = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const internalResults = await searchInternal(query);
        setResults(internalResults);
        if (internalResults.length === 0) setError("no_results");
      } finally {
        setIsLoading(false);
      }
    },
    [searchInternal]
  );

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { search, searchInternalOnly, clearResults, results, isLoading, error };
}
