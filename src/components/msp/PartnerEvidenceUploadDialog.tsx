import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Upload, FileText, Loader2, Quote, Check, X, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  AREA_LABEL,
  DOC_TYPE_LABEL,
  addPartnerEvidence,
  laraSuggestForDocType,
  mockLaraAnalysis,
  type EvidenceCitation,
  type FrameworkMapping,
  type LaraAnalysis,
  type LaraVerdict,
  type MaturityDelta,
  type PartnerEvidenceDocType,
} from "@/lib/partnerEvidence";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  partnerName?: string;
  uploaderName?: string;
  /** Framework IDs to pre-check in the manual step (matches PartnerEvidence.frameworks[i].framework). */
  presetFrameworkIds?: string[];
}

function CitationList({ items }: { items?: EvidenceCitation[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Ingen tydelige kildehenvisninger funnet — lav dekning.
      </p>
    );
  }
  return (
    <ul className="space-y-1">
      {items.map((c, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Quote className="h-3 w-3 mt-0.5 shrink-0 text-primary/60" />
          <span>
            {c.page && <span className="font-medium text-foreground/70">{c.page}: </span>}
            «{c.quote}»
          </span>
        </li>
      ))}
    </ul>
  );
}

export function PartnerEvidenceUploadDialog({
  open,
  onOpenChange,
  customerId,
  partnerName = "MSSP Partner",
  uploaderName = "Deg",
  presetFrameworkIds,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>("");
  const [note, setNote] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<LaraAnalysis | null>(null);
  const [verdict, setVerdict] = useState<LaraVerdict>("accepted");

  // Manual assessment state
  const [docType, setDocType] = useState<PartnerEvidenceDocType>("other");
  const manualSuggestion = useMemo(() => laraSuggestForDocType(docType), [docType]);
  const [selectedFw, setSelectedFw] = useState<Record<number, boolean>>({});
  const [selectedDelta, setSelectedDelta] = useState<Record<number, boolean>>({});

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step !== 3) return;
    const preset = presetFrameworkIds && presetFrameworkIds.length > 0
      ? new Set(presetFrameworkIds.map((s) => s.toLowerCase()))
      : null;
    const fw: Record<number, boolean> = {};
    manualSuggestion.frameworks.forEach((f, i) => {
      fw[i] = preset ? preset.has(f.framework.toLowerCase()) : true;
    });
    const d: Record<number, boolean> = {};
    manualSuggestion.maturityDelta.forEach((_, i) => (d[i] = true));
    setSelectedFw(fw);
    setSelectedDelta(d);
  }, [step, manualSuggestion, presetFrameworkIds]);

  function reset() {
    setStep(1);
    setFileName("");
    setNote("");
    setAnalyzing(false);
    setAnalysis(null);
    setVerdict("accepted");
    setDocType("other");
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    runAnalysis(f.name);
  }

  function runAnalysis(name: string) {
    setAnalyzing(true);
    setTimeout(() => {
      const result = mockLaraAnalysis(name);
      setAnalysis(result);
      setDocType(result.docType);
      setAnalyzing(false);
      setStep(2);
    }, 1100);
  }

  function persist(params: {
    docType: PartnerEvidenceDocType;
    frameworks: FrameworkMapping[];
    maturityDelta: MaturityDelta[];
    verdict: LaraVerdict;
  }) {
    if (params.frameworks.length === 0 && params.maturityDelta.length === 0) {
      toast.error("Velg minst ett regelverk eller modenhetsløft");
      return;
    }
    addPartnerEvidence({
      id: crypto.randomUUID(),
      customerId,
      fileName,
      docType: params.docType,
      note: note || undefined,
      uploadedAt: new Date().toISOString(),
      uploadedByName: uploaderName,
      uploadedByPartner: partnerName,
      frameworks: params.frameworks,
      maturityDelta: params.maturityDelta,
      laraVerdict: params.verdict,
      laraSuggestedType: analysis?.docType,
      confidence: analysis?.confidence,
    });
    const totalControls = params.frameworks.reduce((s, f) => s + f.controlIds.length, 0);
    const fwSummary = params.frameworks.map((f) => f.label).join(", ");
    toast.success("Bevis lagret", {
      description: `Beriker ${totalControls} kontroller${fwSummary ? ` i ${fwSummary}` : ""}.`,
    });
    onOpenChange(false);
    reset();
  }

  function acceptSuggestion() {
    if (!analysis) return;
    persist({
      docType: analysis.docType,
      frameworks: analysis.frameworks,
      maturityDelta: analysis.maturityDelta,
      verdict: "accepted",
    });
  }

  function declineSuggestion() {
    setVerdict("declined");
    setDocType("other");
    setStep(3);
  }

  function goManual() {
    setVerdict("manual");
    if (analysis) setDocType(analysis.docType);
    setStep(3);
  }

  function confirmManual() {
    persist({
      docType,
      frameworks: manualSuggestion.frameworks.filter((_, i) => selectedFw[i]),
      maturityDelta: manualSuggestion.maturityDelta.filter((_, i) => selectedDelta[i]),
      verdict,
    });
  }

  const confidencePct = analysis ? Math.round(analysis.confidence * 100) : 0;
  const lowConfidence = confidencePct < 60;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Last opp partner-bevis"}
            {step === 2 && "Laras vurdering av dokumentet"}
            {step === 3 && "Manuell vurdering"}
          </DialogTitle>
        </DialogHeader>

        {/* ---------- Step 1: upload only ---------- */}
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
                disabled={analyzing}
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-lg border border-dashed border-border bg-muted/30 hover:bg-muted/50 transition-colors p-6 flex flex-col items-center gap-2 text-sm disabled:opacity-70"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="font-medium text-foreground">Lara analyserer {fileName}…</span>
                    <span className="text-xs text-muted-foreground">Leser innhold, type og kontrollpunkter</span>
                  </>
                ) : fileName ? (
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
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Lara foreslår dokumenttype, regelverk og krav — du bekrefter.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notat (valgfritt)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kontekst for kunden…"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
            </DialogFooter>
          </div>
        )}

        {/* ---------- Step 2: Lara's verdict ---------- */}
        {step === 2 && analysis && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div className="space-y-1 min-w-0">
                <p className="text-sm text-foreground/85">
                  Lara har lest <span className="font-medium">{fileName}</span>. {analysis.summary}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${lowConfidence ? "border-warning/50 text-warning" : "border-success/50 text-success"}`}
                >
                  Konfidens {confidencePct} %
                </Badge>
              </div>
            </div>

            {/* Proposed type */}
            <div className="rounded-lg border border-border/60 p-3 space-y-2">
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Foreslått dokumenttype</p>
              <p className="text-sm font-semibold text-foreground">{DOC_TYPE_LABEL[analysis.docType]}</p>
              <CitationList items={analysis.typeCitations} />
            </div>

            {/* Frameworks */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Regelverk og krav</p>
              <div className="space-y-2">
                {analysis.frameworks.map((f, i) => (
                  <div key={i} className="rounded-lg border border-border/60 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{f.label}</span>
                      <Badge variant="outline" className="text-xs">{f.controlIds.length} krav</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.controlIds.join(" · ")}</p>
                    <CitationList items={f.citations} />
                  </div>
                ))}
              </div>
            </div>

            {/* Maturity */}
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Modenhetsløft</p>
              <div className="flex flex-wrap gap-2">
                {analysis.maturityDelta.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-md border border-border/60 px-2.5 py-1">
                    <span className="text-sm text-foreground">{AREA_LABEL[d.area]}</span>
                    <span className="inline-flex items-center rounded-md bg-success px-2 py-0.5 text-sm font-semibold text-success-foreground">
                      +{d.delta}%
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={declineSuggestion} className="gap-1.5 text-muted-foreground">
                <X className="h-4 w-4" /> Avslå forslaget
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={goManual} className="gap-1.5">
                  <SlidersHorizontal className="h-4 w-4" /> Vurder manuelt
                </Button>
                <Button onClick={acceptSuggestion} className="gap-1.5">
                  <Check className="h-4 w-4" /> Aksepter forslag
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}

        {/* ---------- Step 3: manual assessment ---------- */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {verdict === "declined"
                ? "Laras forslag er avslått. Sett type og mapping selv."
                : "Juster Laras forslag før du bekrefter."}
            </p>

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
              <p className="text-xs uppercase tracking-wider text-foreground/80 font-semibold">Regelverk og kontrollpunkter</p>
              <div className="space-y-2">
                {manualSuggestion.frameworks.map((f, i) => (
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
                {manualSuggestion.maturityDelta.map((d, i) => (
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
              <Button variant="outline" onClick={() => setStep(2)}>Tilbake</Button>
              <Button onClick={confirmManual}>Bekreft og berik</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
