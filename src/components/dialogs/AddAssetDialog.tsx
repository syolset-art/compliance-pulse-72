import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Server, 
  Building2, 
  MapPin, 
  Network, 
  Plug, 
  HardDrive, 
  Database, 
  FileText,
  LucideIcon,
  Sparkles,
  Check,
  Loader2,
  Upload,
  Link2,
  FileSpreadsheet,
  ArrowLeft,
  Zap,
  AlertTriangle,
  Building,
  Users,
  TrendingUp,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AssetTypeTemplate {
  asset_type: string;
  display_name: string;
  display_name_plural: string;
  icon: string;
  color: string;
}

interface AssetSuggestion {
  name: string;
  vendor?: string;
  description: string;
  category: string;
  risk_level: string;
  criticality: string;
  reason: string;
  industryRelevant?: boolean;
}

interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  employees: string | null;
  maturity: string | null;
  org_number: string | null;
}

interface AddAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssetAdded: () => void;
  assetTypeTemplates: AssetTypeTemplate[];
}

const iconMap: Record<string, LucideIcon> = {
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
};

type Step = "select-type" | "select-method" | "ai-suggestions" | "manual-form" | "upload" | "connect";

export function AddAssetDialog({ open, onOpenChange, onAssetAdded, assetTypeTemplates }: AddAssetDialogProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<Step>("select-type");
  const [selectedType, setSelectedType] = useState<string>("");
  const [suggestions, setSuggestions] = useState<AssetSuggestion[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [existingAssetNames, setExistingAssetNames] = useState<string[]>([]);
  const [workAreasCount, setWorkAreasCount] = useState(0);
  
  const [formData, setFormData] = useState({
    asset_type: "",
    name: "",
    description: "",
    vendor: "",
    category: "",
    risk_level: "medium",
    criticality: "medium",
  });

  // Fetch company profile and existing data on mount
  useEffect(() => {
    const fetchCompanyData = async () => {
      const [profileRes, assetsRes, workAreasRes] = await Promise.all([
        supabase.from("company_profile").select("*").single(),
        supabase.from("assets").select("name"),
        supabase.from("work_areas").select("id")
      ]);
      
      if (profileRes.data) setCompanyProfile(profileRes.data);
      if (assetsRes.data) setExistingAssetNames(assetsRes.data.map(a => a.name.toLowerCase()));
      if (workAreasRes.data) setWorkAreasCount(workAreasRes.data.length);
    };
    
    fetchCompanyData();
  }, []);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setStep("select-type");
      setSelectedType("");
      setSuggestions([]);
      setSelectedSuggestions(new Set());
      setFormData({
        asset_type: "",
        name: "",
        description: "",
        vendor: "",
        category: "",
        risk_level: "medium",
        criticality: "medium",
      });
    }
  }, [open]);

  const handleTypeSelect = (assetType: string) => {
    setSelectedType(assetType);
    setFormData(prev => ({ ...prev, asset_type: assetType }));
    setStep("select-method");
  };

  // Industry-specific suggestions for prototype
  const getSyntheticSuggestionsByIndustry = (assetType: string, industry: string): AssetSuggestion[] => {
    // Energy-specific systems
    const energySystems: AssetSuggestion[] = [
      { name: "SCADA", vendor: "Siemens", description: "Overvåking og styring av kraftproduksjon og distribusjon", category: "OT", risk_level: "high", criticality: "critical", reason: "Kritisk for kraftstyring", industryRelevant: true },
      { name: "Elhub", vendor: "Statnett", description: "Nasjonal datahub for målerdata og strømmarked", category: "Bransjesystem", risk_level: "medium", criticality: "critical", reason: "Lovpålagt for energiselskaper", industryRelevant: true },
      { name: "DMS", vendor: "ABB", description: "Distribution Management System for nettdrift", category: "Nettdrift", risk_level: "high", criticality: "critical", reason: "Styrer strømnettet", industryRelevant: true },
      { name: "EAM/Vedlikeholdssystem", vendor: "IFS", description: "Enterprise Asset Management for vedlikehold av infrastruktur", category: "Vedlikehold", risk_level: "medium", criticality: "high", reason: "Drift av kraftanlegg", industryRelevant: true },
      { name: "NIS (Nettinformasjonssystem)", vendor: "Powel", description: "Kartlegging og dokumentasjon av strømnett", category: "GIS", risk_level: "medium", criticality: "high", reason: "Oversikt over infrastruktur", industryRelevant: true },
      { name: "Microsoft 365", vendor: "Microsoft", description: "Produktivitetsplattform med e-post, dokumenthåndtering og samarbeid", category: "Produktivitet", risk_level: "low", criticality: "high", reason: "Standard kontorverktøy" },
      { name: "SAP S/4HANA", vendor: "SAP", description: "ERP-system for økonomi, logistikk og forretningsprosesser", category: "ERP", risk_level: "medium", criticality: "critical", reason: "Kjernesystem for økonomi" },
      { name: "HMS Portal", vendor: "Synergi", description: "Sikkerhetsrapportering og avvikshåndtering", category: "HMS", risk_level: "medium", criticality: "high", reason: "Påkrevd for kraftbransjen", industryRelevant: true },
    ];

    const energyVendors: AssetSuggestion[] = [
      { name: "ABB", vendor: "", description: "Leverandør av SCADA, DMS og kraftutstyr", category: "OT-leverandør", risk_level: "medium", criticality: "critical", reason: "Kritisk teknologipartner", industryRelevant: true },
      { name: "Siemens Energy", vendor: "", description: "Turbiner, transformatorer og styringssystemer", category: "OT-leverandør", risk_level: "medium", criticality: "critical", reason: "Kjerneleverandør kraft", industryRelevant: true },
      { name: "Powel/Volue", vendor: "", description: "Energihandel og nettplanlegging", category: "Software", risk_level: "medium", criticality: "high", reason: "Bransjestandard i Norge", industryRelevant: true },
      { name: "TietoEvry", vendor: "", description: "IT-drift og systemutvikling", category: "IT-leverandør", risk_level: "medium", criticality: "high", reason: "Kritisk for IT-drift" },
      { name: "Capgemini", vendor: "", description: "Systemintegrasjon og rådgivning", category: "Konsulent", risk_level: "low", criticality: "medium", reason: "Prosjektleveranser" },
    ];

    const energyHardware: AssetSuggestion[] = [
      { name: "RTU (Remote Terminal Unit)", vendor: "ABB", description: "Fjernstyring av kraftstasjoner og transformatorer", category: "OT", risk_level: "high", criticality: "critical", reason: "Kritisk for nettdrift", industryRelevant: true },
      { name: "Smart Meters", vendor: "Kamstrup", description: "Avanserte strømmålere (AMS)", category: "Måleutstyr", risk_level: "medium", criticality: "high", reason: "Lovpålagt måleutstyr", industryRelevant: true },
      { name: "Industrial Switch", vendor: "Cisco", description: "Nettverksutstyr for driftsmiljø", category: "OT-nettverk", risk_level: "high", criticality: "high", reason: "Kommunikasjon i felt", industryRelevant: true },
      { name: "Dell PowerEdge R750", vendor: "Dell", description: "Rack-server for datacenter", category: "Server", risk_level: "medium", criticality: "high", reason: "Kjører applikasjoner" },
      { name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen brannmur for IT/OT-segmentering", category: "Sikkerhet", risk_level: "high", criticality: "critical", reason: "Beskytter OT-nett", industryRelevant: true },
    ];

    const energyLocations: AssetSuggestion[] = [
      { name: "Kontrollrom", vendor: "", description: "Sentralt driftsenter for nettovervåking", category: "Driftssenter", risk_level: "high", criticality: "critical", reason: "Kjernen i nettdrift", industryRelevant: true },
      { name: "Transformatorstasjon", vendor: "", description: "Høyspent transformator for distribusjon", category: "Kraftanlegg", risk_level: "high", criticality: "critical", reason: "Kritisk infrastruktur", industryRelevant: true },
      { name: "Hovedkontor Bergen", vendor: "", description: "Administrasjon og ledelse", category: "Kontor", risk_level: "low", criticality: "high", reason: "Hovedlokasjon" },
      { name: "Datacenter", vendor: "Green Mountain", description: "Datasenter for IT-systemer", category: "Datasenter", risk_level: "high", criticality: "critical", reason: "Kritisk IT-infrastruktur" },
    ];

    // Default generic suggestions
    const genericSuggestions: Record<string, AssetSuggestion[]> = {
      system: [
        { name: "Microsoft 365", vendor: "Microsoft", description: "Produktivitetsplattform med e-post og samarbeid", category: "Produktivitet", risk_level: "low", criticality: "high", reason: "Standard kontorverktøy" },
        { name: "SAP S/4HANA", vendor: "SAP", description: "ERP-system for økonomi og logistikk", category: "ERP", risk_level: "medium", criticality: "critical", reason: "Kjernesystem" },
        { name: "Salesforce CRM", vendor: "Salesforce", description: "Kundeoppfølging og salgsprosesser", category: "CRM", risk_level: "low", criticality: "medium", reason: "Viktig for kundedata" },
        { name: "ServiceNow", vendor: "ServiceNow", description: "IT Service Management", category: "ITSM", risk_level: "medium", criticality: "high", reason: "Støtter IT-drift" },
      ],
      vendor: [
        { name: "TietoEvry", vendor: "", description: "IT-drift og systemutvikling", category: "IT-leverandør", risk_level: "medium", criticality: "high", reason: "Kritisk for IT-drift" },
        { name: "Atea", vendor: "", description: "Hardware og infrastruktur", category: "IT-leverandør", risk_level: "low", criticality: "medium", reason: "Utstyrsleverandør" },
        { name: "Accenture", vendor: "", description: "Konsulent for digital transformasjon", category: "Konsulent", risk_level: "low", criticality: "medium", reason: "Strategiske prosjekter" },
      ],
      hardware: [
        { name: "Dell PowerEdge R750", vendor: "Dell", description: "Rack-server for datacenter", category: "Server", risk_level: "medium", criticality: "high", reason: "Kjører applikasjoner" },
        { name: "Cisco Catalyst 9300", vendor: "Cisco", description: "Enterprise nettverkssvitsj", category: "Nettverk", risk_level: "medium", criticality: "high", reason: "Backbone" },
        { name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen brannmur", category: "Sikkerhet", risk_level: "high", criticality: "critical", reason: "Nettverkssikkerhet" },
      ],
      network: [
        { name: "Azure Virtual Network", vendor: "Microsoft", description: "Skybasert nettverk", category: "Sky-nettverk", risk_level: "medium", criticality: "high", reason: "Sky-infrastruktur" },
        { name: "Cisco SD-WAN", vendor: "Cisco", description: "Software-defined WAN", category: "WAN", risk_level: "medium", criticality: "high", reason: "Forbinder lokasjoner" },
      ],
      location: [
        { name: "Hovedkontor", vendor: "", description: "Administrasjon og ledelse", category: "Kontor", risk_level: "low", criticality: "high", reason: "Hovedlokasjon" },
        { name: "Datacenter", vendor: "Green Mountain", description: "Primært datasenter", category: "Datasenter", risk_level: "high", criticality: "critical", reason: "Kritisk infrastruktur" },
      ],
      integration: [
        { name: "Azure API Management", vendor: "Microsoft", description: "API gateway", category: "API", risk_level: "medium", criticality: "high", reason: "Sentral API-styring" },
        { name: "MuleSoft Anypoint", vendor: "Salesforce", description: "Integrasjonsplattform", category: "Integrasjon", risk_level: "medium", criticality: "high", reason: "Systemintegrasjon" },
      ],
    };

    // Return industry-specific or generic based on industry
    if (industry === "energi") {
      switch (assetType) {
        case "system": return energySystems;
        case "vendor": return energyVendors;
        case "hardware": return energyHardware;
        case "location": return energyLocations;
        default: return genericSuggestions[assetType] || genericSuggestions.system;
      }
    }

    return genericSuggestions[assetType] || genericSuggestions.system;
  };

  const fetchAISuggestions = async () => {
    setIsLoadingSuggestions(true);
    setStep("ai-suggestions");
    
    // Simulate AI processing delay for realistic prototype feel
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    const industry = companyProfile?.industry || "general";
    let suggestions = getSyntheticSuggestionsByIndustry(selectedType, industry);
    
    // Filter out existing assets
    suggestions = suggestions.filter(s => 
      !existingAssetNames.includes(s.name.toLowerCase())
    );
    
    setSuggestions(suggestions);
    setIsLoadingSuggestions(false);
  };

  const toggleSuggestion = (index: number) => {
    setSelectedSuggestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const createFromSuggestions = async () => {
    if (selectedSuggestions.size === 0) return;
    
    setIsLoading(true);
    try {
      const assetsToCreate = Array.from(selectedSuggestions).map(index => {
        const suggestion = suggestions[index];
        return {
          asset_type: selectedType,
          name: suggestion.name,
          description: suggestion.description,
          vendor: suggestion.vendor || null,
          category: suggestion.category,
          risk_level: suggestion.risk_level,
          criticality: suggestion.criticality,
          lifecycle_status: "active",
        };
      });

      const { error } = await supabase.from("assets").insert(assetsToCreate);
      if (error) throw error;

      toast.success(`${selectedSuggestions.size} eiendeler lagt til`);
      onAssetAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating assets:", error);
      toast.error("Kunne ikke opprette eiendeler");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.asset_type) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.from("assets").insert({
        asset_type: formData.asset_type,
        name: formData.name,
        description: formData.description || null,
        vendor: formData.vendor || null,
        category: formData.category || null,
        risk_level: formData.risk_level,
        criticality: formData.criticality,
        lifecycle_status: "active",
      });

      if (error) throw error;

      toast.success(t("assets.addSuccess"));
      onAssetAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding asset:", error);
      toast.error(t("assets.addError"));
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTemplate = assetTypeTemplates.find(t => t.asset_type === selectedType);
  const IconComponent = selectedTemplate ? (iconMap[selectedTemplate.icon] || Server) : Server;

  const getStepProgress = () => {
    switch (step) {
      case "select-type": return 25;
      case "select-method": return 50;
      case "ai-suggestions": return 75;
      case "manual-form": return 75;
      case "upload": return 75;
      case "connect": return 75;
      default: return 0;
    }
  };

  const goBack = () => {
    switch (step) {
      case "select-method":
        setStep("select-type");
        setSelectedType("");
        break;
      case "ai-suggestions":
      case "manual-form":
      case "upload":
      case "connect":
        setStep("select-method");
        setSuggestions([]);
        setSelectedSuggestions(new Set());
        break;
    }
  };

  // Step 1: Select asset type
  const renderSelectType = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Velg type eiendel du vil legge til
      </p>
      <div className="grid grid-cols-4 gap-3">
        {assetTypeTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Server;
          return (
            <button
              key={template.asset_type}
              type="button"
              onClick={() => handleTypeSelect(template.asset_type)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
            >
              <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-sm font-medium text-center">{template.display_name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 2: Select method
  const renderSelectMethod = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-lg bg-primary/10">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">{selectedTemplate?.display_name}</p>
          <p className="text-sm text-muted-foreground">Hvordan vil du legge til?</p>
        </div>
      </div>

      <div className="grid gap-3">
        {/* AI Suggestions - Primary option */}
        <button
          onClick={fetchAISuggestions}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">AI-forslag fra Mynder</p>
            <p className="text-sm text-muted-foreground mt-1">
              Få intelligente forslag basert på din bransje og selskapsprofil
            </p>
            <div className="flex items-center gap-2 mt-2 text-xs text-primary">
              <Zap className="h-3 w-3" />
              <span>Anbefalt</span>
            </div>
          </div>
        </button>

        {/* Upload Excel */}
        <button
          onClick={() => setStep("upload")}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Last opp Excel-liste</p>
            <p className="text-sm text-muted-foreground mt-1">
              Importer fra en eksisterende Excel-fil med {selectedTemplate?.display_name_plural?.toLowerCase()}
            </p>
          </div>
        </button>

        {/* Connect to source */}
        <button
          onClick={() => setStep("connect")}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <Link2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Koble til datakilde</p>
            <p className="text-sm text-muted-foreground mt-1">
              Hent fra SharePoint, Azure AD, eller andre integrasjoner
            </p>
          </div>
        </button>

        {/* Manual entry */}
        <button
          onClick={() => setStep("manual-form")}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/50 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">Legg til manuelt</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fyll ut skjema for én {selectedTemplate?.display_name?.toLowerCase()} om gangen
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  // Step 3a: AI Suggestions
  const renderAISuggestions = () => {
    const getIndustryLabel = (industry: string) => {
      const labels: Record<string, string> = {
        energi: "Energibransjen",
        technology: "Teknologi",
        finance: "Finans",
        healthcare: "Helse",
        retail: "Varehandel",
      };
      return labels[industry] || industry;
    };

    const getEmployeeLabel = (employees: string | null) => {
      const labels: Record<string, string> = {
        "1-10": "1-10 ansatte",
        "11-50": "11-50 ansatte",
        "51-200": "51-200 ansatte",
        "201-500": "201-500 ansatte",
        "500+": "500+ ansatte",
      };
      return employees ? labels[employees] || employees : null;
    };

    return (
      <div className="space-y-4">
        {/* Context panel - "Basert på" */}
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">
              Forslagene er basert på:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {companyProfile?.name && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                <Building className="h-3 w-3" />
                {companyProfile.name}
              </span>
            )}
            {companyProfile?.industry && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                <TrendingUp className="h-3 w-3" />
                {getIndustryLabel(companyProfile.industry)}
              </span>
            )}
            {companyProfile?.employees && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                <Users className="h-3 w-3" />
                {getEmployeeLabel(companyProfile.employees)}
              </span>
            )}
            {existingAssetNames.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {existingAssetNames.length} eiendeler registrert
              </span>
            )}
            {workAreasCount > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                {workAreasCount} arbeidsområder
              </span>
            )}
          </div>
        </div>

        {isLoadingSuggestions ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-center">
              <p className="font-medium">
                Analyserer {companyProfile?.name || "din virksomhet"}...
              </p>
              <p className="text-sm text-muted-foreground">
                Finner {selectedTemplate?.display_name_plural?.toLowerCase()} for {getIndustryLabel(companyProfile?.industry || "")}
              </p>
            </div>
          </div>
        ) : suggestions.length > 0 ? (
          <>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
              {suggestions.map((suggestion, index) => {
                const isSelected = selectedSuggestions.has(index);
                return (
                  <button
                    key={index}
                    onClick={() => toggleSuggestion(index)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{suggestion.name}</p>
                        {suggestion.vendor && (
                          <span className="text-xs text-muted-foreground">• {suggestion.vendor}</span>
                        )}
                        {suggestion.industryRelevant && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                            Energi
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {suggestion.category}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          suggestion.risk_level === "high" ? "bg-destructive/20 text-destructive" :
                          suggestion.risk_level === "medium" ? "bg-orange-500/20 text-orange-500" :
                          "bg-green-500/20 text-green-600"
                        )}>
                          {suggestion.risk_level === "high" ? "Høy risiko" :
                           suggestion.risk_level === "medium" ? "Medium risiko" : "Lav risiko"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => setStep("manual-form")}
                className="text-sm text-primary hover:underline"
              >
                Finner du ikke det du leter etter? Legg til manuelt →
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Ingen forslag tilgjengelig</p>
              <p className="text-sm text-muted-foreground">Alle relevante {selectedTemplate?.display_name_plural?.toLowerCase()} er allerede registrert</p>
            </div>
            <Button onClick={() => setStep("manual-form")} variant="outline">
              Legg til manuelt
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Step 3b: Manual form
  const renderManualForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("assets.name")} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={`Navn på ${selectedTemplate?.display_name?.toLowerCase()}`}
          required
        />
      </div>

      {["system", "hardware", "network"].includes(selectedType) && (
        <div className="space-y-2">
          <Label htmlFor="vendor">{t("assets.vendor")}</Label>
          <Input
            id="vendor"
            value={formData.vendor}
            onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
            placeholder="F.eks. Microsoft, SAP, Oracle"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">{t("assets.category")}</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="F.eks. ERP, CRM, SCADA"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t("assets.riskLevel")}</Label>
          <Select 
            value={formData.risk_level} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, risk_level: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Lav</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">Høy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("assets.criticality")}</Label>
          <Select 
            value={formData.criticality} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, criticality: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Lav</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">Høy</SelectItem>
              <SelectItem value="critical">Kritisk</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("assets.description")}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Beskriv formål og bruksområde..."
          rows={3}
        />
      </div>
    </form>
  );

  // Step 3c: Upload
  const renderUpload = () => (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
        <p className="font-medium">Dra og slipp Excel-fil her</p>
        <p className="text-sm text-muted-foreground mt-1">eller klikk for å velge fil</p>
        <p className="text-xs text-muted-foreground mt-4">.xlsx, .xls, .csv støttes</p>
      </div>

      <div className="p-4 rounded-lg bg-muted/50">
        <p className="text-sm font-medium mb-2">Forventet format:</p>
        <p className="text-xs text-muted-foreground">
          Kolonner: Navn, Leverandør, Kategori, Beskrivelse, Risiko
        </p>
        <Button variant="link" className="px-0 text-xs h-auto mt-2">
          Last ned mal →
        </Button>
      </div>
    </div>
  );

  // Integration options for "Connect to resource"
  const integrationOptions = [
    {
      id: "acronis",
      name: "Acronis",
      description: "Importer enheter fra Acronis Cyber Protect",
      logo: "🛡️",
      bgColor: "bg-[#00D4AA]/20",
      textColor: "text-[#00D4AA]",
      available: true,
      category: "IT-sikkerhet",
    },
    {
      id: "azure-ad",
      name: "Microsoft Entra ID",
      description: "Hent applikasjoner og enheter fra Azure AD",
      logo: "AD",
      bgColor: "bg-[#0078D4]/20",
      textColor: "text-[#0078D4]",
      available: true,
      category: "Identitet",
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      description: "Importer fra SharePoint-lister og dokumentbibliotek",
      logo: "SP",
      bgColor: "bg-[#038387]/20",
      textColor: "text-[#038387]",
      available: true,
      category: "Dokumenter",
    },
    {
      id: "intune",
      name: "Microsoft Intune",
      description: "Importer administrerte enheter fra Intune",
      logo: "📱",
      bgColor: "bg-[#0078D4]/20",
      textColor: "text-[#0078D4]",
      available: true,
      category: "Enhetsadministrasjon",
    },
    {
      id: "servicenow",
      name: "ServiceNow",
      description: "Synkroniser fra ServiceNow CMDB",
      logo: "SN",
      bgColor: "bg-[#81B5A1]/20",
      textColor: "text-[#81B5A1]",
      available: true,
      category: "ITSM",
    },
    {
      id: "qualys",
      name: "Qualys",
      description: "Importer eiendeler fra Qualys sårbarhetsskanning",
      logo: "Q",
      bgColor: "bg-[#ED1C24]/20",
      textColor: "text-[#ED1C24]",
      available: false,
      category: "Sikkerhet",
    },
    {
      id: "crowdstrike",
      name: "CrowdStrike",
      description: "Hent endepunkter fra Falcon-plattformen",
      logo: "🦅",
      bgColor: "bg-[#FC0039]/20",
      textColor: "text-[#FC0039]",
      available: false,
      category: "EDR",
    },
  ];

  // Step 3d: Connect
  const renderConnect = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Koble til en datakilde for å importere {selectedTemplate?.display_name_plural?.toLowerCase()} automatisk
      </p>

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
        {integrationOptions.map((integration) => (
          <button
            key={integration.id}
            onClick={() => {
              if (integration.available) {
                toast.info(`Kobler til ${integration.name}...`, {
                  description: "Denne funksjonen er under utvikling",
                });
              }
            }}
            disabled={!integration.available}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
              integration.available 
                ? "border-border hover:border-primary/50 hover:bg-muted/30" 
                : "border-border/50 opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
              integration.bgColor
            )}>
              {integration.logo.length <= 2 ? (
                <span className={cn("font-bold text-sm", integration.textColor)}>
                  {integration.logo}
                </span>
              ) : (
                <span className="text-xl">{integration.logo}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium">{integration.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {integration.category}
                </span>
                {!integration.available && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600">
                    Kommer snart
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {integration.description}
              </p>
            </div>
            {integration.available && (
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          Trenger du en integrasjon vi ikke støtter? <button className="text-primary hover:underline">Kontakt oss</button>
        </p>
      </div>
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case "select-type": return "Legg til eiendel";
      case "select-method": return `Legg til ${selectedTemplate?.display_name?.toLowerCase() || "eiendel"}`;
      case "ai-suggestions": return `AI-forslag: ${selectedTemplate?.display_name_plural || "Eiendeler"}`;
      case "manual-form": return `Ny ${selectedTemplate?.display_name?.toLowerCase() || "eiendel"}`;
      case "upload": return "Last opp fra fil";
      case "connect": return "Koble til datakilde";
      default: return "Legg til eiendel";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            {step !== "select-type" && (
              <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle>{getTitle()}</DialogTitle>
          </div>
        </DialogHeader>

        {/* Progress bar */}
        <div className="px-6 pb-4">
          <Progress value={getStepProgress()} className="h-1" />
        </div>

        {/* Content */}
        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {step === "select-type" && renderSelectType()}
          {step === "select-method" && renderSelectMethod()}
          {step === "ai-suggestions" && renderAISuggestions()}
          {step === "manual-form" && renderManualForm()}
          {step === "upload" && renderUpload()}
          {step === "connect" && renderConnect()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          
          {step === "ai-suggestions" && suggestions.length > 0 && (
            <Button 
              onClick={createFromSuggestions}
              disabled={isLoading || selectedSuggestions.size === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Legger til...
                </>
              ) : (
                `Legg til ${selectedSuggestions.size > 0 ? `(${selectedSuggestions.size})` : ""}`
              )}
            </Button>
          )}

          {step === "manual-form" && (
            <Button onClick={handleSubmit} disabled={isLoading || !formData.name}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Lagrer...
                </>
              ) : (
                "Legg til"
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
