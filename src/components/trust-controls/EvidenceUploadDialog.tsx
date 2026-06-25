import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText, Upload, Loader2, Sparkles, AlertTriangle, Info, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ControlAreaChips } from "./ControlAreaChips";
import { useClassifyEvidence, type EvidenceClassification } from "@/hooks/useClassifyEvidence";
import { CONTROL_AREAS, type ControlAreaKey } from "@/lib/controlAreas";
import {
  SHARING_LEVELS,
  QUALITY_FINDING_LABELS,
  appendAudit,
  type SharingLevel,
  type QualityFinding,
} from "@/lib/evidenceStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Asset (organization or service) to attach the evidence to. */
  assetId: string;
}

type Step = "upload" | "analyzing" | "review" | "manual";

const EMPTY_FORM = {
  documentType: "",
  documentTypeLabel: "",
  controlAreas: [] as ControlAreaKey[],
  supportedControls: [] as string[],
  summary: "",
  owner: "",
  version: "",
  approvalDate: "",
  approvedBy: "",
  nextReviewDate: "",
  expiryDate: "",
  sharingLevel: "internal" as SharingLevel,
  usedForTrustScore: false,
  qualityFindings: [] as QualityFinding[],
  aiConfidence: undefined as number | undefined,
};

export function EvidenceUploadDialog({ open, onOpenChange, assetId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const { state, classify, reset: resetClassify } = useClassifyEvidence();

  const reset = () => {
    setStep("upload");
    setFile(null);
    setDragOver(false);
    setForm({ ...EMPTY_FORM });
    resetClassify();
  };

  const applyClassification = (cls: EvidenceClassification) => {
    setForm({
      documentType: cls.documentType,
      documentTypeLabel: cls.documentTypeLabel,
      controlAreas: cls.controlAreas?.filter(Boolean) ?? [],
      supportedControls: cls.supportedControls ?? [],
      summary: cls.summary ?? "",
      owner: cls.extractedMetadata?.owner ?? "",
      version: cls.extractedMetadata?.version ?? "",
      approvalDate: cls.extractedMetadata?.approvalDate ?? "",
      approvedBy: cls.extractedMetadata?.approvedBy ?? "",
      nextReviewDate: cls.extractedMetadata?.nextReviewDate ?? "",
      expiryDate: cls.extractedMetadata?.expiryDate ?? "",
      sharingLevel: (cls.suggestedSharingLevel as SharingLevel) ?? "internal",
      usedForTrustScore: false,
      qualityFindings: cls.qualityFindings ?? [],
      aiConfidence: cls.confidence,
    });
  };

  const handleFileSelect = useCallback(async (f: File) => {
    setFile(f);
    setStep("analyzing");
    const result = await classify(f);
    if (result.fallback) {
      if (result.classification) applyClassification(result.classification);
      setStep("manual");
    } else if (result.classification) {
      applyClassification(result.classification);
      setStep("review");
    } else {
      setStep("manual");
    }
  }, [classify]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let filePath = "";
      let fileName = file?.name ?? form.documentTypeLabel;

      if (file) {
        const ext = file.name.split(".").pop();
        filePath = `${assetId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vendor-documents")
          .upload(filePath, file);
        if (upErr) throw upErr;
      }

      const aiClassified = step === "review";
      const trail = appendAudit([], { action: "uploaded", actor: "Du" });
      const trail2 = appendAudit(trail, {
        action: aiClassified ? "ai_classified" : "manually_classified",
        actor: aiClassified ? "Lara" : "Du",
      });

      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: form.documentType || "other",
        display_name: form.documentTypeLabel || fileName,
        file_name: fileName,
        file_path: filePath,
        status: "draft",
        evidence_status: "draft",
        control_areas: form.controlAreas,
        supported_controls: form.supportedControls,
        ai_confidence: form.aiConfidence ?? null,
        ai_summary: form.summary || null,
        extracted_metadata: {
          owner: form.owner || null,
          version: form.version || null,
          approvalDate: form.approvalDate || null,
          approvedBy: form.approvedBy || null,
          nextReviewDate: form.nextReviewDate || null,
          expiryDate: form.expiryDate || null,
        } as unknown as never,
        quality_findings: form.qualityFindings as unknown as never,
        sharing_level: form.sharingLevel,
        used_for_trust_score: form.usedForTrustScore,
        audit_trail: trail2 as unknown as never,
        notes: form.summary || null,
        valid_to: form.expiryDate || null,
        approved_by: form.approvedBy || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
      toast.success(isNb ? "Dokument lagt til som utkast" : "Document added as draft");
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      console.error(err);
      toast.error(isNb ? "Kunne ikke lagre dokumentet" : "Failed to save document");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && (isNb ? "Last opp bevisdokument" : "Upload evidence document")}
            {step === "analyzing" && (isNb ? "Lara analyserer dokumentet…" : "Lara is analysing the document…")}
            {step === "review" && (isNb ? "Gjennomgå AI-forslag" : "Review AI suggestion")}
            {step === "manual" && (isNb ? "Klassifiser manuelt" : "Classify manually")}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && (isNb
              ? "Last opp et dokument og knytt det til ett eller flere av de fem kontrollområdene."
              : "Upload a document and link it to one or more of the five control areas.")}
            {step === "review" && (isNb
              ? "Bekreft, rediger eller avvis Laras forslag før dokumentet lagres som utkast."
              : "Confirm, edit or reject Lara's suggestion before the document is saved as draft.")}
            {step === "manual" && state.phase === "manual" && (
              state.reason === "low_confidence"
                ? (isNb
                    ? "Lara klarte ikke å klassifisere dokumentet med høy nok sikkerhet. Klassifiser manuelt."
                    : "Lara could not classify this document with enough confidence. You can classify it manually.")
                : (isNb ? "Lara er ikke tilgjengelig nå. Klassifiser manuelt." : "Lara is unavailable. Classify manually.")
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          {step === "upload" && (
            <UploadStep
              fileInputRef={fileInputRef}
              dragOver={dragOver}
              setDragOver={setDragOver}
              onFile={handleFileSelect}
              onDrop={handleDrop}
              onManual={() => setStep("manual")}
              isNb={isNb}
            />
          )}

          {step === "analyzing" && <AnalyzingStep file={file} isNb={isNb} />}

          {(step === "review" || step === "manual") && (
            <ReviewForm
              file={file}
              form={form}
              setForm={setForm}
              isNb={isNb}
              isAiSuggested={step === "review"}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          <div className="text-[11px] text-muted-foreground">
            {(step === "review" || step === "manual") && (
              isNb ? "Lagres som «Utkast». Bekreft som bevis i neste steg." : "Saved as 'Draft'. Confirm as evidence in the next step."
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            {(step === "review" || step === "manual") && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || form.controlAreas.length === 0 || !form.documentTypeLabel}
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isNb ? "Lagre som utkast" : "Save as draft"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- sub-steps ----------

function UploadStep({ fileInputRef, dragOver, setDragOver, onFile, onDrop, onManual, isNb }: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (f: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onManual: () => void;
  isNb: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.md"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "w-full flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/30"
        )}
      >
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            {isNb ? "Dra og slipp fil her, eller klikk for å velge" : "Drag and drop a file here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">PDF, DOC, PNG, JPG · Max 10 MB</p>
        </div>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-md bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p>
          {isNb
            ? "Lara foreslår kontrollområde, dokumenttype og metadata. Du bekrefter, redigerer eller avviser forslaget før dokumentet brukes som bevis."
            : "Lara suggests control area, document type and metadata. You confirm, edit or reject the suggestion before the document is used as evidence."}
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onManual}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {isNb ? "Klassifiser uten å laste opp" : "Classify without uploading"}
        </button>
      </div>
    </div>
  );
}

function AnalyzingStep({ file, isNb }: { file: File | null; isNb: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <div className="relative">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <Sparkles className="h-7 w-7 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
          <Loader2 className="h-3 w-3 text-primary animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-medium">{isNb ? "Lara analyserer dokumentet…" : "Lara is analysing the document…"}</p>
        <p className="text-xs text-muted-foreground">
          {isNb ? "Foreslår kontrollområde, dokumenttype og metadata" : "Suggesting control area, type and metadata"}
        </p>
      </div>
      {file && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground">
          <FileText className="h-3.5 w-3.5" />
          <span className="truncate max-w-[260px]">{file.name}</span>
        </div>
      )}
    </div>
  );
}

function ReviewForm({ file, form, setForm, isNb, isAiSuggested }: {
  file: File | null;
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  isNb: boolean;
  isAiSuggested: boolean;
}) {
  const update = <K extends keyof typeof EMPTY_FORM>(key: K, value: (typeof EMPTY_FORM)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4 py-2">
      {/* File row */}
      {file && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-accent/20">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          {isAiSuggested && typeof form.aiConfidence === "number" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              {Math.round(form.aiConfidence * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Quality findings */}
      {form.qualityFindings.length > 0 && (
        <div className="space-y-1.5">
          {form.qualityFindings.map((f, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-start gap-2 rounded-md border px-3 py-2 text-xs",
                f.severity === "critical" && "border-destructive/30 bg-destructive/5 text-destructive",
                f.severity === "warning" && "border-warning/30 bg-warning/5 text-warning",
                f.severity === "info" && "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {QUALITY_FINDING_LABELS[f.type][isNb ? "nb" : "en"]}
                </p>
                <p className="opacity-80">{isNb ? f.messageNb : f.messageEn}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document type + name */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{isNb ? "Dokumentnavn" : "Document name"} *</Label>
          <Input value={form.documentTypeLabel} onChange={(e) => update("documentTypeLabel", e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{isNb ? "Dokumenttype" : "Document type"}</Label>
          <Input value={form.documentType} onChange={(e) => update("documentType", e.target.value)} placeholder={isNb ? "F.eks. policy, DPA, pentest" : "e.g. policy, DPA, pentest"} />
        </div>
      </div>

      {/* Control areas */}
      <div className="space-y-1.5">
        <Label className="text-xs">{isNb ? "Kontrollområde(r)" : "Control area(s)"} *</Label>
        <ControlAreaChips
          selected={form.controlAreas}
          onChange={(next) => update("controlAreas", next)}
        />
        <p className="text-[11px] text-muted-foreground">
          {isNb ? "Velg ett eller flere av de fem områdene." : "Pick one or more of the five areas."}
        </p>
      </div>

      {/* Supported controls */}
      <div className="space-y-1.5">
        <Label className="text-xs">{isNb ? "Støttede kontrollpunkter" : "Supported controls"}</Label>
        <Textarea
          rows={2}
          value={form.supportedControls.join(", ")}
          onChange={(e) => update("supportedControls", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
          placeholder={isNb ? "F.eks. ISO 27001 A.5.1, GDPR Art. 32" : "e.g. ISO 27001 A.5.1, GDPR Art. 32"}
        />
      </div>

      {/* AI summary */}
      {form.summary && (
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1.5">
            {isAiSuggested && <Sparkles className="h-3 w-3 text-primary" />}
            {isNb ? "Sammendrag" : "Summary"}
          </Label>
          <Textarea rows={2} value={form.summary} onChange={(e) => update("summary", e.target.value)} />
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
        <p className="text-xs font-medium text-foreground">{isNb ? "Metadata" : "Metadata"}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Eier" : "Owner"}</Label>
            <Input value={form.owner} onChange={(e) => update("owner", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Versjon" : "Version"}</Label>
            <Input value={form.version} onChange={(e) => update("version", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Godkjenningsdato" : "Approval date"}</Label>
            <Input type="date" value={form.approvalDate} onChange={(e) => update("approvalDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Godkjent av" : "Approved by"}</Label>
            <Input value={form.approvedBy} onChange={(e) => update("approvedBy", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Neste revisjon" : "Next review"}</Label>
            <Input type="date" value={form.nextReviewDate} onChange={(e) => update("nextReviewDate", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Utløpsdato" : "Expiry date"}</Label>
            <Input type="date" value={form.expiryDate} onChange={(e) => update("expiryDate", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Sharing + trust score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Delingsnivå" : "Sharing level"}</Label>
          <Select value={form.sharingLevel} onValueChange={(v) => update("sharingLevel", v as SharingLevel)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SHARING_LEVELS.map(s => (
                <SelectItem key={s.value} value={s.value}>{isNb ? s.labelNb : s.labelEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Bruk i Trust Score" : "Use for Trust Score"}</Label>
          <Select value={form.usedForTrustScore ? "yes" : "no"} onValueChange={(v) => update("usedForTrustScore", v === "yes")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">{isNb ? "Ja (etter bekreftelse)" : "Yes (after confirmation)"}</SelectItem>
              <SelectItem value="no">{isNb ? "Nei" : "No"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Read-only summary of areas */}
      {form.controlAreas.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          {isNb ? "Knyttes til" : "Linked to"}:{" "}
          {form.controlAreas
            .map((k) => CONTROL_AREAS.find(a => a.key === k)?.[isNb ? "labelNb" : "labelEn"])
            .filter(Boolean)
            .join(", ")}
        </div>
      )}
    </div>
  );
}
