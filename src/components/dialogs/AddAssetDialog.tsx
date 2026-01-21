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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  ArrowLeft,
  Zap,
  AlertTriangle,
  Building,
  Users,
  TrendingUp,
  Info,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield,
  Bot,
  Globe,
  Wifi,
  Box,
  Clock,
  RefreshCw
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

// Mock assets from Acronis for prototype
interface MockAcronisAsset {
  id: string;
  name: string;
  hostname: string;
  type: "server" | "workstation" | "storage" | "network";
  os: string;
  status: "protected" | "warning" | "critical";
  lastSeen: string;
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

// Asset type options for integration import
const INTEGRATION_ASSET_TYPES = [
  { id: "system", label: "Systemer", icon: Server, priority: "high" },
  { id: "vendor", label: "Leverandører", icon: Building2, priority: "high" },
  { id: "location", label: "Lokasjoner", icon: MapPin, priority: "high" },
  { id: "network", label: "Nettverk", icon: Wifi, priority: "high" },
  { id: "integration", label: "Integrasjoner", icon: Plug, priority: "high" },
  { id: "hardware", label: "Digitale enheter", icon: HardDrive, priority: "high" },
  { id: "domain", label: "Domener", icon: Globe, priority: "medium" },
  { id: "physical", label: "Fysiske enheter", icon: Box, priority: "medium" },
];

// Mock data for Acronis prototype
const MOCK_ACRONIS_ASSETS: MockAcronisAsset[] = [
  { id: "1", name: "SRV-DC01", hostname: "srv-dc01.company.local", type: "server", os: "Windows Server 2022", status: "protected", lastSeen: "2 min siden" },
  { id: "2", name: "SRV-SQL01", hostname: "srv-sql01.company.local", type: "server", os: "Windows Server 2019", status: "protected", lastSeen: "5 min siden" },
  { id: "3", name: "SRV-WEB01", hostname: "srv-web01.company.local", type: "server", os: "Ubuntu 22.04 LTS", status: "protected", lastSeen: "1 min siden" },
  { id: "4", name: "SRV-APP01", hostname: "srv-app01.company.local", type: "server", os: "Windows Server 2022", status: "warning", lastSeen: "15 min siden" },
  { id: "5", name: "WS-ADMIN01", hostname: "ws-admin01.company.local", type: "workstation", os: "Windows 11 Pro", status: "protected", lastSeen: "3 min siden" },
  { id: "6", name: "WS-DEV01", hostname: "ws-dev01.company.local", type: "workstation", os: "Windows 11 Pro", status: "protected", lastSeen: "8 min siden" },
  { id: "7", name: "WS-DEV02", hostname: "ws-dev02.company.local", type: "workstation", os: "macOS Sonoma 14.2", status: "protected", lastSeen: "12 min siden" },
  { id: "8", name: "NAS-BACKUP01", hostname: "nas-backup01.company.local", type: "storage", os: "Synology DSM 7.2", status: "protected", lastSeen: "1 min siden" },
  { id: "9", name: "FW-MAIN01", hostname: "fw-main01.company.local", type: "network", os: "Fortinet FortiOS 7.4", status: "protected", lastSeen: "30 sek siden" },
  { id: "10", name: "SW-CORE01", hostname: "sw-core01.company.local", type: "network", os: "Cisco IOS XE 17.9", status: "protected", lastSeen: "45 sek siden" },
];

// AI import messages for simulation
const AI_IMPORT_MESSAGES = [
  { asset: "SRV-DC01", message: "Kartlegger compliance-krav for domene-kontroller..." },
  { asset: "SRV-DC01", message: "Identifisert: ISO 27001 A.9, GDPR Artikkel 32" },
  { asset: "SRV-SQL01", message: "Analyserer databaseserver for personopplysninger..." },
  { asset: "SRV-SQL01", message: "Flagget som kritisk - inneholder persondata" },
  { asset: "SRV-WEB01", message: "Vurderer eksponering mot internett..." },
  { asset: "SRV-APP01", message: "Advarsel fra Acronis - anbefaler risikovurdering" },
  { asset: "NAS-BACKUP01", message: "Klassifiserer som backup-infrastruktur" },
  { asset: "FW-MAIN01", message: "Identifisert som sikkerhetsinfrastruktur - høy kritikalitet" },
];

type Step = 
  | "select-approach" 
  | "select-type" 
  | "select-manual-method" 
  | "ai-suggestions" 
  | "manual-form" 
  | "upload" 
  | "connect"
  | "connect-select-types"
  | "connect-auth"
  | "connect-fetching"
  | "connect-preview"
  | "connect-importing"
  | "connect-complete";

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
  
