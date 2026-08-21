import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, RotateCcw } from "lucide-react";
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

/**
 * Egendefinerte visningsnavn for prioritetsskalaen P0–P3.
 * Gjelder kun visninger inne i leverandørmodulen.
 */
export function VendorPrioritySettingsSection() {
  const queryClient = useQueryClient();
  const { labels, isLoading } = useVendorPriorityLabels();
  const [draft, setDraft] = useState<PriorityLabelMap>(DEFAULT_PRIORITY_LABELS);
  const [initialised, setInitialised] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !initialised) {
      setDraft(labels);
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
        Gi prioritetsnivåene navn som passer deres språkbruk. Navnene brukes kun i
        leverandørmodulen — resten av plattformen viser standardnavnene.
      </p>

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

      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setDraft(DEFAULT_PRIORITY_LABELS)}
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
