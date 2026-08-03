import { useState, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FileText, Upload, Loader2, Sparkles, AlertTriangle, Info, CheckCircle2,
  ArrowRight, Link2, Eye, UserCheck, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ControlAreaChips } from "./ControlAreaChips";
import { TierBadge } from "./TierBadge";
import { EvidenceProgress } from "./EvidenceProgress";
import { useClassifyEvidence, type EvidenceClassification, type SuggestedControlLink } from "@/hooks/useClassifyEvidence";
import { CONTROL_AREAS, type ControlAreaKey } from "@/lib/controlAreas";
import {
  appendAudit,
  type SharingLevel,
  type QualityFinding,
  type EvidenceStatus,
} from "@/lib/evidenceStatus";
import {
  TIER_CONFIG, deriveTier, isDocumentOutdated,
  type TierLevel, type TierSignal,
} from "@/lib/evidenceTier";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Asset (organization or service) to attach the evidence to. */
  assetId: string;
}

type WizardStep = "upload" | "analyzing" | "type" | "placement" | "attest" | "done" | "manual";

interface WizardState {
  // Step 1
  documentType: string;
  documentTypeLabel: string;
  controlAreas: ControlAreaKey[];
  supportedControls: string[];
  summary: string;
  documentDate: string;
  qualityFindings: QualityFinding[];
  aiConfidence?: number;
  // Tier (derived)
  tier: TierLevel;
  tierSignals: TierSignal[];
  // Step 2
  suggestedControls: SuggestedControlLink[];
  selectedControlIds: string[];
  linkAsControl: boolean;
  linkAsResource: boolean;
  // Step 3
  attestedBy: string;
  attestedRole: string;
  // Meta
  sharingLevel: SharingLevel;
}

const EMPTY: WizardState = {
  documentType: "",
  documentTypeLabel: "",
  controlAreas: [],
  supportedControls: [],
  summary: "",
  documentDate: "",
  qualityFindings: [],
  aiConfidence: undefined,
  tier: "unverified",
  tierSignals: [],
  suggestedControls: [],
  selectedControlIds: [],
  linkAsControl: true,
  linkAsResource: false,
  attestedBy: "",
  attestedRole: "",
  sharingLevel: "internal",
};