  // Connect flow state
  const [selectedIntegration, setSelectedIntegration] = useState<string>("");
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<Set<string>>(new Set(["all"]));
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [fetchedAssets, setFetchedAssets] = useState<MockAcronisAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState(0);
  const [aiMessages, setAiMessages] = useState<string[]>([]);
  const [currentAiMessage, setCurrentAiMessage] = useState("");
  const [enableSync, setEnableSync] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState("daily");
  const [importedCount, setImportedCount] = useState(0);
  const [previewFilter, setPreviewFilter] = useState<string>("all");
  
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
      setStep("select-approach");
      setSelectedType("");
      setSuggestions([]);
      setSelectedSuggestions(new Set());
      setSelectedIntegration("");
      setSelectedAssetTypes(new Set(["all"]));
      setApiKey("");
      setShowApiKey(false);
      setFetchedAssets([]);
      setSelectedAssetIds(new Set());
      setImportProgress(0);
      setAiMessages([]);
      setCurrentAiMessage("");
      setEnableSync(false);
      setImportedCount(0);
      setPreviewFilter("all");
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
    setStep("select-manual-method");
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

  // ============ CONNECT FLOW FUNCTIONS ============

  const handleIntegrationSelect = (integrationId: string) => {
    setSelectedIntegration(integrationId);
    setStep("connect-select-types");
  };

  const handleAssetTypeToggle = (typeId: string) => {
    setSelectedAssetTypes(prev => {
      const newSet = new Set(prev);
      if (typeId === "all") {
        // If selecting "all", clear others and add "all"
        return new Set(["all"]);
      } else {
        // Remove "all" if it was selected
        newSet.delete("all");
        if (newSet.has(typeId)) {
          newSet.delete(typeId);
        } else {
          newSet.add(typeId);
        }
        // If nothing selected, default back to "all"
        if (newSet.size === 0) {
          return new Set(["all"]);
        }
        return newSet;
      }
    });
  };

