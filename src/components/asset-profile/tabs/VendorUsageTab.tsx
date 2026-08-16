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
  const [laraLoading, setLaraLoading] = useState(false);

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

  const handleLaraSuggest = async () => {
    setLaraLoading(true);
    setTimeout(() => {
      handleFieldChange("risk_level", riskSuggestion.level);
      setLaraLoading(false);
    }, 600);
  };


  const getLabel = (options: typeof criticalityOptions, value: string | null | undefined) => {
    const opt = options.find(o => o.value === (value || "not_set"));
    return opt ? (isNb ? opt.labelNb : opt.labelEn) : (isNb ? "Ikke satt" : "Not set");
  };

  return (
    <div className="space-y-5">

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {isNb
            ? "Disse innstillingene bestemmer hvilke kontroller og risikovurderinger som kreves for denne leverandøren."
            : "These settings determine which controls and risk assessments are required for this vendor."}
        </p>
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Criticality */}
        <Card className="relative group">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isNb ? "Kritikalitet" : "Criticality"}
              <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <Select
              value={asset?.criticality || "medium"}
              onValueChange={(v) => handleFieldChange("criticality", v)}
            >
              <SelectTrigger className={`h-9 text-sm font-semibold border ${severityColor(asset?.criticality)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {criticalityOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {isNb ? o.labelNb : o.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[13px] text-muted-foreground leading-tight">
              {isNb
                ? "Hvor viktig denne leverandøren er for virksomheten. Høy kritikalitet krever strengere oppfølging."
                : "How important this vendor is to the business. High criticality requires stricter follow-up."}
            </p>
            <button
              onClick={() => onNavigateToTab?.("overview")}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              {isNb ? "Påvirker: Tredjepart og verdikjede" : "Affects: Third-party management"}
            </button>
          </CardContent>
        </Card>

        {/* Priority */}
        <Card className="relative group">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flag className="h-3.5 w-3.5" />
              {isNb ? "Prioritet" : "Priority"}
              <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <Select
              value={asset?.priority || "not_set"}
              onValueChange={(v) => handleFieldChange("priority", v === "not_set" ? null as any : v)}
            >
              <SelectTrigger className={`h-9 text-sm font-semibold border ${priorityColor(asset?.priority)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {isNb ? o.labelNb : o.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[13px] text-muted-foreground leading-tight">
              {isNb
                ? "Din prioritering av leverandøren for filtrering og oppfølging. Kan kobles til risikoscenarier."
                : "Your prioritization of this vendor for filtering and follow-up. Can be linked to risk scenarios."}
            </p>
            <button
              onClick={() => onNavigateToTab?.("overview")}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              {isNb ? "Påvirker: Filtrering og oppfølging" : "Affects: Filtering & follow-up"}
            </button>
          </CardContent>
        </Card>

        {/* GDPR Role */}
        <Card className="relative group">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Database className="h-3.5 w-3.5" />
              {isNb ? "GDPR-rolle" : "GDPR role"}
              <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <Select
              value={asset?.gdpr_role || "not_set"}
              onValueChange={(v) => handleGdprRoleChange(v)}
            >
              <SelectTrigger className="h-9 text-sm font-semibold border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {gdprOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {isNb ? o.labelNb : o.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {showSensitive && (
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] text-foreground leading-tight">
                    {isNb ? "Behandler sensitive personopplysninger" : "Processes sensitive personal data"}
                  </span>
                  <Switch
                    checked={sensitiveOn}
                    onCheckedChange={handleSensitiveToggle}
                  />
                </div>

                {sensitiveOn && (
                  <div className="space-y-1.5">
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

            <p className="text-[13px] text-muted-foreground leading-tight">
              {sensitiveOn
                ? (isNb
                    ? "Særlige kategorier stiller strengere krav: databehandleravtale, risikovurdering og som regel DPIA."
                    : "Special categories require stricter controls: a DPA, a risk assessment and usually a DPIA.")
                : (isNb
                    ? "GDPR-rollen bestemmer hvilke kontroller og dokumentasjonskrav som gjelder (f.eks. DPA-krav)."
                    : "The GDPR role determines which controls and documentation requirements apply (e.g. DPA requirements).")}
            </p>
            <button
              onClick={() => onNavigateToTab?.("overview")}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              {isNb ? "Påvirker: Personvern og datahåndtering" : "Affects: Privacy & data handling"}
            </button>
          </CardContent>
        </Card>

        {/* Risk */}
        <Card className="relative group">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {isNb ? "Risikonivå" : "Risk level"}
              <Button
                size="sm"
                variant="outline"
                className="ml-auto h-7 gap-1 text-[12px]"
                disabled={laraLoading}
                onClick={handleLaraSuggest}
              >
                <Sparkles className="h-3 w-3" />
                {isNb ? "Foreslå" : "Suggest"}
              </Button>
            </div>
            <Select
              value={asset?.risk_level || "medium"}
              onValueChange={handleManualRiskChange}
            >
              <SelectTrigger className={`h-9 text-sm font-semibold border ${severityColor(asset?.risk_level)}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {riskOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>
                    {isNb ? o.labelNb : o.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {riskSetBy ? (
              <div className="flex items-start gap-1.5 rounded-md bg-warning/15 px-2 py-1.5 text-[13px] text-warning-foreground/90 leading-tight">
                <UserRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {isNb ? "Satt manuelt av " : "Set manually by "}
                  {riskSetBy}
                  {riskSetAt ? `, ${riskSetAt}` : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-start gap-1.5 text-[13px] text-muted-foreground leading-tight">
                <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  {isNb ? "Foreslått av Lara: " : "Suggested by Lara: "}
                  <span className="font-medium text-foreground">
                    {getLabel(riskOptions, riskSuggestion.level)}
                  </span>
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

            <button
              onClick={() => onNavigateToTab?.("overview")}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              {isNb ? "Påvirker: Risikostyring og oppfølging" : "Affects: Risk management & follow-up"}
            </button>
          </CardContent>
        </Card>

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
