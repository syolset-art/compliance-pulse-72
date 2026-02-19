import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Upload, X, FileText, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, Loader2,
  Calendar, Shield, Clock, XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DOC_TYPES = [
  { value: "policy", label: "Policy", labelNb: "Policy" },
  { value: "certificate", label: "Certificate", labelNb: "Sertifikat" },
  { value: "report", label: "Report", labelNb: "Rapport" },
  { value: "agreement", label: "Agreement", labelNb: "Avtale" },
  { value: "penetration_test", label: "Penetration Test", labelNb: "Penetrasjonstest" },
  { value: "dpia", label: "DPIA", labelNb: "DPIA" },
  { value: "soc2", label: "SOC 2", labelNb: "SOC 2" },
  { value: "iso27001", label: "ISO 27001", labelNb: "ISO 27001" },
  { value: "dpa", label: "DPA", labelNb: "DPA" },
  { value: "other", label: "Other", labelNb: "Annet" },
];

const DOC_CATEGORIES = [
  { value: "Compliance", label: "Compliance" },
  { value: "Security", label: "Security" },
  { value: "Privacy", label: "Privacy" },
  { value: "Legal", label: "Legal" },
  { value: "Quality", label: "Quality" },
  { value: "Other", label: "Other" },
];

const ALL_REGULATIONS = [
  "GDPR", "ISO 27001", "ISO 27701", "SOC 2", "NIS2", "AI Act", "DORA",
];

interface AIClassification {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  summary: string;
  validFrom?: string | null;
  validTo?: string | null;
  expiryStatus: "valid" | "expired" | "expiring_soon" | "unknown";
  relevantRegulations: Array<{
    regulation: string;
    relevance: "high" | "medium" | "low";
    reason: string;
  }>;
  extractedVendors: Array<{ name: string; description?: string }>;
}

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

type Step = "upload" | "analyzing" | "review";