  const startFetching = async () => {
    setStep("connect-fetching");
    
    // Simulate connection and fetch process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Set mock data
    setFetchedAssets(MOCK_ACRONIS_ASSETS);
    // Pre-select all assets
    setSelectedAssetIds(new Set(MOCK_ACRONIS_ASSETS.map(a => a.id)));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStep("connect-preview");
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const selectAllAssets = () => {
    const filteredIds = getFilteredPreviewAssets().map(a => a.id);
    setSelectedAssetIds(new Set(filteredIds));
  };

  const deselectAllAssets = () => {
    setSelectedAssetIds(new Set());
  };

  const getFilteredPreviewAssets = () => {
    if (previewFilter === "all") return fetchedAssets;
    return fetchedAssets.filter(a => a.type === previewFilter);
  };

  const startImporting = async () => {
    setStep("connect-importing");
    setImportProgress(0);
    setAiMessages([]);
    
    const selectedAssets = fetchedAssets.filter(a => selectedAssetIds.has(a.id));
    const totalSteps = selectedAssets.length * 2; // Each asset has 2 AI messages
    let currentStep = 0;
    
    // Create assets in database
    const assetsToCreate = selectedAssets.map(asset => ({
      name: asset.name,
      description: `${asset.hostname} - ${asset.os}`,
      asset_type: asset.type === "server" || asset.type === "workstation" ? "hardware" : 
                  asset.type === "network" ? "network" : "hardware",
      vendor: "Acronis",
      category: asset.type.charAt(0).toUpperCase() + asset.type.slice(1),
      risk_level: asset.status === "warning" ? "medium" : asset.status === "critical" ? "high" : "low",
      criticality: asset.type === "server" ? "high" : "medium",
      external_source_id: asset.id,
      external_source_provider: "acronis",
      sync_enabled: enableSync,
      lifecycle_status: "active",
    }));

    // Simulate import with AI messages
    for (let i = 0; i < selectedAssets.length; i++) {
      const asset = selectedAssets[i];
      
      // First message - importing
      setCurrentAiMessage(`Importerer ${asset.name}...`);
      setAiMessages(prev => [...prev, `✓ Importert: ${asset.name}`]);
      currentStep++;
      setImportProgress(Math.round((currentStep / totalSteps) * 100));
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // Second message - AI analysis
      const aiMsg = AI_IMPORT_MESSAGES.find(m => m.asset === asset.name);
      if (aiMsg) {
        setCurrentAiMessage(aiMsg.message);
        await new Promise(resolve => setTimeout(resolve, 600));
        setAiMessages(prev => [...prev, `  → ${aiMsg.message}`]);
      } else {
        setCurrentAiMessage(`Kartlegger compliance-krav...`);
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      currentStep++;
      setImportProgress(Math.round((currentStep / totalSteps) * 100));
    }

    // Actually insert to database
    try {
      const { error } = await supabase.from("assets").insert(assetsToCreate);
      if (error) throw error;
    } catch (error) {
      console.error("Error importing assets:", error);
    }

    setImportedCount(selectedAssets.length);
    setImportProgress(100);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    setStep("connect-complete");
  };

  const finishImport = () => {
    onAssetAdded();
    onOpenChange(false);
    toast.success(`${importedCount} nye eiendeler importert og klare for tilordning`);
  };

  // ============ END CONNECT FLOW FUNCTIONS ============

  const selectedTemplate = assetTypeTemplates.find(t => t.asset_type === selectedType);
  const IconComponent = selectedTemplate ? (iconMap[selectedTemplate.icon] || Server) : Server;

  const getStepProgress = () => {
    switch (step) {
      case "select-approach": return 10;
      case "select-type": return 25;
      case "select-manual-method": return 40;
      case "ai-suggestions": return 70;
      case "manual-form": return 70;
      case "upload": return 50;
      case "connect": return 30;
      case "connect-select-types": return 40;
      case "connect-auth": return 50;
      case "connect-fetching": return 60;
      case "connect-preview": return 75;
      case "connect-importing": return 90;
      case "connect-complete": return 100;
      default: return 0;
    }
  };

  const goBack = () => {
    switch (step) {
      case "select-type":
        setStep("select-approach");
        setSelectedType("");
        break;
      case "connect":
      case "upload":
        setStep("select-approach");
        break;
      case "connect-select-types":
        setStep("connect");
        setSelectedIntegration("");
        break;
      case "connect-auth":
        setStep("connect-select-types");
        break;
      case "connect-preview":
        setStep("connect-auth");
        break;
      case "select-manual-method":
        setStep("select-type");
        setSelectedType("");
        break;
      case "ai-suggestions":
      case "manual-form":
        setStep("select-manual-method");
        setSuggestions([]);
        setSelectedSuggestions(new Set());
        break;
    }
  };

  // Step 0: Select approach (automatic vs manual)
  const renderSelectApproach = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Hvordan vil du legge til eiendeler?
      </p>
      <div className="grid gap-3">
        {/* Automatic - Connect to data source */}
        <button
          onClick={() => setStep("connect")}
          className="flex items-start gap-4 p-5 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-primary/20">
            <Link2 className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg text-foreground">Automatisk import</p>
            <p className="text-sm text-muted-foreground mt-1">
              Koble til Acronis, Azure AD, ServiceNow eller andre kilder
            </p>
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Anbefalt</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Synkronisering</span>
            </div>
          </div>
        </button>

        {/* Manual */}
        <button
          onClick={() => setStep("select-type")}
          className="flex items-start gap-4 p-5 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg text-foreground">Manuelt / AI-forslag</p>
            <p className="text-sm text-muted-foreground mt-1">
              Velg type, få AI-forslag basert på din bransje, eller fyll ut manuelt
            </p>
          </div>
        </button>

        {/* Upload */}
        <button
          onClick={() => setStep("upload")}
          className="flex items-start gap-4 p-5 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
        >
          <div className="p-3 rounded-lg bg-muted">
            <Upload className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-lg text-foreground">Last opp fra fil</p>
            <p className="text-sm text-muted-foreground mt-1">
              Importer fra Excel, CSV eller annen strukturert fil
            </p>
          </div>
        </button>
      </div>
    </div>
  );

  // Step 1: Select type
  const renderSelectType = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Hvilken type eiendel vil du legge til?
      </p>
      <div className="grid grid-cols-2 gap-3">
        {assetTypeTemplates.map((template) => {
          const Icon = iconMap[template.icon] || Server;
          return (
            <button
              key={template.asset_type}
              onClick={() => handleTypeSelect(template.asset_type)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                "hover:border-primary/50 hover:bg-muted/30",
                "border-border"
              )}
            >
              <div className={cn("p-2 rounded-lg", `bg-${template.color}/20`)}>
                <Icon className={cn("h-5 w-5", `text-${template.color}`)} />
              </div>
              <div>
                <p className="font-medium">{template.display_name}</p>
                <p className="text-xs text-muted-foreground">{template.display_name_plural}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Step 2: Select method for the selected type
  const renderSelectManualMethod = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <IconComponent className="h-5 w-5 text-primary" />
        <span className="font-medium">{selectedTemplate?.display_name}</span>
      </div>

      <div className="grid gap-3">
        {/* AI Suggestions */}
        <button
          onClick={fetchAISuggestions}
          disabled={isLoadingSuggestions}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 transition-all text-left"
        >
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">AI-forslag</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Anbefalt</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Få forslag basert på bransje og bedriftsprofil
            </p>
          </div>
        </button>

        {/* Manual entry */}
        <button
          onClick={() => setStep("manual-form")}
          className="flex items-start gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left"
        >
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Fyll ut manuelt</p>
            <p className="text-sm text-muted-foreground mt-1">
              Legg til én {selectedTemplate?.display_name?.toLowerCase() || "eiendel"} med alle detaljer
            </p>
          </div>
        </button>
      </div>

      {companyProfile && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300">
            AI-forslag er tilpasset <span className="font-medium">{companyProfile.name}</span> i 
            {" "}<span className="font-medium">{companyProfile.industry}</span>-bransjen
          </p>
        </div>
      )}
    </div>
  );

  // Step 3a: AI suggestions
  const renderAISuggestions = () => (
    <div className="space-y-4">
      {isLoadingSuggestions ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <Sparkles className="h-10 w-10 text-primary animate-pulse" />
            <Loader2 className="h-6 w-6 text-primary animate-spin absolute -bottom-1 -right-1" />
          </div>
          <div className="text-center">
            <p className="font-medium">Analyserer din bedriftsprofil...</p>
            <p className="text-sm text-muted-foreground">
              Finner relevante {selectedTemplate?.display_name_plural?.toLowerCase() || "eiendeler"} for {companyProfile?.industry || "din bransje"}
            </p>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">Ingen nye forslag tilgjengelig</p>
          <Button variant="outline" onClick={() => setStep("manual-form")}>
            Legg til manuelt
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {suggestions.length} forslag funnet
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (selectedSuggestions.size === suggestions.length) {
                  setSelectedSuggestions(new Set());
                } else {
                  setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
                }
              }}
            >
              {selectedSuggestions.size === suggestions.length ? "Fjern alle" : "Velg alle"}
            </Button>
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => toggleSuggestion(index)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-all text-left",
                    selectedSuggestions.has(index)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    selectedSuggestions.has(index)
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}>
                    {selectedSuggestions.has(index) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{suggestion.name}</p>
                      {suggestion.vendor && (
                        <span className="text-xs text-muted-foreground">({suggestion.vendor})</span>
                      )}
                      {suggestion.industryRelevant && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                          Bransjerelevant
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {suggestion.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {suggestion.category}
                      </span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        suggestion.risk_level === "high" ? "bg-red-500/20 text-red-400" :
                        suggestion.risk_level === "medium" ? "bg-orange-500/20 text-orange-400" :
                        "bg-green-500/20 text-green-400"
                      )}>
                        {suggestion.risk_level === "high" ? "Høy risiko" : 
                         suggestion.risk_level === "medium" ? "Medium risiko" : "Lav risiko"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );

  // Step 3b: Manual form
  const renderManualForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <IconComponent className="h-5 w-5 text-primary" />
        <span className="font-medium">{selectedTemplate?.display_name}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("assets.name")} *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder={`F.eks. ${selectedTemplate?.display_name || "Eiendel"} navn`}
          required
        />
      </div>

      {selectedType !== "location" && (
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

  // Step 3d: Connect (select integration)
  const renderConnect = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Velg en datakilde å koble til for automatisk import av eiendeler
      </p>

      <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-1">
        {integrationOptions.map((integration) => (
          <button
            key={integration.id}
            onClick={() => {
              if (integration.available) {
                handleIntegrationSelect(integration.id);
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

  // Step: Connect - Select asset types
  const renderConnectSelectTypes = () => {
    const integration = integrationOptions.find(i => i.id === selectedIntegration);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", integration?.bgColor)}>
            {integration?.logo.length === 2 ? (
              <span className={cn("font-bold text-sm", integration?.textColor)}>{integration?.logo}</span>
            ) : (
              <span className="text-lg">{integration?.logo}</span>
            )}
          </div>
          <div>
            <p className="font-medium">{integration?.name}</p>
            <p className="text-xs text-muted-foreground">Velg hva du vil importere</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Hvilke eiendelstyper vil du hente?</p>
          
          {/* All types option */}
          <button
            onClick={() => handleAssetTypeToggle("all")}
            className={cn(
              "w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
              selectedAssetTypes.has("all")
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className={cn(
              "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0",
              selectedAssetTypes.has("all")
                ? "border-primary bg-primary"
                : "border-muted-foreground"
            )}>
              {selectedAssetTypes.has("all") && <Check className="h-3 w-3 text-primary-foreground" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">Alle typer</p>
              <p className="text-xs text-muted-foreground">Importer alle tilgjengelige eiendelstyper</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Anbefalt</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">eller velg spesifikke</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {INTEGRATION_ASSET_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedAssetTypes.has(type.id);
              const isDisabled = selectedAssetTypes.has("all");
              
              return (
                <button
                  key={type.id}
                  onClick={() => !isDisabled && handleAssetTypeToggle(type.id)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border transition-all text-left",
                    isDisabled && "opacity-40 cursor-not-allowed",
                    isSelected && !isDisabled
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isSelected ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm">{type.label}</span>
                  {type.priority === "medium" && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-muted text-muted-foreground ml-auto">
                      Valgfri
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Step: Connect - API key auth
  const renderConnectAuth = () => {
    const integration = integrationOptions.find(i => i.id === selectedIntegration);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", integration?.bgColor)}>
            {integration?.logo.length === 2 ? (
              <span className={cn("font-bold text-sm", integration?.textColor)}>{integration?.logo}</span>
            ) : (
              <span className="text-lg">{integration?.logo}</span>
            )}
          </div>
          <div>
            <p className="font-medium">Koble til {integration?.name}</p>
            <p className="text-xs text-muted-foreground">Skriv inn API-nøkkel for å fortsette</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API-nøkkel</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Lim inn API-nøkkel her..."
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 space-y-2">
          <div className="flex items-start gap-2">
            <Key className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-300">Hvor finner jeg API-nøkkelen?</p>
              <ol className="text-xs text-blue-300/80 mt-2 space-y-1 list-decimal list-inside">
                <li>Logg inn på {integration?.name} Management Console</li>
                <li>Gå til Innstillinger → API-tilgang</li>
                <li>Klikk "Generer ny nøkkel"</li>
                <li>Kopier nøkkelen og lim inn over</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            API-nøkkelen lagres sikkert og kryptert. Den brukes kun til å hente data fra {integration?.name}.
          </p>
        </div>
      </div>
    );
  };

  // Step: Connect - Fetching animation
  const renderConnectFetching = () => {
    const integration = integrationOptions.find(i => i.id === selectedIntegration);
    
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <div className="relative">
          <div className={cn("h-16 w-16 rounded-xl flex items-center justify-center", integration?.bgColor)}>
            {integration?.logo.length === 2 ? (
              <span className={cn("font-bold text-xl", integration?.textColor)}>{integration?.logo}</span>
            ) : (
              <span className="text-2xl">{integration?.logo}</span>
            )}
          </div>
          <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="font-medium text-lg">Kobler til {integration?.name}...</p>
          <p className="text-sm text-muted-foreground">
            Henter tilgjengelige eiendeler
          </p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Tilkobling verifisert</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-muted-foreground">Henter enhetsliste...</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-50">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">Analyserer enheter</span>
          </div>
        </div>
      </div>
    );
  };

  // Step: Connect - Preview assets
  const renderConnectPreview = () => {
    const integration = integrationOptions.find(i => i.id === selectedIntegration);
    const filteredAssets = getFilteredPreviewAssets();
    const selectedCount = selectedAssetIds.size;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium">{fetchedAssets.length} eiendeler funnet</span>
          </div>
          <span className="text-sm text-muted-foreground">{integration?.name}</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all", label: "Alle" },
            { id: "server", label: "Servere" },
            { id: "workstation", label: "Arbeidsstasjoner" },
            { id: "storage", label: "Lagring" },
            { id: "network", label: "Nettverk" },
          ].map((filter) => (
            <button
              key={filter.id}
              onClick={() => setPreviewFilter(filter.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm transition-colors",
                previewFilter === filter.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Select/deselect all */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">{selectedCount} valgt</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAllAssets}>Velg alle</Button>
            <Button variant="ghost" size="sm" onClick={deselectAllAssets}>Fjern alle</Button>
          </div>
        </div>

        {/* Asset list */}
        <ScrollArea className="h-[250px]">
          <div className="space-y-2 pr-4">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => toggleAssetSelection(asset.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  selectedAssetIds.has(asset.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <Checkbox 
                  checked={selectedAssetIds.has(asset.id)}
                  className="pointer-events-none"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{asset.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                      {asset.type === "workstation" ? "PC" : asset.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{asset.os}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{asset.lastSeen}</span>
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    asset.status === "protected" ? "bg-green-500" :
                    asset.status === "warning" ? "bg-orange-500" : "bg-red-500"
                  )} />
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>

        {/* Sync option */}
        <div className="p-4 rounded-lg border border-border space-y-3">
          <div className="flex items-center gap-3">
            <Checkbox 
              id="enable-sync"
              checked={enableSync}
              onCheckedChange={(checked) => setEnableSync(!!checked)}
            />
            <Label htmlFor="enable-sync" className="cursor-pointer">
              Aktiver automatisk synkronisering
            </Label>
          </div>
          {enableSync && (
            <div className="flex items-center gap-2 pl-7">
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
              <Select value={syncFrequency} onValueChange={setSyncFrequency}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daglig</SelectItem>
                  <SelectItem value="weekly">Ukentlig</SelectItem>
                  <SelectItem value="monthly">Månedlig</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step: Connect - Importing with AI feedback
  const renderConnectImporting = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="font-medium text-lg">Importerer og klargjør eiendeler...</p>
        <p className="text-sm text-muted-foreground">
          Lara analyserer hver eiendel for compliance-krav
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fremgang</span>
          <span className="font-medium">{importProgress}%</span>
        </div>
        <Progress value={importProgress} className="h-2" />
      </div>

      <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Lara jobber...</span>
        </div>
        
        <ScrollArea className="h-[150px]">
          <div className="space-y-1 text-sm font-mono">
            {aiMessages.map((msg, i) => (
              <p key={i} className={cn(
                "text-muted-foreground",
                msg.startsWith("✓") && "text-green-400",
                msg.startsWith("  →") && "text-blue-400 pl-4"
              )}>
                {msg}
              </p>
            ))}
            {currentAiMessage && (
              <p className="text-primary animate-pulse">
                ⟳ {currentAiMessage}
              </p>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );

  // Step: Connect - Complete
  const renderConnectComplete = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-6">
      <div className="relative">
        <div className="h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="font-semibold text-xl">Import fullført!</p>
        <p className="text-muted-foreground">
          {importedCount} eiendeler importert og klargjort
        </p>
      </div>

      <div className="w-full p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-sm">Lara sier:</p>
            <p className="text-sm text-muted-foreground">
              "Jeg har importert {importedCount} eiendeler og klargjort dem i Mynder. 
              Eiendelene ligger nå øverst i listen din.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>For hver eiendel har jeg:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Kartlagt relevante regelverk (ISO 27001, GDPR)</li>
                <li>Identifisert dokumentasjonskrav</li>
                <li>Satt risikonivå basert på Acronis-status</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Neste steg: Tilordne en ansvarlig for hver eiendel."
            </p>
          </div>
        </div>
      </div>

      {enableSync && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>Synkronisering aktivert ({syncFrequency === "daily" ? "daglig" : syncFrequency === "weekly" ? "ukentlig" : "månedlig"})</span>
        </div>
      )}
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case "select-approach": return "Legg til eiendel";
      case "select-type": return "Velg type eiendel";
      case "select-manual-method": return `Legg til ${selectedTemplate?.display_name?.toLowerCase() || "eiendel"}`;
      case "ai-suggestions": return `AI-forslag: ${selectedTemplate?.display_name_plural || "Eiendeler"}`;
      case "manual-form": return `Ny ${selectedTemplate?.display_name?.toLowerCase() || "eiendel"}`;
      case "upload": return "Last opp fra fil";
      case "connect": return "Koble til datakilde";
      case "connect-select-types": return "Velg eiendelstyper";
      case "connect-auth": return "Koble til";
      case "connect-fetching": return "Henter data";
      case "connect-preview": return "Forhåndsvis import";
      case "connect-importing": return "Importerer";
      case "connect-complete": return "Fullført";
      default: return "Legg til eiendel";
    }
  };

  const canGoBack = !["connect-fetching", "connect-importing", "connect-complete"].includes(step);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            {step !== "select-approach" && canGoBack && (
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

        <div className="px-6 pb-6 max-h-[60vh] overflow-y-auto">
          {step === "select-approach" && renderSelectApproach()}
          {step === "select-type" && renderSelectType()}
          {step === "select-manual-method" && renderSelectManualMethod()}
          {step === "ai-suggestions" && renderAISuggestions()}
          {step === "manual-form" && renderManualForm()}
          {step === "upload" && renderUpload()}
          {step === "connect" && renderConnect()}
          {step === "connect-select-types" && renderConnectSelectTypes()}
          {step === "connect-auth" && renderConnectAuth()}
          {step === "connect-fetching" && renderConnectFetching()}
          {step === "connect-preview" && renderConnectPreview()}
          {step === "connect-importing" && renderConnectImporting()}
          {step === "connect-complete" && renderConnectComplete()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
          {step === "connect-complete" ? (
            <>
              <div />
              <Button onClick={finishImport}>
                Se importerte eiendeler
              </Button>
            </>
          ) : step === "connect-importing" || step === "connect-fetching" ? (
            <div className="w-full text-center text-sm text-muted-foreground">
              Vennligst vent...
            </div>
          ) : (
            <>
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

              {step === "connect-select-types" && (
                <Button onClick={() => setStep("connect-auth")}>
                  Neste
                </Button>
              )}

              {step === "connect-auth" && (
                <Button 
                  onClick={startFetching}
                  disabled={apiKey.length < 10}
                >
                  Koble til
                </Button>
              )}

              {step === "connect-preview" && (
                <Button 
                  onClick={startImporting}
                  disabled={selectedAssetIds.size === 0}
                >
                  Importer valgte ({selectedAssetIds.size})
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
