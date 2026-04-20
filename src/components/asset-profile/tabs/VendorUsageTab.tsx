import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Database, Workflow, Shield, AlertTriangle, Pencil, Info, Sparkles, ArrowRight, Flag } from "lucide-react";
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
    case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800";
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

  const { data: relations = [] } = useQuery({
    queryKey: ["asset-relations-usage", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("*, source:assets!asset_relationships_source_asset_id_fkey(id,name), target:assets!asset_relationships_target_asset_id_fkey(id,name)")
        .or(`source_asset_id.eq.${assetId},target_asset_id.eq.${assetId}`);
      if (error) throw error;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
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

  const handleLaraSuggest = async () => {
    setLaraLoading(true);
    // Simulate AI suggestion based on context
    setTimeout(() => {
      const suggested = asset?.vendor_category === "cloud" || dataCategories.some(dc => dc.category === "sensitive")
        ? "high" : "medium";
      handleFieldChange("risk_level", suggested);
      toast.success(isNb ? `Lara foreslår: ${suggested === "high" ? "Høy" : "Middels"} risiko` : `Lara suggests: ${suggested === "high" ? "High" : "Medium"} risk`);
      setLaraLoading(false);
    }, 1200);
  };

  const getLabel = (options: typeof criticalityOptions, value: string | null | undefined) => {
    const opt = options.find(o => o.value === (value || "not_set"));
    return opt ? (isNb ? opt.labelNb : opt.labelEn) : (isNb ? "Ikke satt" : "Not set");
  };

  return (
    <div className="space-y-5">
      {/* Context badge */}
      <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
        <Building2 className="h-3.5 w-3.5" />
        {isNb ? "Vår organisasjon" : "Our organization"}
      </Badge>

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
              {isNb ? "Påvirker: Tredjepartstyring" : "Affects: Third-party management"}
            </button>
          </CardContent>
        </Card>

        {/* Risk Level */}
        <Card className="relative group">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              {isNb ? "Risikonivå" : "Risk level"}
              <Pencil className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
            </div>
            <div className="flex gap-1.5">
              <Select
                value={asset?.risk_level || "medium"}
                onValueChange={(v) => handleFieldChange("risk_level", v)}
              >
                <SelectTrigger className={`h-9 text-sm font-semibold border flex-1 ${severityColor(asset?.risk_level)}`}>
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
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={handleLaraSuggest}
                disabled={laraLoading}
                title={isNb ? "La Lara foreslå" : "Let Lara suggest"}
              >
                <Sparkles className={`h-3.5 w-3.5 text-primary ${laraLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <p className="text-[13px] text-muted-foreground leading-tight">
              {isNb
                ? "Risikonivået påvirker oppfølgingskrav og kontrollfrekvens."
                : "Risk level affects follow-up requirements and control frequency."}
            </p>
            <button
              onClick={() => onNavigateToTab?.("overview")}
              className="flex items-center gap-1 text-[13px] text-primary hover:underline"
            >
              <ArrowRight className="h-2.5 w-2.5" />
              {isNb ? "Påvirker: Drift og sikkerhet" : "Affects: Operations & security"}
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
              onValueChange={(v) => handleFieldChange("gdpr_role", v)}
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
            <p className="text-[13px] text-muted-foreground leading-tight">
              {isNb
                ? "GDPR-rollen bestemmer hvilke kontroller og dokumentasjonskrav som gjelder (f.eks. DPA-krav)."
                : "The GDPR role determines which controls and documentation requirements apply (e.g. DPA requirements)."}
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
      </div>

      {/* Data usage (free-text + AI suggestions) */}
      <AISuggestTextarea
        icon={<Database className="h-4 w-4" />}
        titleNb="Databruk"
        titleEn="Data usage"
        placeholderNb="Beskriv hvilke data leverandøren behandler – personopplysninger, kategorier, mengde, sensitivitet …"
        placeholderEn="Describe what data the vendor processes – personal data, categories, volume, sensitivity …"
        value={(asset?.metadata as any)?.data_usage_text || ""}
        onSave={async (next) => {
          const newMeta = { ...(asset?.metadata as any || {}), data_usage_text: next };
          const { error } = await supabase.from("assets").update({ metadata: newMeta }).eq("id", assetId);
          if (error) {
            toast.error(isNb ? "Kunne ikke lagre" : "Could not save");
          } else {
            toast.success(isNb ? "Lagret" : "Saved");
            queryClient.invalidateQueries({ queryKey: ["asset-usage", assetId] });
          }
        }}
        edgeFunction="suggest-vendor-data-types"
        context={{
          vendorName: asset?.name,
          vendorCategory: asset?.vendor_category,
          vendorDescription: asset?.description,
          vendorUrl: asset?.url,
        }}
      />

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

      {/* Integrations / Relations */}
      {relations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{isNb ? "Integrasjoner" : "Integrations"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {relations.map(r => {
                const other = r.source_asset_id === assetId ? (r as any).target : (r as any).source;
                return (
                  <div key={r.id} className="flex items-center gap-2 text-sm p-1.5">
                    <Badge variant="outline" className="text-[13px]">{r.relationship_type}</Badge>
                    <span>{other?.name || "—"}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
