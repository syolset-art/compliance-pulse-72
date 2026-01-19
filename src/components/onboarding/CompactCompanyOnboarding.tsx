import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { createDefaultWorkAreas } from "@/hooks/useAutoCreateWorkAreas";
import { Loader2, Search, Check, Building2, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CompactCompanyOnboardingProps {
  onComplete: () => void;
}

interface BrregCompany {
  organisasjonsnummer: string;
  navn: string;
  naeringskode1?: {
    beskrivelse: string;
  };
  antallAnsatte?: number;
  forretningsadresse?: {
    kommune: string;
  };
}

interface BrregSearchResult {
  _embedded?: {
    enheter: BrregCompany[];
  };
}

const mapIndustry = (naeringsbeskrivelse?: string): string => {
  if (!naeringsbeskrivelse) return "Annet";
  const desc = naeringsbeskrivelse.toLowerCase();
  
  if (desc.includes("energi") || desc.includes("kraft") || desc.includes("olje") || desc.includes("gass")) return "Energi";
  if (desc.includes("helse") || desc.includes("sykehus") || desc.includes("lege") || desc.includes("medisin")) return "Helse";
  if (desc.includes("bank") || desc.includes("finans") || desc.includes("forsikring") || desc.includes("invest")) return "Finans";
  if (desc.includes("it") || desc.includes("data") || desc.includes("program") || desc.includes("teknologi") || desc.includes("software")) return "Teknologi";
  if (desc.includes("offentlig") || desc.includes("kommune") || desc.includes("stat") || desc.includes("forvaltning")) return "Offentlig";
  
  return "Annet";
};

const mapEmployeeRange = (antall?: number): string => {
  if (!antall || antall === 0) return "";
  if (antall <= 10) return "1-10";
  if (antall <= 50) return "11-50";
  if (antall <= 200) return "51-200";
  if (antall <= 500) return "201-500";
  if (antall <= 1000) return "501-1000";
  return "1000+";
};

export const CompactCompanyOnboarding = ({ onComplete }: CompactCompanyOnboardingProps) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<BrregCompany[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [companyFound, setCompanyFound] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    orgNumber: "",
    industry: "",
    employees: "",
    kommune: ""
  });

  const searchBrreg = async () => {
    const trimmedName = companyName.trim();
    
    if (trimmedName.length < 2) {
      toast.error("Skriv inn minst 2 tegn for å søke");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setSearchResults([]);
    
    try {
      const response = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(trimmedName)}&size=10`
      );
      
      if (!response.ok) {
        toast.error("Kunne ikke søke i Brønnøysundregistrene");
        return;
      }

      const data: BrregSearchResult = await response.json();
      const companies = data._embedded?.enheter || [];
      
      if (companies.length === 0) {
        toast.info("Fant ingen bedrifter med dette navnet");
      } else if (companies.length === 1) {
        // Automatically select if only one result
        selectCompany(companies[0]);
      } else {
        setSearchResults(companies);
        toast.success(`Fant ${companies.length} bedrifter`);
      }
    } catch (error) {
      console.error("Brreg search error:", error);
      toast.error("Kunne ikke søke i Brønnøysundregistrene");
    } finally {
      setIsSearching(false);
    }
  };

  const selectCompany = (company: BrregCompany) => {
    setFormData({
      name: company.navn,
      orgNumber: company.organisasjonsnummer,
      industry: mapIndustry(company.naeringskode1?.beskrivelse),
      employees: mapEmployeeRange(company.antallAnsatte),
      kommune: company.forretningsadresse?.kommune || ""
    });
    setCompanyFound(true);
    setSearchResults([]);
    toast.success(`Valgte ${company.navn}`);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.industry) {
      toast.error("Fyll ut påkrevde felt");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("company_profile")
        .insert({
          name: formData.name,
          org_number: formData.orgNumber || null,
          industry: formData.industry,
          employees: formData.employees || null
        });

      if (error) throw error;

      // Update onboarding_progress
      await supabase
        .from("onboarding_progress")
        .upsert({ id: "default", company_info_completed: true });

      // Auto-create default work areas based on industry
      await createDefaultWorkAreas(formData.industry);

      toast.success("Selskapsinformasjon lagret!");
      onComplete();
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast.error("Kunne ikke lagre selskapsinformasjon");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchBrreg();
    }
  };

  const resetSearch = () => {
    setCompanyFound(false);
    setHasSearched(false);
    setSearchResults([]);
    setCompanyName("");
    setFormData({
      name: "",
      orgNumber: "",
      industry: "",
      employees: "",
      kommune: ""
    });
  };

  // Show search results for selection
  if (searchResults.length > 0) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <p className="text-sm font-medium text-foreground">
            Velg riktig bedrift
          </p>
          <p className="text-xs text-muted-foreground">
            Fant {searchResults.length} treff for "{companyName}"
          </p>
        </div>
        
        <ScrollArea className="h-[240px] pr-2">
          <div className="space-y-2">
            {searchResults.map((company) => (
              <button
                key={company.organisasjonsnummer}
                onClick={() => selectCompany(company)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent hover:border-primary/50 transition-all text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {company.navn}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Org.nr: {company.organisasjonsnummer}
                    {company.forretningsadresse?.kommune && ` • ${company.forretningsadresse.kommune}`}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </ScrollArea>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetSearch}
          className="w-full"
        >
          Søk på nytt
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!companyFound ? (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-3">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Søk opp selskapet ditt fra Brønnøysundregistrene
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companySearch" className="text-xs font-medium">
              Bedriftsnavn
            </Label>
            <div className="flex gap-2">
              <Input
                id="companySearch"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Skriv inn bedriftsnavn..."
                className="flex-1"
              />
              <Button 
                onClick={searchBrreg} 
                disabled={isSearching || companyName.trim().length < 2}
                size="icon"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {hasSearched && searchResults.length === 0 && !isSearching
                ? "Ingen treff. Prøv et annet søkeord."
                : "Skriv inn bedriftsnavn og trykk søk"
              }
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Company found confirmation */}
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground shrink-0">
                <Check className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground text-sm">{formData.name}</h4>
                <p className="text-xs text-muted-foreground">
                  Org.nr: {formData.orgNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Editable details */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Bransje</Label>
                <p className="text-sm font-medium">{formData.industry}</p>
              </div>
              {formData.employees && (
                <div>
                  <Label className="text-xs text-muted-foreground">Ansatte</Label>
                  <p className="text-sm font-medium">{formData.employees}</p>
                </div>
              )}
            </div>
            {formData.kommune && (
              <div>
                <Label className="text-xs text-muted-foreground">Kommune</Label>
                <p className="text-sm font-medium">{formData.kommune}</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSearch}
              className="flex-1"
            >
              Søk på nytt
            </Button>
            <Button 
              size="sm" 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Bekreft"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
