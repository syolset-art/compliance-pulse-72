import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_KEYS, PRIORITY_META, type PriorityKey } from "@/lib/derivedPriority";
import {
  DEFAULT_PRIORITY_LABELS,
  OPTIONAL_PRIORITY_KEYS,
  useVendorPriorityLabels,
  VENDOR_MODULE_SETTINGS_KEY,
  type PriorityLabelMap,
} from "@/hooks/useVendorPriorityLabels";

/** Visningsnavn for prioritetsskalaen P-0 – P-4. */
const PRIORITY_LABELS: Record<PriorityKey, string> = {
  P0: "P-0",
  P1: "P-1",
  P2: "P-2",
  P3: "P-3",
  P4: "P-4",
};

/**
 * Prioriteringsskalaen er valgfri. Når den er aktivert kan brukeren endre
 * visningsnavn per nivå, og markere de laveste nivåene (P-3 og P-4) som
 * «ikke aktuelt». Gjelder kun visninger inne i leverandørmodulen.
 */
export function VendorPrioritySettingsSection() {
  const queryClient = useQueryClient();
  const { labels, disabled, enabled, isLoading } = useVendorPriorityLabels();
  const [draft, setDraft] = useState<PriorityLabelMap>(DEFAULT_PRIORITY_LABELS);
  const [draftDisabled, setDraftDisabled] = useState<PriorityKey[]>([]);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [initialised, setInitialised] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialised) {
      setDraft(labels);
      setDraftDisabled(disabled);
      setDraftEnabled(enabled);
      setInitialised(true);
    }
  }, [isLoading, initialised, labels, disabled, enabled]);


  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = PRIORITY_KEYS.reduce((acc, key) => {
        acc[key] = (draft[key] || "").trim() || DEFAULT_PRIORITY_LABELS[key];
        return acc;
      }, {} as Record<string, string>);

      const { error } = await supabase
        .from("vendor_module_settings")
        .upsert(
          { scope: "global", priority_labels: payload, disabled_priority_levels: draftDisabled },
          { onConflict: "scope" },
        );
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: VENDOR_MODULE_SETTINGS_KEY });
      toast.success("Prioritetsskalaen er lagret");
    } catch (e) {
      toast.error("Kunne ikke lagre prioritetsskalaen");
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: "default" | "letters" | "numbers") => {
    setDraft(
      PRIORITY_KEYS.reduce((acc, key, i) => {
        acc[key] =
          preset === "default"
            ? DEFAULT_PRIORITY_LABELS[key]
            : preset === "letters"
              ? ["A", "B", "C", "D", "E"][i]
              : `${i + 1}`;
        return acc;
      }, {} as PriorityLabelMap),
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Prioritetsskalaen sier hva virksomheten skal ha fokus på og prioritere nå — fra
        prioritet 1 til 4. Det betyr ikke nødvendigvis at leverandøren er kritisk, men at
        den er høyest opp på listen. Du kan beholde standardnavnene, eller velge A–D eller
        egne navn. Haker du av for «Ikke aktuelt» skjules nivået i leverandørmodulen.
        Gjelder kun i leverandørmodulen.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Forslag:</span>
        <Button variant="outline" size="sm" onClick={() => applyPreset("default")}>
          Standard
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset("letters")}>
          A–D
        </Button>
        <Button variant="outline" size="sm" onClick={() => applyPreset("numbers")}>
          1–4
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
            <span className="shrink-0 min-w-8">Nivå</span>
            <span className="flex-1">Standard</span>
            <span className="shrink-0 w-24 text-right">Ikke aktuelt</span>
          </div>
          {PRIORITY_KEYS.map((key) => {
            const meta = PRIORITY_META[key];
            const isDisabled = draftDisabled.includes(key);
            return (
              <div key={key} className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold shrink-0 min-w-8 ${meta.pillClass} ${isDisabled ? "opacity-40" : ""}`}
                >
                  {PRIORITY_LABELS[key]}
                </span>
                <div className="flex-1 min-w-0">
                  <Label htmlFor={`priority-${key}`} className="sr-only">
                    Visningsnavn for nivå {PRIORITY_LABELS[key]}
                  </Label>
                  <Input
                    id={`priority-${key}`}
                    value={draft[key] ?? ""}
                    placeholder={DEFAULT_PRIORITY_LABELS[key]}
                    disabled={isDisabled}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
                <div className="shrink-0 w-24 flex justify-end">
                  <Checkbox
                    id={`priority-disabled-${key}`}
                    aria-label={`Merk nivå ${PRIORITY_LABELS[key]} som ikke aktuelt`}
                    checked={isDisabled}
                    onCheckedChange={(checked) =>
                      setDraftDisabled((prev) =>
                        checked ? [...prev, key] : prev.filter((k) => k !== key),
                      )
                    }
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>


      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setDraft(DEFAULT_PRIORITY_LABELS);
            setDraftDisabled([]);
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