export function EvidenceUploadDialog({ open, onOpenChange, assetId }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<WizardStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<WizardState>({ ...EMPTY });
  const [savedStatus, setSavedStatus] = useState<EvidenceStatus>("uploaded");
  const { classify, reset: resetClassify } = useClassifyEvidence();

  const reset = () => {
    setStep("upload");
    setFile(null);
    setDragOver(false);
    setState({ ...EMPTY });
    setSavedStatus("uploaded");
    resetClassify();
  };

  const applyClassification = (cls: EvidenceClassification) => {
    const tier = cls.tier
      ? { tier: cls.tier, weight: TIER_CONFIG[cls.tier].weight, signals: cls.tierSignals ?? [] }
      : deriveTier({ documentType: cls.documentType, signals: cls.tierSignals });
    setState((prev) => ({
      ...prev,
      documentType: cls.documentType,
      documentTypeLabel: cls.documentTypeLabel,
      controlAreas: cls.controlAreas?.filter(Boolean) ?? [],
      supportedControls: cls.supportedControls ?? [],
      summary: cls.summary ?? "",
      documentDate: cls.documentDate ?? cls.extractedMetadata?.approvalDate ?? "",
      qualityFindings: cls.qualityFindings ?? [],
      aiConfidence: cls.confidence,
      tier: tier.tier,
      tierSignals: tier.signals,
      suggestedControls: cls.suggestedControls ?? [],
      selectedControlIds: (cls.suggestedControls ?? []).map((c) => c.controlId),
      sharingLevel: (cls.suggestedSharingLevel as SharingLevel) ?? "internal",
    }));
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
      setStep("type");
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
    mutationFn: async (finalStatus: EvidenceStatus) => {
      let filePath = "";
      const fileName = file?.name ?? state.documentTypeLabel;

      if (file) {
        const ext = file.name.split(".").pop();
        filePath = `${assetId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("vendor-documents")
          .upload(filePath, file);
        if (upErr) throw upErr;
      }

      const aiClassified = step !== "manual";
      let trail = appendAudit([], { action: "uploaded", actor: "Du" });
      trail = appendAudit(trail, {
        action: aiClassified ? "ai_classified" : "manually_classified",
        actor: aiClassified ? "Lara" : "Du",
      });
      if (finalStatus === "confirmed" || finalStatus === "attested") {
        trail = appendAudit(trail, { action: "confirmed", actor: "Du" });
      }
      if (finalStatus === "attested") {
        trail = appendAudit(trail, {
          action: "attested",
          actor: state.attestedBy,
          actor_role: state.attestedRole || undefined,
        });
      }

      const placement: string[] = [];
      if (state.linkAsControl) placement.push("control");
      if (state.linkAsResource) placement.push("resource");

      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: state.documentType || "other",
        display_name: state.documentTypeLabel || fileName,
        file_name: fileName,
        file_path: filePath,
        status: "draft",
        evidence_status: finalStatus,
        control_areas: state.controlAreas,
        supported_controls: state.supportedControls,
        ai_confidence: state.aiConfidence ?? null,
        ai_summary: state.summary || null,
        tier: state.tier ? TIER_CONFIG[state.tier].weight : null,
        tier_source: state.tier || null,
        tier_signals: state.tierSignals as unknown as never,
        document_date: state.documentDate || null,
        placement: placement as unknown as never,
        attested_by: finalStatus === "attested" ? state.attestedBy : null,
        attested_role: finalStatus === "attested" ? state.attestedRole || null : null,
        attested_at: finalStatus === "attested" ? new Date().toISOString() : null,
        quality_findings: state.qualityFindings as unknown as never,
        sharing_level: state.sharingLevel,
        used_for_trust_score: state.linkAsControl,
        audit_trail: trail as unknown as never,
        notes: state.summary || null,
      } as never);
      if (error) throw error;
    },
    onSuccess: (_, finalStatus) => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
      setSavedStatus(finalStatus);
      setStep("done");
    },
    onError: (err) => {
      console.error(err);
      toast.error(isNb ? "Kunne ikke lagre dokumentet" : "Failed to save document");
    },
  });

  const outdated = isDocumentOutdated(state.documentDate);

  const closeDialog = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && (isNb ? "Last opp dokumentasjon" : "Upload evidence")}
            {step === "analyzing" && (isNb ? "Lara leser dokumentet…" : "Lara is reading the document…")}
            {step === "type" && (isNb ? "1. Hva er dette?" : "1. What is this?")}
            {step === "placement" && (isNb ? "2. Hvor hører det hjemme?" : "2. Where does it belong?")}
            {step === "attest" && (isNb ? "3. Bekreft at dette stemmer" : "3. Attest this is correct")}
            {step === "done" && (isNb ? "Ferdig" : "Done")}
            {step === "manual" && (isNb ? "Klassifiser manuelt" : "Classify manually")}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && (isNb
              ? "AI foreslår type, vekting og kontrollkobling. Du bekrefter i to raske steg."
              : "AI suggests type, weight and control link. You confirm in two quick steps.")}
            {step === "type" && (isNb
              ? "Bekreft eller korriger dokumenttypen. Vekting utledes automatisk."
              : "Confirm or correct the document type. Weight is derived automatically.")}
            {step === "placement" && (isNb
              ? "Skal dokumentet drive en kontrollscore, vises som ressurs, eller begge?"
              : "Should the document drive a control score, appear as a resource, or both?")}
            {step === "attest" && (isNb
              ? "Valgfritt, men gir full uttelling. Noen med ansvar bekrefter innholdet."
              : "Optional, but unlocks full weight. A responsible person confirms the content.")}
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

          {step === "type" && (
            <TypeStep
              file={file}
              state={state}
              setState={setState}
              outdated={outdated}
              isNb={isNb}
            />
          )}

          {step === "placement" && (
            <PlacementStep state={state} setState={setState} isNb={isNb} />
          )}

          {step === "attest" && (
            <AttestStep state={state} setState={setState} isNb={isNb} />
          )}

          {step === "done" && (
            <DoneStep
              savedStatus={savedStatus}
              state={state}
              onAttest={() => setStep("attest")}
              onClose={closeDialog}
              isNb={isNb}
            />
          )}

          {step === "manual" && (
            <ManualStep state={state} setState={setState} isNb={isNb} />
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 border-t">
          <div className="text-[11px] text-muted-foreground min-w-0 truncate">
            {step === "type" && (isNb ? "Steg 1 av 3" : "Step 1 of 3")}
            {step === "placement" && (isNb ? "Steg 2 av 3" : "Step 2 of 3")}
            {step === "attest" && (isNb ? "Steg 3 av 3 (valgfritt)" : "Step 3 of 3 (optional)")}
          </div>
          <div className="flex gap-2">
            {step !== "done" && (
              <Button variant="ghost" onClick={closeDialog}>
                {isNb ? "Avbryt" : "Cancel"}
              </Button>
            )}

            {step === "type" && (
              <Button
                onClick={() => setStep("placement")}
                disabled={!state.documentTypeLabel}
                className="gap-1"
              >
                {isNb ? "Bekreft type" : "Confirm type"} <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {step === "placement" && (
              <>
                <Button variant="outline" onClick={() => setStep("type")}>
                  {isNb ? "Tilbake" : "Back"}
                </Button>
                <Button
                  onClick={() => saveMutation.mutate("confirmed")}
                  disabled={
                    saveMutation.isPending ||
                    (!state.linkAsControl && !state.linkAsResource) ||
                    (state.linkAsControl && state.controlAreas.length === 0)
                  }
                  className="gap-1"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isNb ? "Bekreft plassering" : "Confirm placement"}
                </Button>
              </>
            )}

            {step === "attest" && (
              <>
                <Button variant="outline" onClick={() => setStep("done")}>
                  {isNb ? "Hopp over" : "Skip"}
                </Button>
                <Button
                  onClick={() => saveMutation.mutate("attested")}
                  disabled={!state.attestedBy || saveMutation.isPending}
                  className="gap-1"
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <UserCheck className="h-4 w-4" />
                  {isNb ? "Attester" : "Attest"}
                </Button>
              </>
            )}

            {step === "manual" && (
              <Button
                onClick={() => saveMutation.mutate("classified")}
                disabled={
                  saveMutation.isPending ||
                  state.controlAreas.length === 0 ||
                  !state.documentTypeLabel
                }
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {isNb ? "Lagre" : "Save"}
              </Button>
            )}

            {step === "done" && (
              <Button onClick={closeDialog}>{isNb ? "Ferdig" : "Done"}</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------- steps ----------

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
            ? "Happy path: bekreft type → bekreft plassering. Vekting utledes av dokumenttype og signaler AI leser. Du velger aldri vekting selv."
            : "Happy path: confirm type → confirm placement. Weight is derived from document type and signals — never user-selected."}
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onManual}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          {isNb ? "Klassifiser uten AI" : "Classify without AI"}
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
        <p className="text-sm font-medium">{isNb ? "Lara leser dokumentet…" : "Lara is reading the document…"}</p>
        <p className="text-xs text-muted-foreground">
          {isNb ? "Foreslår type, vekting, kontroll og dato" : "Suggesting type, weight, control and date"}
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

// ---- STEP 1: type ----
function TypeStep({ file, state, setState, outdated, isNb }: {
  file: File | null;
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  outdated: boolean;
  isNb: boolean;
}) {
  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4 py-2">
      {file && (
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-accent/20">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          {typeof state.aiConfidence === "number" && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground rounded-full bg-muted px-2 py-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              {Math.round(state.aiConfidence * 100)}%
            </span>
          )}
        </div>
      )}

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-foreground/90">
              {isNb ? "Lara foreslår" : "Lara suggests"}
            </p>
            <p className="text-sm font-semibold">{state.documentTypeLabel || "—"}</p>
          </div>
          <TierBadge tier={state.tier} signals={state.tierSignals} />
        </div>
        {state.summary && (
          <p className="text-xs text-muted-foreground pl-6">{state.summary}</p>
        )}
      </div>

      {outdated && (
        <div className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/5 p-3 text-xs">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-warning">
              {isNb ? "Dokumentet ser ut til å være utdatert" : "This document appears to be outdated"}
            </p>
            <p className="text-muted-foreground">
              {isNb
                ? `Datert ${state.documentDate}. Vurder å laste opp nyere versjon.`
                : `Dated ${state.documentDate}. Consider uploading a newer version.`}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{isNb ? "Dokumentnavn" : "Document name"} *</Label>
          <Input value={state.documentTypeLabel} onChange={(e) => update("documentTypeLabel", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Dokumenttype" : "Document type"}</Label>
          <Input
            value={state.documentType}
            onChange={(e) => update("documentType", e.target.value)}
            placeholder={isNb ? "F.eks. policy, DPA, ISO 27001" : "e.g. policy, DPA, ISO 27001"}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Dokumentdato" : "Document date"}</Label>
          <Input type="date" value={state.documentDate} onChange={(e) => update("documentDate", e.target.value)} />
        </div>
      </div>
    </div>
  );
}

// ---- STEP 2: placement ----
function PlacementStep({ state, setState, isNb }: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  isNb: boolean;
}) {
  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const tierWeight = TIER_CONFIG[state.tier].weight;

  return (
    <div className="space-y-4 py-2">
      {/* Path A — control */}
      <label
        className={cn(
          "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
          state.linkAsControl ? "border-primary/50 bg-primary/5" : "border-border hover:bg-accent/30",
        )}
      >
        <Checkbox
          checked={state.linkAsControl}
          onCheckedChange={(c) => update("linkAsControl", !!c)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              {isNb ? "Koble til kontroll" : "Link to a control"}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {isNb ? "Driver scoren" : "Drives the score"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isNb
              ? "Dokumentet vekter kontrollområdet. Bidrag = kontrollvekt × kritikalitet × tier."
              : "The document weights the control area. Contribution = control weight × criticality × tier."}
          </p>

          {state.linkAsControl && (
            <div className="space-y-2 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {isNb ? "Kontrollområde(r)" : "Control area(s)"} *
                </Label>
                <ControlAreaChips
                  selected={state.controlAreas}
                  onChange={(next) => update("controlAreas", next)}
                />
              </div>

              {state.suggestedControls.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary" />
                    {isNb ? "Foreslåtte kontrollpunkter" : "Suggested controls"}
                  </Label>
                  <div className="space-y-1">
                    {state.suggestedControls.map((c) => {
                      const checked = state.selectedControlIds.includes(c.controlId);
                      return (
                        <label
                          key={c.controlId}
                          className="flex items-center gap-2 rounded-md border border-border/60 px-2 py-1.5 text-xs cursor-pointer hover:bg-muted/30"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              update(
                                "selectedControlIds",
                                v
                                  ? [...state.selectedControlIds, c.controlId]
                                  : state.selectedControlIds.filter((id) => id !== c.controlId),
                              )
                            }
                          />
                          <span className="flex-1 truncate">
                            {(isNb ? c.labelNb : c.labelEn) || c.controlId}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(c.confidence * 100)}%
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-md bg-muted/40 border p-2 text-[11px] text-muted-foreground">
                {isNb ? "Vekting:" : "Weight:"}{" "}
                <span className="font-medium text-foreground">
                  {tierWeight.toFixed(2).replace(".", isNb ? "," : ".")}
                </span>{" "}
                · {TIER_CONFIG[state.tier][isNb ? "descriptionNb" : "descriptionEn"]}
              </div>
            </div>
          )}
        </div>
      </label>

      {/* Path B — resource */}
      <label
        className={cn(
          "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
          state.linkAsResource ? "border-primary/50 bg-primary/5" : "border-border hover:bg-accent/30",
        )}
      >
        <Checkbox
          checked={state.linkAsResource}
          onCheckedChange={(c) => update("linkAsResource", !!c)}
          className="mt-0.5"
        />
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">
              {isNb ? "Bare vis som ressurs" : "Show as resource only"}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {isNb ? "Ingen scorepåvirkning" : "No score impact"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isNb
              ? "Vises på Trust Profile som ressurs (sertifikat, rapport). Kan alltid kobles til kontroll senere."
              : "Appears on the Trust Profile as a resource (certificate, report). Can be linked to a control later."}
          </p>
        </div>
      </label>
    </div>
  );
}

// ---- STEP 3: attest ----
function AttestStep({ state, setState, isNb }: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  isNb: boolean;
}) {
  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4 py-2">
      <div className="rounded-lg border border-success/30 bg-success/5 p-3 flex items-start gap-2">
        <UserCheck className="h-4 w-4 text-success mt-0.5 shrink-0" />
        <p className="text-xs text-foreground/85">
          {isNb
            ? "For at dette skal telle fullt ut, må noen med ansvar bekrefte det. Verifisering av ekstern part kommer i eget steg."
            : "For full weight, a responsible person must confirm it. External verification is a separate step."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Navn" : "Name"} *</Label>
          <Input
            value={state.attestedBy}
            onChange={(e) => update("attestedBy", e.target.value)}
            placeholder={isNb ? "Ditt navn" : "Your name"}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">{isNb ? "Rolle" : "Role"}</Label>
          <Input
            value={state.attestedRole}
            onChange={(e) => update("attestedRole", e.target.value)}
            placeholder={isNb ? "F.eks. CISO, DPO" : "e.g. CISO, DPO"}
          />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        {isNb ? "Dato settes automatisk til i dag." : "Date will be set to today."}
      </p>
    </div>
  );
}

// ---- DONE ----
function DoneStep({ savedStatus, state, onAttest, onClose, isNb }: {
  savedStatus: EvidenceStatus;
  state: WizardState;
  onAttest: () => void;
  onClose: () => void;
  isNb: boolean;
}) {
  const canAttest = savedStatus === "confirmed";
  return (
    <div className="space-y-4 py-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <p className="text-sm font-medium">
          {isNb ? "Dokumentet er lagret" : "Document saved"}
        </p>
        <p className="text-xs text-muted-foreground max-w-md">
          {state.documentTypeLabel}
        </p>
      </div>

      <div className="rounded-lg border p-3 space-y-2">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {isNb ? "Status" : "Status"}
        </p>
        <EvidenceProgress status={savedStatus} />
      </div>

      {canAttest && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
          <UserCheck className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isNb ? "Attester for full uttelling" : "Attest for full weight"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isNb
                ? "Legg til attestering nå — det tar 15 sekunder."
                : "Add attestation now — takes 15 seconds."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onAttest}>
            {isNb ? "Attester" : "Attest"}
          </Button>
        </div>
      )}

      <div className="rounded-lg border border-dashed p-3 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isNb ? "Verifisering av ekstern part" : "External verification"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isNb
              ? "Venter på verifisering. Kan legges til fra dokumentkortet når verifikator er utpekt."
              : "Awaiting verification. Can be added from the document card once a verifier is assigned."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- MANUAL fallback ----
function ManualStep({ state, setState, isNb }: {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  isNb: boolean;
}) {
  const update = <K extends keyof WizardState>(k: K, v: WizardState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
        <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
        <p>{isNb
          ? "Lara klarte ikke å klassifisere dokumentet. Fyll ut manuelt. Vekting settes til «Egenerklært» (0,30) inntil en attestering legges til."
          : "Lara could not classify this document. Fill in manually. Weight defaults to 'Self-declared' (0.30) until attested."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{isNb ? "Dokumentnavn" : "Document name"} *</Label>
          <Input value={state.documentTypeLabel} onChange={(e) => update("documentTypeLabel", e.target.value)} />
        </div>
        <div className="space-y-1.5 col-span-2">
          <Label className="text-xs">{isNb ? "Dokumenttype" : "Document type"}</Label>
          <Input value={state.documentType} onChange={(e) => update("documentType", e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{isNb ? "Kontrollområde(r)" : "Control area(s)"} *</Label>
        <ControlAreaChips
          selected={state.controlAreas}
          onChange={(next) => update("controlAreas", next)}
        />
      </div>
    </div>
  );
}
