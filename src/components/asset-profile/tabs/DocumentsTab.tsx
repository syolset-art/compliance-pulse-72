import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Trash2, FileCheck, AlertTriangle, Lock } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
const DOCUMENT_TYPES = [
  { value: "penetration_test", label: "Penetrasjonstest", labelEn: "Penetration Test" },
  { value: "dpia", label: "DPIA", labelEn: "DPIA" },
  { value: "soc2", label: "SOC 2", labelEn: "SOC 2" },
  { value: "iso27001", label: "ISO 27001", labelEn: "ISO 27001" },
  { value: "dpa", label: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement" },
  { value: "nda", label: "NDA / Konfidensialitetsavtale", labelEn: "NDA / Confidentiality Agreement" },
  { value: "other", label: "Annet", labelEn: "Other" },
];

interface DocumentsTabProps {
  assetId: string;
}

export function DocumentsTab({ assetId }: DocumentsTabProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [notes, setNotes] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const planName = subscription?.plan?.name || "starter";
  const maxDocs = planName === "starter" ? 5 : Infinity;

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["vendor-documents", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const atLimit = planName === "starter" && documents.length >= maxDocs;

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${assetId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("vendor-documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("vendor_documents")
        .insert({
          asset_id: assetId,
          file_name: file.name,
          file_path: filePath,
          document_type: docType,
          notes: notes || null,
        });
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(t("vendorDocs.uploadSuccess", "Dokument lastet opp"));
      setNotes("");
      setDocType("other");
    },
    onError: () => {
      toast.error(t("vendorDocs.uploadError", "Kunne ikke laste opp dokument"));
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("vendor-documents").remove([doc.file_path]);
      const { error } = await supabase
        .from("vendor_documents")
        .delete()
        .eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(t("vendorDocs.deleteSuccess", "Dokument slettet"));
    },
  });

  const processFile = useCallback(async (file: File) => {
    if (atLimit) {
      toast.error(t("vendorDocs.limitReached", "Maks 5 dokumenter på Starter-planen. Oppgrader for ubegrenset."));
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error(t("vendorDocs.invalidType", "Ugyldig filtype. Last opp PDF, Word, Excel eller PowerPoint."));
      return;
    }
    setUploading(true);
    await uploadMutation.mutateAsync(file);
    setUploading(false);
  }, [atLimit, uploadMutation, t]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    e.target.value = "";
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  }, [processFile]);

  const getTypeLabel = (type: string) => {
    const dt = DOCUMENT_TYPES.find((d) => d.value === type);
    return i18n.language === "nb" ? dt?.label || type : dt?.labelEn || type;
  };

  return (
    <div className="space-y-6">
      {/* Upload section with drag-and-drop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("vendorDocs.uploadTitle", "Last opp dokumentasjon")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("vendorDocs.documentType", "Dokumenttype")}</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {i18n.language === "nb" ? dt.label : dt.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("vendorDocs.notes", "Notater (valgfritt)")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("vendorDocs.notesPlaceholder", "F.eks. utført av Mnemonic, Q1 2025")}
                rows={1}
              />
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center gap-3 p-8 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer
              ${atLimit ? "opacity-50 pointer-events-none" : ""}
              ${isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-accent/30"
              }
            `}
            onClick={() => {
              if (!atLimit && !uploading) {
                document.getElementById(`file-input-${assetId}`)?.click();
              }
            }}
          >
            <Input
              id={`file-input-${assetId}`}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx"
              onChange={handleFileSelect}
              disabled={uploading || atLimit}
            />
            <div className={`p-3 rounded-full transition-colors ${isDragOver ? "bg-primary/10" : "bg-muted"}`}>
              <Upload className={`h-6 w-6 transition-colors ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploading
                  ? t("vendorDocs.uploading", "Laster opp...")
                  : isDragOver
                    ? t("vendorDocs.dropHere", "Slipp filen her")
                    : t("vendorDocs.dragOrClick", "Dra og slipp fil her, eller klikk for å velge")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("vendorDocs.acceptedFormats", "PDF, Word, Excel, PowerPoint")}
              </p>
            </div>
            {planName === "starter" && (
              <span className="text-xs text-muted-foreground">
                {documents.length}/{maxDocs} {t("vendorDocs.documentsUsed", "dokumenter brukt")}
              </span>
            )}
          </div>

          {atLimit && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
              <Lock className="h-4 w-4 text-warning" />
              <span className="text-muted-foreground">
                {t("vendorDocs.upgradeForMore", "Oppgrader til Professional for ubegrenset antall dokumenter.")}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("vendorDocs.documentsTitle", "Dokumenter")} ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t("vendorDocs.noDocuments", "Ingen dokumenter lastet opp ennå")}</p>
              <p className="text-xs mt-1">{t("vendorDocs.noDocumentsHint", "Last opp rapporter som penetrasjonstester, DPIA-er, DPA-er m.m.")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileCheck className="h-5 w-5 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(doc.document_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString(i18n.language === "nb" ? "nb-NO" : "en-US")}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{doc.notes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                    onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
