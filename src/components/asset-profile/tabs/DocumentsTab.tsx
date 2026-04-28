import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, FileText, Trash2, FileCheck, Lock, Send, Mail, Globe, EyeOff, HelpCircle } from "lucide-react";
import { DocumentSharingPopover } from "../DocumentSharingPopover";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { DocumentRequestsSection } from "./DocumentRequestsSection";
import { RequestUpdateDialog } from "../RequestUpdateDialog";
import { DocumentDetailDialog } from "../DocumentDetailDialog";
import { UploadDocumentDialog } from "../UploadDocumentDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DOCUMENT_TYPES = [
  { value: "penetration_test", label: "Penetrasjonstest", labelEn: "Penetration Test" },
  { value: "dpia", label: "DPIA", labelEn: "DPIA" },
  { value: "soc2", label: "SOC 2", labelEn: "SOC 2" },
  { value: "iso27001", label: "ISO 27001", labelEn: "ISO 27001" },
  { value: "dpa", label: "DPA / Databehandleravtale", labelEn: "DPA / Data Processing Agreement" },
  { value: "contract", label: "Kontrakt", labelEn: "Contract" },
  { value: "nda", label: "NDA / Konfidensialitetsavtale", labelEn: "NDA / Confidentiality Agreement" },
  { value: "other", label: "Annet", labelEn: "Other" },
];

interface DocumentsTabProps {
  assetId: string;
  assetName?: string;
  vendorName?: string;
}

function getStatusBadge(status: string | null, validTo: string | null, isNb: boolean) {
  if (validTo) {
    const expiry = new Date(validTo);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return <Badge variant="destructive" className="text-[13px]">{isNb ? "Utløpt" : "Expired"}</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px]">{isNb ? "Utløper snart" : "Expiring soon"}</Badge>;
  }
  if (status === "pending_review") return <Badge variant="secondary" className="text-[13px]">{isNb ? "Til vurdering" : "Pending review"}</Badge>;
  if (status === "superseded") return <Badge variant="secondary" className="text-[13px]">{isNb ? "Erstattet" : "Superseded"}</Badge>;
  return <Badge className="bg-status-closed/15 text-status-closed dark:text-status-closed border-status-closed/30 text-[13px]">{isNb ? "Gyldig" : "Valid"}</Badge>;
}

