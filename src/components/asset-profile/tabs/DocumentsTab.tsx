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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, Trash2, FileCheck, Lock, Calendar, CheckCircle2, AlertTriangle, Clock, Send, Building2, Truck } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { DocumentRequestsSection } from "./DocumentRequestsSection";
import { RequestUpdateDialog } from "../RequestUpdateDialog";
import { DocumentDetailDialog } from "../DocumentDetailDialog";
import { UploadDocumentDialog } from "../UploadDocumentDialog";

const DOCUMENT_TYPES = [
  { value: "penetration_test", label: "Penetrasjonstest", labelEn: "Penetration Test" },
  { value: "dpia", label: "DPIA", labelEn: "DPIA" },
  { value: "soc2", label: "SOC 2", labelEn: "SOC 2" },
  { value: "iso27001", label: "ISO 27001", labelEn: "ISO 27001" },
  { value: "dpa", label: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement" },
  { value: "nda", label: "NDA / Konfidensialitetsavtale", labelEn: "NDA / Confidentiality Agreement" },
  { value: "other", label: "Annet", labelEn: "Other" },
];

const SOURCE_LABELS: Record<string, { nb: string; en: string }> = {
  manual_upload: { nb: "Manuell", en: "Manual" },
  email_inbox: { nb: "E-post", en: "Email" },
  vendor_portal: { nb: "Portal", en: "Portal" },
};

interface DocumentsTabProps {
  assetId: string;
  assetName?: string;
  vendorName?: string;
}

function getStatusBadge(status: string | null, validTo: string | null, t: any) {
  if (validTo) {
    const expiry = new Date(validTo);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive" className="text-[10px]">{t("vendorDocs.expired", "Utløpt")}</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-yellow-500/15 text-yellow-700 border-yellow-500/30 text-[10px]">{t("vendorDocs.expiringSoon", "Utløper snart")}</Badge>;
  }
  if (status === "pending_review") return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30 text-[10px]">{t("vendorDocs.pendingReview", "Til vurdering")}</Badge>;
  if (status === "superseded") return <Badge variant="secondary" className="text-[10px]">{t("vendorDocs.superseded", "Erstattet")}</Badge>;
  return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">{t("vendorDocs.current", "Gyldig")}</Badge>;
}

export function DocumentsTab({ assetId, assetName, vendorName }: DocumentsTabProps) {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const [uploading, setUploading] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [preselectedDocType, setPreselectedDocType] = useState<string | undefined>();
  const [docType, setDocType] = useState("other");
  const [notes, setNotes] = useState("");
  const [version, setVersion] = useState("v1.0");
  const [validFrom, setValidFrom] = useState("");
  const [validTo, setValidTo] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [detailDoc, setDetailDoc] = useState<any>(null);
  const dragCounterRef = useRef(0);

  const planName = subscription?.plan?.name || "starter";
  const maxDocs = planName === "starter" ? 5 : Infinity;

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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const filePath = `${assetId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("vendor-documents").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: file.name,
        file_path: filePath,
        document_type: docType,
        notes: notes || null,
        version,
        valid_from: validFrom || null,
        valid_to: validTo || null,
        source: "manual_upload",
        status: "current",
        received_at: new Date().toISOString(),
      } as any);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(t("vendorDocs.uploadSuccess", "Dokument lastet opp"));
      setNotes(""); setDocType("other"); setVersion("v1.0"); setValidFrom(""); setValidTo("");
      setShowUpload(false);
    },
    onError: () => toast.error(t("vendorDocs.uploadError", "Kunne ikke laste opp dokument")),
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("vendor-documents").remove([doc.file_path]);
      const { error } = await supabase.from("vendor_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(t("vendorDocs.deleteSuccess", "Dokument slettet"));
    },
  });

  const processFile = useCallback(async (file: File) => {
    if (atLimit) { toast.error(t("vendorDocs.limitReached", "Maks 5 dokumenter på Starter-planen.")); return; }
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
    if (!allowedTypes.includes(file.type)) { toast.error(t("vendorDocs.invalidType", "Ugyldig filtype.")); return; }
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

  const handleDragEnter = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current++; if (e.dataTransfer.items?.length) setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounterRef.current--; if (dragCounterRef.current === 0) setIsDragOver(false); }, []);
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleDrop = useCallback(async (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); dragCounterRef.current = 0; const file = e.dataTransfer.files?.[0]; if (file) await processFile(file); }, [processFile]);

  const getTypeLabel = (type: string) => {
    const dt = DOCUMENT_TYPES.find((d) => d.value === type);
    return i18n.language === "nb" ? dt?.label || type : dt?.labelEn || type;
  };

  const getSourceLabel = (source: string | null) => {
    if (!source) return "-";
    const s = SOURCE_LABELS[source];
    return s ? (i18n.language === "nb" ? s.nb : s.en) : source;
  };

  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";

  return (
    <div className="space-y-6">
      {/* Header with upload button */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-primary" />
          {t("vendorDocs.documentsTitle", "Dokumenter")} ({documents.length})
        </h3>
        <Button size="sm" onClick={() => setShowUploadDialog(true)} disabled={atLimit}>
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          {t("vendorDocs.uploadTitle", "Last opp")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">{t("vendorDocs.noDocuments", "Ingen dokumenter lastet opp ennå")}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Vendor documents */}
          {(() => {
            const vendorDocs = documents.filter((d: any) => d.source === "vendor_portal" || d.source === "email_inbox");
            const customerDocs = documents.filter((d: any) => d.source !== "vendor_portal" && d.source !== "email_inbox");

            const renderDocTable = (docs: any[], emptyMsg: string) => (
              docs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">{emptyMsg}</p>
              ) : (
                <div className="rounded-lg border overflow-x-auto">
                  <Table className="min-w-[600px]">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-[11px] font-semibold uppercase">{t("vendorDocs.name", "Navn")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase">{t("vendorDocs.documentType", "Type")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase hidden sm:table-cell">{t("vendorDocs.version", "Versjon")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase">{t("vendorDocs.validTo", "Gyldig til")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase">{t("vendorDocs.statusLabel", "Status")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase hidden md:table-cell">{t("vendorDocs.date", "Dato")}</TableHead>
                        <TableHead className="w-10" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docs.map((doc: any) => (
                        <TableRow key={doc.id} className="hover:bg-accent/30">
                          <TableCell className="py-2.5">
                            {(() => {
                              const isExpired = doc.valid_to && new Date(doc.valid_to) < new Date();
                              return (
                                <div
                                  className={`flex items-center gap-2 ${isExpired ? "cursor-pointer group" : ""}`}
                                  onClick={() => isExpired && setDetailDoc(doc)}
                                >
                                  <FileCheck className="h-4 w-4 text-primary flex-shrink-0" />
                                  <span className={`text-sm font-medium truncate max-w-[180px] ${isExpired ? "underline decoration-destructive/40 group-hover:decoration-destructive" : ""}`}>{doc.file_name}</span>
                                </div>
                              );
                            })()}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <Badge variant="secondary" className="text-[10px]">{getTypeLabel(doc.document_type)}</Badge>
                          </TableCell>
                          <TableCell className="py-2.5 text-sm text-muted-foreground hidden sm:table-cell">{doc.version || "v1.0"}</TableCell>
                          <TableCell className="py-2.5 text-sm text-muted-foreground">
                            {doc.valid_to ? new Date(doc.valid_to).toLocaleDateString(locale) : "—"}
                          </TableCell>
                          <TableCell className="py-2.5">{getStatusBadge(doc.status, doc.valid_to, t)}</TableCell>
                          <TableCell className="py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                            {new Date(doc.created_at).toLocaleDateString(locale)}
                          </TableCell>
                          <TableCell className="py-2.5">
                            <div className="flex items-center gap-0.5">
                              {doc.valid_to && new Date(doc.valid_to) < new Date() && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title={isNb ? "Be om ny versjon" : "Request new version"}
                                  onClick={() => {
                                    setPreselectedDocType(doc.document_type);
                                    setRequestDialogOpen(true);
                                  }}
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )
            );

            return (
              <>
                {/* From vendor */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Truck className="h-4 w-4 text-primary" />
                      {isNb ? "Fra leverandør" : "From vendor"}
                      <Badge variant="outline" className="text-[10px] ml-1">{vendorDocs.length}</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isNb ? "Dokumenter mottatt direkte fra leverandøren via portal eller e-post" : "Documents received directly from the vendor via portal or email"}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderDocTable(vendorDocs, isNb ? "Ingen dokumenter mottatt fra leverandøren ennå" : "No documents received from vendor yet")}
                  </CardContent>
                </Card>

                {/* From customer / internal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {isNb ? "Intern / Lastet opp av virksomheten" : "Internal / Uploaded by organization"}
                      <Badge variant="outline" className="text-[10px] ml-1">{customerDocs.length}</Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {isNb ? "Dokumenter lastet opp og vedlikeholdt av din organisasjon" : "Documents uploaded and maintained by your organization"}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderDocTable(customerDocs, isNb ? "Ingen interne dokumenter lastet opp ennå" : "No internal documents uploaded yet")}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </>
      )}

      {atLimit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm">
          <Lock className="h-4 w-4 text-yellow-600" />
          <span className="text-muted-foreground">{t("vendorDocs.upgradeForMore", "Oppgrader til Professional for ubegrenset antall dokumenter.")}</span>
        </div>
      )}

      {/* Upload section - collapsible */}
      {showUpload && (
        <Card>
          <CardHeader><CardTitle className="text-base">{t("vendorDocs.uploadTitle", "Last opp dokumentasjon")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t("vendorDocs.documentType", "Dokumenttype")}</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{DOCUMENT_TYPES.map((dt) => <SelectItem key={dt.value} value={dt.value}>{i18n.language === "nb" ? dt.label : dt.labelEn}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("vendorDocs.version", "Versjon")}</Label>
                <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v1.0" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("vendorDocs.validFrom", "Gyldig fra")}</Label>
                <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t("vendorDocs.validTo", "Gyldig til")}</Label>
                <Input type="date" value={validTo} onChange={(e) => setValidTo(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("vendorDocs.notes", "Notater (valgfritt)")}</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t("vendorDocs.notesPlaceholder", "F.eks. utført av Mnemonic, Q1 2025")} rows={1} />
            </div>

            <div
              onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed transition-all cursor-pointer ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/30"}`}
              onClick={() => { if (!uploading) document.getElementById(`file-input-${assetId}`)?.click(); }}
            >
              <Input id={`file-input-${assetId}`} type="file" className="hidden" accept=".pdf,.doc,.docx,.xlsx,.xls,.pptx" onChange={handleFileSelect} disabled={uploading} />
              <Upload className={`h-5 w-5 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
              <p className="text-sm">{uploading ? t("vendorDocs.uploading", "Laster opp...") : t("vendorDocs.dragOrClick", "Dra og slipp fil her, eller klikk for å velge")}</p>
              <p className="text-xs text-muted-foreground">{t("vendorDocs.acceptedFormats", "PDF, Word, Excel, PowerPoint")}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document requests & reminders section */}
      <DocumentRequestsSection assetId={assetId} />

      <DocumentDetailDialog
        open={!!detailDoc}
        onOpenChange={(val) => { if (!val) setDetailDoc(null); }}
        document={detailDoc}
        onRequestUpdate={(docType) => {
          setPreselectedDocType(docType);
          setRequestDialogOpen(true);
        }}
      />

      <RequestUpdateDialog
        open={requestDialogOpen}
        onOpenChange={(val) => {
          setRequestDialogOpen(val);
          if (!val) setPreselectedDocType(undefined);
        }}
        assetId={assetId}
        assetName={assetName || ""}
        vendorName={vendorName}
        preselectedType={preselectedDocType}
      />

      <UploadDocumentDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        assetId={assetId}
      />
    </div>
  );
}
