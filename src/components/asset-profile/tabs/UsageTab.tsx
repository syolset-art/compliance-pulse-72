import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Plus, FileText, Users, Workflow, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface UsageTabProps {
  assetId: string;
}

export const UsageTab = ({ assetId }: UsageTabProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [processText, setProcessText] = useState("");
  const [originalProcessText, setOriginalProcessText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["asset-with-workarea", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select(`
          *,
          work_areas (
            id,
            name,
            description,
            responsible_person
          )
        `)
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const meta = (asset?.metadata as any) || {};
    const stored = meta.processes_text || "";
    setProcessText(stored);
    setOriginalProcessText(stored);
  }, [asset?.id]);

  const meta = (asset?.metadata as any) || {};
  const updatedAt = meta.processes_updated_at as string | undefined;
  const dirty = processText !== originalProcessText;

  const handleAiSuggest = async () => {
    if (!asset) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-vendor-processes", {
        body: {
          vendorName: asset.name,
          vendorCategory: asset.vendor_category || asset.vendor,
          vendorDescription: asset.description,
          language: i18n.language,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const suggestion = data?.suggestion || "";
      if (!suggestion) {
        toast.error(isNb ? "Ingen forslag mottatt" : "No suggestion received");
        return;
      }
      if (processText.trim() && !confirm(isNb ? "Erstatte eksisterende tekst med AI-forslaget?" : "Replace existing text with AI suggestion?")) {
        setProcessText(processText + "\n\n" + suggestion);
      } else {
        setProcessText(suggestion);
      }
      toast.success(isNb ? "AI-forslag lagt til" : "AI suggestion added");
    } catch (e: any) {
      toast.error(e.message || (isNb ? "Kunne ikke hente forslag" : "Could not fetch suggestion"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newMeta = { ...(meta || {}), processes_text: processText, processes_updated_at: new Date().toISOString() };
      const { error } = await supabase.from("assets").update({ metadata: newMeta }).eq("id", assetId);
      if (error) throw error;
      setOriginalProcessText(processText);
      toast.success(isNb ? "Lagret" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["asset-with-workarea", assetId] });
    } catch (e: any) {
      toast.error(e.message || (isNb ? "Kunne ikke lagre" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Work Areas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t("trustProfile.workAreas")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asset?.work_areas ? (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="font-medium">{asset.work_areas.name}</p>
              {asset.work_areas.description && (
                <p className="text-sm text-muted-foreground">{asset.work_areas.description}</p>
              )}
              {asset.work_areas.responsible_person && (
                <p className="text-sm">
                  <span className="text-muted-foreground">{t("trustProfile.responsible")}:</span>{" "}
                  {asset.work_areas.responsible_person}
                </p>
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t("trustProfile.noWorkArea")}</p>
          )}
        </CardContent>
      </Card>

      {/* Protocols */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("trustProfile.protocols")}
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("common.add")}
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t("trustProfile.noProtocols")}</p>
        </CardContent>
      </Card>

      {/* Processes - free text + AI */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Workflow className="h-5 w-5" />
            {isNb ? "Prosesser som bruker denne leverandøren" : "Processes using this vendor"}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            {isNb ? "Foreslå med AI" : "Suggest with AI"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={processText}
            onChange={(e) => setProcessText(e.target.value)}
            placeholder={isNb ? "Beskriv hvilke prosesser i virksomheten som bruker denne leverandøren, eller la AI foreslå…" : "Describe which business processes use this vendor, or let AI suggest…"}
            rows={6}
            className="resize-y min-h-[120px]"
          />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {updatedAt
                ? `${isNb ? "Sist oppdatert" : "Last updated"} ${new Date(updatedAt).toLocaleString(isNb ? "nb-NO" : "en-US")}`
                : isNb ? "Ikke lagret enda" : "Not saved yet"}
            </p>
            <Button
              size="sm"
              variant={dirty ? "default" : "ghost"}
              onClick={handleSave}
              disabled={!dirty || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {isNb ? "Lagre" : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
