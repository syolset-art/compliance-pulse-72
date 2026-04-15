import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Upload, X, Loader2, Sparkles, Eye, EyeOff, Lock, AlertCircle, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { AIGeneratedBadge } from "@/components/process/AIGeneratedBadge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DocCategory = "policy" | "certification" | "document";
type Visibility = "published" | "visible" | "hidden";
type Step = "upload" | "analyzing" | "review" | "manual";

interface Classification {
  documentType: string;
  documentTypeLabel: string;
  confidence: number;
  summary: string;
  validFrom?: string;
  validTo?: string;
  expiryStatus: string;
  relevantRegulations?: { regulation: string; relevance: string; reason: string }[];
  extractedVendors?: { name: string; description?: string }[];
}

const ALL_SUBTYPES = [
  { value: "policy", label: "General Policy", labelNb: "Generell policy", cat: "policy" },
  { value: "privacy_policy", label: "Privacy Policy", labelNb: "Personvernpolicy", cat: "policy" },
  { value: "acceptable_use", label: "Acceptable Use", labelNb: "Akseptabel bruk", cat: "policy" },
  { value: "incident_response", label: "Incident Response", labelNb: "Hendelseshåndtering", cat: "policy" },
  { value: "security_policy", label: "Security Policy", labelNb: "Sikkerhetspolicy", cat: "policy" },
  { value: "data_protection_policy", label: "Data Protection", labelNb: "Databeskyttelse", cat: "policy" },
  { value: "iso_27001", label: "ISO 27001", cat: "certification" },
  { value: "iso_9001", label: "ISO 9001", cat: "certification" },
  { value: "soc2", label: "SOC 2 Type II", cat: "certification" },
  { value: "iso_27701", label: "ISO 27701", cat: "certification" },
  { value: "other_cert", label: "Other", labelNb: "Annet", cat: "certification" },
  { value: "dpa", label: "DPA / Databehandleravtale", cat: "document" },
  { value: "report", label: "Report", labelNb: "Rapport", cat: "document" },
  { value: "agreement", label: "Agreement", labelNb: "Avtale", cat: "document" },
  { value: "penetration_test", label: "Penetration Test", labelNb: "Penetrasjonstest", cat: "document" },
  { value: "other", label: "Other", labelNb: "Annet", cat: "document" },
];

function mapDocumentTypeToCategory(docType: string): { category: DocCategory; subType: string } {
  const certTypes = ["certificate", "soc2", "iso27001"];
  const policyTypes = ["policy"];
  const docTypes = ["dpa", "dpia", "report", "agreement", "penetration_test", "vendor_list"];

  if (certTypes.includes(docType)) {
    const subMap: Record<string, string> = { certificate: "other_cert", soc2: "soc2", iso27001: "iso_27001" };
    return { category: "certification", subType: subMap[docType] || "other_cert" };
  }
  if (policyTypes.includes(docType)) {
    return { category: "policy", subType: "policy" };
  }
  if (docTypes.includes(docType)) {
    const subMap: Record<string, string> = { dpa: "dpa", dpia: "dpa", report: "report", agreement: "agreement", penetration_test: "penetration_test", vendor_list: "other" };
    return { category: "document", subType: subMap[docType] || "other" };
  }
  return { category: "document", subType: "other" };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
}

