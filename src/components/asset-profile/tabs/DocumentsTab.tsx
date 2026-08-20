import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, FileText, Trash2, Lock, Send, Mail, MoreHorizontal, CheckCircle2, Clock, Archive } from "lucide-react";
import { DocumentActionButtons } from "@/components/agents/DocumentActionButtons";
import { DocumentSourceIcon } from "../DocumentSourceIcon";
import {
  computeDocCoverage,
  docSourceLabel,
  resolveDocSource,
  resolveDocOrigin,
  docOriginLabel,
  DOC_SOURCE_ORDER,
  type DocSourceKey,
  type DocOrigin,
} from "@/lib/vendorDocumentSource";


import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DocumentSharingPopover } from "../DocumentSharingPopover";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { RequestUpdateDialog } from "../RequestUpdateDialog";
import { DocumentDetailDialog } from "../DocumentDetailDialog";
import { UploadDocumentDialog } from "../UploadDocumentDialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


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
  hideUploadButton?: boolean;
  onUploadTriggerReady?: (trigger: () => void) => void;
  inboxItems?: any[];
  onApproveInbox?: (item: any) => void;
  onRejectInbox?: (itemId: string) => void;
  onPreviewInbox?: (item: any) => void;
}


function getStatusBadge(status: string | null, validTo: string | null, isNb: boolean) {
  if (status === "expired" || (validTo && new Date(validTo) < new Date())) {
    return <Badge variant="destructive" className="text-[13px]">{isNb ? "Utløpt" : "Expired"}</Badge>;
  }
  if (validTo) {
    const daysLeft = Math.ceil((new Date(validTo).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 30) return <Badge className="bg-warning/15 text-warning border-warning/30 text-[13px]">{isNb ? "Utløper snart" : "Expiring soon"}</Badge>;
  }
  if (status === "pending_review") return <Badge variant="secondary" className="text-[13px]">{isNb ? "Til vurdering" : "Pending review"}</Badge>;
  if (status === "superseded") return <Badge variant="secondary" className="text-[13px]">{isNb ? "Erstattet" : "Superseded"}</Badge>;
  if (status === "rejected") return <Badge variant="secondary" className="text-[13px]">{isNb ? "Avvist" : "Rejected"}</Badge>;
  // "Gyldig" vises ikke — det er standardtilstand
  return null;
}

export function DocumentsTab({ assetId, assetName, vendorName, hideUploadButton, onUploadTriggerReady }: DocumentsTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [preselectedDocType, setPreselectedDocType] = useState<string | undefined>();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [detailDoc, setDetailDoc] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [originFilter, setOriginFilter] = useState<DocOrigin | "all">("all");

  const { data: requests = [] } = useQuery({
    queryKey: ["vendor-document-requests", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_document_requests")
        .select("*")
        .eq("asset_id", assetId)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });


  useEffect(() => {
    onUploadTriggerReady?.(() => setShowUploadDialog(true));
  }, [onUploadTriggerReady]);


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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("vendor_documents").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      toast.success(isNb ? "Status oppdatert" : "Status updated");
    },
  });

  const locale = isNb ? "nb-NO" : "en-US";

  const getTypeLabel = (type: string) => {
    const dt = DOCUMENT_TYPES.find((d) => d.value === type);
    return isNb ? dt?.label || type : dt?.labelEn || type;
  };

  const getExpiryDate = (document: { expires_at?: string | null; valid_to?: string | null }) =>
    document.expires_at || document.valid_to || null;

  // Auto-merk utgåtte dokumenter som "expired" – avledet fra utløpsdato, ingen cron
  useEffect(() => {
    const stale = (documents as any[]).filter(
      (d) => {
        const expiry = getExpiryDate(d);
        return d.status === "current" && expiry && new Date(expiry) < new Date();
      },
    );
    if (stale.length) {
      supabase
        .from("vendor_documents")
        .update({ status: "expired" } as any)
        .in("id", stale.map((d) => d.id))
        .then(() => queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  // Filtrer historikk vekk fra hovedvisningen med mindre brukeren ber om det
  const isHistorical = (d: any) => d.status === "superseded" || d.status === "expired" || d.status === "rejected";
  const visibleDocs = showHistory ? documents : documents.filter((d: any) => !isHistorical(d));
  const docsById: Record<string, any> = Object.fromEntries((documents as any[]).map((d) => [d.id, d]));

  const coverage = computeDocCoverage(documents as any[]);
  const filteredDocs =
    originFilter === "all"
      ? visibleDocs
      : (visibleDocs as any[]).filter((d: any) => resolveDocOrigin(d.source) === originFilter);
  const originCounts = {
    internal: (visibleDocs as any[]).filter((d: any) => resolveDocOrigin(d.source) === "internal").length,
    external: (visibleDocs as any[]).filter((d: any) => resolveDocOrigin(d.source) === "external").length,
  };
  const expiredCount = (documents as any[]).filter((d: any) => {
    const expiry = getExpiryDate(d);
    return expiry && new Date(expiry) < new Date() && d.status !== "superseded";
  }).length;
  const historyCount = (documents as any[]).filter(isHistorical).length;
  const pendingRequests = (requests as any[]).filter((r: any) => r.status !== "received");
  const showRequestRows = originFilter === "all" || originFilter === "external";



  const renderDocTable = (docs: any[], emptyMsg: string, reqs: any[] = []) => {
    if (docs.length === 0 && reqs.length === 0) {
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
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Dokument" : "Document"}</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Type" : "Type"}</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Opprinnelse" : "Origin"}</TableHead>

                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9 hidden sm:table-cell">{isNb ? "Gyldig til" : "Valid to"}</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Status" : "Status"}</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground tracking-wide h-9">{isNb ? "Tilgang" : "Access"}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc: any, idx: number) => {
                const expiry = getExpiryDate(doc);
                const isExpired = expiry && new Date(expiry) < new Date();
                const replacement = doc.superseded_by ? docsById[doc.superseded_by] : null;
                const isHistorical = doc.status === "superseded" || doc.status === "expired" || doc.status === "rejected";
                return (
                  <TableRow
                    key={doc.id}
                    className={`group hover:bg-muted/30 transition-colors ${isHistorical ? "opacity-60" : ""} ${idx === docs.length - 1 ? "border-b-0" : "border-b border-border/60"}`}
                  >
                    <TableCell className="py-3">
                      <div
                        className={`flex items-center gap-2.5 ${isExpired ? "cursor-pointer" : ""}`}
                        onClick={() => isExpired && setDetailDoc(doc)}
                      >
                        <DocumentSourceIcon source={resolveDocSource(doc.source)} isNb={isNb} />
                        <div className="min-w-0">
                          <span className={`text-sm font-medium truncate block max-w-[220px] ${isExpired ? "text-destructive" : "text-foreground"}`}>
                            {doc.file_name}
                          </span>

                          <span className="text-[12px] text-muted-foreground hidden md:block">
                            {doc.version || "v1.0"} · {new Date(doc.created_at).toLocaleDateString(locale)}
                            {replacement && (
                              <> · {isNb ? "erstattet av" : "replaced by"} <span className="text-foreground/80">{replacement.file_name}</span></>
                            )}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{getTypeLabel(doc.document_type)}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {docOriginLabel(resolveDocOrigin(doc.source), isNb)}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {expiry ? new Date(expiry).toLocaleDateString(locale) : "—"}
                    </TableCell>
                    <TableCell className="py-3">{getStatusBadge(doc.status, expiry, isNb)}</TableCell>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            aria-label={isNb ? "Endre dokument" : "Edit document"}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs">
                            {isNb ? "Sett status" : "Set status"}
                          </DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: doc.id, status: "approved" })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-status-closed" />
                            {isNb ? "Godkjent" : "Approved"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: doc.id, status: "pending_review" })}
                          >
                            <Clock className="h-3.5 w-3.5 mr-2 text-warning" />
                            {isNb ? "Til vurdering" : "Pending review"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: doc.id, status: "superseded" })}
                          >
                            <Archive className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                            {isNb ? "Erstattet" : "Superseded"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate({ id: doc.id, file_path: doc.file_path })}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            {isNb ? "Slett dokument" : "Delete document"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Etterspurt dokumentasjon – venter på leverandøren */}
              {reqs.map((req: any) => {
                const daysLeft = req.due_date
                  ? Math.ceil((new Date(req.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;
                const overdue = daysLeft !== null && daysLeft < 0;
                return (
                  <TableRow key={`req-${req.id}`} className="border-b border-border/60 bg-muted/20">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-medium text-muted-foreground">
                            {isNb ? "Etterspurt" : "Requested"}: {getTypeLabel(req.document_type)}
                          </span>
                          <span className="hidden text-[12px] text-muted-foreground md:block">
                            {req.due_date
                              ? `${isNb ? "Frist" : "Due"} ${new Date(req.due_date).toLocaleDateString(locale)}`
                              : isNb ? "Ingen frist" : "No due date"}
                            {req.reminder_count > 0 && ` · ${req.reminder_count} ${isNb ? "purringer" : "reminders"}`}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{getTypeLabel(req.document_type)}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="text-[11px] font-normal">
                        {docOriginLabel("external", isNb)}
                      </Badge>
                    </TableCell>

                    <TableCell className="hidden py-3 text-xs text-muted-foreground sm:table-cell">
                      {req.due_date ? new Date(req.due_date).toLocaleDateString(locale) : "—"}
                    </TableCell>
                    <TableCell className="py-3">
                      {overdue ? (
                        <Badge variant="destructive" className="text-[12px]">
                          {isNb ? "Over frist" : "Overdue"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[12px]">
                          {isNb ? "Venter" : "Waiting"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-xs text-muted-foreground">{isNb ? "Leverandør" : "Vendor"}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => { setPreselectedDocType(req.document_type); setRequestDialogOpen(true); }}
                      >
                        <Send className="mr-1 h-3 w-3" />
                        {isNb ? "Purr" : "Remind"}
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

  const uploadButton = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => setShowUploadDialog(true)}
        disabled={atLimit}
        className="h-8 gap-1.5 text-xs"
      >
        <Upload className="h-3.5 w-3.5" />
        {isNb ? "Last opp" : "Upload"}
      </Button>
      <DocumentActionButtons showUpload={false} />
    </div>
  );


  return (
    <div className="space-y-5">
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
      ) : documents.length === 0 && pendingRequests.length === 0 ? (
        hideUploadButton ? (
          <p className="text-xs text-muted-foreground">
            {isNb ? "Ingen dokumenter lastet opp ennå." : "No documents uploaded yet."}
          </p>
        ) : (
          <div className="flex items-center justify-end">{uploadButton}</div>
        )
      ) : (
        <div className="w-full space-y-4">
          {/* Dekning – kompakt linje */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground">
              {coverage.total} {isNb ? "dokumenter" : "documents"}
            </span>
            <span>·</span>
            <span>{coverage.valid} {isNb ? "gyldige" : "valid"}</span>
            {coverage.expiring > 0 && (
              <>
                <span>·</span>
                <span className="text-warning">{coverage.expiring} {isNb ? "utløper snart" : "expiring soon"}</span>
              </>
            )}
            {coverage.expired > 0 && (
              <>
                <span>·</span>
                <span className="text-destructive">{coverage.expired} {isNb ? "utløpt" : "expired"}</span>
              </>
            )}
            {pendingRequests.length > 0 && (
              <>
                <span>·</span>
                <span>{pendingRequests.length} {isNb ? "etterspurt" : "requested"}</span>
              </>
            )}
          </div>

          {/* Intern / ekstern */}
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border">
            <div className="flex flex-wrap items-center gap-5">
              {(["all", "internal", "external"] as const).map((key) => {
                const count =
                  key === "all" ? visibleDocs.length : originCounts[key as DocOrigin];
                const active = originFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOriginFilter(key as DocOrigin | "all")}
                    className={`-mb-px flex items-center gap-1.5 pb-2.5 text-xs transition-colors ${
                      active
                        ? "border-b-2 border-foreground font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {key === "all"
                      ? isNb ? "Alle" : "All"
                      : docOriginLabel(key as DocOrigin, isNb) + (isNb ? "e" : "")}
                    <span className="text-muted-foreground/70">{count}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 pb-2">
              {historyCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Switch id="show-history" checked={showHistory} onCheckedChange={setShowHistory} className="scale-75" />
                  <Label htmlFor="show-history" className="text-[12px] text-muted-foreground cursor-pointer">
                    {isNb ? `Vis historikk (${historyCount})` : `Show history (${historyCount})`}
                  </Label>
                </div>
              )}
              {!hideUploadButton && uploadButton}
            </div>
          </div>

          {renderDocTable(
            filteredDocs,
            isNb ? "Ingen dokumenter fra denne kilden ennå" : "No documents from this source yet",
            showRequestRows ? pendingRequests : [],
          )}
        </div>
      )}


      {atLimit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm">
          <Lock className="h-4 w-4 text-warning" />
          <span className="text-xs text-muted-foreground">{isNb ? "Oppgrader for ubegrenset antall dokumenter." : "Upgrade for unlimited documents."}</span>
        </div>
      )}

      {/* Dialogs */}


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
