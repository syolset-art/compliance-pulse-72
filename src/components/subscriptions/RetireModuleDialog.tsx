import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  Archive,
  CalendarClock,
  Info,
} from "lucide-react";
import {
  formatDateLong,
  getRetentionUntil,
  type CancellationDataChoice,
  type CancellationMeta,
} from "@/lib/moduleActivationState";

const REASONS: Array<{ id: string; label: string }> = [
  { id: "too_expensive", label: "For dyrt i forhold til nytten" },
  { id: "not_used", label: "Vi bruker den for lite" },
  { id: "missing_features", label: "Mangler funksjonalitet vi trenger" },
  { id: "switching", label: "Vi bytter til en annen leverandør" },
  { id: "internal", label: "Vi løser dette internt" },
  { id: "other", label: "Annet" },
];

/** Tabeller som telles opp per modul for datainnsynet. */
const MODULE_INVENTORY: Record<string, Array<{ table: string; label: string }>> = {
  core: [
    { table: "systems", label: "systemer" },
    { table: "system_incidents", label: "avvik" },
    { table: "system_processes", label: "behandlingsaktiviteter" },
    { table: "uploaded_documents", label: "dokumenter" },
  ],
  frameworks: [
    { table: "selected_frameworks", label: "aktiverte regelverk" },
    { table: "framework_documents", label: "regelverksdokumenter" },
  ],
  vendors: [
    { table: "vendor_documents", label: "leverandører og dokumenter" },
    { table: "vendor_deliveries", label: "leveranser" },
  ],
  assets: [
    { table: "assets", label: "verdier" },
    { table: "work_area_documents", label: "dokumenter i arbeidsområder" },
  ],
  partner: [{ table: "msp_customers", label: "kunder" }],
};

export interface RetireModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string | null;
  moduleTitle: string;
  /** ISO-dato for når oppsigelsen trer i kraft. */
  effectiveAt: string;
  onConfirm: (meta: CancellationMeta) => void;
}

