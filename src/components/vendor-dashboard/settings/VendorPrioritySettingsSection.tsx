import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_KEYS, PRIORITY_META } from "@/lib/derivedPriority";
import {
  DEFAULT_PRIORITY_LABELS,
  useVendorPriorityLabels,
  VENDOR_MODULE_SETTINGS_KEY,
  type PriorityLabelMap,
} from "@/hooks/useVendorPriorityLabels";

type TemplateId = "standard" | "risk" | "custom";

const TEMPLATES: {
  id: Exclude<TemplateId, "custom">;
  name: string;
  description: string;
  labels: PriorityLabelMap;
}[] = [
  {
    id: "standard",
    name: "Standard",
    description: "Kritisk · Høy · Medium · Lav",
    labels: DEFAULT_PRIORITY_LABELS,
  },
  {
    id: "risk",
    name: "Risikobasert",
    description: "Uakseptabel · Vesentlig · Moderat · Ubetydelig",
    labels: {
      P0: "Uakseptabel risiko",
      P1: "Vesentlig risiko",
      P2: "Moderat risiko",
      P3: "Ubetydelig risiko",
    } as PriorityLabelMap,
  },
];

function matchTemplate(labels: PriorityLabelMap): TemplateId {
  const found = TEMPLATES.find((t) =>
    PRIORITY_KEYS.every((k) => (labels[k] || "").trim() === t.labels[k]),
  );
  return found?.id ?? "custom";
}

/**
 * Egendefinerte visningsnavn for prioritetsskalaen P0–P3.
 * Gjelder kun visninger inne i leverandørmodulen.
 */
export function VendorPrioritySettingsSection() {
  const queryClient = useQueryClient();
  const { labels, isLoading } = useVendorPriorityLabels();
  const [draft, setDraft] = useState<PriorityLabelMap>(DEFAULT_PRIORITY_LABELS);
  const [template, setTemplate] = useState<TemplateId>("standard");
  const [initialised, setInitialised] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialised) {
      setDraft(labels);
      setTemplate(matchTemplate(labels));
      setInitialised(true);
    }
  }, [isLoading, initialised, labels]);


  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = PRIORITY_KEYS.reduce((acc, key) => {
        acc[key] = (draft[key] || "").trim() || DEFAULT_PRIORITY_LABELS[key];
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from("vendor_module_settings")
        .upsert({ scope: "global", priority_labels: payload }, { onConflict: "scope" });
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: VENDOR_MODULE_SETTINGS_KEY });
      toast.success("Prioritetsskalaen er lagret");
    } catch (e) {
      toast.error("Kunne ikke lagre prioritetsskalaen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Velg en ferdig mal for prioritetsskalaen, eller skriv inn egen notasjon. Navnene
        brukes kun i leverandørmodulen — resten av plattformen viser standardnavnene.
      </p>

      <div className="grid gap-2 sm:grid-cols-3">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTemplate(t.id);
              setDraft(t.labels);
            }}
            className={`rounded-lg border p-3 text-left transition-colors ${
              template === t.id
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/50"
            }`}
          >
            <span className="flex items-center gap-1.5 text-sm font-medium">
              {template === t.id && <Check className="h-3.5 w-3.5 text-primary" />}
              {t.name}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t.description}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setTemplate("custom")}
          className={`rounded-lg border p-3 text-left transition-colors ${
            template === "custom"
              ? "border-primary bg-primary/5"
              : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {template === "custom" && <Check className="h-3.5 w-3.5 text-primary" />}
            Egen notasjon
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Skriv inn deres egne navn
          </span>
        </button>
      </div>

      {template === "custom" && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {PRIORITY_KEYS.map((key) => {
              const meta = PRIORITY_META[key];
              return (
                <div key={key} className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium shrink-0 ${meta.pillClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dotClass}`} aria-hidden />
                    {key}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Label htmlFor={`priority-${key}`} className="sr-only">
                      Visningsnavn for {key}
                    </Label>
                    <Input
                      id={`priority-${key}`}
                      value={draft[key] ?? ""}
                      placeholder={DEFAULT_PRIORITY_LABELS[key]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setDraft(DEFAULT_PRIORITY_LABELS);
            setTemplate("standard");
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Tilbakestill
        </Button>

        <Button onClick={handleSave} disabled={saving || isLoading}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Lagre
        </Button>
      </div>
    </div>
  );
}
