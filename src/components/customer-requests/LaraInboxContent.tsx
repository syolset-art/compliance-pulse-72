import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2, FileText, Mail, ChevronDown, Loader2, Clock, TrendingUp, Eye, Building2,
} from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { supersedePreviousDocuments } from "@/lib/documentStatus";

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
    iso27001: { confirms: ["Gyldig ISO 27001-sertifikat", "Dekker hele tjenesten", "Audit utført"], affects: ["Informasjonssikkerhet", "Styring og kontroll"], score_impact: 10, valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), note: "Bekrefter etablert ISMS hos leverandør." },
    soc2: { confirms: ["Ren SOC 2-rapport", "Ingen kritiske avvik"], affects: ["Driftssikkerhet", "Tredjepartsstyring"], score_impact: 9, valid_until: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(), note: "Erstatter forrige rapport." },
    dpa: { confirms: ["Behandlingsgrunnlag", "Lagringstid", "Registrertes rettigheter"], affects: ["Personvern", "Datahåndtering"], score_impact: 7, note: "GDPR art. 28-krav er dekket." },
    dpia: { confirms: ["Risikovurdering for behandling utført", "Tiltak identifisert"], affects: ["Personvern"], score_impact: 6 },
    penetration_test: { confirms: ["Pentest gjennomført", "Funn lukket"], affects: ["Teknisk sikkerhet"], score_impact: 8 },
    nda: { confirms: ["Signert konfidensialitetsavtale"], affects: ["Juridisk"], score_impact: 3 },
  };
  return presets[docType] || { confirms: ["Dokument mottatt og lest"], affects: ["Generell etterlevelse"], score_impact: 4 };
}