export function RetireModuleDialog({
  open,
  onOpenChange,
  moduleId,
  moduleTitle,
  effectiveAt,
  onConfirm,
}: RetireModuleDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [reasonNote, setReasonNote] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [dataChoice, setDataChoice] = useState<CancellationDataChoice>("retain");
  const [confirmed, setConfirmed] = useState(false);
  const [inventory, setInventory] = useState<Array<{ label: string; count: number }> | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const retentionUntil = useMemo(() => getRetentionUntil(effectiveAt), [effectiveAt]);

  useEffect(() => {
    if (!open) {
      setStep(1);
      setReason("");
      setReasonNote("");
      setCompetitor("");
      setDataChoice("retain");
      setConfirmed(false);
      setInventory(null);
      setExportUrl(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !moduleId) return;
    const entries = MODULE_INVENTORY[moduleId] ?? [];
    if (entries.length === 0) {
      setInventory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        entries.map(async (e) => {
          const { count } = await (supabase as never as {
            from: (t: string) => {
              select: (c: string, o: { count: "exact"; head: true }) => Promise<{ count: number | null }>;
            };
          })
            .from(e.table)
            .select("id", { count: "exact", head: true });
          return { label: e.label, count: count ?? 0 };
        }),
      );
      if (!cancelled) setInventory(results.filter((r) => r.count > 0));
    })();
    return () => {
      cancelled = true;
    };
  }, [open, moduleId]);

  const handleExport = async (format: "json" | "csv") => {
    if (!moduleId) return;
    setExporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("export-module-data", {
        body: { moduleId, format },
      });
      if (error) throw error;
      const url = (data as { url?: string })?.url;
      if (!url) throw new Error("Ingen fil ble generert");
      setExportUrl(url);
      window.open(url, "_blank");
      toast.success("Eksportfilen er klar. Lenken er gyldig i 7 dager.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunne ikke eksportere data");
    } finally {
      setExporting(false);
    }
  };

  const canContinue = reason !== "" && (reason !== "other" || reasonNote.trim().length > 2);
  const canConfirm = confirmed;

  const handleConfirm = () => {
    onConfirm({
      reason,
      reasonNote: reasonNote.trim() || undefined,
      competitor: competitor.trim() || undefined,
      dataChoice,
      retentionUntil: retentionUntil.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">
            {step === 1 ? `Avvikle ${moduleTitle}` : "Bekreft avviklingen"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {step === 1
              ? `${moduleTitle} er tilgjengelig ut inneværende periode, til ${formatDateLong(effectiveAt)}.`
              : "Du vil ikke lenger faktureres for produktet fra neste periode. Dataene dine oppbevares trygt frem til sletting."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Hvorfor avvikler dere modulen?</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-1.5">
                {REASONS.map((r) => (
                  <label
                    key={r.id}
                    htmlFor={`reason-${r.id}`}
                    className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <RadioGroupItem value={r.id} id={`reason-${r.id}`} />
                    <span>{r.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            {reason === "switching" && (
              <div className="space-y-1.5">
                <Label htmlFor="competitor" className="text-xs">
                  Hvilken leverandør bytter dere til?{" "}
                  <span className="text-muted-foreground">(valgfritt)</span>
                </Label>
                <Input
                  id="competitor"
                  value={competitor}
                  onChange={(e) => setCompetitor(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="reason-note" className="text-xs">
                Utdyp gjerne{" "}
                {reason === "other" ? (
                  <span className="text-destructive">*</span>
                ) : (
                  <span className="text-muted-foreground">(valgfritt)</span>
                )}
              </Label>
              <Textarea
                id="reason-note"
                rows={2}
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                placeholder="Hva skulle til for at dere ble værende?"
                className="text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                Dette er registrert på modulen
              </div>
              {inventory === null ? (
                <p className="text-xs text-muted-foreground mt-1.5">Henter oversikt …</p>
              ) : inventory.length === 0 ? (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Ingen registrerte data å ta med videre.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {inventory.map((i) => `${i.count} ${i.label}`).join(" · ")}
                </p>
              )}
            </div>

            <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-foreground">
                    Data-nedlasting kommer snart
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vi jobber med en enkel måte å laste ned dataene dine på. Inntil videre
                    oppbevarer vi dem trygt frem til sletting, og du vil ikke faktureres for
                    produktet fra neste periode.
                  </p>
                </div>
              </div>
            </div>

            <RadioGroup
              value={dataChoice}
              onValueChange={(v) => setDataChoice(v as CancellationDataChoice)}
              className="space-y-2"
            >
              <label
                htmlFor="dc-download"
                className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <RadioGroupItem value="download" id="dc-download" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <Download className="h-3.5 w-3.5 text-muted-foreground" />
                    Last ned dataene mine
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Maskinlesbar fil (JSON eller CSV) — kommer snart.
                  </p>
                  {dataChoice === "download" && (
                    <div className="flex items-center gap-2 mt-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Last ned JSON
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Kommer snart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs"
                              disabled
                            >
                              <Download className="h-3.5 w-3.5 mr-1.5" />
                              Last ned CSV
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Kommer snart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                </div>
              </label>

              <label
                htmlFor="dc-retain"
                className="flex items-start gap-2.5 rounded-md border border-border px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <RadioGroupItem value="retain" id="dc-retain" className="mt-0.5" />
                <div className="min-w-0">
                  <div className="text-sm font-medium flex items-center gap-1.5">
                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                    Behold dataene til sletting
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ingen eksport nå. Dataene ligger tilgjengelige hvis dere ombestemmer dere.
                  </p>
                </div>
              </label>
            </RadioGroup>

            <Separator />

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                {moduleTitle} er aktivt til {formatDateLong(effectiveAt)}. Deretter stanses
                faktureringen, og dataene oppbevares til {formatDateLong(retentionUntil)} før de
                slettes permanent. Du kan angre oppsigelsen når som helst før den trer i kraft.
              </span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(c) => setConfirmed(c === true)}
                className="mt-0.5"
              />
              <span className="text-xs text-foreground/80">
                Jeg bekrefter oppsigelsen av {moduleTitle} og har forstått fristen for sletting av
                data.
              </span>
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {step === 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="mr-auto h-9 text-xs"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Tilbake
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-9" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          {step === 1 ? (
            <Button size="sm" className="h-9" disabled={!canContinue} onClick={() => setStep(2)}>
              Neste
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!canConfirm}
              onClick={handleConfirm}
            >
              Bekreft avvikling
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
