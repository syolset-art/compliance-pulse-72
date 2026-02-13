import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Sparkles, CheckCircle2, Plus, ArrowRight, Info } from "lucide-react";

const DOC_TYPES = [
  { value: "policy", label: "Policy", labelNb: "Policy", desc: "Internal or external policy document", descNb: "Internt eller eksternt policydokument" },
  { value: "certificate", label: "Certificate", labelNb: "Sertifikat", desc: "ISO, SOC 2, or other certification", descNb: "ISO, SOC 2 eller annen sertifisering" },
  { value: "report", label: "Report", labelNb: "Rapport", desc: "Audit report, risk assessment, etc.", descNb: "Revisjonsrapport, risikovurdering o.l." },
  { value: "agreement", label: "Agreement", labelNb: "Avtale", desc: "DPA, SLA, or contract", descNb: "DPA, SLA eller kontrakt" },
  { value: "penetration_test", label: "Penetration Test", labelNb: "Penetrasjonstest", desc: "Pentest report or findings", descNb: "Pentestrapport eller funn" },
  { value: "dpia", label: "DPIA", labelNb: "DPIA", desc: "Data Protection Impact Assessment", descNb: "Vurdering av personvernkonsekvenser" },
  { value: "soc2", label: "SOC 2", labelNb: "SOC 2", desc: "SOC 2 Type I or Type II report", descNb: "SOC 2 Type I- eller Type II-rapport" },
  { value: "iso27001", label: "ISO 27001", labelNb: "ISO 27001", desc: "ISO 27001 certificate or documentation", descNb: "ISO 27001-sertifikat eller dokumentasjon" },
  { value: "dpa", label: "DPA", labelNb: "DPA", desc: "Data Processing Agreement", descNb: "Databehandleravtale" },
  { value: "other", label: "Other", labelNb: "Annet", desc: "Describe below what this document contains", descNb: "Beskriv nedenfor hva dokumentet inneholder" },
];

const DOC_CATEGORIES = [
  { value: "Compliance", label: "Compliance" },
  { value: "Security", label: "Security" },
  { value: "Privacy", label: "Privacy" },
  { value: "Legal", label: "Legal" },
  { value: "Quality", label: "Quality" },
  { value: "Other", label: "Other" },
];

const REGULATIONS = [
  "GDPR", "ISO 27001", "ISO 27701", "SOC 2", "NIS2", "AI Act", "DORA",
];

interface FileEntry {
  file: File;
  type: string;
  category: string;
  displayName: string;
  linkedRegulations: string[];
  confirmed: boolean;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

export function UploadDocumentDialog({ open, onOpenChange, assetId }: UploadDocumentDialogProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 0: classify before upload
  const [step, setStep] = useState<"classify" | "upload">("classify");
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [docDescription, setDocDescription] = useState("");

  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const resetDialog = () => {
    setStep("classify");
    setSelectedDocType("");
    setDocDescription("");
    setFiles([]);
    setUploading(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetDialog();
    onOpenChange(v);
  };

  const handleProceedToUpload = () => {
    setStep("upload");
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles).map((f) => ({
      file: f,
      type: selectedDocType || "other",
      category: inferCategory(selectedDocType),
      displayName: f.name.replace(/\.[^/.]+$/, ""),
      linkedRegulations: inferRegulations(selectedDocType),
      confirmed: false,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, [selectedDocType]);

  const updateFile = (index: number, updates: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, ...updates } : f)));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRegulation = (index: number, reg: string) => {
    setFiles((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f;
        const has = f.linkedRegulations.includes(reg);
        return {
          ...f,
          linkedRegulations: has
            ? f.linkedRegulations.filter((r) => r !== reg)
            : [...f.linkedRegulations, reg],
        };
      })
    );
  };

  const confirmedCount = files.filter((f) => f.confirmed).length;

