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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LaraIcon } from "@/components/agents/LaraIcon";

/** Fjerner markdown-stjerner og understrek fra fritekst. */
export function stripMarkdown(text: string): string {
  return text.replace(/\*+/g, "").replace(/__+/g, "").replace(/[ \t]{2,}/g, " ");
}

function parseSuggestionItems(raw: string): string[] {
  return stripMarkdown(raw)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*[-•\d.)]+\s*/, "").trim())
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
  /** Ferdige forslag brukeren kan legge til uten AI. */
  presets?: { nb: string; en: string }[];
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
  presets,
  context,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const [draft, setDraft] = useState(value);
  const [suggestionItems, setSuggestionItems] = useState<string[] | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setDraft(stripMarkdown(value)); }, [value]);

  const addLine = (line: string) => {
    const clean = stripMarkdown(line).trim();
    if (!clean) return;
    if (draft.includes(clean)) return;
    setDraft(draft ? `${draft}\n• ${clean}` : `• ${clean}`);
  };

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
      await onSave(stripMarkdown(draft));
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
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleSuggest}
                disabled={loading}
                className="inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Lara"
              >
                {loading
                  ? <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  : <LaraIcon size={18} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px] text-[12px]">
              {isNb
                ? "Lara kan foreslå dette – godkjenn eller rediger."
                : "Lara can suggest this – approve or edit."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(stripMarkdown(e.target.value))}
          placeholder={isNb ? placeholderNb : placeholderEn}
          rows={5}
          className="text-sm resize-y min-h-[110px]"
        />

        {presets && presets.length > 0 && !suggestionItems && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {isNb ? "Vanlige prosesser — klikk for å legge til" : "Common processes — click to add"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((p) => {
                const label = isNb ? p.nb : p.en;
                const added = draft.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => addLine(label)}
                    disabled={added}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                      added
                        ? "border-border bg-muted text-muted-foreground"
                        : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
                    )}
                  >
                    {added ? "✓ " : "+ "}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
