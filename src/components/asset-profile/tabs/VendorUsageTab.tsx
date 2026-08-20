import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Database, Workflow, Shield, AlertTriangle, Pencil, Info, Sparkles, ArrowRight, Flag, ChevronDown, UserRound } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SENSITIVE_DATA_CATEGORIES, sensitiveCategoryLabel, gdprRoleHandlesPersonalData } from "@/lib/sensitiveData";
import { suggestVendorRisk } from "@/lib/vendorRiskSuggestion";
import { suggestVendorContext, usageTagLabel } from "@/lib/vendorContextSuggestion";
import { buildGdprRolePlan } from "@/lib/vendorGdprRolePlan";
import { GdprRolePlanCard } from "@/components/asset-profile/usage/GdprRolePlanCard";
import { LaraContextBanner } from "@/components/asset-profile/usage/LaraContextBanner";

import { VendorPurposeCard } from "@/components/asset-profile/usage/VendorPurposeCard";
import { ContextPillRow, type ContextPillItem } from "@/components/asset-profile/usage/ContextPillRow";
import { SaraMappedContextView, type SaraContextField } from "@/components/asset-profile/usage/SaraMappedContextView";
import { buildSaraVendorMapping } from "@/lib/saraVendorMapping";
import { useSaraAgent } from "@/lib/saraAgent";
import { toast } from "sonner";
import { useState } from "react";
import { AISuggestTextarea } from "@/components/asset-profile/AISuggestTextarea";

interface VendorUsageTabProps {
  assetId: string;
  onNavigateToTab?: (tab: string) => void;
}

const criticalityOptions = [
  { value: "low", labelNb: "Lav", labelEn: "Low" },
  { value: "medium", labelNb: "Middels", labelEn: "Medium" },
  { value: "high", labelNb: "Høy", labelEn: "High" },
  { value: "critical", labelNb: "Kritisk", labelEn: "Critical" },
];

const riskOptions = [
  { value: "low", labelNb: "Lav", labelEn: "Low" },
  { value: "medium", labelNb: "Middels", labelEn: "Medium" },
  { value: "high", labelNb: "Høy", labelEn: "High" },
  { value: "critical", labelNb: "Kritisk", labelEn: "Critical" },
];

const gdprOptions = [
  { value: "databehandler", labelNb: "Databehandler", labelEn: "Data processor" },
  { value: "underdatabehandler", labelNb: "Underdatabehandler", labelEn: "Sub-processor" },
  { value: "ingen_persondata", labelNb: "Ingen persondata", labelEn: "No personal data" },
  { value: "not_set", labelNb: "Ikke satt", labelEn: "Not set" },
];

const priorityOptions = [
  { value: "critical", labelNb: "Kritisk", labelEn: "Critical" },
  { value: "high", labelNb: "Høy", labelEn: "High" },
  { value: "medium", labelNb: "Middels", labelEn: "Medium" },
  { value: "low", labelNb: "Lav", labelEn: "Low" },
  { value: "not_set", labelNb: "Ikke satt", labelEn: "Not set" },
];

const getLabelFor = (
  options: { value: string; labelNb: string; labelEn: string }[],
  value: string | null | undefined,
  isNb: boolean,
) => {
  const opt = options.find((o) => o.value === (value || "not_set"));
  return opt ? (isNb ? opt.labelNb : opt.labelEn) : (isNb ? "Ikke satt" : "Not set");
};