export function DocumentsTab({ assetId, assetName, vendorName }: DocumentsTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [preselectedDocType, setPreselectedDocType] = useState<string | undefined>();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [detailDoc, setDetailDoc] = useState<any>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async (doc: { id: string; file_path: string }) => {
      await supabase.storage.from("vendor-documents").remove([doc.file_path]);
      const { error } = await supabase.from("vendor_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? "Dokument slettet" : "Document deleted");
    },
  });

  const locale = isNb ? "nb-NO" : "en-US";

  const getTypeLabel = (type: string) => {
    const dt = DOCUMENT_TYPES.find((d) => d.value === type);
    return isNb ? dt?.label || type : dt?.labelEn || type;
  };

  const vendorDocs = documents.filter((d: any) => d.source === "vendor_portal" || d.source === "email_inbox");
  const internalDocs = documents.filter((d: any) => d.source !== "vendor_portal" && d.source !== "email_inbox");
  const expiredCount = documents.filter((d: any) => d.valid_to && new Date(d.valid_to) < new Date()).length;

  const renderDocTable = (docs: any[], emptyMsg: string) => {
    if (docs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">{emptyMsg}</p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[580px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="text-[11px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Dokument" : "Document"}</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Type" : "Type"}</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground tracking-wide h-9 hidden sm:table-cell">{isNb ? "Gyldig til" : "Valid to"}</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Status" : "Status"}</TableHead>
                <TableHead className="text-[11px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Tilgang" : "Access"}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc: any, idx: number) => {
                const isExpired = doc.valid_to && new Date(doc.valid_to) < new Date();
                return (
                  <TableRow
                    key={doc.id}
                    className={`group hover:bg-muted/30 transition-colors ${idx === docs.length - 1 ? "border-b-0" : "border-b border-border/60"}`}
                  >
                    <TableCell className="py-3">
                      <div
                        className={`flex items-center gap-2.5 ${isExpired ? "cursor-pointer" : ""}`}
                        onClick={() => isExpired && setDetailDoc(doc)}
                      >
                        <div className="h-7 w-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
                          <FileCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <span className={`text-sm font-medium truncate block max-w-[220px] ${isExpired ? "text-destructive" : "text-foreground"}`}>
                            {doc.file_name}
                          </span>
                          <span className="text-[11px] text-muted-foreground hidden md:block">
                            {doc.version || "v1.0"} · {new Date(doc.created_at).toLocaleDateString(locale)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{getTypeLabel(doc.document_type)}</span>
                    </TableCell>
                    <TableCell className="py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {doc.valid_to ? new Date(doc.valid_to).toLocaleDateString(locale) : "—"}
                    </TableCell>
                    <TableCell className="py-3">{getStatusBadge(doc.status, doc.valid_to, isNb)}</TableCell>
                    <TableCell className="py-3">
                      <DocumentSharingPopover
                        docId={doc.id}
                        assetId={assetId}
                        documentType={doc.document_type}
                        visibility={doc.visibility || "private"}
                        sharedWithEmails={(doc as any).shared_with_emails || []}
                        isNb={isNb}
                      />
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-end gap-3">
        <Button size="sm" onClick={() => setShowUploadDialog(true)} disabled={atLimit} className="h-8 gap-1.5 text-xs">
          <Upload className="h-3.5 w-3.5" />
          {isNb ? "Last opp" : "Upload"}
        </Button>
      </div>

      {/* Expired alert */}
      {expiredCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-destructive/5 border border-destructive/15">
          <p className="text-xs text-destructive font-medium">
            {isNb
              ? `${expiredCount} dokument${expiredCount > 1 ? "er" : ""} har utløpt og bør fornyes`
              : `${expiredCount} document${expiredCount > 1 ? "s" : ""} expired and should be renewed`}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 border-destructive/30 text-destructive hover:bg-destructive/10 shrink-0"
            onClick={() => setRequestDialogOpen(true)}
          >
            <Mail className="h-3 w-3" />
            {isNb ? "Be om fornyelse" : "Request renewal"}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}</div>
      ) : documents.length === 0 ? null : (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="h-auto bg-transparent p-0 gap-5 border-b border-border w-full justify-start rounded-none">
            <TabsTrigger
              value="all"
              className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground -mb-px"
            >
              {isNb ? "Alle" : "All"}
              <span className="text-muted-foreground/70">{documents.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="internal"
              className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground -mb-px"
            >
              {isNb ? "Interne" : "Internal"}
              <span className="text-muted-foreground/70">{internalDocs.length}</span>
            </TabsTrigger>
            <TabsTrigger
              value="vendor"
              className="text-xs gap-1.5 px-0 pb-2.5 pt-0 rounded-none bg-transparent text-muted-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground -mb-px"
            >
              {isNb ? "Fra leverandør" : "From vendor"}
              <span className="text-muted-foreground/70">{vendorDocs.length}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderDocTable(documents, isNb ? "Ingen dokumenter" : "No documents")}
          </TabsContent>
          <TabsContent value="internal" className="mt-4">
            {renderDocTable(internalDocs, isNb ? "Ingen interne dokumenter lastet opp ennå" : "No internal documents uploaded yet")}
          </TabsContent>
          <TabsContent value="vendor" className="mt-4">
            {renderDocTable(vendorDocs, isNb ? "Ingen dokumenter mottatt fra leverandøren ennå" : "No documents received from vendor yet")}
          </TabsContent>
        </Tabs>
      )}

      {atLimit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <Lock className="h-4 w-4 text-warning" />
          <span className="text-xs text-muted-foreground">{isNb ? "Oppgrader for ubegrenset antall dokumenter." : "Upgrade for unlimited documents."}</span>
        </div>
      )}

      {/* Requests section */}
      <DocumentRequestsSection assetId={assetId} />

      {/* Dialogs */}
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
