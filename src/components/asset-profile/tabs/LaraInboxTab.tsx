import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, X, Mail, Sparkles, FileText, Eye, Download, Shield, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Props {
  assetId: string;
  assetName: string;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

export function LaraInboxTab({ assetId, assetName }: Props) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  const { data: inboxItems = [], isLoading } = useQuery({
    queryKey: ["lara-inbox", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lara_inbox")
        .select("*")
        .eq("matched_asset_id", assetId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch asset info and existing vendor docs for TPRM impact calculation
  const { data: assetInfo } = useQuery({
    queryKey: ["asset-tprm-lara", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("criticality, risk_level, next_review_date")
        .eq("id", assetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: vendorDocs = [] } = useQuery({
    queryKey: ["vendor-documents-tprm-lara", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("document_type")
        .eq("asset_id", assetId);
      if (error) throw error;
      return data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      // Move to vendor_documents
      await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: item.file_name,
        file_path: item.file_path || "",
        document_type: item.matched_document_type || "other",
        source: "email_inbox",
        status: "current",
        received_at: item.received_at,
        notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
      } as any);
      // Update inbox status
      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
    },
    onSuccess: (_data, item) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tprm-lara", assetId] });

      // Calculate TPRM impact
      const existingDocTypes = vendorDocs.map((d: any) => d.document_type).filter(Boolean);
      const hasAudit = !!assetInfo?.next_review_date;
      const docType = item.matched_document_type || "other";
      const tprmImpact = calculateTPRMImpact(
        existingDocTypes,
        hasAudit,
        docType,
        assetInfo?.criticality,
        assetInfo?.risk_level,
      );

      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: docType,
        assetId,
        assetName,
        isIncident: false,
        tprmImpact,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await supabase.from("lara_inbox").update({ status: "rejected", processed_at: new Date().toISOString() } as any).eq("id", itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      toast.success("Forslag avvist");
    },
  });

  const pendingItems = inboxItems.filter((i: any) => i.status === "new" || i.status === "auto_matched");
  const processedItems = inboxItems.filter((i: any) => i.status === "manually_assigned" || i.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Pending items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <img src={laraButterfly} alt="Lara" className="h-5 w-5" />
            Lara Innboks
            {pendingItems.length > 0 && (
              <Badge className="bg-primary/15 text-primary border-primary/30 text-[13px]">{pendingItems.length} nye</Badge>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Dokumenter mottatt på e-post som Lara har analysert og foreslått matching for.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />)}</div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ingen ventende dokumenter i innboksen</p>
            </div>
          ) : (
            pendingItems.map((item: any) => (
              <div key={item.id} className="p-4 rounded-lg border border-border bg-card hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() => setPreviewItem(item)}
                      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
                      aria-label="Vis dokument"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                    </button>
                    <div className="min-w-0">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="text-sm font-medium truncate text-left hover:text-primary hover:underline transition-colors"
                      >
                        {item.file_name || item.subject}
                      </button>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Fra: {item.sender_name || item.sender_email} · {new Date(item.received_at).toLocaleDateString(locale)}
                      </p>
                      {item.subject && <p className="text-xs text-muted-foreground mt-0.5">Emne: {item.subject}</p>}

                      {/* Lara suggestion */}
                      <div className="flex items-center gap-2 mt-2 p-2 rounded-md bg-primary/5 border border-primary/10">
                        <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <p className="text-xs">
                          <span className="font-medium">Lara foreslår:</span> Koble til <span className="font-semibold">{assetName}</span> som{" "}
                          <Badge variant="secondary" className="text-[13px] mx-0.5">{DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type}</Badge>
                        </p>
                        {item.confidence_score && (
                          <Badge className="bg-status-closed/15 text-status-closed border-status-closed/30 text-[13px] ml-auto flex-shrink-0">
                            {Math.round(item.confidence_score * 100)}% sikker
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setPreviewItem(item)}>
                      <Eye className="h-3.5 w-3.5 mr-1" />
                      Vis
                    </Button>
                    <Button size="sm" className="h-8 text-xs" onClick={() => approveMutation.mutate(item)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Godkjenn
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => rejectMutation.mutate(item.id)}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Avvis
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Processed items */}
      {processedItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Behandlede ({processedItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {processedItems.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-border opacity-60">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{item.file_name || item.subject}</p>
                  <p className="text-[13px] text-muted-foreground">{item.sender_name || item.sender_email}</p>
                </div>
                <Badge variant={item.status === "manually_assigned" ? "default" : "secondary"} className="text-[13px] ml-auto">
                  {item.status === "manually_assigned" ? "Godkjent" : "Avvist"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />

      {/* Document preview dialog */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          {previewItem && (
            <>
              <DialogHeader className="px-6 pt-6 pb-3 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <DialogTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-primary" />
                      {previewItem.file_name || previewItem.subject}
                    </DialogTitle>
                    <DialogDescription className="text-xs mt-1">
                      Fra {previewItem.sender_name || previewItem.sender_email} · Mottatt {new Date(previewItem.received_at).toLocaleDateString(locale)}
                    </DialogDescription>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 mr-8" onClick={() => toast.success("Demo: Last ned dokument")}>
                    <Download className="h-3.5 w-3.5" /> Last ned
                  </Button>
                </div>
              </DialogHeader>

              {/* Lara analysis banner */}
              <div className="px-6 py-3 bg-primary/5 border-b border-primary/10">
                <div className="flex items-center gap-2.5">
                  <img src={laraButterfly} alt="Lara" className="h-5 w-5" />
                  <div className="flex-1 text-xs">
                    <span className="font-medium">Lara har analysert dokumentet:</span>{" "}
                    Identifisert som <Badge variant="secondary" className="text-[13px] mx-0.5">{DOC_TYPE_LABELS[previewItem.matched_document_type] || previewItem.matched_document_type}</Badge>
                    for <span className="font-semibold">{assetName}</span>
                  </div>
                  {previewItem.confidence_score && (
                    <Badge className="bg-status-closed/15 text-status-closed border-status-closed/30 text-[13px]">
                      {Math.round(previewItem.confidence_score * 100)}% sikker
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mock document preview */}
              <ScrollArea className="max-h-[55vh]">
                <div className="px-10 py-10 bg-muted/30">
                  <div className="bg-white shadow-sm border border-border rounded-md p-10 mx-auto max-w-2xl text-foreground">
                    <div className="flex items-center justify-between pb-6 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                          <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{previewItem.sender_name || "Leverandør"}</p>
                          <p className="text-[11px] text-muted-foreground">{previewItem.sender_email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px]">CONFIDENTIAL</Badge>
                    </div>

                    <div className="mt-8 space-y-1">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {DOC_TYPE_LABELS[previewItem.matched_document_type] || "Dokument"}
                      </p>
                      <h1 className="text-2xl font-bold tracking-tight">
                        {previewItem.file_name?.replace(/\.[^.]+$/, "") || previewItem.subject}
                      </h1>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Utstedt</p>
                          <p className="font-medium">{new Date(previewItem.received_at).toLocaleDateString(locale)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Utstedt for</p>
                          <p className="font-medium">{assetName}</p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4 text-sm leading-relaxed">
                      <h2 className="text-base font-semibold">1. Sammendrag</h2>
                      <p className="text-muted-foreground">
                        Dette dokumentet bekrefter at <span className="font-medium text-foreground">{previewItem.sender_name || "leverandøren"}</span> oppfyller
                        de relevante kravene knyttet til informasjonssikkerhet, personvern og operasjonell motstandsdyktighet.
                        Dokumentet er utarbeidet i samsvar med gjeldende standarder og inngår som del av leverandørens kontinuerlige etterlevelse.
                      </p>

                      <h2 className="text-base font-semibold">2. Omfang</h2>
                      <p className="text-muted-foreground">
                        Vurderingen omfatter alle tjenester levert til kunden, inkludert databehandling, drift, tilgangskontroll og
                        hendelseshåndtering. Kontroller er testet i perioden og funnet å fungere effektivt.
                      </p>

                      <h2 className="text-base font-semibold">3. Konklusjon</h2>
                      <p className="text-muted-foreground">
                        Basert på utført gjennomgang er det vår vurdering at kontrollene er hensiktsmessig utformet og operativt effektive.
                        Det er ikke avdekket vesentlige avvik som krever umiddelbar oppfølging.
                      </p>

                      <div className="mt-8 pt-6 border-t border-border flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Signert av</p>
                          <p className="font-serif italic text-lg mt-1">{previewItem.sender_name || "Compliance Officer"}</p>
                          <p className="text-[11px] text-muted-foreground">{previewItem.sender_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Dokument-ID</p>
                          <p className="text-xs font-mono">{previewItem.id?.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-[10px] text-muted-foreground mt-10 pt-4 border-t border-border">
                      — Side 1 av 1 — Demo-forhåndsvisning —
                    </p>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer actions */}
              <div className="px-6 py-3 border-t bg-background flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Godkjenn for å koble dokumentet til {assetName}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { rejectMutation.mutate(previewItem.id); setPreviewItem(null); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Avvis
                  </Button>
                  <Button size="sm" onClick={() => { approveMutation.mutate(previewItem); setPreviewItem(null); }}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Godkjenn og koble til
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