  const handleUploadAll = async () => {
    const toUpload = files.filter((f) => f.confirmed);
    if (toUpload.length === 0) return;
    setUploading(true);
    try {
      for (const entry of toUpload) {
        const filePath = `${assetId}/${Date.now()}_${entry.file.name}`;
        const { error: storageErr } = await supabase.storage
          .from("vendor-documents")
          .upload(filePath, entry.file);
        if (storageErr) throw storageErr;

        const { error: dbErr } = await supabase.from("vendor_documents").insert({
          asset_id: assetId,
          file_name: entry.file.name,
          file_path: filePath,
          document_type: entry.type,
          display_name: entry.displayName,
          category: entry.category,
          linked_regulations: entry.linkedRegulations,
          source: "manual_upload",
          status: "current",
          received_at: new Date().toISOString(),
          context_description: docDescription || null,
        } as any);
        if (dbErr) throw dbErr;
      }
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? `${toUpload.length} dokument(er) lastet opp` : `${toUpload.length} document(s) uploaded`);
      resetDialog();
      onOpenChange(false);
    } catch {
      toast.error(isNb ? "Kunne ikke laste opp" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "classify"
              ? (isNb ? "Hva slags dokument er dette?" : "What type of document is this?")
              : (isNb ? "Last opp dokumenter" : "Upload Documents")}
            {step === "upload" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Sparkles className="h-3 w-3" />
                Smart Classification
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "classify"
              ? (isNb
                  ? "Velg type og beskriv dokumentet kort, slik at vi kan gi en bedre analyse."
                  : "Select a type and briefly describe the document so we can provide a better analysis.")
              : (isNb ? "Legg til metadata og koble til regelverk før opplasting" : "Add metadata and link to regulations before uploading")}
          </DialogDescription>
        </DialogHeader>

        {/* ===== STEP: CLASSIFY ===== */}
        {step === "classify" && (
          <div className="space-y-5">
            {/* Info banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {isNb
                  ? "Ved å velge riktig type og gi en kort beskrivelse, kan vi automatisk koble dokumentet til relevante regelverk og gi mer presise analyseresultater."
                  : "By selecting the correct type and providing a brief description, we can automatically link the document to relevant regulations and provide more precise analysis results."}
              </p>
            </div>

            {/* Document type grid */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isNb ? "Dokumenttype" : "Document Type"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES.map((dt) => {
                  const isSelected = selectedDocType === dt.value;
                  return (
                    <button
                      key={dt.value}
                      onClick={() => setSelectedDocType(dt.value)}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{isNb ? dt.labelNb : dt.label}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {isNb ? dt.descNb : dt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isNb ? "Kort beskrivelse (valgfritt)" : "Brief description (optional)"}
              </Label>
              <Textarea
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder={isNb
                  ? "F.eks. «SOC 2 Type II-rapport fra 2024 for vår skyplattform» eller «Internt policy-dokument for informasjonssikkerhet»"
                  : "E.g. 'SOC 2 Type II report from 2024 for our cloud platform' or 'Internal information security policy document'"}
                rows={3}
                className="text-sm resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {isNb
                  ? "En kort beskrivelse hjelper AI-analysen å forstå dokumentets kontekst og formål."
                  : "A brief description helps the AI analysis understand the document's context and purpose."}
              </p>
            </div>
          </div>
        )}

        {/* ===== STEP: UPLOAD ===== */}
        {step === "upload" && (
          <>
            {/* Context summary */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">
                  {isNb ? "Dokumenttype" : "Document type"}:{" "}
                  {DOC_TYPES.find((d) => d.value === selectedDocType)?.[isNb ? "labelNb" : "label"] || (isNb ? "Annet" : "Other")}
                </span>
              </div>
              {docDescription && (
                <p className="text-[11px] text-muted-foreground pl-5.5 truncate">
                  «{docDescription}»
                </p>
              )}
              <button onClick={() => setStep("classify")} className="text-[11px] text-primary hover:underline pl-5.5">
                {isNb ? "Endre" : "Change"}
              </button>
            </div>

            {/* AI Auto-Fill banner */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Auto-Fill Available
              </div>
              <p className="text-xs text-muted-foreground">2 of 3 scans remaining this year</p>
              <Progress value={66} className="h-1.5" />
            </div>

            {/* File count */}
            {files.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{files.length} {isNb ? "fil(er) klar" : "file(s) ready"}</span>
                <Badge variant="outline" className="text-[10px]">Premium Features</Badge>
              </div>
            )}

            {/* File cards */}
            <div className="space-y-4">
              {files.map((entry, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium truncate">{entry.file.name}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                      {entry.confirmed && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      )}
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeFile(idx)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px]">{isNb ? "Type" : "Type"}</Label>
                      <Select value={entry.type} onValueChange={(v) => updateFile(idx, { type: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map((dt) => (
                            <SelectItem key={dt.value} value={dt.value}>
                              {isNb ? dt.labelNb : dt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">{isNb ? "Kategori" : "Category"}</Label>
                      <Select value={entry.category} onValueChange={(v) => updateFile(idx, { category: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DOC_CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">{isNb ? "Visningsnavn" : "Display Name"}</Label>
                    <Input
                      value={entry.displayName}
                      onChange={(e) => updateFile(idx, { displayName: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px]">{isNb ? "Regelverk" : "Regulations"}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {REGULATIONS.map((reg) => {
                        const selected = entry.linkedRegulations.includes(reg);
                        return (
                          <Badge
                            key={reg}
                            variant={selected ? "default" : "outline"}
                            className="text-[10px] cursor-pointer transition-colors"
                            onClick={() => toggleRegulation(idx, reg)}
                          >
                            {reg}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant={entry.confirmed ? "secondary" : "default"}
                      className="h-7 text-xs"
                      onClick={() => updateFile(idx, { confirmed: !entry.confirmed })}
                    >
                      {entry.confirmed ? (isNb ? "Bekreftet ✓" : "Confirmed ✓") : (isNb ? "Bekreft" : "Confirm")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add more files */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-colors"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {files.length === 0
                  ? (isNb ? "Velg filer eller dra og slipp her" : "Select files or drag and drop here")
                  : (isNb ? "Legg til flere filer" : "Add more files")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx"
                onChange={(e) => {
                  if (e.target.files) addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === "classify" && (
            <>
              <span className="text-xs text-muted-foreground mr-auto">
                {isNb ? "Du kan endre dette senere" : "You can change this later"}
              </span>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                {isNb ? "Avbryt" : "Cancel"}
              </Button>
              <Button onClick={handleProceedToUpload} disabled={!selectedDocType}>
                <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                {isNb ? "Neste: Velg filer" : "Next: Select files"}
              </Button>
            </>
          )}
          {step === "upload" && (
            <>
              <span className="text-sm text-muted-foreground mr-auto">
                {confirmedCount} {isNb ? "dokument(er) klar til opplasting" : "document(s) ready to upload"}
              </span>
              <Button variant="outline" onClick={() => setStep("classify")}>
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button onClick={handleUploadAll} disabled={confirmedCount === 0 || uploading}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading
                  ? (isNb ? "Laster opp..." : "Uploading...")
                  : (isNb ? "Last opp alle" : "Upload All")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Infer a default category from doc type */
function inferCategory(docType: string): string {
  const map: Record<string, string> = {
    policy: "Compliance",
    certificate: "Security",
    report: "Compliance",
    agreement: "Legal",
    penetration_test: "Security",
    dpia: "Privacy",
    soc2: "Security",
    iso27001: "Security",
    dpa: "Privacy",
  };
  return map[docType] || "Other";
}

/** Infer linked regulations from doc type */
function inferRegulations(docType: string): string[] {
  const map: Record<string, string[]> = {
    dpia: ["GDPR"],
    dpa: ["GDPR"],
    iso27001: ["ISO 27001"],
    soc2: ["SOC 2"],
    policy: [],
    certificate: [],
    report: [],
    agreement: [],
    penetration_test: [],
  };
  return map[docType] || [];
}
