import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  icon: React.ReactNode;
  titleNb: string;
  titleEn: string;
  placeholderNb: string;
  placeholderEn: string;
  value: string;
  onSave: (next: string) => Promise<void> | void;
  edgeFunction: "suggest-vendor-data-types" | "suggest-vendor-processes";
  context: {
    vendorName?: string | null;
    vendorCategory?: string | null;
    vendorDescription?: string | null;
    vendorUrl?: string | null;
  };
}

export function AISuggestTextarea({
  icon,
  titleNb,
  titleEn,
  placeholderNb,
  placeholderEn,
  value,
  onSave,
  edgeFunction,
  context,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [draft, setDraft] = useState(value);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(value); }, [value]);

  const isDirty = draft !== value;

  const handleSuggest = async () => {
    if (!context.vendorName) {
      toast.error(isNb ? "Mangler leverandørnavn" : "Missing vendor name");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: { ...context, language: isNb ? "nb" : "en" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setSuggestion(data?.suggestion || "");
    } catch (e: any) {
      toast.error(e.message || (isNb ? "Kunne ikke hente forslag" : "Could not fetch suggestion"));
    } finally {
      setLoading(false);
    }
  };

  const acceptSuggestion = (replace: boolean) => {
    if (!suggestion) return;
    setDraft(replace ? suggestion : (draft ? `${draft}\n${suggestion}` : suggestion));
    setSuggestion(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          {icon}
          {isNb ? titleNb : titleEn}
        </CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 h-8"
          onClick={handleSuggest}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
          {isNb ? "Foreslå med Mynder" : "Suggest with Mynder"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isNb ? placeholderNb : placeholderEn}
          rows={5}
          className="text-sm resize-y min-h-[110px]"
        />

        {suggestion && (
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              {isNb ? "Forslag fra Mynder" : "Suggestion from Mynder"}
            </div>
            <pre className="text-xs whitespace-pre-wrap font-sans text-foreground leading-relaxed">{suggestion}</pre>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" variant="default" className="gap-1.5 h-8" onClick={() => acceptSuggestion(true)}>
                <Check className="h-3.5 w-3.5" />
                {isNb ? "Erstatt" : "Replace"}
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => acceptSuggestion(false)}>
                <Check className="h-3.5 w-3.5" />
                {isNb ? "Legg til" : "Append"}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="gap-1.5 h-8" onClick={() => setSuggestion(null)}>
                <X className="h-3.5 w-3.5" />
                {isNb ? "Avvis" : "Dismiss"}
              </Button>
            </div>
          </div>
        )}

        {isDirty && (
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setDraft(value)} disabled={saving}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button type="button" size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {isNb ? "Lagre" : "Save"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