export function LaraInboxContent() {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const locale = i18n.language === "nb" ? "nb-NO" : "en-US";
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const { data: inboxItems = [], isLoading } = useQuery({
    queryKey: ["lara-inbox-global"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lara_inbox")
        .select("*, assets:matched_asset_id(id, name, asset_type, criticality, risk_level, next_review_date)")
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  // Auto-progresjon: pending → analyzing → analyzed (samme logikk som per-leverandør)
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!inboxItems.length) return;
    const now = Date.now();
    const items = inboxItems as any[];
    const toAnalyzing = items.filter((i) => i.analysis_status === "pending" && now - new Date(i.received_at).getTime() > 30_000);
    const toAnalyzed = items.filter((i) => i.analysis_status === "analyzing" && now - new Date(i.received_at).getTime() > 75_000);
    const run = async () => {
      if (toAnalyzing.length) {
        await supabase.from("lara_inbox").update({ analysis_status: "analyzing" } as any).in("id", toAnalyzing.map((i) => i.id));
      }
      if (toAnalyzed.length) {
        for (const item of toAnalyzed) {
          const summary = buildAnalysisSummary(item.matched_document_type || "other");
          await supabase.from("lara_inbox").update({
            analysis_status: "analyzed",
            analyzed_at: new Date().toISOString(),
            analysis_summary: summary,
          } as any).eq("id", item.id);
          if (!notifiedRef.current.has(item.id)) {
            notifiedRef.current.add(item.id);
            toast.success(`Lara har analysert ${item.file_name || item.subject}`, {
              description: "Klar for din godkjenning.",
            });
          }
        }
      }
      if (toAnalyzing.length || toAnalyzed.length) {
        queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
        queryClient.invalidateQueries({ queryKey: ["lara-inbox-total"] });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxItems]);

  const approveMutation = useMutation({
    mutationFn: async (item: any) => {
      const docType = item.matched_document_type || "other";
      const summary = item.analysis_summary || {};
      const assetId = item.matched_asset_id;
      const { data: inserted } = await supabase.from("vendor_documents").insert({
        asset_id: assetId,
        file_name: item.file_name,
        file_path: item.file_path || "",
        document_type: docType,
        source: "email_inbox",
        status: "current",
        received_at: item.received_at,
        valid_to: summary.valid_until ? new Date(summary.valid_until).toISOString().slice(0, 10) : null,
        notes: `Mottatt fra ${item.sender_name || item.sender_email}`,
      } as any).select("id").single();

      const replaced = await supersedePreviousDocuments(supabase, {
        assetId,
        documentType: docType,
        newDocumentId: (inserted as any)?.id ?? null,
      });

      await supabase.from("lara_inbox").update({ status: "manually_assigned", processed_at: new Date().toISOString() } as any).eq("id", item.id);
      return { replacedCount: replaced.length };
    },
    onSuccess: (data, item) => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-total"] });
      const asset = item.assets;
      const docType = item.matched_document_type || "other";
      const tprm = calculateTPRMImpact([], !!asset?.next_review_date, docType, asset?.criticality, asset?.risk_level);
      if (data?.replacedCount) {
        toast.info(`Erstattet ${data.replacedCount} tidligere ${DOC_TYPE_LABELS[docType] || "dokument"}`);
      }
      setApprovedItem({
        fileName: item.file_name || item.subject || "",
        documentType: docType,
        assetId: asset?.id ?? "",
        assetName: asset?.name ?? "",
        isIncident: false,
        tprmImpact: tprm,
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("lara_inbox").update({ status: "rejected", processed_at: new Date().toISOString() } as any).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-global"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-total"] });
      toast.success("Forslag avvist");
    },
  });

  const allPending = (inboxItems as any[]).filter((i) => i.status === "new" || i.status === "auto_matched");
  const ready = allPending.filter((i) => i.analysis_status === "analyzed");
  const analyzing = allPending.filter((i) => i.analysis_status === "analyzing");
  const queued = allPending.filter((i) => i.analysis_status === "pending" || !i.analysis_status);

  return (
    <div className="space-y-8">
      {/* Lara-banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/15">
        <img src={laraButterfly} alt="Lara" className="h-8 w-8 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-foreground">Lara analyserer alt før du godkjenner</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Du ser alltid hva Lara fant – hvilken leverandør, hva dokumentet bekrefter, og hvor mye trust score øker – før du godkjenner.
          </p>
        </div>
      </div>

      {/* Klar for godkjenning */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h3 className="text-sm font-medium text-foreground">Klar for din godkjenning</h3>
          {ready.length > 0 && <span className="text-xs text-muted-foreground">{ready.length} ferdig analysert</span>}
        </div>

        {isLoading ? (
          <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-16 bg-muted/40 animate-pulse rounded-lg" />)}</div>
        ) : ready.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-lg">
            <Mail className="h-5 w-5 mx-auto mb-2 opacity-40" />
            <p className="text-xs">Ingen dokumenter venter på godkjenning</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ready.map((item: any) => {
              const asset = item.assets;
              const docTypeLabel = DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type;
              const isExpanded = !collapsedIds.has(item.id);
              const summary = item.analysis_summary || {};
              const receivedDate = new Date(item.received_at).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" });
              const validUntilLabel = summary.valid_until
                ? new Date(summary.valid_until).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
                : null;

              return (
                <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
                  <button type="button" onClick={() => toggleCollapsed(item.id)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">{item.file_name || item.subject}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Building2 className="h-3 w-3" />
                          {asset?.name || "Ukjent leverandør"} · {docTypeLabel} · {receivedDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {summary.score_impact && (
                        <Badge variant="secondary" className="gap-1 text-[11px]">
                          <TrendingUp className="h-3 w-3" />+{summary.score_impact} poeng
                        </Badge>
                      )}
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="px-4 py-3">
                        <div className="flex items-center gap-2 mb-3">
                          <img src={laraButterfly} alt="Lara" className="h-3.5 w-3.5" />
                          <p className="text-xs font-medium text-foreground">Lara har analysert dokumentet</p>
                        </div>
                        <dl className="space-y-1.5 text-xs">
                          {summary.confirms?.length > 0 && (
                            <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                              <dt className="text-muted-foreground">Bekrefter</dt>
                              <dd className="text-foreground">{summary.confirms.join(" · ")}</dd>
                            </div>
                          )}
                          {summary.affects?.length > 0 && (
                            <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                              <dt className="text-muted-foreground">Berører</dt>
                              <dd className="text-foreground">{summary.affects.join(", ")}</dd>
                            </div>
                          )}
                          {summary.valid_until && (
                            <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                              <dt className="text-muted-foreground">Gyldig til</dt>
                              <dd className="text-foreground">{new Date(summary.valid_until).toLocaleDateString(locale)}</dd>
                            </div>
                          )}
                          {summary.score_impact && (
                            <div className="grid grid-cols-[110px_1fr] gap-3 items-start">
                              <dt className="text-muted-foreground">Trust score</dt>
                              <dd className="text-success font-medium">+{summary.score_impact} poeng ved godkjenning</dd>
                            </div>
                          )}
                        </dl>
                        {summary.note && (
                          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">Merk:</span> {summary.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 -ml-2" onClick={() => setPreviewItem(item)}>
                            <Eye className="h-3.5 w-3.5" />Les dokumentet
                          </Button>
                          {asset?.id && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => navigate(`/assets/${asset.id}`)}>
                              Åpne {asset.name}
                            </Button>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={() => rejectMutation.mutate(item.id)}>
                            Avvis
                          </Button>
                          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => approveMutation.mutate(item)}>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Godkjenn og berik trust score
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {analyzing.length > 0 && (
        <section>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-medium text-foreground">Lara analyserer</h3>
            <span className="text-xs text-muted-foreground">{analyzing.length} dokument</span>
          </div>
          <div className="space-y-1.5">
            {analyzing.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card">
                <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{item.file_name || item.subject}</p>
                  <p className="text-xs text-muted-foreground">{item.assets?.name || "—"} · Lara leser og vurderer …</p>
                </div>
                <span className="text-xs text-primary">Analyserer</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {queued.length > 0 && (
        <section>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-sm font-medium text-foreground">I kø</h3>
            <span className="text-xs text-muted-foreground">{queued.length} venter</span>
          </div>
          <div className="space-y-1.5">
            {queued.map((item: any) => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-card opacity-70">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-foreground">{item.file_name || item.subject}</p>
                  <p className="text-xs text-muted-foreground">{item.assets?.name || "—"} · Venter på Lara</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Dialog open={!!previewItem} onOpenChange={(v) => !v && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.file_name || previewItem?.subject}</DialogTitle>
            <DialogDescription>Forhåndsvisning av dokumentet</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-md border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground italic">Demo-modus: faktisk dokument-forhåndsvisning vises her i produksjon.</p>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />
    </div>
  );
}