const priorityColor = (value: string | null | undefined) => {
  switch (value) {
    case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
    case "high": return "text-warning bg-warning/10 border-warning/20";
    case "medium": return "text-warning bg-warning/10 border-warning/20 dark:text-warning dark:bg-warning/20 dark:border-warning";
    case "low": return "text-success bg-success/10 border-success/20";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

const severityColor = (value: string | null | undefined) => {
  switch (value) {
    case "low": return "text-success bg-success/10 border-success/20";
    case "medium": return "text-warning bg-warning/10 border-warning/20";
    case "high":
    case "critical": return "text-destructive bg-destructive/10 border-destructive/20";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

export const VendorUsageTab = ({ assetId, onNavigateToTab }: VendorUsageTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [laraLoading, setLaraLoading] = useState(false);
  const { installed: saraInstalled } = useSaraAgent();
  const [viewMode, setViewMode] = useState<"auto" | "manual">("auto");
  const [acceptedAt, setAcceptedAt] = useState<Date | null>(null);
  const [preAcceptSnapshot, setPreAcceptSnapshot] = useState<{
    criticality: string | null;
    gdpr_role: string | null;
    risk_level: string | null;
    metadata: Record<string, any>;
  } | null>(null);

  const { data: asset } = useQuery({
    queryKey: ["asset-usage", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("*, work_areas(id, name, responsible_person)")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: dataCategories = [] } = useQuery({
    queryKey: ["asset-data-categories", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_categories")
        .select("*")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: processors = [] } = useQuery({
    queryKey: ["asset-processors", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_data_processors")
        .select("*")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: processes = [] } = useQuery({
    queryKey: ["system-processes", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_processes")
        .select("*")
        .eq("system_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from("assets")
        .update(updates)
        .eq("id", assetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["asset-usage", assetId] });
      queryClient.invalidateQueries({ queryKey: ["asset-with-workarea", assetId] });
      queryClient.invalidateQueries({ queryKey: ["asset-detail", assetId] });
      toast.success(isNb ? "Lagret" : "Saved");
    },
    onError: () => {
      toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
    },
  });

  const handleFieldChange = (field: string, value: string) => {
    updateMutation.mutate({ [field]: value });
  };

  // Sensitive personopplysninger — kun relevant når en GDPR-rolle med persondata er valgt
  const showSensitive = gdprRoleHandlesPersonalData(asset?.gdpr_role);
  const sensitiveOn = !!(asset as any)?.processes_sensitive_data;
  const selectedSensitive: string[] = ((asset as any)?.sensitive_data_categories as string[]) || [];

  const handleGdprRoleChange = (value: string) => {
    if (!gdprRoleHandlesPersonalData(value)) {
      updateMutation.mutate({
        gdpr_role: value,
        processes_sensitive_data: false,
        sensitive_data_categories: [],
      } as any);
      return;
    }
    handleFieldChange("gdpr_role", value);
  };

  const handleSensitiveToggle = (checked: boolean) => {
    updateMutation.mutate({
      processes_sensitive_data: checked,
      ...(checked ? {} : { sensitive_data_categories: [] }),
    } as any);
  };

  const toggleSensitiveCategory = (value: string) => {
    const next = selectedSensitive.includes(value)
      ? selectedSensitive.filter((v) => v !== value)
      : [...selectedSensitive, value];
    updateMutation.mutate({ sensitive_data_categories: next } as any);
  };

  const riskSuggestion = suggestVendorRisk({
    criticality: asset?.criticality,
    priority: (asset as any)?.priority,
    gdprRole: asset?.gdpr_role,
    sensitive: sensitiveOn,
  });

  const riskMeta = ((asset?.metadata as any) || {}) as Record<string, any>;
  const riskSetBy: string | null = riskMeta.risk_set_by || null;
  const riskSetAt: string | null = riskMeta.risk_set_at
    ? new Date(riskMeta.risk_set_at).toLocaleDateString(isNb ? "nb-NO" : "en-GB")
    : null;

  const [rationaleDraft, setRationaleDraft] = useState<string>("");
  const [rationaleLoaded, setRationaleLoaded] = useState(false);
  if (!rationaleLoaded && asset) {
    setRationaleLoaded(true);
    setRationaleDraft(riskMeta.risk_rationale || "");
  }

  const saveMeta = (patch: Record<string, any>) => {
    updateMutation.mutate({ metadata: { ...riskMeta, ...patch } } as any);
  };

  const currentUserName =
    (user?.user_metadata as any)?.full_name || user?.email || (isNb ? "deg" : "you");

  const handleManualRiskChange = (value: string) => {
    updateMutation.mutate({
      risk_level: value,
      metadata: {
        ...riskMeta,
        risk_set_by: currentUserName,
        risk_set_at: new Date().toISOString(),
      },
    } as any);
  };

  const saveRationale = () => {
    if ((riskMeta.risk_rationale || "") === rationaleDraft) return;
    saveMeta({ risk_rationale: rationaleDraft });
  };

  const handleLaraSuggest = async () => {
    setLaraLoading(true);
    setTimeout(() => {
      updateMutation.mutate({
        risk_level: riskSuggestion.level,
        metadata: { ...riskMeta, risk_set_by: null, risk_set_at: null, risk_rationale: null },
      } as any);
      setRationaleDraft("");
      setLaraLoading(false);
    }, 600);
  };



  // --- Bruk og kontekst: bruksformål + Laras forslag ---
  const usagePurpose: string = riskMeta.usage_purpose || "";
  const usageTags: string[] = riskMeta.usage_tags || [];
  const [openPill, setOpenPill] = useState<string | null>(null);

  const contextSuggestion = suggestVendorContext({
    vendorName: asset?.name,
    vendorCategory: asset?.vendor_category,
    description: asset?.description,
    usagePurpose,
    usageTags,
    hasPrivacyPolicy: !!asset?.privacy_policy_url,
    sensitive: sensitiveOn,
  });

  const handleToggleUsageTag = (value: string) => {
    const next = usageTags.includes(value)
      ? usageTags.filter((v) => v !== value)
      : [...usageTags, value];
    saveMeta({ usage_tags: next });
  };

  const handleSuggestPurpose = () => {
    setLaraLoading(true);
    setTimeout(() => {
      saveMeta({
        usage_tags: contextSuggestion.usageTags.length ? contextSuggestion.usageTags : usageTags,
        usage_purpose: usagePurpose || (isNb ? contextSuggestion.usageTextNb : contextSuggestion.usageTextEn),
      });
      setLaraLoading(false);
    }, 500);
  };

  const handleAcceptAll = () => {
    setLaraLoading(true);
    setPreAcceptSnapshot({
      criticality: asset?.criticality ?? null,
      gdpr_role: (asset as any)?.gdpr_role ?? null,
      risk_level: (asset as any)?.risk_level ?? null,
      metadata: { ...riskMeta },
    });
    setTimeout(() => {
      updateMutation.mutate({
        criticality: contextSuggestion.criticality,
        ...(contextSuggestion.gdprRole ? { gdpr_role: contextSuggestion.gdprRole } : {}),
        risk_level: riskSuggestion.level,
        metadata: {
          ...riskMeta,
          usage_tags: contextSuggestion.usageTags.length ? contextSuggestion.usageTags : usageTags,
          usage_purpose: usagePurpose || (isNb ? contextSuggestion.usageTextNb : contextSuggestion.usageTextEn),
          risk_set_by: null,
          risk_set_at: null,
          risk_rationale: null,
        },
      } as any);
      setRationaleDraft("");
      setAcceptedAt(new Date());
      setLaraLoading(false);
    }, 600);
  };

  const handleUndoAccept = () => {
    if (!preAcceptSnapshot) return;
    setLaraLoading(true);
    updateMutation.mutate({
      criticality: preAcceptSnapshot.criticality,
      gdpr_role: preAcceptSnapshot.gdpr_role,
      risk_level: preAcceptSnapshot.risk_level,
      metadata: preAcceptSnapshot.metadata,
    } as any);
    setPreAcceptSnapshot(null);
    setAcceptedAt(null);
    setLaraLoading(false);
  };

  // Bekreftet tilstand vises så lenge lagrede verdier fortsatt matcher forslaget
  const suggestionApplied =
    !!acceptedAt &&
    asset?.criticality === contextSuggestion.criticality &&
    (!contextSuggestion.gdprRole || (asset as any)?.gdpr_role === contextSuggestion.gdprRole) &&
    (asset as any)?.risk_level === riskSuggestion.level;

  const appliedItems = [
    { label: isNb ? "Kritikalitet" : "Criticality", value: getLabelFor(criticalityOptions, contextSuggestion.criticality, isNb) },
    ...(contextSuggestion.gdprRole
      ? [{ label: isNb ? "GDPR-rolle" : "GDPR role", value: getLabelFor(gdprOptions, contextSuggestion.gdprRole, isNb) }]
      : []),
    { label: isNb ? "Risiko" : "Risk", value: getLabelFor(riskOptions, riskSuggestion.level, isNb) },
    ...(usageTags.length
      ? [{ label: isNb ? "Bruk" : "Usage", value: usageTags.map((t) => usageTagLabel(t, isNb)).join(", ") }]
      : []),
    ...(usagePurpose ? [{ label: isNb ? "Bruksformål" : "Purpose", value: usagePurpose }] : []),
  ];

  const nextStep = (() => {
    const isProcessor =
      (asset as any)?.gdpr_role === "databehandler" || (asset as any)?.gdpr_role === "underdatabehandler";
    if (isProcessor && !(asset as any)?.has_dpa) {
      return {
        labelNb: "Legg til databehandleravtale",
        labelEn: "Add data processing agreement",
        onClick: () => onNavigateToTab?.("evidence"),
      };
    }
    if (
      (asset?.criticality === "high" || asset?.criticality === "critical") &&
      !riskMeta.risk_rationale
    ) {
      return {
        labelNb: "Gjør risikovurdering",
        labelEn: "Do a risk assessment",
        onClick: () => setOpenPill("risk"),
      };
    }
    return {
      labelNb: "Se leverandørens dokumentasjon",
      labelEn: "View vendor documentation",
      onClick: () => onNavigateToTab?.("evidence"),
    };
  })();

  // --- Laras plan for GDPR-rolle (må godkjennes av brukeren) ---
  const [gdprPlanDismissed, setGdprPlanDismissed] = useState(false);

  const gdprPlan = buildGdprRolePlan({
    vendorName: asset?.name,
    vendorCategory: asset?.vendor_category,
    description: asset?.description,
    usagePurpose,
    usageTags,
    hasPrivacyPolicy: !!asset?.privacy_policy_url,
    hasDpa: !!(asset as any)?.has_dpa,
    sensitive: sensitiveOn,
    currentRole: asset?.gdpr_role,
  });

  const gdprPlanApprovedBy: string | null = riskMeta.gdpr_role_approved_by || null;
  const gdprPlanApprovedAt: string | null = riskMeta.gdpr_role_approved_at
    ? new Date(riskMeta.gdpr_role_approved_at).toLocaleDateString(isNb ? "nb-NO" : "en-GB")
    : null;

  const handleApproveGdprPlan = () => {
    setLaraLoading(true);
    setTimeout(() => {
      const keepSensitive = gdprRoleHandlesPersonalData(gdprPlan.role);
      updateMutation.mutate({
        gdpr_role: gdprPlan.role,
        ...(keepSensitive ? {} : { processes_sensitive_data: false, sensitive_data_categories: [] }),
        metadata: {
          ...riskMeta,
          gdpr_role_approved_by: currentUserName,
          gdpr_role_approved_at: new Date().toISOString(),
          gdpr_role_plan_steps: isNb ? gdprPlan.stepsNb : gdprPlan.stepsEn,
          gdpr_role_plan_done: gdprPlan.steps.filter((s) => s.byLara).map((s) => s.id),
        },
      } as any);
      setLaraLoading(false);
      toast.success(
        isNb ? "Planen er godkjent — Lara følger opp stegene" : "Plan approved — Lara follows up on the steps"
      );
    }, 500);
  };


  const gdprPlanDoneSteps: string[] = Array.isArray(riskMeta.gdpr_role_plan_done)
    ? riskMeta.gdpr_role_plan_done
    : [];

  const gdprPlanApproved = !!gdprPlanApprovedBy && gdprPlan.matchesCurrent;

  const handleToggleGdprStep = (id: string) => {
    updateMutation.mutate({
      metadata: {
        ...riskMeta,
        gdpr_role_plan_done: gdprPlanDoneSteps.includes(id)
          ? gdprPlanDoneSteps.filter((s) => s !== id)
          : [...gdprPlanDoneSteps, id],
      },
    } as any);
    toast.success(isNb ? "Steget er markert som gjort" : "Step marked as done");
  };

  const toneText = (value: string | null | undefined) => {
    switch (value) {
      case "low": return "text-success";
      case "medium": return "text-warning";
      case "high":
      case "critical": return "text-destructive";
      default: return "text-foreground";
    }
  };

  const getLabel = (options: typeof criticalityOptions, value: string | null | undefined) =>
    getLabelFor(options, value, isNb);

  const pillItems: ContextPillItem[] = [
    {
      key: "criticality",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: isNb ? "Kritikalitet" : "Criticality",
      value: getLabel(criticalityOptions, asset?.criticality || "medium"),
      toneClass: toneText(asset?.criticality),
      panel: (
        <>
          <Select
            value={asset?.criticality || "medium"}
            onValueChange={(v) => handleFieldChange("criticality", v)}
          >
            <SelectTrigger className={`h-9 max-w-xs text-sm font-semibold border ${severityColor(asset?.criticality)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {criticalityOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{isNb ? o.labelNb : o.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[13px] text-muted-foreground leading-snug">
            {isNb
              ? "Hvor viktig denne leverandøren er for virksomheten. Høy kritikalitet krever strengere oppfølging."
              : "How important this vendor is to the business. High criticality requires stricter follow-up."}
          </p>
          <button onClick={() => onNavigateToTab?.("overview")} className="flex items-center gap-1 text-[13px] text-primary hover:underline">
            <ArrowRight className="h-2.5 w-2.5" />
            {isNb ? "Påvirker: Tredjepart og verdikjede" : "Affects: Third-party management"}
          </button>
        </>
      ),
    },
    {
      key: "priority",
      icon: <Flag className="h-3.5 w-3.5" />,
      label: isNb ? "Prioritet" : "Priority",
      value: getLabel(priorityOptions, asset?.priority),
      toneClass: "text-foreground",
      panel: (
        <>
          <Select
            value={asset?.priority || "not_set"}
            onValueChange={(v) => handleFieldChange("priority", v === "not_set" ? null as any : v)}
          >
            <SelectTrigger className={`h-9 max-w-xs text-sm font-semibold border ${priorityColor(asset?.priority)}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{isNb ? o.labelNb : o.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[13px] text-muted-foreground leading-snug">
            {isNb
              ? "Din prioritering av leverandøren for filtrering og oppfølging."
              : "Your prioritization of this vendor for filtering and follow-up."}
          </p>
          <button onClick={() => onNavigateToTab?.("overview")} className="flex items-center gap-1 text-[13px] text-primary hover:underline">
            <ArrowRight className="h-2.5 w-2.5" />
            {isNb ? "Påvirker: Filtrering og oppfølging" : "Affects: Filtering & follow-up"}
          </button>
        </>
      ),
    },
    {
      key: "gdpr",
      icon: <Database className="h-3.5 w-3.5" />,
      label: isNb ? "GDPR-rolle" : "GDPR role",
      value: getLabel(gdprOptions, asset?.gdpr_role),
      toneClass: "text-foreground",
      panel: (
        <>
          {(gdprPlanApproved || !gdprPlanDismissed) && (
            <GdprRolePlanCard
              isNb={isNb}
              plan={gdprPlan}
              loading={laraLoading}
              approved={gdprPlanApproved}
              completedStepIds={gdprPlanDoneSteps}
              onToggleStep={handleToggleGdprStep}
              approvedBy={gdprPlan.matchesCurrent ? gdprPlanApprovedBy : null}
              approvedAt={gdprPlan.matchesCurrent ? gdprPlanApprovedAt : null}
              onApprove={handleApproveGdprPlan}
              onDismiss={() => setGdprPlanDismissed(true)}
            />
          )}

          <Select value={asset?.gdpr_role || "not_set"} onValueChange={handleGdprRoleChange}>
            <SelectTrigger className="h-9 max-w-xs text-sm font-semibold border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {gdprOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{isNb ? o.labelNb : o.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>


          {showSensitive && (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between gap-2 max-w-xs">
                <span className="text-[13px] text-foreground leading-tight">
                  {isNb ? "Behandler sensitive personopplysninger" : "Processes sensitive personal data"}
                </span>
                <Switch checked={sensitiveOn} onCheckedChange={handleSensitiveToggle} />
              </div>

              {sensitiveOn && (
                <div className="space-y-1.5 max-w-xs">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 w-full justify-between text-[13px] font-normal">
                        {selectedSensitive.length > 0
                          ? `${selectedSensitive.length} ${isNb ? "kategorier" : "categories"}`
                          : (isNb ? "Velg kategorier" : "Select categories")}
                        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-64 p-2">
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {SENSITIVE_DATA_CATEGORIES.map((c) => (
                          <label key={c.value} className="flex items-center gap-2 text-sm px-1 py-1 rounded hover:bg-accent cursor-pointer">
                            <Checkbox
                              checked={selectedSensitive.includes(c.value)}
                              onCheckedChange={() => toggleSensitiveCategory(c.value)}
                            />
                            <span>{isNb ? c.labelNb : c.labelEn}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {selectedSensitive.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedSensitive.map((v) => (
                        <Badge key={v} variant="outline" className="text-[11px] text-warning bg-warning/10 border-warning/20">
                          {sensitiveCategoryLabel(v, isNb)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <p className="text-[13px] text-muted-foreground leading-snug">
            {sensitiveOn
              ? (isNb
                  ? "Særlige kategorier stiller strengere krav: databehandleravtale, risikovurdering og som regel DPIA."
                  : "Special categories require stricter controls: a DPA, a risk assessment and usually a DPIA.")
              : (isNb
                  ? "GDPR-rollen bestemmer hvilke kontroller og dokumentasjonskrav som gjelder (f.eks. DPA-krav)."
                  : "The GDPR role determines which controls and documentation requirements apply (e.g. DPA requirements).")}
          </p>
          <button onClick={() => onNavigateToTab?.("overview")} className="flex items-center gap-1 text-[13px] text-primary hover:underline">
            <ArrowRight className="h-2.5 w-2.5" />
            {isNb ? "Påvirker: Personvern og datahåndtering" : "Affects: Privacy & data handling"}
          </button>
        </>
      ),
    },
    {
      key: "risk",
      icon: <Shield className="h-3.5 w-3.5" />,
      label: isNb ? "Risikonivå" : "Risk level",
      value: getLabel(riskOptions, asset?.risk_level || "medium"),
      toneClass: toneText(asset?.risk_level),
      panel: (
        <>
          <div className="flex items-center gap-2">
            <Select value={asset?.risk_level || "medium"} onValueChange={handleManualRiskChange}>
              <SelectTrigger className={`h-9 max-w-xs text-sm font-semibold border ${severityColor(asset?.risk_level)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {riskOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{isNb ? o.labelNb : o.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 gap-1 text-[12px]" disabled={laraLoading} onClick={handleLaraSuggest}>
              <Sparkles className="h-3 w-3" />
              {isNb ? "Foreslå" : "Suggest"}
            </Button>
          </div>

          {riskSetBy ? (
            <div className="flex items-start gap-1.5 rounded-md bg-warning/15 px-2 py-1.5 text-[13px] text-warning-foreground/90 leading-tight">
              <UserRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {isNb ? "Satt manuelt av " : "Set manually by "}{riskSetBy}{riskSetAt ? `, ${riskSetAt}` : ""}
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-tight">
              <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
              <span>
                {isNb ? "Foreslått av Lara: " : "Suggested by Lara: "}
                <span className="font-medium text-foreground">{getLabel(riskOptions, riskSuggestion.level)}</span>
                {" — "}
                {(isNb ? riskSuggestion.reasons : riskSuggestion.reasonsEn).join(" · ")}
              </span>
            </div>
          )}

          {riskSetBy && (
            <div className="space-y-1">
              <p className="text-[12px] text-muted-foreground">
                {isNb ? "Begrunnelse " : "Rationale "}
                <span className="text-muted-foreground/70">
                  {isNb ? "(påkrevd ved manuell overstyring)" : "(required for manual override)"}
                </span>
              </p>
              <Textarea
                value={rationaleDraft}
                onChange={(e) => setRationaleDraft(e.target.value)}
                onBlur={saveRationale}
                rows={3}
                className="text-[13px]"
                placeholder={isNb
                  ? "F.eks. ROS-analyse gjennomført 12.06.2026 viser forhøyet risiko ved bortfall."
                  : "E.g. risk assessment from 12 June 2026 shows elevated risk on outage."}
              />
              {!rationaleDraft.trim() && (
                <p className="text-[12px] text-destructive">
                  {isNb ? "Begrunnelse mangler." : "Rationale is missing."}
                </p>
              )}
            </div>
          )}

          {riskSuggestion.needsRosDpia && (
            <div className="flex items-start gap-1.5 rounded-md border border-warning/20 bg-warning/10 p-2 text-[13px] text-warning leading-tight">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {isNb
                  ? "Anbefalt: gjennomfør ROS-analyse (og DPIA ved sensitive personopplysninger)."
                  : "Recommended: run a risk assessment (and a DPIA for sensitive personal data)."}
              </span>
            </div>
          )}

          <button onClick={() => onNavigateToTab?.("overview")} className="flex items-center gap-1 text-[13px] text-primary hover:underline">
            <ArrowRight className="h-2.5 w-2.5" />
            {isNb ? "Påvirker: Risikostyring og oppfølging" : "Affects: Risk management & follow-up"}
          </button>
        </>
      ),
    },
  ];

  // --- Alternativ visning: alt kartlagt automatisk av den lokale agenten Sara ---
  const saraMapping = buildSaraVendorMapping({
    vendorName: asset?.name,
    vendorCategory: (asset as any)?.vendor_category,
    description: asset?.description,
    hasDpa: !!(asset as any)?.has_dpa,
    hasPrivacyPolicy: !!asset?.privacy_policy_url,
    sensitive: sensitiveOn,
    dataCategoryCount: dataCategories.length,
    processorCount: processors.length,
    nonEuProcessorCount: processors.filter((p: any) => p.eu_eos_compliant === false).length,
  });

  const opts = (list: typeof criticalityOptions) =>
    list.map((o) => ({ value: o.value, label: isNb ? o.labelNb : o.labelEn }));

  const saraFields: SaraContextField[] = [
    {
      key: "criticality",
      label: isNb ? "Kritikalitet" : "Criticality",
      value: asset?.criticality,
      suggested: saraMapping.criticality,
      options: opts(criticalityOptions),
      overridden: !!riskMeta.criticality_set_by,
      onChange: (v) =>
        updateMutation.mutate({ criticality: v, metadata: { ...riskMeta, criticality_set_by: currentUserName } } as any),
    },
    {
      key: "priority",
      label: isNb ? "Prioritet" : "Priority",
      value: (asset as any)?.priority,
      suggested: saraMapping.priority,
      options: opts(priorityOptions),
      overridden: !!riskMeta.priority_set_by,
      onChange: (v) =>
        updateMutation.mutate({ priority: v, metadata: { ...riskMeta, priority_set_by: currentUserName } } as any),
    },
    {
      key: "gdpr",
      label: isNb ? "GDPR-rolle" : "GDPR role",
      value: asset?.gdpr_role,
      suggested: saraMapping.gdprRole,
      options: opts(gdprOptions),
      overridden: !!riskMeta.gdpr_role_approved_by,
      onChange: handleGdprRoleChange,
    },
    {
      key: "risk",
      label: isNb ? "Risikonivå" : "Risk level",
      value: asset?.risk_level,
      suggested: saraMapping.riskLevel,
      options: opts(riskOptions),
      overridden: !!riskSetBy,
      onChange: handleManualRiskChange,
    },
  ];

  if (saraInstalled && viewMode === "auto") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("auto")}
              className="rounded-md bg-background px-2.5 py-1 text-[12px] font-medium shadow-sm"
            >
              {isNb ? "Automatisk (Sara)" : "Automatic (Sara)"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("manual")}
              className="rounded-md px-2.5 py-1 text-[12px] text-muted-foreground"
            >
              {isNb ? "Manuell" : "Manual"}
            </button>
          </div>
        </div>

        <SaraMappedContextView
          isNb={isNb}
          mapping={saraMapping}
          fields={saraFields}
          purpose={usagePurpose}
          tags={usageTags}
          onSavePurpose={(v) => saveMeta({ usage_purpose: v })}
          onToggleTag={handleToggleUsageTag}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {saraInstalled && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("auto")}
              className="rounded-md px-2.5 py-1 text-[12px] text-muted-foreground"
            >
              {isNb ? "Automatisk (Sara)" : "Automatic (Sara)"}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("manual")}
              className="rounded-md bg-background px-2.5 py-1 text-[12px] font-medium shadow-sm"
            >
              {isNb ? "Manuell" : "Manual"}
            </button>
          </div>
        </div>
      )}

      <LaraContextBanner
        isNb={isNb}
        suggestion={contextSuggestion}
        riskLabel={getLabel(riskOptions, riskSuggestion.level)}
        criticalityLabel={getLabel(criticalityOptions, contextSuggestion.criticality)}
        gdprLabel={getLabel(gdprOptions, contextSuggestion.gdprRole)}
        loading={laraLoading}
        onAcceptAll={handleAcceptAll}
      />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ContextPillRow
          items={pillItems}
          openKey={openPill}
          onToggle={(k) => setOpenPill(openPill === k ? null : k)}
        />

        <VendorPurposeCard
          isNb={isNb}
          purpose={usagePurpose}
          tags={usageTags}
          suggestedText={isNb ? contextSuggestion.usageTextNb : contextSuggestion.usageTextEn}
          suggesting={laraLoading}
          onSavePurpose={(v) => saveMeta({ usage_purpose: v })}
          onToggleTag={handleToggleUsageTag}
          onSuggest={handleSuggestPurpose}
        />
      </div>




      {/* Processes (free-text + AI suggestions) */}
      <AISuggestTextarea
        icon={<Workflow className="h-4 w-4" />}
        titleNb="Prosesser som bruker denne leverandøren"
        titleEn="Processes using this vendor"
        placeholderNb="Beskriv hvilke interne prosesser eller arbeidsflyter som bruker leverandøren …"
        placeholderEn="Describe which internal processes or workflows use this vendor …"
        value={(asset?.metadata as any)?.processes_text || ""}
        onSave={async (next) => {
          const newMeta = { ...(asset?.metadata as any || {}), processes_text: next };
          const { error } = await supabase.from("assets").update({ metadata: newMeta }).eq("id", assetId);
          if (error) {
            toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
          } else {
            toast.success(isNb ? "Lagret" : "Saved");
            queryClient.invalidateQueries({ queryKey: ["asset-usage", assetId] });
          }
        }}
        edgeFunction="suggest-vendor-processes"
        context={{
          vendorName: asset?.name,
          vendorCategory: asset?.vendor_category,
          vendorDescription: asset?.description,
          vendorUrl: asset?.url,
        }}
      />

      {/* Sub-processors */}
      {processors.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isNb ? "Underdatabehandlere" : "Sub-processors"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {processors.map(p => (
                <div key={p.id} className="flex items-center justify-between text-sm p-1.5">
                  <span className="font-medium">{p.name}</span>
                  {p.eu_eos_compliant !== null && (
                    <Badge variant={p.eu_eos_compliant ? "default" : "destructive"} className="text-[13px]">
                      {p.eu_eos_compliant ? "EU/EØS" : (isNb ? "Utenfor EU" : "Non-EU")}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
