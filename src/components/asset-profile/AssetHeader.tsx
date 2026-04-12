import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ExternalLink, 
  Server,
  Building2,
  MapPin,
  Network,
  Plug,
  HardDrive,
  Database,
  FileText,
  LucideIcon,
  User,
  Users,
  Send,
  Mail,
  Camera,
  Loader2,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Pencil,
  Sparkles,
  FileCheck,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RequestUpdateDialog } from "./RequestUpdateDialog";
import { ContactPersonField } from "./ContactPersonField";
import { SelfProfileMetadataRow } from "./SelfProfileMetadataRow";
import { HeaderMaturityIndicators } from "@/components/trust-controls/HeaderMaturityIndicators";

interface TrustMetrics {
  trustScore: number;
  confidenceScore: number;
  lastUpdated: string;
}

interface AssetHeaderProps {
  asset: {
    id: string;
    asset_type: string;
    name: string;
    description: string | null;
    vendor: string | null;
    category: string | null;
    lifecycle_status: string | null;
    url: string | null;
    work_area_id: string | null;
    asset_manager: string | null;
    logo_url: string | null;
    work_areas?: {
      id: string;
      name: string;
      responsible_person: string | null;
    } | null;
  };
  template?: {
    asset_type: string;
    display_name: string;
    icon: string;
    color: string;
  } | null;
  trustMetrics?: TrustMetrics | null;
  requestDialogOpen?: boolean;
  onRequestDialogChange?: (open: boolean) => void;
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

// Demo people per work area for prototype
const DEMO_PEOPLE: Record<string, string[]> = {
  "HR og personell": ["Jan Olsen", "Kari Nordmann", "Erik Hansen", "Marte Johansen"],
  "IT og sikkerhet": ["Tore Berg", "Lise Andersen", "Anders Svendsen", "Nina Larsen"],
  "Økonomi": ["Hanne Pedersen", "Pål Eriksen", "Silje Dahl"],
  "Salg og marked": ["Kristian Haugen", "Maria Nilsen", "Ola Solberg"],
  "Ledelse": ["Trond Bakke", "Ingrid Moe", "Bjørn Sæther"],
};

const DEFAULT_PEOPLE = ["Jan Olsen", "Kari Nordmann", "Erik Hansen", "Tore Berg", "Lise Andersen"];

export function AssetHeader({ asset, template, trustMetrics, requestDialogOpen: externalDialogOpen, onRequestDialogChange }: AssetHeaderProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [internalDialogOpen, setInternalDialogOpen] = useState(false);
  
  const requestDialogOpen = externalDialogOpen ?? internalDialogOpen;
  const setRequestDialogOpen = onRequestDialogChange ?? setInternalDialogOpen;
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(asset.description || "");
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [showAllRegulations, setShowAllRegulations] = useState(false);
  const [showCompanyInfo, setShowCompanyInfo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const isSelf = asset.asset_type === 'self';

  const { data: companyProfile } = useQuery({
    queryKey: ["company_profile_msp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("id, is_msp_partner, industry, name")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isSelf,
  });

  const isMspPartner = isSelf && (companyProfile as any)?.is_msp_partner === true;

  const { data: workAreas = [] } = useQuery({
    queryKey: ["work_areas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Active regulatory frameworks
  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return (data || []).map((fw: any) => ({
        framework_id: fw.framework_id,
        framework_name: fw.framework_name,
      }));
    },
  });

  // Count active vendor document requests
  const { data: requestCount = 0 } = useQuery({
    queryKey: ["vendor-request-count", asset.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vendor_document_requests")
        .select("*", { count: "exact", head: true })
        .eq("asset_id", asset.id)
        .neq("status", "received");
      if (error) throw error;
      return count || 0;
    },
    enabled: !isSelf,
  });

  // Standards/certifications vs regulatory frameworks
  const STANDARDS_KEYWORDS = ["iso27001", "iso27701", "soc2", "soc", "iso", "nist", "cobit"];
  const REGULATION_COLORS: Record<string, string> = {
    dora: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
    nis2: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700",
    gdpr: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700",
    personopplysningsloven: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700",
    "ai-act": "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
    aiact: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700",
  };

  const STANDARD_COLORS: Record<string, string> = {
    iso: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700",
    soc: "bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700",
    nist: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700",
  };

  const isStandard = (id: string) => {
    const lower = id.toLowerCase().replace(/[^a-z0-9]/g, "");
    return STANDARDS_KEYWORDS.some(kw => lower.includes(kw));
  };

  const getRegulationColor = (id: string) => {
    const lower = id.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, cls] of Object.entries(REGULATION_COLORS)) {
      if (lower.includes(key.replace("-", ""))) return cls;
    }
    return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700";
  };

  const getStandardColor = (id: string) => {
    const lower = id.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const [key, cls] of Object.entries(STANDARD_COLORS)) {
      if (lower.includes(key)) return cls;
    }
    return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700";
  };

