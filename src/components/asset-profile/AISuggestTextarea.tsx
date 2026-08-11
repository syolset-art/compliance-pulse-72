import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, Loader2, Check, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function parseSuggestionItems(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-*•\d.)]+\s*/, "").trim())
    .filter((l) => l.length > 0);
}

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
  hideHeader,
  context,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [draft, setDraft] = useState(value);
  const [suggestionItems, setSuggestionItems] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
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
      const items = parseSuggestionItems(data?.suggestion || "");
      setSuggestionItems(items);
      // Pre-check all items by default
      setSelected(Object.fromEntries(items.map((_, i) => [i, true])));
    } catch (e: any) {
      toast.error(e.message || (isNb ? "Kunne ikke hente forslag" : "Could not fetch suggestion"));
    } finally {
      setLoading(false);
    }
  };

  const applySelection = (replace: boolean) => {
    if (!suggestionItems) return;
    const chosen = suggestionItems.filter((_, i) => selected[i]);
    if (chosen.length === 0) {
      toast.error(isNb ? "Velg minst ett forslag" : "Select at least one suggestion");
      return;
    }
    const block = chosen.map((c) => `• ${c}`).join("\n");
    setDraft(replace ? block : (draft ? `${draft}\n${block}` : block));
    setSuggestionItems(null);
    setSelected({});
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
      {!hideHeader && (
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
            {isNb ? "La Lara foreslå" : "Let Lara suggest"}
          </Button>
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isNb ? placeholderNb : placeholderEn}
          rows={5}
          className="text-sm resize-y min-h-[110px]"
        />

        {suggestionItems && (
          <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3 space-y-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" />
                {isNb ? "Forslag fra Lara" : "Suggestion from Lara"}
              </div>
              <div className="flex gap-2 text-[11px]">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  onClick={() => setSelected(Object.fromEntries(suggestionItems.map((_, i) => [i, true])))}
                >
                  {isNb ? "Velg alle" : "Select all"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  onClick={() => setSelected({})}
                >
                  {isNb ? "Fjern alle" : "Clear"}
                </button>
              </div>
            </div>
            {suggestionItems.length === 0 ? (
              <p className="text-xs text-muted-foreground">{isNb ? "Ingen forslag" : "No suggestions"}</p>
            ) : (
              <ul className="space-y-1.5">
                {suggestionItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Checkbox
                      id={`sugg-${i}`}
                      checked={!!selected[i]}
                      onCheckedChange={(c) => setSelected((s) => ({ ...s, [i]: !!c }))}
                      className="mt-0.5"
                    />
                    <label htmlFor={`sugg-${i}`} className="text-xs leading-relaxed text-foreground cursor-pointer flex-1">
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button type="button" size="sm" variant="default" className="gap-1.5 h-8" onClick={() => applySelection(false)}>
                <Check className="h-3.5 w-3.5" />
                {isNb ? "Legg til valgte" : "Add selected"}
              </Button>
              <Button type="button" size="sm" variant="outline" className="gap-1.5 h-8" onClick={() => applySelection(true)}>
                <Check className="h-3.5 w-3.5" />
                {isNb ? "Erstatt med valgte" : "Replace with selected"}
              </Button>
              <Button type="button" size="sm" variant="ghost" className="gap-1.5 h-8" onClick={() => { setSuggestionItems(null); setSelected({}); }}>
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
