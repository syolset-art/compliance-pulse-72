import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVendorLookup, VendorSearchResult } from "@/hooks/useVendorLookup";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Building2,
  Search,
  Users,
  Globe,
  MapPin,
  Briefcase,
  Check,
  ArrowLeft,
  ArrowRight,
  Database,
  PenLine,
  Loader2,
  Cloud,
  Server,
  Lightbulb,
  Monitor,
  Home,
  MoreHorizontal,
  Sparkles,
  Upload,
  FileText,
  Link2,
  AlertTriangle,
  Crown,
  CheckCircle2,
  Shield,
  ExternalLink,
} from "lucide-react";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorAdded?: () => void;
}

type Step = "quantity" | "method" | "search" | "categorize" | "contact" | "confirm" | "file-upload" | "file-analyzing" | "file-results" | "scan-limit";
type Mode = "single" | "multiple";
type Country = "NO" | "SE" | "DK" | "other";
type VendorCategory = "saas" | "infrastructure" | "consulting" | "it_operations" | "facilities" | "other";
type GdprRole = "databehandler" | "underdatabehandler" | "ingen";
type DocumentType = "vendor_list" | "policy" | "dpa" | "dpia" | "certificate" | "report" | "other";

const SCAN_LIMIT = 5;
const SCAN_COUNTER_KEY = "mynder_scan_count";

function getScanCount(): number {
  try {
    return parseInt(localStorage.getItem(SCAN_COUNTER_KEY) || "0", 10);
  } catch { return 0; }
}
function incrementScanCount(): number {
  const next = getScanCount() + 1;
  localStorage.setItem(SCAN_COUNTER_KEY, String(next));
  return next;
}

const STEPS_SINGLE: Step[] = ["quantity", "search", "categorize", "contact", "confirm"];

const VENDOR_CATEGORIES: { value: VendorCategory; label: string; icon: React.ReactNode }[] = [
  { value: "saas", label: "SaaS / Skytjeneste", icon: <Cloud className="h-5 w-5" /> },
  { value: "infrastructure", label: "Infrastruktur / IaaS", icon: <Server className="h-5 w-5" /> },
  { value: "consulting", label: "Rådgivning", icon: <Lightbulb className="h-5 w-5" /> },
  { value: "it_operations", label: "IT-drift", icon: <Monitor className="h-5 w-5" /> },
  { value: "facilities", label: "Kontor og fasiliteter", icon: <Home className="h-5 w-5" /> },
  { value: "other", label: "Annet", icon: <MoreHorizontal className="h-5 w-5" /> },
];

const GDPR_ROLES: { value: GdprRole; label: string; description: string }[] = [
  { value: "databehandler", label: "Databehandler", description: "Behandler personopplysninger på vegne av dere (krever DPA)" },
  { value: "underdatabehandler", label: "Underdatabehandler", description: "Brukes av en av deres databehandlere" },
  { value: "ingen", label: "Ingen persondata", description: "Ingen tilgang til personopplysninger" },
];

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: "vendor_list", label: "Leverandørliste" },
  { value: "policy", label: "Personvernpolicy" },
  { value: "dpa", label: "Databehandleravtale (DPA)" },
  { value: "dpia", label: "DPIA" },
  { value: "certificate", label: "Sertifikat" },
  { value: "report", label: "Rapport" },
  { value: "other", label: "Annet" },
];

const countryFlags: Record<Country, string> = { NO: "🇳🇴", SE: "🇸🇪", DK: "🇩🇰", other: "🌍" };
const countryLabels: Record<Country, string> = { NO: "Norge", SE: "Sverige", DK: "Danmark", other: "Annet" };

interface ClassificationResult {
  documentType: DocumentType;
  documentTypeLabel: string;
  confidence: number;
  summary: string;
  extractedVendors: { name: string; description?: string }[];
}

// Helper: determine if a Trust Profile is "verified" (self-managed) vs AI-generated
function isVerifiedTrustProfile(result: VendorSearchResult): boolean {
  return (result.publishMode != null && result.publishMode !== "private") || (result.documentCount != null && result.documentCount > 0);
}

