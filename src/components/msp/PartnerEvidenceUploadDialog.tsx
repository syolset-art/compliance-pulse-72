import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, FileText, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AREA_LABEL,
  DOC_TYPE_LABEL,
  addPartnerEvidence,
  laraSuggestForDocType,
  type FrameworkMapping,
  type MaturityDelta,
  type PartnerEvidenceDocType,
} from "@/lib/partnerEvidence";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  partnerName?: string;
  uploaderName?: string;
  /** Framework IDs to pre-check in step 2 (matches PartnerEvidence.frameworks[i].framework). */
  presetFrameworkIds?: string[];
}

export function PartnerEvidenceUploadDialog({
  open,
  onOpenChange,
  customerId,
  partnerName = "MSSP Partner",
  uploaderName = "Deg",
  presetFrameworkIds,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [fileName, setFileName] = useState<string>("");
  const [docType, setDocType] = useState<PartnerEvidenceDocType>("pentest");
  const [note, setNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const suggestion = useMemo(() => laraSuggestForDocType(docType), [docType]);
  const [selectedFw, setSelectedFw] = useState<Record<number, boolean>>({});
  const [selectedDelta, setSelectedDelta] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (step === 2) {
      const preset = presetFrameworkIds && presetFrameworkIds.length > 0
        ? new Set(presetFrameworkIds.map((s) => s.toLowerCase()))
        : null;
      const fw: Record<number, boolean> = {};
      suggestion.frameworks.forEach((f, i) => {
        fw[i] = preset ? preset.has(f.framework.toLowerCase()) : true;
      });
      const d: Record<number, boolean> = {};
      suggestion.maturityDelta.forEach((_, i) => (d[i] = true));
      setSelectedFw(fw);
      setSelectedDelta(d);
    }
  }, [step, suggestion, presetFrameworkIds]);


  function reset() {
    setStep(1);
    setFileName("");
    setNote("");
    setDocType("pentest");
    setAnalyzing(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFileName(f.name);
  }

  function goToStep2() {
    if (!fileName) {
      toast.error("Velg en fil først");
      return;
    }
    setAnalyzing(true);
    // Simulate Lara analysis
    setTimeout(() => {
      setAnalyzing(false);
      setStep(2);
    }, 900);
  }

  function confirm() {
    const frameworks: FrameworkMapping[] = suggestion.frameworks.filter((_, i) => selectedFw[i]);
    const maturityDelta: MaturityDelta[] = suggestion.maturityDelta.filter((_, i) => selectedDelta[i]);
    if (frameworks.length === 0 && maturityDelta.length === 0) {
      toast.error("Velg minst ett regelverk eller modenhetsløft");
      return;
    }
    addPartnerEvidence({
      id: crypto.randomUUID(),
      customerId,
      fileName,
      docType,
      note: note || undefined,
      uploadedAt: new Date().toISOString(),
      uploadedByName: uploaderName,
      uploadedByPartner: partnerName,
      frameworks,
      maturityDelta,
    });
    const totalControls = frameworks.reduce((s, f) => s + f.controlIds.length, 0);
    const fwSummary = frameworks.map((f) => f.label).join(", ");
    toast.success("Bevis bekreftet og lagt til", {
      description: `Beriker ${totalControls} kontroller${fwSummary ? ` i ${fwSummary}` : ""}.`,
    });
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "Last opp partner-bevis" : "Lara foreslår mapping"}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Dokument</Label>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xlsx,.png,.jpg"
                onChange={handleFile}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors p-6 flex flex-col items-center gap-2 text-sm"
              >
                {fileName ? (
                  <>
                    <FileText className="h-6 w-6 text-primary" />
                    <span className="font-medium text-foreground">{fileName}</span>
                    <span className="text-xs text-muted-foreground">Klikk for å bytte fil</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="font-medium text-foreground">Velg fil eller dra hit</span>
                    <span className="text-xs text-muted-foreground">PDF, Word, Excel eller bilde</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as PartnerEvidenceDocType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DOC_TYPE_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notat (valgfritt)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kontekst for kunden, f.eks. omfang av pentesten…"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button onClick={goToStep2} disabled={!fileName || analyzing} className="gap-1.5">
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Lara analyserer…</>
                ) : (
                  <>La Lara foreslå <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p className="text-sm text-foreground/85">
                Lara har lest <span className="font-medium">{fileName}</span> og foreslår følgende mapping. Huk av det du vil bekrefte.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Regelverk og kontrollpunkter</p>
              <div className="space-y-2">
                {suggestion.frameworks.map((f, i) => (
                  <label
                    key={i}
                    className="flex items-start gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer"
                  >
                    <Checkbox
                      checked={!!selectedFw[i]}
                      onCheckedChange={(c) => setSelectedFw((s) => ({ ...s, [i]: !!c }))}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-foreground">{f.label}</span>
                        <Badge variant="outline" className="text-xs">{f.controlIds.length} kontroller</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.controlIds.join(" · ")}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Modenhetsløft</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestion.maturityDelta.map((d, i) => (
                  <label
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border/60 p-3 hover:bg-muted/30 cursor-pointer"
                  >
                    <Checkbox
                      checked={!!selectedDelta[i]}
                      onCheckedChange={(c) => setSelectedDelta((s) => ({ ...s, [i]: !!c }))}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{AREA_LABEL[d.area]}</p>
                      <span className="mt-1 inline-flex items-center rounded-md bg-success px-2 py-0.5 text-sm font-semibold text-success-foreground">
                        +{d.delta}%
                      </span>

                    </div>

                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)}>Tilbake</Button>
              <Button onClick={confirm}>Bekreft og berik</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
