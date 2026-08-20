import { useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentsTab } from "./DocumentsTab";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { FileText, CheckCircle2, X, Download, Shield, Calendar, Building2 } from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";

const DOC_TYPE_LABELS: Record<string, string> = {
  penetration_test: "Penetrasjonstest",
  dpa: "DPA / Databehandleravtale",
  iso27001: "ISO 27001-sertifikat",
  soc2: "SOC 2-rapport",
  dpia: "DPIA",
  nda: "NDA",
  other: "Dokument",
};

function buildAnalysisSummary(docType: string) {
  const presets: Record<string, any> = {
    iso27001: {
      confirms: ["Gyldig ISO 27001-sertifikat", "Dekker hele tjenesten", "Audit utført"],
      affects: ["Informasjonssikkerhet", "Styring og kontroll"],
      score_impact: 10,
      valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      note: "Bekrefter etablert ISMS hos leverandør.",
    },
    soc2: {
      confirms: ["Ren SOC 2-rapport", "Ingen kritiske avvik"],
      affects: ["Driftssikkerhet", "Tredjepartsstyring"],
      score_impact: 9,
      valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
      note: "Erstatter forrige rapport.",
    },
    dpa: {
      confirms: ["Behandlingsgrunnlag", "Lagringstid", "Registrertes rettigheter"],
      affects: ["Personvern", "Datahåndtering"],
      score_impact: 7,
      note: "GDPR art. 28-krav er dekket.",
    },
    dpia: {
      confirms: ["Risikovurdering for behandling utført", "Tiltak identifisert"],
      affects: ["Personvern"],
      score_impact: 6,
    },
    penetration_test: {
      confirms: ["Pentest gjennomført", "Funn lukket"],
      affects: ["Teknisk sikkerhet"],
      score_impact: 8,
    },
    nda: {
      confirms: ["Signert konfidensialitetsavtale"],
      affects: ["Juridisk"],
      score_impact: 3,
    },
  };
  return presets[docType] || {
    confirms: ["Dokument mottatt og lest"],
    affects: ["Generell etterlevelse"],
    score_impact: 4,
  };
}

interface VendorEvidenceTabProps {
  assetId: string;
  assetName: string;
  vendorName?: string;
}

export const VendorEvidenceTab = ({ assetId, assetName, vendorName }: VendorEvidenceTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const locale = isNb ? "nb-NO" : "en-US";
  const queryClient = useQueryClient();
  const uploadTriggerRef = useRef<(() => void) | null>(null);
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const notifiedRef = useRef<Set<string>>(new Set());

  const { data: inboxItems = [] } = useQuery({
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
    refetchInterval: 15000,
  });

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

  useEffect(() => {
    if (!inboxItems.length) return;
    const now = Date.now();
    const items = inboxItems as any[];

    const toAnalyzing = items.filter((i) =>
      i.analysis_status === "pending" &&
      now - new Date(i.received_at).getTime() > 30_000,
    );
    const toAnalyzed = items.filter((i) =>
      i.analysis_status === "analyzing" &&
      now - new Date(i.received_at).getTime() > 75_000,
    );

    const run = async () => {
      if (toAnalyzing.length) {
        await supabase.from("lara_inbox")
          .update({ analysis_status: "analyzing" } as any)
          .in("id", toAnalyzing.map((i) => i.id));
      }
      if (toAnalyzed.length) {
        for (const item of toAnalyzed) {
          const docType = item.matched_document_type || "other";
          const summary = buildAnalysisSummary(docType);
          await supabase.from("lara_inbox")
            .update({
              analysis_status: "analyzed",
              analyzed_at: new Date().toISOString(),
              analysis_summary: summary,
            } as any)
            .eq("id", item.id);
          if (!notifiedRef.current.has(item.id)) {
            notifiedRef.current.add(item.id);
            toast.success(`Lara har analysert ${item.file_name || item.subject}`, {
              description: "Klar for din godkjenning – beriker trust score når godkjent.",
            });
          }
        }
      }
      if (toAnalyzing.length || toAnalyzed.length) {
        queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxItems]);

  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      const docType = item.matched_document_type || "other";
      const summary = item.analysis_summary || {};
      const { data: inserted } = await supabase
        .from("vendor_documents")
        .insert({
          asset_id: assetId,
          file_name: item.file_name,
          file_path: item.file_path || "",
          document_type: docType,
          source: "email_inbox",
          status: "current",
          received_at: item.received_at,
          valid_to: summary.valid_until ? new Date(summary.valid_until).toISOString().slice(0, 10) : null,
          notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
        } as any)
        .select("id")
        .single();

      const { supersedePreviousDocuments } = await import("@/lib/documentStatus");
      const replacedIds = await supersedePreviousDocuments(supabase, {
        assetId,
        documentType: docType,
        newDocumentId: inserted?.id ?? null,
      });

      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
      return { replacedCount: replacedIds.length };
    },
    onSuccess: (data, item) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents", assetId] });
      queryClient.invalidateQueries({ queryKey: ["vendor-documents-tprm-lara", assetId] });

      const existingDocTypes = vendorDocs.map((d: any) => d.document_type).filter(Boolean);
      const hasAudit = !!assetInfo?.next_review_date;
      const docType = item.matched_document_type || "other";
      const tprmImpact = calculateTPRMImpact(
        existingDocTypes, hasAudit, docType,
        assetInfo?.criticality, assetInfo?.risk_level,
      );
      if (data?.replacedCount) {
        toast.info(`Erstattet ${data.replacedCount} tidligere ${DOC_TYPE_LABELS[docType] || "dokument"}`, {
          description: "Det forrige dokumentet er flyttet til historikken.",
        });
      }
      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: docType,
        assetId, assetName, isIncident: false, tprmImpact,
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

  return (
    <div className="space-y-6">
      <DocumentsTab
        assetId={assetId}
        assetName={assetName}
        vendorName={vendorName}
        onUploadTriggerReady={(trigger) => { uploadTriggerRef.current = trigger; }}
        inboxItems={inboxItems}
        onApproveInbox={(item) => approveMutation.mutate(item)}
        onRejectInbox={(itemId) => rejectMutation.mutate(itemId)}
        onPreviewInbox={(item) => setPreviewItem(item)}
      />

      <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />

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
                          <p className="text-[12px] text-muted-foreground">{previewItem.sender_email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[12px]">CONFIDENTIAL</Badge>
                    </div>

                    <div className="mt-8 space-y-1">
                      <p className="text-[12px] uppercase tracking-wider text-muted-foreground">
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
                          <p className="text-[12px] text-muted-foreground">{previewItem.sender_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Dokument-ID</p>
                          <p className="text-xs font-mono">{previewItem.id?.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-[11px] text-muted-foreground mt-10 pt-4 border-t border-border">
                      — Side 1 av 1 — Demo-forhåndsvisning —
                    </p>
                  </div>
                </div>
              </ScrollArea>

              <div className="px-6 py-3 border-t bg-background flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Godkjenn for å berike trust score til {assetName}
                </p>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => { rejectMutation.mutate(previewItem.id); setPreviewItem(null); }}>
                    <X className="h-3.5 w-3.5 mr-1" /> Avvis
                  </Button>
                  <Button size="sm" onClick={() => { approveMutation.mutate(previewItem); setPreviewItem(null); }}>
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Godkjenn og berik trust score
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
