import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
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
  RefreshCw,
  User,
  Calculator,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PerformerSelectStep, type PerformerRole } from "@/components/integration/PerformerSelectStep";
import { InvitePerformerForm, type InviteData } from "@/components/integration/InvitePerformerForm";
import { IntegrationPendingStatus } from "@/components/integration/IntegrationPendingStatus";
import { CustomerTypeStep } from "@/components/integration/CustomerTypeStep";
import { CustomerIdStep } from "@/components/integration/CustomerIdStep";
import { RequestAccessStep } from "@/components/integration/RequestAccessStep";
import { useIntegrationPerformers } from "@/hooks/useIntegrationPerformers";
import { use7SecurityIntegration, type FetchedAsset } from "@/hooks/use7SecurityIntegration";

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
  type: "system" | "location" | "network" | "hardware" | "vendor";
  os: string;
  status: "protected" | "warning" | "critical";
  lastSeen: string;
  complianceScore?: number;
  frameworks?: string[];
  vendor?: string;
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
  { id: "system", label: "Systems", icon: Server, priority: "high" },
  { id: "location", label: "Locations", icon: MapPin, priority: "high" },
  { id: "network", label: "Networks", icon: Wifi, priority: "high" },
  { id: "hardware", label: "Digital devices", icon: HardDrive, priority: "high" },
  { id: "vendor", label: "Vendors", icon: Building2, priority: "medium" },
  { id: "integration", label: "Integrations", icon: Plug, priority: "medium" },
];

// Mock data for Acronis prototype - realistic data
const MOCK_ACRONIS_ASSETS: MockAcronisAsset[] = [
  // Systems - known enterprise systems
  { id: "sys-1", name: "Microsoft 365", hostname: "m365.microsoft.com", type: "system", os: "SaaS", status: "protected", lastSeen: "1 min ago", complianceScore: 92, frameworks: ["ISO 27001", "GDPR"], vendor: "Microsoft" },
  { id: "sys-2", name: "SAP S/4HANA", hostname: "sap-prod.company.no", type: "system", os: "HANA DB", status: "protected", lastSeen: "3 min ago", complianceScore: 88, frameworks: ["ISO 27001", "SOC 2"], vendor: "SAP" },
  { id: "sys-3", name: "Salesforce CRM", hostname: "company.my.salesforce.com", type: "system", os: "SaaS", status: "protected", lastSeen: "2 min ago", complianceScore: 95, frameworks: ["ISO 27001", "GDPR", "SOC 2"], vendor: "Salesforce" },
  { id: "sys-4", name: "ServiceNow ITSM", hostname: "company.service-now.com", type: "system", os: "SaaS", status: "warning", lastSeen: "8 min ago", complianceScore: 78, frameworks: ["ISO 27001"], vendor: "ServiceNow" },
  { id: "sys-5", name: "Visma Business", hostname: "visma-prod.company.no", type: "system", os: "Windows Server 2022", status: "protected", lastSeen: "5 min ago", complianceScore: 85, frameworks: ["GDPR"], vendor: "Visma" },
  { id: "sys-6", name: "HubSpot Marketing", hostname: "app.hubspot.com", type: "system", os: "SaaS", status: "critical", lastSeen: "45 min ago", complianceScore: 62, frameworks: ["GDPR"], vendor: "HubSpot" },
  
  // Locations - offices
  { id: "loc-1", name: "Headquarters Oslo", hostname: "oslo-hq.company.no", type: "location", os: "Akersgata 20, 0158 Oslo", status: "protected", lastSeen: "1 min ago", complianceScore: 94, frameworks: ["ISO 27001", "NS-EN 50600"] },
  { id: "loc-2", name: "Branch Bergen", hostname: "bergen.company.no", type: "location", os: "Bryggen 12, 5003 Bergen", status: "protected", lastSeen: "2 min ago", complianceScore: 89, frameworks: ["ISO 27001"] },
  { id: "loc-3", name: "Branch Trondheim", hostname: "trondheim.company.no", type: "location", os: "Munkegata 5, 7013 Trondheim", status: "protected", lastSeen: "3 min ago", complianceScore: 91, frameworks: ["ISO 27001"] },
  { id: "loc-4", name: "Branch Stavanger", hostname: "stavanger.company.no", type: "location", os: "Haakon VIIs gt 8, 4005 Stavanger", status: "warning", lastSeen: "15 min ago", complianceScore: 76, frameworks: ["ISO 27001"] },
  { id: "loc-5", name: "Data Center Green Mountain", hostname: "dc1.greenmountain.no", type: "location", os: "Rennesøy, Rogaland", status: "protected", lastSeen: "30 sec ago", complianceScore: 98, frameworks: ["ISO 27001", "SOC 2", "NS-EN 50600"] },
  
  // Networks
  { id: "net-1", name: "Headquarters LAN", hostname: "10.0.0.0/16", type: "network", os: "Cisco Catalyst 9300", status: "protected", lastSeen: "1 min ago", complianceScore: 90, frameworks: ["ISO 27001"], vendor: "Cisco" },
  { id: "net-2", name: "Azure Virtual Network", hostname: "vnet-prod-norway.azure", type: "network", os: "Azure VNET", status: "protected", lastSeen: "2 min ago", complianceScore: 94, frameworks: ["ISO 27001", "SOC 2"], vendor: "Microsoft" },
  { id: "net-3", name: "SD-WAN Multi-site", hostname: "sdwan.company.no", type: "network", os: "Fortinet SD-WAN", status: "protected", lastSeen: "45 sec ago", complianceScore: 88, frameworks: ["ISO 27001"], vendor: "Fortinet" },
  { id: "net-4", name: "Guest WiFi", hostname: "wifi-guest.company.no", type: "network", os: "Meraki MR56", status: "warning", lastSeen: "5 min ago", complianceScore: 72, frameworks: [], vendor: "Cisco Meraki" },
  { id: "net-5", name: "DMZ Network", hostname: "172.16.0.0/24", type: "network", os: "Palo Alto PA-3260", status: "protected", lastSeen: "1 min ago", complianceScore: 96, frameworks: ["ISO 27001", "PCI DSS"], vendor: "Palo Alto" },
  
  // Hardware
  { id: "hw-1", name: "Dell PowerEdge R750", hostname: "srv-prod-01.company.no", type: "hardware", os: "Windows Server 2022", status: "protected", lastSeen: "1 min ago", complianceScore: 92, frameworks: ["ISO 27001"], vendor: "Dell" },
  { id: "hw-2", name: "HPE ProLiant DL380", hostname: "srv-db-01.company.no", type: "hardware", os: "VMware ESXi 8.0", status: "protected", lastSeen: "2 min ago", complianceScore: 90, frameworks: ["ISO 27001"], vendor: "HPE" },
  { id: "hw-3", name: "Synology NAS RS3621", hostname: "nas-backup.company.no", type: "hardware", os: "DSM 7.2", status: "protected", lastSeen: "3 min ago", complianceScore: 85, frameworks: ["ISO 27001"], vendor: "Synology" },
  { id: "hw-4", name: "Fortinet FortiGate 600E", hostname: "fw-main.company.no", type: "hardware", os: "FortiOS 7.4.1", status: "protected", lastSeen: "30 sec ago", complianceScore: 97, frameworks: ["ISO 27001", "PCI DSS"], vendor: "Fortinet" },
  
  // Vendors
  { id: "ven-1", name: "TietoEvry", hostname: "tietoevry.com", type: "vendor", os: "IT operations and development", status: "protected", lastSeen: "1 day ago", complianceScore: 91, frameworks: ["ISO 27001", "SOC 2"] },
  { id: "ven-2", name: "Atea", hostname: "atea.no", type: "vendor", os: "Hardware and infrastructure", status: "protected", lastSeen: "2 days ago", complianceScore: 88, frameworks: ["ISO 27001"] },
  { id: "ven-3", name: "Knowit", hostname: "knowit.no", type: "vendor", os: "Consulting firm", status: "warning", lastSeen: "1 week ago", complianceScore: 75, frameworks: ["ISO 27001"] },
];

