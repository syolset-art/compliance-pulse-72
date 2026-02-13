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
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Upload, X, FileText, Sparkles, CheckCircle2, Plus } from "lucide-react";

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
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: FileEntry[] = Array.from(newFiles).map((f) => ({
      file: f,
      type: "other",
      category: "Compliance",
      displayName: f.name.replace(/\.[^/.]+$/, ""),
      linkedRegulations: [],
      confirmed: false,
    }));
    setFiles((prev) => [...prev, ...entries]);
  }, []);

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
        } as any);
        if (dbErr) throw dbErr;
      }
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? `${toUpload.length} dokument(er) lastet opp` : `${toUpload.length} document(s) uploaded`);
      setFiles([]);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isNb ? "Last opp dokumenter" : "Upload Documents"}
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Sparkles className="h-3 w-3" />
              Smart Classification
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isNb ? "Legg til metadata og koble til regelverk før opplasting" : "Add metadata and link to regulations before uploading"}
          </DialogDescription>
        </DialogHeader>

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
              {/* File header */}
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

              {/* Type + Category */}
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

              {/* Display Name */}
              <div className="space-y-1">
                <Label className="text-[11px]">{isNb ? "Visningsnavn" : "Display Name"}</Label>
                <Input
                  value={entry.displayName}
                  onChange={(e) => updateFile(idx, { displayName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              {/* Regulations */}
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

              {/* Confirm */}
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
            {isNb ? "Legg til flere filer" : "Add more files"}
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <span className="text-sm text-muted-foreground mr-auto">
            {confirmedCount} {isNb ? "dokument(er) klar til opplasting" : "document(s) ready to upload"}
          </span>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={handleUploadAll} disabled={confirmedCount === 0 || uploading}>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {uploading
              ? (isNb ? "Laster opp..." : "Uploading...")
              : (isNb ? "Last opp alle" : "Upload All")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
