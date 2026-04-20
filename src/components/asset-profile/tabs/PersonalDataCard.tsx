import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface PersonalDataCardProps {
  assetId: string;
}

export const PersonalDataCard = ({ assetId }: PersonalDataCardProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: asset } = useQuery({
    queryKey: ["asset-personal-data", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, vendor, vendor_category, description, url, metadata")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    const meta = (asset?.metadata as any) || {};
    const stored = meta.personal_data_text || "";
    setText(stored);
    setOriginalText(stored);
  }, [asset?.id]);

  const meta = (asset?.metadata as any) || {};
  const updatedAt = meta.personal_data_updated_at as string | undefined;
  const dirty = text !== originalText;

  const handleAiSuggest = async () => {
    if (!asset) return;
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-vendor-data-types", {
        body: {
          vendorName: asset.name,
          vendorCategory: asset.vendor_category || asset.vendor,
          vendorDescription: asset.description,
          vendorUrl: asset.url,
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
      if (text.trim() && !confirm(isNb ? "Erstatte eksisterende tekst med AI-forslaget?" : "Replace existing text with AI suggestion?")) {
        setText(text + "\n\n" + suggestion);
      } else {
        setText(suggestion);
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
      const newMeta = { ...(meta || {}), personal_data_text: text, personal_data_updated_at: new Date().toISOString() };
      const { error } = await supabase.from("assets").update({ metadata: newMeta }).eq("id", assetId);
      if (error) throw error;
      setOriginalText(text);
      toast.success(isNb ? "Lagret" : "Saved");
      queryClient.invalidateQueries({ queryKey: ["asset-personal-data", assetId] });
    } catch (e: any) {
      toast.error(e.message || (isNb ? "Kunne ikke lagre" : "Could not save"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          {isNb ? "Personopplysninger som behandles" : "Personal Data Processed"}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={handleAiSuggest} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {isNb ? "Foreslå med AI" : "Suggest with AI"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isNb ? "Skriv inn hvilke personopplysninger leverandøren behandler, eller la AI foreslå…" : "Describe what personal data the vendor processes, or let AI suggest…"}
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
  );
};