// AI import messages for simulation - updated for new mock data
const AI_IMPORT_MESSAGES = [
  { asset: "Microsoft 365", message: "Mapping compliance requirements for productivity platform..." },
  { asset: "Microsoft 365", message: "Identified: ISO 27001, GDPR – 92% compliance" },
  { asset: "SAP S/4HANA", message: "Analyzing ERP system for personal data..." },
  { asset: "SAP S/4HANA", message: "Flagged as critical – contains customer and financial data" },
  { asset: "Hovedkontor Oslo", message: "Classifying physical location – high security required" },
  { asset: "Datasenter Green Mountain", message: "NS-EN 50600 certified – critical infrastructure" },
  { asset: "Azure Virtual Network", message: "Verifying cloud network segmentation..." },
  { asset: "Fortinet FortiGate 600E", message: "Identified as security infrastructure – 97% compliance" },
  { asset: "ServiceNow ITSM", message: "Warning: Requires follow-up – 78% compliance" },
  { asset: "TietoEvry", message: "Vendor assessment: ISO 27001 and SOC 2 certified" },
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
  | "connect-customer-type"
  | "connect-customer-id"
  | "connect-request-access"
  | "connect-access-pending"
  | "connect-performer-select"
  | "connect-invite-performer"
  | "connect-pending"
  | "connect-auth"
  | "connect-fetching"
  | "connect-preview"
  | "connect-importing"
  | "connect-complete";

export function AddAssetDialog({ open, onOpenChange, onAssetAdded, assetTypeTemplates }: AddAssetDialogProps) {
  const { t } = useTranslation();
  const { createPerformer, logAuditEvent } = useIntegrationPerformers();
  const { fetchAcronisAssets } = use7SecurityIntegration();
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
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<Set<string>>(new Set());
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
  
  // Performer/Invite state
  const [selectedPerformerRole, setSelectedPerformerRole] = useState<PerformerRole | null>(null);
  const [pendingInvite, setPendingInvite] = useState<InviteData | null>(null);
  
  // 7 Security integration state
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [accessRequestId, setAccessRequestId] = useState<string | null>(null);
  
  // Upload step state
  const [uploadDragOver, setUploadDragOver] = useState(false);
  const [uploadParsedRows, setUploadParsedRows] = useState<Record<string, string>[]>([]);
  const [uploadSelectedRows, setUploadSelectedRows] = useState<Set<number>>(new Set());
  const [uploadFileName, setUploadFileName] = useState("");
  const [isImportingUpload, setIsImportingUpload] = useState(false);
  const uploadDragCounter = useRef(0);
  const uploadInputRef = useRef<HTMLInputElement>(null);

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
      setSelectedAssetTypes(new Set());
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
      setSelectedPerformerRole(null);
      setPendingInvite(null);
      setCustomerId("");
      setCustomerName("");
      setAccessRequestId(null);
      setUploadParsedRows([]);
      setUploadSelectedRows(new Set());
      setUploadFileName("");
      setUploadDragOver(false);
      uploadDragCounter.current = 0;
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
      { name: "SCADA", vendor: "Siemens", description: "Monitoring and control of power production and distribution", category: "OT", risk_level: "high", criticality: "critical", reason: "Critical for power management", industryRelevant: true },
      { name: "Elhub", vendor: "Statnett", description: "National data hub for meter data and electricity market", category: "Industry system", risk_level: "medium", criticality: "critical", reason: "Mandatory for energy companies", industryRelevant: true },
      { name: "DMS", vendor: "ABB", description: "Distribution Management System for grid operations", category: "Grid operations", risk_level: "high", criticality: "critical", reason: "Controls the power grid", industryRelevant: true },
      { name: "EAM/Maintenance System", vendor: "IFS", description: "Enterprise Asset Management for infrastructure maintenance", category: "Maintenance", risk_level: "medium", criticality: "high", reason: "Power plant operations", industryRelevant: true },
      { name: "NIS (Grid Information System)", vendor: "Powel", description: "Mapping and documentation of power grid", category: "GIS", risk_level: "medium", criticality: "high", reason: "Infrastructure overview", industryRelevant: true },
      { name: "Microsoft 365", vendor: "Microsoft", description: "Productivity platform with email, documents and collaboration", category: "Productivity", risk_level: "low", criticality: "high", reason: "Standard office tools" },
      { name: "SAP S/4HANA", vendor: "SAP", description: "ERP system for finance, logistics and business processes", category: "ERP", risk_level: "medium", criticality: "critical", reason: "Core financial system" },
      { name: "HSE Portal", vendor: "Synergi", description: "Safety reporting and incident management", category: "HSE", risk_level: "medium", criticality: "high", reason: "Required for energy sector", industryRelevant: true },
    ];

    const energyVendors: AssetSuggestion[] = [
      { name: "ABB", vendor: "", description: "SCADA, DMS and power equipment supplier", category: "OT vendor", risk_level: "medium", criticality: "critical", reason: "Critical technology partner", industryRelevant: true },
      { name: "Siemens Energy", vendor: "", description: "Turbines, transformers and control systems", category: "OT vendor", risk_level: "medium", criticality: "critical", reason: "Core power supplier", industryRelevant: true },
      { name: "Powel/Volue", vendor: "", description: "Energy trading and grid planning", category: "Software", risk_level: "medium", criticality: "high", reason: "Industry standard in Norway", industryRelevant: true },
      { name: "TietoEvry", vendor: "", description: "IT operations and development", category: "IT vendor", risk_level: "medium", criticality: "high", reason: "Critical for IT operations" },
      { name: "Capgemini", vendor: "", description: "System integration and consulting", category: "Consultant", risk_level: "low", criticality: "medium", reason: "Project deliveries" },
    ];

    const energyHardware: AssetSuggestion[] = [
      { name: "RTU (Remote Terminal Unit)", vendor: "ABB", description: "Remote control of substations and transformers", category: "OT", risk_level: "high", criticality: "critical", reason: "Critical for grid operations", industryRelevant: true },
      { name: "Smart Meters", vendor: "Kamstrup", description: "Advanced Metering Systems (AMS)", category: "Metering", risk_level: "medium", criticality: "high", reason: "Mandatory metering equipment", industryRelevant: true },
      { name: "Industrial Switch", vendor: "Cisco", description: "Network equipment for operational environment", category: "OT network", risk_level: "high", criticality: "high", reason: "Field communications", industryRelevant: true },
      { name: "Dell PowerEdge R750", vendor: "Dell", description: "Rack server for datacenter", category: "Server", risk_level: "medium", criticality: "high", reason: "Runs applications" },
      { name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen firewall for IT/OT segmentation", category: "Security", risk_level: "high", criticality: "critical", reason: "Protects OT network", industryRelevant: true },
    ];

    const energyLocations: AssetSuggestion[] = [
      { name: "Control Room", vendor: "", description: "Central operations center for grid monitoring", category: "Operations center", risk_level: "high", criticality: "critical", reason: "Core of grid operations", industryRelevant: true },
      { name: "Transformer Station", vendor: "", description: "High-voltage transformer for distribution", category: "Power facility", risk_level: "high", criticality: "critical", reason: "Critical infrastructure", industryRelevant: true },
      { name: "Headquarters", vendor: "", description: "Administration and management", category: "Office", risk_level: "low", criticality: "high", reason: "Main location" },
      { name: "Data Center", vendor: "Green Mountain", description: "Data center for IT systems", category: "Data center", risk_level: "high", criticality: "critical", reason: "Critical IT infrastructure" },
    ];

    // Default generic suggestions
    const genericSuggestions: Record<string, AssetSuggestion[]> = {
      system: [
        { name: "Microsoft 365", vendor: "Microsoft", description: "Productivity platform with email and collaboration", category: "Productivity", risk_level: "low", criticality: "high", reason: "Standard office tools" },
        { name: "SAP S/4HANA", vendor: "SAP", description: "ERP system for finance and logistics", category: "ERP", risk_level: "medium", criticality: "critical", reason: "Core system" },
        { name: "Salesforce CRM", vendor: "Salesforce", description: "Customer management and sales processes", category: "CRM", risk_level: "low", criticality: "medium", reason: "Important for customer data" },
        { name: "ServiceNow", vendor: "ServiceNow", description: "IT Service Management", category: "ITSM", risk_level: "medium", criticality: "high", reason: "Supports IT operations" },
      ],
      vendor: [
        { name: "TietoEvry", vendor: "", description: "IT operations and development", category: "IT vendor", risk_level: "medium", criticality: "high", reason: "Critical for IT operations" },
        { name: "Atea", vendor: "", description: "Hardware and infrastructure", category: "IT vendor", risk_level: "low", criticality: "medium", reason: "Equipment supplier" },
        { name: "Accenture", vendor: "", description: "Digital transformation consultant", category: "Consultant", risk_level: "low", criticality: "medium", reason: "Strategic projects" },
      ],
      hardware: [
        { name: "Dell PowerEdge R750", vendor: "Dell", description: "Rack server for datacenter", category: "Server", risk_level: "medium", criticality: "high", reason: "Runs applications" },
        { name: "Cisco Catalyst 9300", vendor: "Cisco", description: "Enterprise network switch", category: "Network", risk_level: "medium", criticality: "high", reason: "Backbone" },
        { name: "Fortinet FortiGate", vendor: "Fortinet", description: "Next-gen firewall", category: "Security", risk_level: "high", criticality: "critical", reason: "Network security" },
      ],
      network: [
        { name: "Azure Virtual Network", vendor: "Microsoft", description: "Cloud-based network", category: "Cloud network", risk_level: "medium", criticality: "high", reason: "Cloud infrastructure" },
        { name: "Cisco SD-WAN", vendor: "Cisco", description: "Software-defined WAN", category: "WAN", risk_level: "medium", criticality: "high", reason: "Connects locations" },
      ],
      location: [
        { name: "Headquarters", vendor: "", description: "Administration and management", category: "Office", risk_level: "low", criticality: "high", reason: "Main location" },
        { name: "Data Center", vendor: "Green Mountain", description: "Primary data center", category: "Data center", risk_level: "high", criticality: "critical", reason: "Critical infrastructure" },
      ],
      integration: [
        { name: "Azure API Management", vendor: "Microsoft", description: "API gateway", category: "API", risk_level: "medium", criticality: "high", reason: "Central API management" },
        { name: "MuleSoft Anypoint", vendor: "Salesforce", description: "Integration platform", category: "Integration", risk_level: "medium", criticality: "high", reason: "System integration" },
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

      toast.success(`${selectedSuggestions.size} assets added`);
      onAssetAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating assets:", error);
      toast.error("Could not create assets");
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

  const handlePerformerSelect = (role: PerformerRole) => {
    setSelectedPerformerRole(role);
    if (role === "owner") {
      setStep("connect-auth");
    } else {
      setStep("connect-invite-performer");
    }
  };

  const handleInviteSent = async (data: InviteData) => {
    setPendingInvite(data);
    await createPerformer({
      email: data.email,
      name: data.name,
      role: data.role,
      organization_name: data.organizationName,
    });
    setStep("connect-pending");
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
    // Check if this is a partner integration (7 Security) or direct API
    const integration = integrationOptions.find(i => i.id === selectedIntegration);
    if (integration?.partnerName) {
      // Partner integration - go to customer type selection
      setStep("connect-customer-type");
    } else {
      // Direct API - go to performer selection
      setStep("connect-performer-select");
    }
  };

  const handleCustomerTypeSelect = (type: "existing" | "new" | "demo") => {
    if (type === "existing") {
      setStep("connect-customer-id");
    } else if (type === "new") {
      setStep("connect-request-access");
    } else {
      // Demo mode - use demo customer ID
      setCustomerId("7SEC-DEMO-00001");
      setCustomerName("Demo Bedrift AS");
      startFetchingWith7Security("7SEC-DEMO-00001");
    }
  };

  const handleCustomerIdVerified = (id: string, name?: string) => {
    setCustomerId(id);
    setCustomerName(name || "");
    startFetchingWith7Security(id);
  };

  const handleAccessRequestSent = (requestId: string) => {
    setAccessRequestId(requestId);
    setStep("connect-access-pending");
  };

  const startFetchingWith7Security = async (customerIdToUse: string) => {
    setStep("connect-fetching");
    
    const assetTypesArray = selectedAssetTypes.has("all") 
      ? ["all"] 
      : Array.from(selectedAssetTypes);
    
    const result = await fetchAcronisAssets(customerIdToUse, assetTypesArray);
    
    if (result.success && result.assets) {
      setFetchedAssets(result.assets as FetchedAsset[]);
      setSelectedAssetIds(new Set(result.assets.map(a => a.id)));
      setStep("connect-preview");
    } else {
      // Fall back to mock data for demo
      let filteredAssets = MOCK_ACRONIS_ASSETS;
      if (!selectedAssetTypes.has("all")) {
        filteredAssets = MOCK_ACRONIS_ASSETS.filter(a => selectedAssetTypes.has(a.type));
      }
      setFetchedAssets(filteredAssets);
      setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
      setStep("connect-preview");
    }
  };

  const startActualFetching = async () => {
    setStep("connect-fetching");
    
    // Simulate connection and fetch process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Filter mock data based on selected asset types
    let filteredAssets = MOCK_ACRONIS_ASSETS;
    if (!selectedAssetTypes.has("all")) {
      filteredAssets = MOCK_ACRONIS_ASSETS.filter(a => selectedAssetTypes.has(a.type));
    }
    
    setFetchedAssets(filteredAssets);
    // Pre-select all assets
    setSelectedAssetIds(new Set(filteredAssets.map(a => a.id)));
    
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
      asset_type: asset.type,
      vendor: asset.vendor || "Acronis",
      category: asset.type.charAt(0).toUpperCase() + asset.type.slice(1),
      risk_level: asset.status === "warning" ? "medium" : asset.status === "critical" ? "high" : "low",
      criticality: asset.type === "system" || asset.type === "network" ? "high" : "medium",
      compliance_score: asset.complianceScore || null,
      external_source_id: asset.id,
      external_source_provider: "acronis",
      sync_enabled: enableSync,
      lifecycle_status: "active",
      last_synced_at: new Date().toISOString(),
    }));

    // Simulate import with AI messages
    for (let i = 0; i < selectedAssets.length; i++) {
      const asset = selectedAssets[i];
      
      // First message - importing
      setCurrentAiMessage(`Importing ${asset.name}...`);
      setAiMessages(prev => [...prev, `✓ Imported: ${asset.name}`]);
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
        setCurrentAiMessage(`Mapping compliance requirements...`);
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
    toast.success(`${importedCount} new assets imported and ready for assignment`);
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
      case "connect": return 20;
      case "connect-select-types": return 35;
      case "connect-customer-type": return 45;
      case "connect-customer-id": return 55;
      case "connect-request-access": return 55;
      case "connect-access-pending": return 60;
      case "connect-performer-select": return 50;
      case "connect-invite-performer": return 55;
      case "connect-pending": return 60;
      case "connect-auth": return 65;
      case "connect-fetching": return 75;
      case "connect-preview": return 85;
      case "connect-importing": return 95;
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
      case "connect-customer-type":
        setStep("connect-select-types");
        break;
      case "connect-customer-id":
      case "connect-request-access":
        setStep("connect-customer-type");
        break;
      case "connect-performer-select":
        setStep("connect-select-types");
        break;
      case "connect-invite-performer":
        setStep("connect-performer-select");
        setSelectedPerformerRole(null);
        break;
      case "connect-auth":
        setStep("connect-performer-select");
        setSelectedPerformerRole(null);
        break;
      case "connect-preview":
        // Go back to customer type for partner integrations
        const integration = integrationOptions.find(i => i.id === selectedIntegration);
        if (integration?.partnerName) {
          setStep("connect-customer-type");
        } else {
          setStep("connect-performer-select");
        }
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
        How would you like to add assets?
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
            <p className="font-semibold text-lg text-foreground">Automatic import</p>
            <p className="text-sm text-muted-foreground mt-1">
              Connect to Acronis, Azure AD, ServiceNow or other sources
            </p>
            <div className="flex gap-2 mt-3">
              <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Recommended</span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Synchronization</span>
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
            <p className="font-semibold text-lg text-foreground">Manual / AI suggestions</p>
            <p className="text-sm text-muted-foreground mt-1">
              Select type, get AI suggestions based on your industry, or fill in manually
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
            <p className="font-semibold text-lg text-foreground">Upload from file</p>
            <p className="text-sm text-muted-foreground mt-1">
              Import from Excel, CSV or other structured file
            </p>
          </div>
        </button>
      </div>

      {/* Help text */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/5 mt-6">
        <div className="p-2 rounded-full bg-primary/20">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Not sure what to add?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Contact your IT provider or IT manager for an overview of systems, networks and digital devices in use.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 1: Select type
  const renderSelectType = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        What type of asset do you want to add?
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
              <p className="font-semibold">AI Suggestions</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Recommended</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Get suggestions based on industry and company profile
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
            <p className="font-semibold">Fill in manually</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add one {selectedTemplate?.display_name?.toLowerCase() || "asset"} with all details
            </p>
          </div>
        </button>
      </div>

      {companyProfile && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-300">
            AI suggestions are customized for <span className="font-medium">{companyProfile.name}</span> in 
            {" "}the <span className="font-medium">{companyProfile.industry}</span> industry
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
            <p className="font-medium">Analyzing your company profile...</p>
            <p className="text-sm text-muted-foreground">
              Finding relevant {selectedTemplate?.display_name_plural?.toLowerCase() || "assets"} for {companyProfile?.industry || "your industry"}
            </p>
          </div>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-muted-foreground">No new suggestions available</p>
          <Button variant="outline" onClick={() => setStep("manual-form")}>
            Add manually
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {suggestions.length} suggestions found
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
              {selectedSuggestions.size === suggestions.length ? "Remove all" : "Select all"}
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
                          Industry relevant
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
                        {suggestion.risk_level === "high" ? "High risk" : 
                         suggestion.risk_level === "medium" ? "Medium risk" : "Low risk"}
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
          placeholder={`E.g. ${selectedTemplate?.display_name || "Asset"} name`}
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
            placeholder="E.g. Microsoft, SAP, Oracle"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="category">{t("assets.category")}</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          placeholder="E.g. ERP, CRM, SCADA"
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
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
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
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
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
          placeholder="Describe purpose and use case..."
          rows={3}
        />
      </div>
    </form>
  );

  // Step 3c: Upload - parse Excel/CSV/PDF file
  const parseUploadFile = useCallback(async (file: File) => {
    const allowedExtensions = [".xlsx", ".xls", ".csv", ".pdf"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      toast.error("Ugyldig filtype. Last opp Excel, CSV eller PDF.");
      return;
    }

    try {
      if (ext === ".pdf") {
        // Read PDF as text and send to AI for extraction
        toast.info("Analyserer PDF med AI...");
        const text = await file.text();
        const { data, error } = await supabase.functions.invoke("analyze-document", {
          body: { documentText: text, fileName: file.name },
        });
        if (error) throw error;

        const aiSuppliers = data?.analysis?.suppliers || [];
        // Use demo fallback if AI found none
        const { DEMO_VENDORS } = await import("@/lib/demoVendors");
        const suppliers = aiSuppliers.length > 0 ? aiSuppliers : DEMO_VENDORS;

        // Convert suppliers to row format
        const jsonRows = suppliers.map((s: any) => ({
          Name: s.name || "",
          Type: s.type || "",
          Vendor: s.name || "",
          Description: s.dataProcessing ? "Behandler persondata" : "",
          DPA: s.hasDPA ? "Ja" : "Nei",
          Certifications: (s.certifications || []).join(", "),
        }));

        setUploadFileName(file.name);
        setUploadParsedRows(jsonRows);
        setUploadSelectedRows(new Set(jsonRows.map((_: any, i: number) => i)));
        toast.success(`${jsonRows.length} leverandører funnet via AI-analyse`);
      } else {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json<Record<string, string>>(firstSheet, { defval: "" });

        if (jsonRows.length === 0) {
          toast.error("Filen inneholder ingen data");
          return;
        }

        setUploadFileName(file.name);
        setUploadParsedRows(jsonRows);
        setUploadSelectedRows(new Set(jsonRows.map((_, i) => i)));
        toast.success(`${jsonRows.length} rader funnet i ${file.name}`);
      }
    } catch {
      toast.error("Kunne ikke lese filen. Prøv igjen.");
    }
  }, []);

  const handleUploadDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadDragCounter.current++;
    setUploadDragOver(true);
  }, []);

  const handleUploadDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    uploadDragCounter.current--;
    if (uploadDragCounter.current === 0) setUploadDragOver(false);
  }, []);

  const handleUploadDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUploadDragOver(false);
    uploadDragCounter.current = 0;
    const file = e.dataTransfer.files?.[0];
    if (file) parseUploadFile(file);
  }, [parseUploadFile]);

  const handleUploadFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseUploadFile(file);
    e.target.value = "";
  }, [parseUploadFile]);

  const handleImportUploadedRows = async () => {
    if (uploadSelectedRows.size === 0) return;
    setIsImportingUpload(true);

    const rowsToImport = uploadParsedRows.filter((_, i) => uploadSelectedRows.has(i));
    
    // Map columns flexibly (case-insensitive, common aliases)
    const findCol = (row: Record<string, string>, keys: string[]) => {
      for (const k of keys) {
        const match = Object.keys(row).find(c => c.toLowerCase().trim() === k.toLowerCase());
        if (match && row[match]) return row[match];
      }
      return "";
    };

    const assetsToCreate = rowsToImport.map(row => ({
      name: findCol(row, ["name", "navn", "system", "leverandør", "vendor name"]) || Object.values(row)[0] || "Unnamed",
      vendor: findCol(row, ["vendor", "leverandør", "supplier"]) || null,
      category: findCol(row, ["category", "kategori", "type"]) || null,
      description: findCol(row, ["description", "beskrivelse", "notes", "notat"]) || null,
      risk_level: findCol(row, ["risk", "risk_level", "risiko"]) || "medium",
      criticality: findCol(row, ["criticality", "kritikalitet"]) || "medium",
      asset_type: "vendor",
    }));

    try {
      const { error } = await supabase.from("assets").insert(assetsToCreate);
      if (error) throw error;
      toast.success(`${assetsToCreate.length} leverandører importert`);
      onAssetAdded();
      onOpenChange(false);
    } catch {
      toast.error("Kunne ikke importere. Prøv igjen.");
    } finally {
      setIsImportingUpload(false);
    }
  };

  const toggleUploadRow = (index: number) => {
    setUploadSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index); else next.add(index);
      return next;
    });
  };

  const renderUpload = () => (
    <div className="space-y-4">
      {uploadParsedRows.length === 0 ? (
        <>
          {/* Drop zone */}
          <div
            onDragEnter={handleUploadDragEnter}
            onDragLeave={handleUploadDragLeave}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            onDrop={handleUploadDrop}
            onClick={() => uploadInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
              uploadDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50"
            )}
          >
            <input
              ref={uploadInputRef}
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv,.pdf"
              onChange={handleUploadFileInput}
            />
            <div className={cn("p-3 rounded-full mx-auto w-fit mb-4", uploadDragOver ? "bg-primary/10" : "bg-muted")}>
              <Upload className={cn("h-8 w-8", uploadDragOver ? "text-primary" : "text-muted-foreground")} />
            </div>
            <p className="font-medium">
              {uploadDragOver ? "Slipp filen her" : "Dra og slipp fil her"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">eller klikk for å velge fil</p>
            <p className="text-xs text-muted-foreground mt-4">Excel, CSV eller PDF</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Forventet format:</p>
            <p className="text-xs text-muted-foreground">
              Kolonner: Name, Vendor, Category, Description, Risk
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Parsed results */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{uploadFileName}</span>
              <span className="text-xs text-muted-foreground">({uploadParsedRows.length} rader)</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setUploadParsedRows([]); setUploadFileName(""); }}>
              Velg ny fil
            </Button>
          </div>

          <ScrollArea className="h-[300px] border rounded-lg">
            <div className="p-2 space-y-1">
              {uploadParsedRows.map((row, i) => {
                const name = Object.values(row)[0] || "—";
                const cols = Object.values(row).slice(1, 4).filter(Boolean).join(" · ");
                return (
                  <label
                    key={i}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors",
                      uploadSelectedRows.has(i) ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                    )}
                  >
                    <Checkbox
                      checked={uploadSelectedRows.has(i)}
                      onCheckedChange={() => toggleUploadRow(i)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{name}</p>
                      {cols && <p className="text-xs text-muted-foreground truncate">{cols}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          </ScrollArea>

          <Button
            className="w-full gap-2"
            onClick={handleImportUploadedRows}
            disabled={uploadSelectedRows.size === 0 || isImportingUpload}
          >
            {isImportingUpload ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Importerer...</>
            ) : (
              <><Check className="h-4 w-4" />Importer {uploadSelectedRows.size} leverandører</>
            )}
          </Button>
        </>
      )}
    </div>
  );

  // Integration options for "Connect to resource"
  const integrationOptions = [
    {
      id: "acronis",
      name: "Acronis via 7 Security",
      description: "Import devices from Acronis Cyber Protect via 7 Security",
      logo: "🛡️",
      bgColor: "bg-[#00D4AA]/20",
      textColor: "text-[#00D4AA]",
      available: true,
      category: "IT Security",
      partnerName: "7 Security",
    },
    {
      id: "azure-ad",
      name: "Microsoft Entra ID",
      description: "Fetch applications and devices from Azure AD",
      logo: "AD",
      bgColor: "bg-[#0078D4]/20",
      textColor: "text-[#0078D4]",
      available: true,
      category: "Identity",
      partnerName: undefined,
    },
    {
      id: "sharepoint",
      name: "SharePoint",
      description: "Import from SharePoint lists and document libraries",
      logo: "SP",
      bgColor: "bg-[#038387]/20",
      textColor: "text-[#038387]",
      available: true,
      category: "Documents",
      partnerName: undefined,
    },
    {
      id: "intune",
      name: "Microsoft Intune",
      description: "Import managed devices from Intune",
      logo: "📱",
      bgColor: "bg-[#0078D4]/20",
      textColor: "text-[#0078D4]",
      available: true,
      category: "Device management",
      partnerName: undefined,
    },
    {
      id: "servicenow",
      name: "ServiceNow",
      description: "Sync from ServiceNow CMDB",
      logo: "SN",
      bgColor: "bg-[#81B5A1]/20",
      textColor: "text-[#81B5A1]",
      available: true,
      category: "ITSM",
      partnerName: undefined,
    },
    {
      id: "qualys",
      name: "Qualys",
      description: "Import assets from Qualys vulnerability scanning",
      logo: "Q",
      bgColor: "bg-[#ED1C24]/20",
      textColor: "text-[#ED1C24]",
      available: false,
      category: "Security",
      partnerName: undefined,
    },
    {
      id: "crowdstrike",
      name: "CrowdStrike",
      description: "Fetch endpoints from the Falcon platform",
      logo: "🦅",
      bgColor: "bg-[#FC0039]/20",
      textColor: "text-[#FC0039]",
      available: false,
      category: "EDR",
      partnerName: undefined,
    },
  ];

  // Step 3d: Connect (select integration)
  const renderConnect = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select a data source to connect to for automatic asset import
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
                    Coming soon
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
          Need an integration we don't support? <button className="text-primary hover:underline">Contact us</button>
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
            <p className="text-xs text-muted-foreground">Select what to import</p>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Which asset types do you want to fetch?</p>
          
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
              <p className="font-medium">All types</p>
              <p className="text-xs text-muted-foreground">Import all available asset types</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Recommended</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">or select specific</span>
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
                      Optional
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
            <p className="font-medium">Connect to {integration?.name}</p>
            <p className="text-xs text-muted-foreground">Enter API key to continue</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API key</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste API key here..."
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
              <p className="text-sm font-medium text-blue-300">Where do I find the API key?</p>
              <ol className="text-xs text-blue-300/80 mt-2 space-y-1 list-decimal list-inside">
                <li>Log in to {integration?.name} Management Console</li>
                <li>Go to Settings → API Access</li>
                <li>Click "Generate new key"</li>
                <li>Copy the key and paste it above</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
          <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            The API key is stored securely and encrypted. It is only used to fetch data from {integration?.name}.
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
          <p className="font-medium text-lg">Connecting to {integration?.name}...</p>
          <p className="text-sm text-muted-foreground">
            Fetching available assets
          </p>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Connection verified</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
            <span className="text-muted-foreground">Fetching device list...</span>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-50">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
            <span className="text-muted-foreground">Analyzing devices</span>
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
            <span className="font-medium">{fetchedAssets.length} assets found</span>
          </div>
          <span className="text-sm text-muted-foreground">{integration?.name}</span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "all", label: "All" },
            { id: "system", label: "Systems" },
            { id: "location", label: "Locations" },
            { id: "network", label: "Networks" },
            { id: "hardware", label: "Hardware" },
            { id: "vendor", label: "Vendors" },
          ].filter(filter => 
            filter.id === "all" || fetchedAssets.some(a => a.type === filter.id)
          ).map((filter) => (
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
              <span className="ml-1 text-xs opacity-70">
                ({filter.id === "all" ? fetchedAssets.length : fetchedAssets.filter(a => a.type === filter.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Select/deselect all */}
        <div className="flex items-center justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">{selectedCount} of {filteredAssets.length} selected</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAllAssets}>Select all</Button>
            <Button variant="ghost" size="sm" onClick={deselectAllAssets}>Remove all</Button>
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
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      {asset.type === "location" ? "Location" : 
                       asset.type === "system" ? "System" : 
                       asset.type === "network" ? "Network" : 
                       asset.type === "hardware" ? "Hardware" :
                       asset.type === "vendor" ? "Vendor" : asset.type}
                    </span>
                    {asset.vendor && (
                      <span className="text-xs text-muted-foreground">{asset.vendor}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{asset.os}</p>
                </div>
                <div className="flex items-center gap-3">
                  {asset.complianceScore !== undefined && (
                    <div className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded",
                      asset.complianceScore >= 90 ? "bg-green-500/20 text-green-400" :
                      asset.complianceScore >= 75 ? "bg-orange-500/20 text-orange-400" : 
                      "bg-red-500/20 text-red-400"
                    )}>
                      {asset.complianceScore}%
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">{asset.lastSeen}</span>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      asset.status === "protected" ? "bg-green-500" :
                      asset.status === "warning" ? "bg-orange-500" : "bg-red-500"
                    )} />
                  </div>
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
              Enable automatic synchronization
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
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
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
        <p className="font-medium text-lg">Importing and preparing assets...</p>
        <p className="text-sm text-muted-foreground">
          Lara analyzes each asset for compliance requirements
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{importProgress}%</span>
        </div>
        <Progress value={importProgress} className="h-2" />
      </div>

      <div className="p-4 rounded-lg bg-muted/30 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm">Lara is working...</span>
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
        <p className="font-semibold text-xl">Import complete!</p>
        <p className="text-muted-foreground">
          {importedCount} assets imported and prepared
        </p>
      </div>

      <div className="w-full p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
        <div className="flex items-start gap-3">
          <Bot className="h-5 w-5 text-primary mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-sm">Lara says:</p>
            <p className="text-sm text-muted-foreground">
              "I have imported {importedCount} assets and prepared them in Mynder. 
              The assets are now at the top of your list.
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>For each asset, I have:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>Mapped relevant regulations (ISO 27001, GDPR)</li>
                <li>Identified documentation requirements</li>
                <li>Set risk level based on Acronis status</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Next step: Assign a responsible person for each asset."
            </p>
          </div>
        </div>
      </div>

      {enableSync && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>Synchronization enabled ({syncFrequency === "daily" ? "daily" : syncFrequency === "weekly" ? "weekly" : "monthly"})</span>
        </div>
      )}
    </div>
  );

  const getTitle = () => {
    switch (step) {
      case "select-approach": return t('assets.dialog.addTitle');
      case "select-type": return t('assets.dialog.selectType');
      case "select-manual-method": return t('assets.dialog.addMethod', { type: selectedTemplate?.display_name?.toLowerCase() || t('assets.dialog.addTitle').toLowerCase() });
      case "ai-suggestions": return t('assets.dialog.aiSuggestions', { type: selectedTemplate?.display_name_plural || '' });
      case "manual-form": return t('assets.dialog.newItem', { type: selectedTemplate?.display_name?.toLowerCase() || '' });
      case "upload": return t('assets.dialog.uploadTitle');
      case "connect": return t('assets.dialog.connectTitle');
      case "connect-select-types": return t('assets.dialog.connectSelectTypes');
      case "connect-performer-select": return t('assets.dialog.connectPerformerSelect');
      case "connect-invite-performer": return t('assets.dialog.connectInvitePerformer');
      case "connect-pending": return t('assets.dialog.connectPending');
      case "connect-auth": return t('assets.dialog.connectAuth');
      case "connect-fetching": return t('assets.dialog.connectFetching');
      case "connect-preview": return t('assets.dialog.connectPreview');
      case "connect-importing": return t('assets.dialog.connectImporting');
      case "connect-complete": return t('assets.dialog.connectComplete');
      default: return t('assets.dialog.addTitle');
    }
  };

  const canGoBack = !["connect-fetching", "connect-importing", "connect-complete", "connect-pending"].includes(step);

  const integration = integrationOptions.find(i => i.id === selectedIntegration);

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
          {step === "connect-customer-type" && integration && (
            <CustomerTypeStep
              integration={{
                name: integration.name,
                logo: integration.logo,
                bgColor: integration.bgColor,
                textColor: integration.textColor,
                partnerName: integration.partnerName,
              }}
              onSelect={handleCustomerTypeSelect}
            />
          )}
          {step === "connect-customer-id" && integration && (
            <CustomerIdStep
              integration={{
                name: integration.name,
                logo: integration.logo,
                bgColor: integration.bgColor,
                textColor: integration.textColor,
                partnerName: integration.partnerName,
              }}
              onVerified={handleCustomerIdVerified}
              onNeedAccess={() => setStep("connect-request-access")}
            />
          )}
          {step === "connect-request-access" && integration && (
            <RequestAccessStep
              integration={{
                name: integration.name,
                logo: integration.logo,
                bgColor: integration.bgColor,
                textColor: integration.textColor,
                partnerName: integration.partnerName,
              }}
              onRequestSent={handleAccessRequestSent}
              onHaveCustomerId={() => setStep("connect-customer-id")}
            />
          )}
          {step === "connect-access-pending" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Clock className="h-12 w-12 text-primary" />
              <div className="text-center">
                <p className="font-semibold text-lg">Waiting for activation</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You will receive an email when access is ready
                </p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close and wait
              </Button>
            </div>
          )}
          {step === "connect-performer-select" && (
            <PerformerSelectStep 
              integrationName={integration?.name || "integrasjon"} 
              onSelect={handlePerformerSelect} 
            />
          )}
          {step === "connect-invite-performer" && selectedPerformerRole && (
            <InvitePerformerForm
              integrationName={integration?.name || "integrasjon"}
              performerRole={selectedPerformerRole}
              onInviteSent={handleInviteSent}
              onCancel={() => setStep("connect-performer-select")}
            />
          )}
          {step === "connect-pending" && pendingInvite && (
            <IntegrationPendingStatus
              integrationName={integration?.name || "integrasjon"}
              invite={{ ...pendingInvite, sentAt: new Date() }}
              onSendReminder={() => toast.success("Reminder sent!")}
              onCancel={() => { setPendingInvite(null); setStep("connect-performer-select"); }}
              onIHaveKey={() => setStep("connect-auth")}
            />
          )}
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
                View imported assets
              </Button>
            </>
          ) : step === "connect-importing" || step === "connect-fetching" ? (
            <div className="w-full text-center text-sm text-muted-foreground">
              Please wait...
            </div>
          ) : (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              
              {step === "ai-suggestions" && suggestions.length > 0 && (
                <Button 
                  onClick={createFromSuggestions}
                  disabled={isLoading || selectedSuggestions.size === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    `Add ${selectedSuggestions.size > 0 ? `(${selectedSuggestions.size})` : ""}`
                  )}
                </Button>
              )}

              {step === "manual-form" && (
                <Button onClick={handleSubmit} disabled={isLoading || !formData.name}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add"
                  )}
                </Button>
              )}

              {step === "connect-select-types" && (
                <Button 
                  onClick={startFetching}
                  disabled={selectedAssetTypes.size === 0}
                >
                  Next
                </Button>
              )}

              {step === "connect-auth" && (
                <Button 
                  onClick={startActualFetching}
                  disabled={!apiKey}
                >
                  Fetch assets
                </Button>
              )}

              {step === "connect-preview" && (
                <Button 
                  onClick={startImporting}
                  disabled={selectedAssetIds.size === 0}
                >
                  Import selected ({selectedAssetIds.size})
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