  const GREY_FALLBACK = "bg-muted text-muted-foreground border-border";

  const frameworkBadgeClass = (id: string) => isStandard(id) ? getStandardColor(id) : getRegulationColor(id);
  const isKnownFramework = (_id: string) => true;

  // Get people list based on the asset's work area
  const selectedWorkAreaName = workAreas.find((a: any) => a.id === asset.work_area_id)?.name || "";
  const peopleList = DEMO_PEOPLE[selectedWorkAreaName] || DEFAULT_PEOPLE;

  const updateAsset = useMutation({
    mutationFn: async (updates: Partial<Record<string, any>>) => {
      const { error } = await supabase
        .from("assets")
        .update(updates)
        .eq("id", asset.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
      toast.success(t("trustProfile.updateSuccess"));
    },
    onError: () => {
      toast.error(t("trustProfile.updateError"));
    },
  });

  const updateCompanyProfile = useMutation({
    mutationFn: async (updates: Partial<Record<string, any>>) => {
      const { error } = await supabase
        .from("company_profile")
        .update(updates)
        .eq("id", companyProfile?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_profile_msp"] });
    },
  });

  const handleOwnerChange = (value: string) => {
    const workAreaId = value === "none" ? null : value;
    const selectedArea = workAreas.find((a: any) => a.id === value);
    const responsiblePerson = selectedArea?.responsible_person || null;
    updateAsset.mutate({ 
      work_area_id: workAreaId, 
      asset_manager: responsiblePerson 
    });
  };

  const handleManagerChange = (value: string) => {
    updateAsset.mutate({ asset_manager: value === "__none__" ? null : value });
  };

  const handleSaveDesc = () => {
    updateAsset.mutate({ description: descValue });
    setEditingDesc(false);
  };

  const handleGenerateDesc = async () => {
    setIsGeneratingDesc(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-company-description", {
        body: {
          companyName: asset.name,
          industry: (companyProfile as any)?.industry,
          existingDescription: descValue,
          language: i18n.language,
        },
      });
      if (!error && data?.suggestion) {
        setDescValue(data.suggestion);
        toast.success(isNb ? "Forslag hentet fra Lara" : "Suggestion from Lara");
      } else {
        toast.error(isNb ? "Kunne ikke hente forslag" : "Could not get suggestion");
      }
    } catch (e) {
      console.error("generate desc error:", e);
      toast.error(isNb ? "Noe gikk galt" : "Something went wrong");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(isNb ? "Kun bildefiler er tillatt" : "Only image files are allowed");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(isNb ? "Maks filstørrelse er 2MB" : "Max file size is 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${asset.id}/logo.${ext}`;

      // Remove old logo if exists
      await supabase.storage.from("company-logos").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("company-logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("company-logos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("assets")
        .update({ logo_url: urlData.publicUrl } as any)
        .eq("id", asset.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ["asset", asset.id] });
      toast.success(isNb ? "Logo lastet opp" : "Logo uploaded");
    } catch (err) {
      console.error("Logo upload error:", err);
      toast.error(isNb ? "Kunne ikke laste opp logo" : "Failed to upload logo");
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const selectedWorkArea = workAreas.find((a: any) => a.id === asset.work_area_id);
  const displayedManager = asset.asset_manager || selectedWorkArea?.responsible_person || null;

  const IconComponent = template?.icon ? iconMap[template.icon] || Server : Server;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "bg-success/15 text-success border-success/30";
      case "planned": return "bg-primary/15 text-primary border-primary/30";
      case "deprecated": return "bg-warning/15 text-warning border-warning/30";
      case "archived": return "bg-muted text-muted-foreground border-border";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case "active": return t("assets.statusActive");
      case "planned": return t("assets.statusPlanned");
      case "deprecated": return t("assets.statusDeprecated");
      case "archived": return t("assets.statusArchived");
      default: return status || "-";
    }
  };

  return (
    <Card className="p-5 md:p-6">
      {/* Hidden file input for logo */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleLogoUpload}
      />

      {/* Top row: icon/logo + name + badges + trust metrics */}
      <div className="flex items-start gap-4">
        {/* Owner & Manager — top right for vendor/system profiles */}
        {!isSelf && (
          <div className="hidden md:flex items-center gap-8 shrink-0 ml-auto order-last">
            {/* Eier (Arbeidsområde) */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {isNb ? "Eier (Arbeidsområde)" : "Owner (Work Area)"}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                      {isNb
                        ? "Arbeidsområdet som eier denne verdien. Arbeidsområdeansvarlig settes som standard leverandøransvarlig."
                        : "The work area that owns this asset. The area owner is set as default manager."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={asset.work_area_id || "none"} onValueChange={handleOwnerChange}>
                <SelectTrigger className="h-9 min-w-[170px] text-sm border border-input bg-background rounded-md px-3 hover:bg-accent/50 transition-colors">
                  <SelectValue placeholder={isNb ? "Velg arbeidsområde" : "Select work area"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("trustProfile.noOwner")}</SelectItem>
                  {workAreas.map((area: any) => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Leverandøransvarlig */}
            <div>
              <div className="flex items-center gap-1 mb-1.5">
                <span className="text-[11px] text-muted-foreground font-medium">
                  {isNb ? "Leverandøransvarlig" : "Vendor Manager"}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                      {isNb
                        ? "Personen som er ansvarlig for oppfølging av denne leverandøren."
                        : "The person responsible for managing this vendor."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Select value={asset.asset_manager || "__none__"} onValueChange={handleManagerChange}>
                <SelectTrigger className="h-9 min-w-[170px] text-sm border border-input bg-background rounded-md px-3 hover:bg-accent/50 transition-colors">
                  <SelectValue placeholder={isNb ? "Velg ansvarlig" : "Select manager"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{isNb ? "— Ikke valgt —" : "— Not assigned —"}</SelectItem>
                  {peopleList.map((person) => (
                    <SelectItem key={person} value={person}>{person}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Logo / Icon area */}
        <div className="relative group shrink-0">
          {(asset as any).logo_url ? (
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-border">
              <img
                src={(asset as any).logo_url}
                alt={`${asset.name} logo`}
                className="h-full w-full object-contain bg-background"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <IconComponent className="h-6 w-6 text-primary" />
            </div>
          )}
          {isSelf && (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
              className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {uploadingLogo ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-white" />
              )}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="text-lg md:text-xl font-bold text-foreground">{asset.name}</h1>
            {isMspPartner && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-400 text-[10px] shrink-0 gap-1 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-600">
                <Award className="h-3 w-3" />
                {isNb ? "Partner og forhandler av Mynder" : "Mynder partner & reseller"}
              </Badge>
            )}
            {!isSelf && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {template?.display_name || asset.asset_type}
              </Badge>
            )}
            {!isSelf && (
              <Badge className={`text-[10px] ${getStatusColor(asset.lifecycle_status)} shrink-0`}>
                {getStatusLabel(asset.lifecycle_status)}
              </Badge>
            )}
          </div>

          {isSelf ? (
            <div>
              <p className="text-sm text-muted-foreground mt-0.5 mb-2">
                {isNb ? "Digital Trust Profile og samsvarsoversikt" : "Digital Trust Profile and compliance overview"}
              </p>
              {/* Editable description */}
              {editingDesc ? (
                <div className="flex flex-col gap-2 mt-1">
                  <Textarea
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    className="text-sm min-h-[80px] resize-none"
                    placeholder={isNb ? "Beskriv virksomheten din..." : "Describe your company..."}
                    autoFocus
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="sm" onClick={handleSaveDesc} disabled={updateAsset.isPending} className="h-7 text-xs">
                      {isNb ? "Lagre" : "Save"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditingDesc(false); setDescValue(asset.description || ""); }}
                      className="h-7 text-xs"
                    >
                      {isNb ? "Avbryt" : "Cancel"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleGenerateDesc}
                      disabled={isGeneratingDesc}
                      className="h-7 text-xs gap-1.5 ml-auto text-primary border-primary/30 hover:bg-primary/10"
                    >
                      {isGeneratingDesc ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {isNb ? "Lara foreslår" : "Lara suggests"}
                    </Button>
                  </div>
                </div>
              ) : (
              <button
                  onClick={() => { setDescValue(asset.description || ""); setEditingDesc(true); }}
                  className="flex items-start gap-2 w-full text-left rounded-md p-1.5 -m-1.5 hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  {asset.description ? (
                    <p className="text-sm text-muted-foreground flex-1 leading-relaxed">{asset.description}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic flex-1">
                      {isNb ? "Klikk for å legge til en beskrivelse av virksomheten..." : "Click to add a company description..."}
                    </p>
                  )}
                  <Pencil className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          ) : (
            <>
              {asset.vendor && (
                <p className="text-sm text-muted-foreground mt-1">{asset.vendor}</p>
              )}
              {asset.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {asset.description}
                </p>
              )}
            </>
          )}

          {!isSelf && asset.url && (
            <a 
              href={asset.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              {(() => { try { return new URL(asset.url).hostname; } catch { return asset.url; } })()}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Standards & Certifications + Regulatory Coverage — only for self profiles */}
          {isSelf && frameworks.length > 0 && (() => {
            const standards = frameworks.filter((fw: any) => isStandard(fw.framework_id));
            const regulations = frameworks.filter((fw: any) => !isStandard(fw.framework_id));
            return (
              <div className="space-y-3 mt-3">
                {standards.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      {isNb ? "Standarder og sertifiseringer" : "Standards & Certifications"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {standards.map((fw: any) => (
                        <span
                          key={fw.framework_id}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStandardColor(fw.framework_id)}`}
                        >
                          {fw.framework_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {regulations.length > 0 && (() => {
                  const MAX_VISIBLE = 4;
                  const hasMore = regulations.length > MAX_VISIBLE;
                  return (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        {isNb ? "Gjeldende regelverk" : "Regulatory Coverage"}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(showAllRegulations ? regulations : regulations.slice(0, MAX_VISIBLE)).map((fw: any) => (
                          <span
                            key={fw.framework_id}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRegulationColor(fw.framework_id)}`}
                          >
                            {fw.framework_name}
                          </span>
                        ))}
                        {hasMore && !showAllRegulations && (
                          <button
                            onClick={() => setShowAllRegulations(true)}
                            className="text-[11px] text-primary hover:underline font-medium ml-1"
                          >
                            +{regulations.length - MAX_VISIBLE} {isNb ? "mer" : "more"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>

        {/* Trust Score gauge for self profiles only — right side */}
        {trustMetrics && isSelf && (() => {
          const score = trustMetrics.trustScore;
          const conf = trustMetrics.confidenceScore;
          const isHigh = score >= 75;
          const isMid = score >= 50;
          const radius = 38;
          const circ = 2 * Math.PI * radius;
          const dash = (score / 100) * circ;
          const strokeColor = isHigh ? "hsl(var(--success))" : isMid ? "hsl(var(--warning))" : "hsl(var(--destructive))";
          const bgRingColor = "hsl(var(--muted))";
          const confLabel = conf >= 80 ? (isNb ? "Høy tillit" : "High confidence") : conf >= 50 ? (isNb ? "Middels tillit" : "Medium confidence") : (isNb ? "Lav tillit" : "Low confidence");
          return (
            <div className="hidden md:flex flex-col items-center gap-3 shrink-0 pl-8 border-l border-border min-w-[200px]">
              <div className="relative flex items-center justify-center">
                <svg width="128" height="128" viewBox="0 0 96 96" className="-rotate-90">
                  <circle cx="48" cy="48" r={radius} fill="none" stroke={bgRingColor} strokeWidth="6" />
                  <circle cx="48" cy="48" r={radius} fill="none" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-4xl font-extrabold tabular-nums leading-none ${isHigh ? "text-success" : isMid ? "text-warning" : "text-destructive"}`}>{score}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide leading-tight mt-0.5">/100</span>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trust Score</span>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  {conf >= 80 && <CheckCircle2 className="h-3 w-3 text-success" />}
                  {conf >= 50 && conf < 80 && <AlertTriangle className="h-3 w-3 text-warning" />}
                  {conf < 50 && <XCircle className="h-3 w-3 text-muted-foreground" />}
                  <span className={`text-[11px] font-medium ${conf >= 80 ? "text-success" : conf >= 50 ? "text-warning" : "text-muted-foreground"}`}>{confLabel}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{trustMetrics.lastUpdated}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] text-muted-foreground gap-1 px-2 py-0.5 h-5">
                <ShieldCheck className="h-2.5 w-2.5" />
                {isNb ? "Egenerklæring" : "Self-declared"}
              </Badge>
            </div>
          );
        })()}
      </div>

      {/* Horizontal metric cards for vendor/system profiles */}
      {trustMetrics && !isSelf && (
        <div className="mt-4 pt-4 border-t border-border">
          <HeaderMaturityIndicators
            riskLevel={(asset as any).risk_level || "medium"}
            criticality={(asset as any).criticality || "medium"}
            maturityPercent={trustMetrics?.trustScore ?? 0}
          />
        </div>
      )}

      {/* Self-profile metadata row */}
      {isSelf && (
        <SelfProfileMetadataRow
          asset={asset}
          companyProfile={companyProfile}
          updateAsset={updateAsset}
          updateCompanyProfile={updateCompanyProfile}
          isNb={isNb}
        />
      )}

      {/* Vendor info & contact — bottom section */}
      {!isSelf && (
        <>
          <div className="border-t border-border mt-4 pt-4">
            {/* Mobile-only: Owner & Manager */}
            <div className="flex flex-col gap-3 md:hidden mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t("trustProfile.owner")}</p>
                  <Select value={asset.work_area_id || "none"} onValueChange={handleOwnerChange}>
                    <SelectTrigger className="h-6 w-full max-w-[200px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
                      <SelectValue placeholder={t("trustProfile.selectOwner")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("trustProfile.noOwner")}</SelectItem>
                      {workAreas.map((area: any) => (
                        <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{t("trustProfile.systemManager")}</p>
                  <Select value={asset.asset_manager || "__none__"} onValueChange={handleManagerChange}>
                    <SelectTrigger className="h-6 w-full max-w-[200px] text-xs bg-transparent border-none shadow-none p-0 hover:bg-muted/50 rounded">
                      <SelectValue placeholder={t("trustProfile.assignManager")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{isNb ? "— Ikke valgt —" : "— Not assigned —"}</SelectItem>
                      {peopleList.map((person) => (
                        <SelectItem key={person} value={person}>{person}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Single row: Kontaktperson (left) — Bransje & Org.nr & Nettsted (right) */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Left: Kontaktperson */}
              <div className="shrink-0">
                <ContactPersonField
                  assetId={asset.id}
                  contactPerson={(asset as any).contact_person}
                  contactEmail={(asset as any).contact_email}
                  contactPhone={(asset as any).contact_phone}
                  isNb={isNb}
                />
              </div>

              {/* Right: Bransje, Org.nr, Nettsted */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground sm:justify-end">
                <InlineEditableField
                  label={isNb ? "Bransje" : "Industry"}
                  value={(asset as any).vendor_category || ""}
                  placeholder={isNb ? "Legg til bransje" : "Add industry"}
                  onSave={(val) => updateAsset.mutate({ vendor_category: val || null })}
                  disabled={asset.publish_mode === 'claimed'}
                />
                {(asset as any).org_number && (
                  <span>
                    <span className="font-medium text-foreground">{isNb ? "Org.nr" : "Org. no."}:</span>{" "}
                    <span className="tabular-nums">{(asset as any).org_number}</span>
                  </span>
                )}
                {asset.url && (
                  <a href={asset.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    {(() => { try { return new URL(asset.url).hostname; } catch { return asset.url; } })()}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={setRequestDialogOpen}
        assetId={asset.id}
        assetName={asset.name}
        vendorName={asset.vendor || undefined}
        contactPerson={(asset as any).contact_person || undefined}
        contactEmail={(asset as any).contact_email || undefined}
      />
    </Card>
  );
}