export function UploadDocumentDialog({ open, onOpenChange, assetId }: UploadDocumentDialogProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [classification, setClassification] = useState<AIClassification | null>(null);

  // Editable fields (populated by AI, adjustable by user)
  const [docType, setDocType] = useState("");
  const [category, setCategory] = useState("Other");
  const [displayName, setDisplayName] = useState("");
  const [linkedRegulations, setLinkedRegulations] = useState<string[]>([]);
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");

  const [uploading, setUploading] = useState(false);

  const resetDialog = () => {
    setStep("upload");
    setFile(null);
    setClassification(null);
    setDocType("");
    setCategory("Other");
    setDisplayName("");
    setLinkedRegulations([]);
    setValidFrom("");
    setValidTo("");
    setUploading(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) resetDialog();
    onOpenChange(v);
  };

  const readFileAsText = async (f: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || "");
      reader.onerror = () => resolve("");
      reader.readAsText(f);
    });
  };

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setDisplayName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    setStep("analyzing");

    try {
      const text = await readFileAsText(selectedFile);
      if (!text || text.length < 20) {
        // Binary file - can't extract text, skip AI
        toast.info(isNb ? "Kunne ikke lese filinnhold for AI-analyse. Velg type manuelt." : "Could not read file for AI analysis. Select type manually.");
        setStep("review");
        setDocType("other");
        setCategory("Other");
        return;
      }

      const { data, error } = await supabase.functions.invoke("classify-document", {
        body: { documentText: text, fileName: selectedFile.name },
      });

      if (error || data?.error) {
        console.error("Classification error:", error || data?.error);
        toast.error(isNb ? "AI-klassifisering feilet. Velg type manuelt." : "AI classification failed. Select type manually.");
        setStep("review");
        setDocType("other");
        setCategory("Other");
        return;
      }

      const cls: AIClassification = data.classification;
      setClassification(cls);
      setDocType(cls.documentType === "vendor_list" ? "other" : cls.documentType);
      setCategory(inferCategory(cls.documentType));
      setLinkedRegulations(
        (cls.relevantRegulations || [])
          .filter((r) => r.relevance === "high" || r.relevance === "medium")
          .map((r) => r.regulation)
      );
      if (cls.validFrom) setValidFrom(cls.validFrom);
      if (cls.validTo) setValidTo(cls.validTo);
      setStep("review");
    } catch (err) {
      console.error("Classification error:", err);
      toast.error(isNb ? "AI-analyse feilet" : "AI analysis failed");
      setStep("review");
      setDocType("other");
      setCategory("Other");
    }
  }, [isNb]);

  const toggleRegulation = (reg: string) => {
    setLinkedRegulations((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `${assetId}/${Date.now()}_${file.name}`;
      const { error: storageErr } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, file);
      if (storageErr) throw storageErr;

      const { error: dbErr } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: file.name,
        file_path: filePath,
        document_type: docType,
        display_name: displayName,
        category,
        linked_regulations: linkedRegulations,
        source: "manual_upload",
        status: "current",
        received_at: new Date().toISOString(),
        valid_from: validFrom || null,
        valid_to: validTo || null,
        context_description: classification?.summary || null,
      } as any);
      if (dbErr) throw dbErr;

      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? "Dokument lastet opp og klassifisert" : "Document uploaded and classified");
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
      const f = e.dataTransfer.files?.[0];
      if (f) handleFileSelected(f);
    },
    [handleFileSelected]
  );

  const expiryStatusConfig = {
    valid: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", label: isNb ? "Gyldig" : "Valid" },
    expired: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", label: isNb ? "Utgått" : "Expired" },
    expiring_soon: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800", label: isNb ? "Utløper snart" : "Expiring soon" },
    unknown: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/30 border-border", label: isNb ? "Ukjent" : "Unknown" },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === "upload" && (isNb ? "Last opp dokument" : "Upload Document")}
            {step === "analyzing" && (isNb ? "Analyserer dokument..." : "Analyzing document...")}
            {step === "review" && (
              <>
                {isNb ? "AI-analyse ferdig" : "AI Analysis Complete"}
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI
                </Badge>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && (isNb ? "Last opp et dokument, så analyserer vi det automatisk" : "Upload a document and we'll analyze it automatically")}
            {step === "analyzing" && (isNb ? "Vi klassifiserer dokumentet og identifiserer relevante regelverk..." : "We're classifying the document and identifying relevant regulations...")}
            {step === "review" && (isNb ? "Gjennomgå og juster AI-forslagene før du lagrer" : "Review and adjust AI suggestions before saving")}
          </DialogDescription>
        </DialogHeader>

        {/* ===== STEP: UPLOAD ===== */}
        {step === "upload" && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-10 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 cursor-pointer transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium">{isNb ? "Dra og slipp fil her, eller klikk for å velge" : "Drag and drop a file, or click to select"}</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, PowerPoint</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx,.txt,.csv"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelected(f);
                e.target.value = "";
              }}
            />
          </div>
        )}

        {/* ===== STEP: ANALYZING ===== */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <Sparkles className="h-4 w-4 text-primary absolute -top-1 -right-1" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">{isNb ? "Analyserer" : "Analyzing"} {file?.name}</p>
              <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                <span>🔍 {isNb ? "Identifiserer dokumenttype..." : "Identifying document type..."}</span>
                <span>📅 {isNb ? "Sjekker gyldighetsdatoer..." : "Checking validity dates..."}</span>
                <span>⚖️ {isNb ? "Kobler til relevante regelverk..." : "Linking to relevant regulations..."}</span>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP: REVIEW ===== */}
        {step === "review" && (
          <div className="space-y-4">
            {/* File info */}
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium truncate">{file?.name}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {file && (file.size / 1024 / 1024).toFixed(1)} MB
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto shrink-0" onClick={() => { setFile(null); setClassification(null); setStep("upload"); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* AI Summary */}
            {classification?.summary && (
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription className="text-sm">{classification.summary}</AlertDescription>
              </Alert>
            )}

            {/* Expiry status banner */}
            {classification && classification.expiryStatus !== "unknown" && (
              <div className={`flex items-center gap-2 p-3 rounded-lg border ${expiryStatusConfig[classification.expiryStatus].bg}`}>
                {(() => {
                  const Icon = expiryStatusConfig[classification.expiryStatus].icon;
                  return <Icon className={`h-4 w-4 ${expiryStatusConfig[classification.expiryStatus].color}`} />;
                })()}
                <div>
                  <span className={`text-sm font-medium ${expiryStatusConfig[classification.expiryStatus].color}`}>
                    {expiryStatusConfig[classification.expiryStatus].label}
                  </span>
                  {classification.expiryStatus === "expired" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isNb ? "Dette dokumentet er utgått. Du bør be leverandøren om en oppdatert versjon." : "This document has expired. You should request an updated version from the vendor."}
                    </p>
                  )}
                  {classification.expiryStatus === "expiring_soon" && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {isNb ? "Dokumentet utløper snart. Planlegg fornyelse." : "Document is expiring soon. Plan for renewal."}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Suggested type & category */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  {isNb ? "Dokumenttype" : "Document Type"}
                  {classification && <Badge variant="outline" className="text-[9px] ml-1">AI-forslag</Badge>}
                </Label>
                <Select value={docType} onValueChange={setDocType}>
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
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isNb ? "Kategori" : "Category"}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DOC_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Display name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isNb ? "Visningsnavn" : "Display Name"}</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            {/* Validity dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isNb ? "Gyldig fra" : "Valid from"}
                </Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isNb ? "Gyldig til" : "Valid to"}
                </Label>
                <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>

            {/* Relevant regulations */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {isNb ? "Relevante regelverk" : "Relevant Regulations"}
                {classification?.relevantRegulations && classification.relevantRegulations.length > 0 && (
                  <Badge variant="outline" className="text-[9px] ml-1">AI-forslag</Badge>
                )}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_REGULATIONS.map((reg) => {
                  const selected = linkedRegulations.includes(reg);
                  const aiSuggestion = classification?.relevantRegulations?.find((r) => r.regulation === reg);
                  return (
                    <Badge
                      key={reg}
                      variant={selected ? "default" : "outline"}
                      className={`text-[10px] cursor-pointer transition-colors ${
                        selected ? "" : aiSuggestion ? "border-primary/40 text-primary" : ""
                      }`}
                      onClick={() => toggleRegulation(reg)}
                    >
                      {reg}
                    </Badge>
                  );
                })}
              </div>

              {/* AI regulation reasons */}
              {classification?.relevantRegulations && classification.relevantRegulations.length > 0 && (
                <div className="space-y-1 mt-2">
                  {classification.relevantRegulations
                    .filter((r) => r.relevance === "high" || r.relevance === "medium")
                    .map((r, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                        <Badge variant={r.relevance === "high" ? "default" : "secondary"} className="text-[9px] shrink-0 mt-0.5">
                          {r.regulation}
                        </Badge>
                        <span>{r.reason}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {step === "upload" && (
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
          )}
          {step === "analyzing" && (
            <Button variant="outline" onClick={() => { setStep("upload"); setFile(null); }}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
          )}
          {step === "review" && (
            <>
              <span className="text-xs text-muted-foreground mr-auto">
                {classification && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {isNb ? `Konfidensgrad: ${Math.round((classification.confidence || 0) * 100)}%` : `Confidence: ${Math.round((classification.confidence || 0) * 100)}%`}
                  </span>
                )}
              </span>
              <Button variant="outline" onClick={() => { setFile(null); setClassification(null); setStep("upload"); }}>
                {isNb ? "Velg annen fil" : "Choose another file"}
              </Button>
              <Button onClick={handleSave} disabled={uploading || !docType}>
                <Upload className="h-3.5 w-3.5 mr-1.5" />
                {uploading
                  ? (isNb ? "Lagrer..." : "Saving...")
                  : (isNb ? "Lagre dokument" : "Save Document")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