// --- Trust Profile Badge ---
function TrustProfileBadge({ result }: { result: VendorSearchResult }) {
  const verified = isVerifiedTrustProfile(result);
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        <Shield className="h-3 w-3" /> Verifisert Trust Profile
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[13px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
      <Sparkles className="h-3 w-3" /> AI-generert profil
    </span>
  );
}

// --- Animated analysis steps component ---
function AnalysisAnimation({ currentPhase }: { currentPhase: number }) {
  const phases = [
    "Leser dokumentinnhold",
    "Identifiserer dokumenttype",
    "Henter ut data",
    "Sjekker compliance-informasjon",
  ];
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/20">
          <Sparkles className="h-7 w-7 text-primary animate-pulse" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">Identifiserer dokumenttype...</h3>
      <div className="w-full max-w-xs space-y-2">
        {phases.map((label, i) => (
          <div key={i} className="flex items-center gap-3">
            {i < currentPhase ? (
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            ) : i === currentPhase ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
            )}
            <span className={cn(
              "text-sm transition-all",
              i < currentPhase && "text-muted-foreground",
              i === currentPhase && "font-semibold text-foreground",
              i > currentPhase && "text-muted-foreground/50"
            )}>
              {label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// --- Scan limit banner ---
function ScanLimitBanner({ used, limit }: { used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const pct = (used / limit) * 100;
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">AI-skanninger</span>
        <span className="font-semibold">{remaining} av {limit} igjen</span>
      </div>
      <div className="relative h-2 w-full rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct < 60 ? 'hsl(var(--primary))' : pct < 80 ? 'hsl(45, 93%, 47%)' : 'hsl(0, 84%, 60%)',
          }}
        />
      </div>
    </div>
  );
}

// --- Existing vendor warning card ---
function ExistingVendorCard({ vendor, onOpenProfile, onClose }: { vendor: VendorSearchResult; onOpenProfile: () => void; onClose: () => void }) {
  return (
    <div className="rounded-lg border-2 border-yellow-500/40 bg-yellow-50/50 dark:bg-yellow-900/10 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground">Denne leverandøren finnes allerede</h4>
          <p className="text-xs text-muted-foreground mt-1">
            <strong>{vendor.name}</strong> er allerede registrert i systemet.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <TrustProfileBadge result={vendor} />
        {vendor.complianceScore != null && vendor.complianceScore > 0 && (
          <span className="text-[13px] font-medium text-muted-foreground">
            Compliance: {vendor.complianceScore}%
          </span>
        )}
        {vendor.documentCount != null && vendor.documentCount > 0 && (
          <span className="text-[13px] text-muted-foreground">
            {vendor.documentCount} dokumenter
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="default" onClick={onOpenProfile} className="gap-1.5">
          <ExternalLink className="h-3.5 w-3.5" /> Åpne Trust Profile
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} className="text-xs">
          Lukk
        </Button>
      </div>
    </div>
  );
}

export function AddVendorDialog({ open, onOpenChange, onVendorAdded }: AddVendorDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { search: vendorSearch, searchInternalOnly, checkDuplicate, clearResults, results, isLoading, error } = useVendorLookup();

  const [step, setStep] = useState<Step>("quantity");
  const [mode, setMode] = useState<Mode>("single");
  const [country, setCountry] = useState<Country>("NO");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<VendorSearchResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [addedVendors, setAddedVendors] = useState<string[]>([]);
  const [vendorCategory, setVendorCategory] = useState<VendorCategory | "">("");
  const [gdprRole, setGdprRole] = useState<GdprRole | "">("");
  const [vendorDescription, setVendorDescription] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggested_description?: string;
    vendor_category?: string;
    vendor_category_reason?: string;
    gdpr_role?: string;
    gdpr_role_reason?: string;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Duplicate check state
  const [duplicateMatch, setDuplicateMatch] = useState<VendorSearchResult | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [analysisPhase, setAnalysisPhase] = useState(0);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | "">("");
  const [selectedVendorsToImport, setSelectedVendorsToImport] = useState<Set<number>>(new Set());
  const [scanCount, setScanCount] = useState(getScanCount);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetForm = useCallback(() => {
    setStep("quantity");
    setMode("single");
    setCountry("NO");
    setSearchQuery("");
    setSelected(null);
    setManualMode(false);
    setManualName("");
    setManualUrl("");
    setContactName("");
    setContactEmail("");
    setContactRole("");
    setVendorCategory("");
    setGdprRole("");
    setVendorDescription("");
    setAiSuggestion(null);
    setIsSuggesting(false);
    setUploadedFile(null);
    setClassification(null);
    setSelectedDocType("");
    setSelectedVendorsToImport(new Set());
    setDuplicateMatch(null);
    setIsCheckingDuplicate(false);
    clearResults();
  }, [clearResults]);

  const resetForNext = useCallback(() => {
    setStep("search");
    setSearchQuery("");
    setSelected(null);
    setManualMode(false);
    setManualName("");
    setManualUrl("");
    setContactName("");
    setContactEmail("");
    setContactRole("");
    setVendorCategory("");
    setGdprRole("");
    setVendorDescription("");
    setAiSuggestion(null);
    setIsSuggesting(false);
    setDuplicateMatch(null);
    setIsCheckingDuplicate(false);
    clearResults();
  }, [clearResults]);

  const createVendor = useMutation({
    mutationFn: async () => {
      const vendor = selected || {
        name: manualName,
        orgNumber: null,
        country: country,
        industry: null,
        url: manualUrl || null,
      };

      const { error: insertError } = await supabase.from("assets").insert({
        name: vendor.name,
        asset_type: "vendor",
        country: vendor.country || country,
        url: vendor.url,
        org_number: vendor.orgNumber,
        contact_person: contactName || null,
        contact_email: contactEmail || null,
        description: vendorDescription || null,
        vendor_category: vendorCategory || null,
        gdpr_role: gdprRole || null,
        metadata: {
          industry: (vendor as VendorSearchResult).industry,
          contact_role: contactRole || null,
        },
      } as any);

      if (insertError) throw insertError;
      return vendor.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("addVendor.success", "{{name}} ble lagt til", { name }));
      onVendorAdded?.();

      if (mode === "multiple") {
        setAddedVendors((prev) => [...prev, name]);
        resetForNext();
      } else {
        onOpenChange(false);
        resetForm();
      }
    },
    onError: () => {
      toast.error(t("addVendor.error", "Kunne ikke legge til leverandør"));
    },
  });

  // Bulk import vendors from classification
  const importVendors = useMutation({
    mutationFn: async (vendors: { name: string; description?: string }[]) => {
      const inserts = vendors.map((v) => ({
        name: v.name,
        asset_type: "vendor" as const,
        description: v.description || null,
      }));
      const { error: insertError } = await supabase.from("assets").insert(inserts as any);
      if (insertError) throw insertError;
      return vendors.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(`${count} leverandører ble importert`);
      onVendorAdded?.();
      onOpenChange(false);
      resetForm();
    },
    onError: () => {
      toast.error("Kunne ikke importere leverandører");
    },
  });

  const handleAiSuggest = async () => {
    const vendorName = selected?.name || manualName;
    if (!vendorName) return;
    setIsSuggesting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("suggest-vendor-category", {
        body: {
          vendorName,
          description: vendorDescription || undefined,
          industry: (selected as VendorSearchResult)?.industry || undefined,
          country: selected?.country || country,
        },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setAiSuggestion(data);
      if (data.vendor_category) setVendorCategory(data.vendor_category as VendorCategory);
      if (data.gdpr_role) setGdprRole(data.gdpr_role as GdprRole);
      if (data.suggested_description && !vendorDescription) setVendorDescription(data.suggested_description);
      toast.success(t("addVendor.aiSuggestionReady", "Lara har et forslag klart"));
    } catch (e) {
      console.error("AI suggestion error:", e);
      toast.error(t("addVendor.aiSuggestionError", "Kunne ikke hente forslag"));
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      vendorSearch(searchQuery, country);
    }
  };

  const handleSelect = (result: VendorSearchResult) => {
    if (result.existingId) {
      // Show existing vendor card instead of adding
      setDuplicateMatch(result);
      return;
    }
    setSelected(result);
    setStep("categorize");
  };

  const handleOpenExistingProfile = (id: string) => {
    onOpenChange(false);
    resetForm();
    navigate(`/assets/${id}`);
  };

  const handleManualConfirm = async () => {
    if (!manualName.trim()) return;
    setIsCheckingDuplicate(true);
    try {
      const existing = await checkDuplicate(manualName);
      if (existing) {
        setDuplicateMatch(existing);
        setIsCheckingDuplicate(false);
        return;
      }
    } catch {
      // If check fails, proceed anyway
    }
    setIsCheckingDuplicate(false);
    setSelected({
      source: "manual",
      name: manualName,
      orgNumber: null,
      country: country,
      industry: null,
      address: null,
      employees: null,
      url: manualUrl || null,
    });
    setStep("categorize");
  };

  // File handling
  const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".pdf", ".doc", ".docx", ".txt", ".json"];
  const ACCEPTED_MIME_TYPES = [
    "text/csv", "text/plain", "application/json",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  const READABLE_FORMATS_LABEL = "CSV, Excel, PDF, Word, TXT, JSON";

  const handleFileSelect = (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Filen er for stor. Maks 20 MB.");
      return;
    }
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isAccepted = ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME_TYPES.includes(file.type);
    if (!isAccepted) {
      toast.error(`Filformatet støttes ikke. Godkjente formater: ${READABLE_FORMATS_LABEL}`);
      return;
    }
    setUploadedFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const startAnalysis = async () => {
    if (!uploadedFile) return;

    if (getScanCount() >= SCAN_LIMIT) {
      setStep("scan-limit");
      return;
    }

    setStep("file-analyzing");
    setAnalysisPhase(0);

    const ext = "." + uploadedFile.name.split(".").pop()?.toLowerCase();
    const binaryFormats = [".pdf", ".xlsx", ".xls", ".doc", ".docx"];
    if (binaryFormats.includes(ext)) {
      toast.error(
        `AI kan ikke lese innholdet i ${ext.toUpperCase()}-filer direkte. Last opp filen i et tekstbasert format som CSV, TXT eller JSON for best resultat.`
      );
      setStep("file-upload");
      return;
    }

    let documentText = "";
    try {
      documentText = await uploadedFile.text();
    } catch {
      toast.error("Kunne ikke lese filen. Prøv med et annet format (CSV, TXT, JSON).");
      setStep("file-upload");
      return;
    }

    if (!documentText.trim()) {
      toast.error("Filen er tom. Last opp en fil som inneholder data.");
      setStep("file-upload");
      return;
    }

    const phaseTimer = setInterval(() => {
      setAnalysisPhase((p) => Math.min(p + 1, 3));
    }, 1200);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("classify-document", {
        body: { documentText, fileName: uploadedFile.name },
      });

      clearInterval(phaseTimer);

      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      const result = data.classification as ClassificationResult;
      setClassification(result);
      setSelectedDocType(result.documentType);
      if (result.extractedVendors?.length) {
        setSelectedVendorsToImport(new Set(result.extractedVendors.map((_, i) => i)));
      }

      const newCount = incrementScanCount();
      setScanCount(newCount);

      setAnalysisPhase(4);
      setTimeout(() => setStep("file-results"), 600);
    } catch (e) {
      clearInterval(phaseTimer);
      console.error("Classification error:", e);
      toast.error("Kunne ikke analysere dokumentet");
      setStep("file-upload");
    }
  };

  const handleImportSelected = () => {
    if (!classification?.extractedVendors) return;
    const toImport = classification.extractedVendors.filter((_, i) => selectedVendorsToImport.has(i));
    if (toImport.length === 0) {
      toast.error("Velg minst én leverandør");
      return;
    }
    importVendors.mutate(toImport);
  };

  const stepIndex = STEPS_SINGLE.indexOf(step);
  const isFileFlow = ["method", "file-upload", "file-analyzing", "file-results", "scan-limit"].includes(step);
  const fileFlowSteps = ["quantity", "method", "file-upload", "file-analyzing", "file-results"];
  const fileStepIndex = fileFlowSteps.indexOf(step);
  const progressPercent = isFileFlow
    ? ((Math.max(fileStepIndex, 0) + 1) / fileFlowSteps.length) * 100
    : ((stepIndex + 1) / STEPS_SINGLE.length) * 100;

  const sourceLabel = (source: string) => {
    switch (source) {
      case "brreg": return "Brønnøysundregistrene";
      case "cvr": return "CVR (Danmark)";
      case "bolagsverket": return "Bolagsverket";
      case "internal": return t("addVendor.internalDb", "Vår database");
      default: return "";
    }
  };

  const currentStepNum = isFileFlow ? Math.max(fileStepIndex, 0) + 1 : stepIndex + 1;
  const totalSteps = isFileFlow ? fileFlowSteps.length : STEPS_SINGLE.length;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addVendor.title", "Legg til leverandør")}</DialogTitle>
          <DialogDescription>
            {step === "file-analyzing"
              ? "Analyserer dokument..."
              : t("addVendor.step", "Steg {{current}} av {{total}}", {
                  current: currentStepNum,
                  total: totalSteps,
                })}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressPercent} className="h-1.5" />

        {/* Step: Quantity */}
        {step === "quantity" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("addVendor.howMany", "Hvor mange leverandører vil du legge til?")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMode("single"); setStep("search"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t("addVendor.singleVendor", "Én leverandør")}</span>
              </button>
              <button
                onClick={() => { setMode("multiple"); setStep("method"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Users className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t("addVendor.multipleVendors", "Flere leverandører")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Method (only for multiple) */}
        {step === "method" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Hvordan vil du legge til leverandører?
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setStep("search")}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors text-left"
              >
                <Search className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <span className="text-sm font-medium">Søk manuelt</span>
                  <p className="text-xs text-muted-foreground">Søk og legg til leverandører én om gangen</p>
                </div>
              </button>
              <button
                disabled
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-border opacity-50 cursor-not-allowed text-left"
              >
                <Link2 className="h-6 w-6 text-muted-foreground shrink-0" />
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Koble til API</span>
                  <p className="text-xs text-muted-foreground">Automatisk synkronisering</p>
                  <Badge variant="secondary" className="mt-1 text-[13px]">Kommer snart</Badge>
                </div>
              </button>
              <button
                onClick={() => setStep("file-upload")}
                className="w-full flex items-center gap-3 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors text-left"
              >
                <Upload className="h-6 w-6 text-primary shrink-0" />
                <div>
                  <span className="text-sm font-medium">Last opp fil</span>
                  <p className="text-xs text-muted-foreground">Last opp en leverandørliste, policy eller annet dokument</p>
                </div>
              </button>
            </div>
            <div className="flex justify-start pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("quantity")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
              </Button>
            </div>
          </div>
        )}

        {/* Step: File Upload */}
        {step === "file-upload" && (
          <div className="space-y-4 pt-2">
            <ScanLimitBanner used={scanCount} limit={SCAN_LIMIT} />

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                uploadedFile && "border-primary bg-primary/5"
              )}
            >
              {uploadedFile ? (
                <>
                  <FileText className="h-10 w-10 text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium">{uploadedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setUploadedFile(null); }}>
                    Velg en annen fil
                  </Button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">Dra og slipp fil her</p>
                    <p className="text-xs text-muted-foreground">eller klikk for å velge</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Støttede formater: CSV, TXT, JSON</p>
                  <p className="text-[13px] text-yellow-600 mt-1">⚠ PDF, Excel og Word kan ikke leses av AI direkte</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.txt,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("method")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
              </Button>
              <Button size="sm" onClick={startAnalysis} disabled={!uploadedFile}>
                Analyser med AI <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: File Analyzing (animated) */}
        {step === "file-analyzing" && (
          <AnalysisAnimation currentPhase={analysisPhase} />
        )}

        {/* Step: File Results */}
        {step === "file-results" && classification && (
          <div className="space-y-4 pt-2">
            <ScanLimitBanner used={scanCount} limit={SCAN_LIMIT} />

            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Vi tror dette er: <strong>{classification.documentTypeLabel}</strong>
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[13px]">
                    {Math.round(classification.confidence * 100)}% sikkerhet
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{classification.summary}</p>
              <div>
                <Label className="text-xs">Stemmer ikke? Velg riktig type:</Label>
                <Select value={selectedDocType} onValueChange={(v) => setSelectedDocType(v as DocumentType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedDocType === "vendor_list" || classification.documentType === "vendor_list") && classification.extractedVendors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Funne leverandører ({classification.extractedVendors.length})</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      if (selectedVendorsToImport.size === classification.extractedVendors.length) {
                        setSelectedVendorsToImport(new Set());
                      } else {
                        setSelectedVendorsToImport(new Set(classification.extractedVendors.map((_, i) => i)));
                      }
                    }}
                  >
                    {selectedVendorsToImport.size === classification.extractedVendors.length ? "Fjern alle" : "Velg alle"}
                  </Button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 rounded-md border p-2">
                  {classification.extractedVendors.map((v, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        selectedVendorsToImport.has(i) ? "bg-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedVendorsToImport.has(i)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedVendorsToImport);
                          if (checked) next.add(i); else next.delete(i);
                          setSelectedVendorsToImport(next);
                        }}
                      />
                      <div className="min-w-0">
                        <span className="text-sm font-medium">{v.name}</span>
                        {v.description && (
                          <p className="text-xs text-muted-foreground truncate">{v.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {(!classification.extractedVendors || classification.extractedVendors.length === 0) && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Ingen leverandører funnet</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {classification.documentType !== "vendor_list"
                        ? `Dette ser ut som et ${classification.documentTypeLabel.toLowerCase()}-dokument. Det inneholder ikke en liste over leverandører som kan importeres.`
                        : "Vi klarte ikke å hente ut leverandørnavn fra dette dokumentet. Prøv med en annen fil eller legg til leverandører manuelt."
                      }
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      For å importere leverandører trenger vi en fil som inneholder en oversikt eller liste over leverandørnavn.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setStep("file-upload"); setClassification(null); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Last opp ny fil
              </Button>
              {(selectedDocType === "vendor_list" || classification.documentType === "vendor_list") && classification.extractedVendors.length > 0 ? (
                <Button size="sm" onClick={handleImportSelected} disabled={importVendors.isPending || selectedVendorsToImport.size === 0}>
                  {importVendors.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Importer {selectedVendorsToImport.size} leverandører
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setStep("search")}>
                  <PenLine className="h-4 w-4 mr-1" /> Legg til manuelt
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step: Scan Limit Reached */}
        {step === "scan-limit" && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600 shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">Du har brukt alle AI-skanninger</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Etter dette må du fylle inn manuelt (5–10 min per dokument).
                  </p>
                </div>
              </div>
            </div>

            <ScanLimitBanner used={scanCount} limit={SCAN_LIMIT} />

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-semibold text-sm">Premium</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ubegrenset AI-skanning for <strong>$1.37/dag</strong>
              </p>
              <Button size="sm" variant="luxury" className="w-full mt-2" onClick={() => {
                toast.info("Oppgradering kommer snart!");
              }}>
                Oppgrader nå
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("file-upload")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Tilbake
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStep("search")}>
                Legg inn manuelt
              </Button>
            </div>
          </div>
        )}

        {/* Step: Search */}
        {step === "search" && !manualMode && (
          <div className="space-y-4 pt-2">
            {mode === "multiple" && addedVendors.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t("addVendor.added", "Lagt til")} ({addedVendors.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {addedVendors.map((v, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Duplicate match warning */}
            {duplicateMatch && (
              <ExistingVendorCard
                vendor={duplicateMatch}
                onOpenProfile={() => handleOpenExistingProfile(duplicateMatch.existingId!)}
                onClose={() => setDuplicateMatch(null)}
              />
            )}

            <div>
              <Label htmlFor="vendor-search">{t("addVendor.searchLabel", "Søk etter leverandør")}</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="vendor-search"
                  placeholder={t("addVendor.searchPlaceholder", "Skriv leverandørnavn...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{t("addVendor.country", "Land")}</Label>
              <div className="flex gap-2 mt-1.5">
                {(["NO", "SE", "DK", "other"] as Country[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCountry(c); clearResults(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      country === c ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <span>{countryFlags[c]}</span>
                    <span className="hidden sm:inline">{countryLabels[c]}</span>
                  </button>
                ))}
              </div>
            </div>

            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {t("addVendor.resultsFrom", "Resultater fra {{source}}", { source: sourceLabel(results[0].source) })}
                </p>
                <div className="space-y-1.5" role="listbox">
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(r)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        r.existingId
                          ? "border-yellow-500/40 bg-yellow-50/30 dark:bg-yellow-900/10 hover:border-yellow-500/60"
                          : "border-border hover:border-primary"
                      )}
                      role="option"
                      aria-selected={false}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{r.name}</span>
                            {r.existingId && (
                              <Badge variant="warning" className="text-[13px] gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Allerede registrert
                              </Badge>
                            )}
                          </div>
                          {r.existingId && (
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <TrustProfileBadge result={r} />
                              {r.complianceScore != null && r.complianceScore > 0 && (
                                <span className="text-[13px] text-muted-foreground">
                                  Compliance: {r.complianceScore}%
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            {r.industry && <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{r.industry}</span>}
                            {r.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.address}</span>}
                            {r.employees != null && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.employees}+</span>}
                          </div>
                        </div>
                        {r.orgNumber && (
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{r.orgNumber}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error === "no_results" && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("addVendor.noResults", "Fant ikke leverandøren i registeret")}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => searchInternalOnly(searchQuery)} className="gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    {t("addVendor.searchInternal", "Søk i vår database")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setManualMode(true); setManualName(searchQuery); }} className="gap-1.5">
                    <PenLine className="h-3.5 w-3.5" />
                    {t("addVendor.addManually", "Legg inn manuelt")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setStep(mode === "multiple" ? "method" : "quantity"); clearResults(); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
            </div>
          </div>
        )}

        {/* Manual mode */}
        {step === "search" && manualMode && (
          <div className="space-y-4 pt-2">
            {/* Duplicate match warning in manual mode */}
            {duplicateMatch && (
              <ExistingVendorCard
                vendor={duplicateMatch}
                onOpenProfile={() => handleOpenExistingProfile(duplicateMatch.existingId!)}
                onClose={() => setDuplicateMatch(null)}
              />
            )}
            <div>
              <Label htmlFor="manual-name">{t("addVendor.vendorName", "Leverandørnavn")} *</Label>
              <Input id="manual-name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="manual-url">{t("addVendor.website", "Nettside")}</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input id="manual-url" placeholder="https://" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <Button size="sm" onClick={handleManualConfirm} disabled={!manualName.trim() || isCheckingDuplicate}>
                {isCheckingDuplicate ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {t("addVendor.next", "Neste")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Categorize */}
        {step === "categorize" && (
          <div className="space-y-5 pt-2">
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t("addVendor.laraCanHelp", "Lara kan hjelpe deg å klassifisere")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("addVendor.laraCanHelpDesc", "Basert på leverandørnavnet foreslår Lara type og GDPR-rolle")}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAiSuggest}
                  disabled={isSuggesting}
                  className="shrink-0 gap-1.5"
                >
                  {isSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isSuggesting ? t("addVendor.suggesting", "Analyserer...") : t("addVendor.askLara", "Spør Lara")}
                </Button>
              </div>
            </div>

            {aiSuggestion && (
              <div className="space-y-1.5">
                {aiSuggestion.vendor_category_reason && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                    <span><strong>{t("addVendor.vendorType", "Leverandørtype")}:</strong> {aiSuggestion.vendor_category_reason}</span>
                  </div>
                )}
                {aiSuggestion.gdpr_role_reason && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 shrink-0 mt-0.5 text-primary" />
                    <span><strong>{t("addVendor.gdprRole", "GDPR-rolle")}:</strong> {aiSuggestion.gdpr_role_reason}</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-sm font-medium">{t("addVendor.description", "Beskrivelse")}</Label>
              <Textarea
                placeholder={t("addVendor.descriptionPlaceholder", "Beskriv hva leverandøren leverer og hvordan dere bruker dem...")}
                value={vendorDescription}
                onChange={(e) => setVendorDescription(e.target.value)}
                className="mt-1.5 min-h-[60px] resize-none"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{t("addVendor.vendorType", "Leverandørtype")}</Label>
                {aiSuggestion?.vendor_category && vendorCategory === aiSuggestion.vendor_category && (
                  <Badge variant="secondary" className="text-[13px] gap-1"><Sparkles className="h-2.5 w-2.5" /> Lara</Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {VENDOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setVendorCategory(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-colors text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      vendorCategory === cat.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <span className="text-primary">{cat.icon}</span>
                    <span className="text-xs font-medium leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{t("addVendor.gdprRole", "GDPR-rolle")}</Label>
                {aiSuggestion?.gdpr_role && gdprRole === aiSuggestion.gdpr_role && (
                  <Badge variant="secondary" className="text-[13px] gap-1"><Sparkles className="h-2.5 w-2.5" /> Lara</Badge>
                )}
              </div>
              <RadioGroup value={gdprRole} onValueChange={(v) => setGdprRole(v as GdprRole)} className="mt-2 space-y-2">
                {GDPR_ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors",
                      gdprRole === role.value ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <RadioGroupItem value={role.value} className="mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{role.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("search")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("contact")}>
                  {t("addVendor.skip", "Hopp over")}
                </Button>
                <Button size="sm" onClick={() => setStep("contact")}>
                  {t("addVendor.next", "Neste")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {step === "contact" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("addVendor.contactInfo", "Legg til kontaktperson (valgfritt)")}
            </p>
            <div>
              <Label htmlFor="contact-name">{t("addVendor.contactName", "Kontaktperson")}</Label>
              <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="contact-email">{t("addVendor.contactEmail", "E-post")}</Label>
              <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="contact-role">{t("addVendor.contactRole", "Rolle/tittel")}</Label>
              <Input id="contact-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("categorize")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("confirm")}>
                  {t("addVendor.skip", "Hopp over")}
                </Button>
                <Button size="sm" onClick={() => setStep("confirm")}>
                  {t("addVendor.next", "Neste")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selected && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">{selected.name}</h4>
              {vendorDescription && <p className="text-xs text-muted-foreground">{vendorDescription}</p>}
              <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                {selected.orgNumber && (
                  <><span>{t("addVendor.orgNumber", "Org.nr")}</span><span className="font-mono">{selected.orgNumber}</span></>
                )}
                {selected.country && (
                  <><span>{t("addVendor.country", "Land")}</span><span>{countryFlags[selected.country as Country] || "🌍"} {countryLabels[selected.country as Country] || selected.country}</span></>
                )}
                {selected.industry && (
                  <><span>{t("addVendor.industry", "Bransje")}</span><span>{selected.industry}</span></>
                )}
                {selected.url && (
                  <><span>{t("addVendor.website", "Nettside")}</span><span className="truncate">{selected.url}</span></>
                )}
                {vendorCategory && (
                  <><span>{t("addVendor.vendorType", "Leverandørtype")}</span><span>{VENDOR_CATEGORIES.find(c => c.value === vendorCategory)?.label}</span></>
                )}
                {gdprRole && (
                  <><span>{t("addVendor.gdprRole", "GDPR-rolle")}</span><span>{GDPR_ROLES.find(r => r.value === gdprRole)?.label}</span></>
                )}
                {contactName && (
                  <><span>{t("addVendor.contactName", "Kontaktperson")}</span><span>{contactName}</span></>
                )}
                {contactEmail && (
                  <><span>{t("addVendor.contactEmail", "E-post")}</span><span>{contactEmail}</span></>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("contact")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <Button onClick={() => createVendor.mutate()} disabled={createVendor.isPending}>
                {createVendor.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                {t("addVendor.addVendor", "Legg til leverandør")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