export const AddEvidenceDialog = ({ open, onOpenChange, assetId }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [category, setCategory] = useState<DocCategory>("document");
  const [displayName, setDisplayName] = useState("");
  const [subType, setSubType] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("published");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [classification, setClassification] = useState<Classification | null>(null);
  const [aiFields, setAiFields] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setStep("upload");
    setCategory("document");
    setDisplayName("");
    setSubType("");
    setIssuer("");
    setIssuedDate("");
    setExpiryDate("");
    setNotes("");
    setVisibility("published");
    setFile(null);
    setUploading(false);
    setClassification(null);
    setAiFields(new Set());
    setDragOver(false);
  };

  const uploadFile = async (f: File): Promise<string> => {
    const ext = f.name.split(".").pop();
    const path = `${assetId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("vendor-documents").upload(path, f);
    if (error) throw error;
    return path;
  };

  const readFileText = (f: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string || "");
      reader.onerror = () => resolve("");
      reader.readAsText(f);
    });
  };

  const classifyDocument = async (f: File) => {
    setStep("analyzing");
    try {
      const text = await readFileText(f);
      const documentText = text.length > 100 ? text : `[Binary file: ${f.name}, size: ${f.size} bytes, type: ${f.type}]`;

      const { data, error } = await supabase.functions.invoke("classify-document", {
        body: { documentText, fileName: f.name },
      });

      if (error) throw error;
      if (!data?.classification) throw new Error("No classification returned");

      const cls: Classification = data.classification;
      setClassification(cls);

      // Map to form fields
      const mapped = mapDocumentTypeToCategory(cls.documentType);
      setCategory(mapped.category);
      setSubType(mapped.subType);
      setDisplayName(cls.documentTypeLabel || f.name.replace(/\.[^.]+$/, ""));
      setNotes(cls.summary || "");
      if (cls.validFrom) setIssuedDate(cls.validFrom);
      if (cls.validTo) setExpiryDate(cls.validTo);

      const fields = new Set<string>(["category", "subType", "displayName", "notes"]);
      if (cls.validFrom) fields.add("issuedDate");
      if (cls.validTo) fields.add("expiryDate");
      setAiFields(fields);

      setStep("review");
    } catch (err) {
      console.error("Classification failed:", err);
      toast.error(isNb ? "AI-analyse feilet. Fyll ut manuelt." : "AI analysis failed. Fill in manually.");
      setDisplayName(f.name.replace(/\.[^.]+$/, ""));
      setStep("review");
    }
  };

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    classifyDocument(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  }, [handleFileSelect]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      let filePath = "";
      let fileName = displayName;

      if (file) {
        filePath = await uploadFile(file);
        fileName = file.name;
      }

      const docType = category === "certification" ? "certification" : subType || "policy";
      const { error } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        document_type: docType,
        file_name: fileName || displayName,
        file_path: filePath,
        display_name: displayName,
        status: "draft",
        visibility,
        valid_from: issuedDate || null,
        valid_to: expiryDate || null,
        category: category === "certification" ? "certification" : subType || null,
        notes: notes || null,
        source: issuer || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      toast.success(isNb ? "Dokument lagt til" : "Document added");
      reset();
      onOpenChange(false);
    },
    onError: () => {
      setUploading(false);
      toast.error(isNb ? "Kunne ikke lagre" : "Failed to save");
    },
  });

  const subtypesForCategory = ALL_SUBTYPES.filter((s) => s.cat === category);

  const expiryBadge = classification?.expiryStatus === "expired"
    ? { label: isNb ? "Utgått" : "Expired", className: "bg-destructive/10 text-destructive border-destructive/20" }
    : classification?.expiryStatus === "expiring_soon"
    ? { label: isNb ? "Utløper snart" : "Expiring soon", className: "bg-warning/10 text-warning border-warning/20" }
    : classification?.expiryStatus === "valid"
    ? { label: isNb ? "Gyldig" : "Valid", className: "bg-success/10 text-success border-success/20" }
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && (isNb ? "Legg til dokumentasjon" : "Add documentation")}
            {step === "analyzing" && (isNb ? "Analyserer dokument..." : "Analyzing document...")}
            {step === "review" && (isNb ? "Bekreft detaljer" : "Confirm details")}
            {step === "manual" && (isNb ? "Legg til manuelt" : "Add manually")}
          </DialogTitle>
          <DialogDescription>
            {step === "upload" && (isNb ? "Last opp en fil, så klassifiserer Lara den automatisk." : "Upload a file and Lara will classify it automatically.")}
            {step === "analyzing" && (isNb ? "Lara leser og analyserer dokumentet ditt..." : "Lara is reading and analyzing your document...")}
            {step === "review" && (isNb ? "Kontroller AI-forslaget og juster om nødvendig." : "Review the AI suggestion and adjust if needed.")}
            {step === "manual" && (isNb ? "Fyll inn informasjon om dokumentet." : "Fill in document information.")}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="space-y-4 py-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />

            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-all",
                dragOver
                  ? "border-primary bg-primary/5 scale-[1.02]"
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
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG, DOC · Max 10 MB</p>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => setStep("manual")}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                {isNb ? "Legg til uten fil" : "Add without file"}
              </button>
            </div>
          </div>
        )}

        {/* Step: Analyzing */}
        {step === "analyzing" && (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <Loader2 className="h-3 w-3 text-primary animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">{isNb ? "Lara analyserer dokumentet..." : "Lara is analyzing the document..."}</p>
              <p className="text-xs text-muted-foreground">
                {isNb ? "Identifiserer type, datoer og relevante regelverk" : "Identifying type, dates and relevant regulations"}
              </p>
            </div>
            {file && (
              <div className="flex items-center gap-2 rounded-md border px-3 py-1.5 bg-muted/30 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            )}
          </div>
        )}

        {/* Step: Review (AI-prefilled) */}
        {step === "review" && (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* File info */}
            {file && (
              <div className="flex items-center gap-3 rounded-lg border p-3 bg-accent/20">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                </div>
                {classification && classification.confidence > 0.7 && (
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[11px] gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {Math.round(classification.confidence * 100)}%
                  </Badge>
                )}
              </div>
            )}

            {/* Expiry warning */}
            {expiryBadge && (
              <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium", expiryBadge.className)}>
                <AlertCircle className="h-3.5 w-3.5" />
                {expiryBadge.label}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{isNb ? "Navn" : "Name"} *</Label>
                {aiFields.has("displayName") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
              </div>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>

            {/* Category + SubType row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isNb ? "Kategori" : "Category"}</Label>
                  {aiFields.has("category") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
                </div>
                <Select value={category} onValueChange={(v) => { setCategory(v as DocCategory); setSubType(""); }}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">{isNb ? "Retningslinje" : "Policy"}</SelectItem>
                    <SelectItem value="certification">{isNb ? "Sertifisering" : "Certification"}</SelectItem>
                    <SelectItem value="document">{isNb ? "Dokument" : "Document"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isNb ? "Type" : "Type"}</Label>
                  {aiFields.has("subType") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
                </div>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={isNb ? "Velg..." : "Select..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {subtypesForCategory.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {isNb && "labelNb" in s ? (s as any).labelNb : s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isNb ? "Gyldig fra" : "Valid from"}</Label>
                  {aiFields.has("issuedDate") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
                </div>
                <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                  {aiFields.has("expiryDate") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
                </div>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            {/* Notes / Summary */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs">{isNb ? "Oppsummering / notater" : "Summary / notes"}</Label>
                {aiFields.has("notes") && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
            </div>

            {/* Relevant regulations */}
            {classification?.relevantRegulations && classification.relevantRegulations.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">{isNb ? "Relevante regelverk" : "Relevant regulations"}</Label>
                <div className="flex flex-wrap gap-1.5">
                  {classification.relevantRegulations.map((r, i) => (
                    <Badge key={i} variant="outline" className={cn(
                      "text-[11px]",
                      r.relevance === "high" ? "bg-primary/10 text-primary border-primary/20"
                        : r.relevance === "medium" ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {r.regulation}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Visibility inline */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Synlighet" : "Visibility"}</Label>
              <div className="flex gap-2">
                {([
                  { v: "published" as const, icon: Eye, label: isNb ? "Publisert" : "Published" },
                  { v: "visible" as const, icon: EyeOff, label: isNb ? "Intern" : "Internal" },
                  { v: "hidden" as const, icon: Lock, label: isNb ? "Skjult" : "Hidden" },
                ]).map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      visibility === v
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2">
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || uploading || !displayName.trim()}>
                {(saveMutation.isPending || uploading) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isNb ? "Lagre dokumentasjon" : "Save documentation"}
              </Button>
            </div>
          </div>
        )}

        {/* Step: Manual (no file) */}
        {step === "manual" && (
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Navn" : "Name"} *</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-9 text-sm"
                placeholder={isNb ? "F.eks. Personvernpolicy 2025" : "E.g. Privacy Policy 2025"} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isNb ? "Kategori" : "Category"}</Label>
                <Select value={category} onValueChange={(v) => { setCategory(v as DocCategory); setSubType(""); }}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="policy">{isNb ? "Retningslinje" : "Policy"}</SelectItem>
                    <SelectItem value="certification">{isNb ? "Sertifisering" : "Certification"}</SelectItem>
                    <SelectItem value="document">{isNb ? "Dokument" : "Document"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isNb ? "Type" : "Type"}</Label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isNb ? "Velg..." : "Select..."} /></SelectTrigger>
                  <SelectContent>
                    {subtypesForCategory.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {isNb && "labelNb" in s ? (s as any).labelNb : s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{isNb ? "Gyldig fra" : "Valid from"}</Label>
                <Input type="date" value={issuedDate} onChange={(e) => setIssuedDate(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{isNb ? "Utløpsdato" : "Expiry date"}</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Notater" : "Notes"}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Synlighet" : "Visibility"}</Label>
              <div className="flex gap-2">
                {([
                  { v: "published" as const, icon: Eye, label: isNb ? "Publisert" : "Published" },
                  { v: "visible" as const, icon: EyeOff, label: isNb ? "Intern" : "Internal" },
                  { v: "hidden" as const, icon: Lock, label: isNb ? "Skjult" : "Hidden" },
                ]).map(({ v, icon: Icon, label }) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                      visibility === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => { reset(); }}>
                {isNb ? "Avbryt" : "Cancel"}
              </Button>
              <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !displayName.trim()}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {isNb ? "Lagre" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
