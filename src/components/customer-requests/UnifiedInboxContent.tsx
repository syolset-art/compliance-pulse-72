import { useState, useEffect, useRef, useMemo } from "react";
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
  CheckCircle2, FileText, Mail, ChevronDown, Loader2, Clock, TrendingUp, Eye, Building2, Sparkles, User, Inbox,
} from "lucide-react";
import { toast } from "sonner";
import laraButterfly from "@/assets/lara-butterfly.png";
import { ApprovalSuccessDialog, type ApprovedItemData } from "@/components/ApprovalSuccessDialog";
import { calculateTPRMImpact } from "@/lib/tprmUtils";
import { supersedePreviousDocuments } from "@/lib/documentStatus";
import { CustomerRequestCard } from "@/components/customer-requests/CustomerRequestCard";
import { cn } from "@/lib/utils";

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

type FilterKey = "all" | "needs_you" | "done";

interface UnifiedInboxContentProps {
  /** Begrens til meldinger utvekslet med én leverandør */
  assetId?: string;
  vendorName?: string;
  emptyMessage?: string;
}

export function UnifiedInboxContent({ assetId, vendorName, emptyMessage }: UnifiedInboxContentProps = {}) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const locale = isNb ? "nb-NO" : "en-US";

  const [filter, setFilter] = useState<FilterKey>("all");
  const [approvedItem, setApprovedItem] = useState<ApprovedItemData | null>(null);
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapsed = (id: string) =>
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  // Fetch both sources in parallel
  const { data: laraItems = [], isLoading: laraLoading } = useQuery({
    queryKey: ["unified-inbox-lara", assetId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("lara_inbox")
        .select("*, assets:matched_asset_id(id, name, asset_type, criticality, risk_level, next_review_date)")
        .order("received_at", { ascending: false });
      if (assetId) query = query.eq("matched_asset_id", assetId);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: manualItems = [], isLoading: manualLoading } = useQuery({
    queryKey: ["unified-inbox-manual", vendorName ?? "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_compliance_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = data || [];
      if (!vendorName) return rows;
      const needle = vendorName.trim().toLowerCase();
      return rows.filter((r: any) => (r.customer_name || "").trim().toLowerCase() === needle);
    },
  });


  // Auto-progress pending → analyzing → analyzed (same logic as before)
  const notifiedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!laraItems.length) return;
    const now = Date.now();
    const items = laraItems as any[];
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
        queryClient.invalidateQueries({ queryKey: ["unified-inbox-lara"] });
        queryClient.invalidateQueries({ queryKey: ["lara-inbox-pending-count"] });
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [laraItems]);

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
      queryClient.invalidateQueries({ queryKey: ["unified-inbox-lara"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-pending-count"] });
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
      queryClient.invalidateQueries({ queryKey: ["unified-inbox-lara"] });
      queryClient.invalidateQueries({ queryKey: ["lara-inbox-pending-count"] });
      toast.success(isNb ? "Forslag avvist" : "Suggestion rejected");
    },
  });

  const archiveManualMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("customer_compliance_requests").update({ status: "archived" } as any).eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-inbox-manual"] });
      toast.success(isNb ? "Melding arkivert" : "Message archived");
    },
  });

  const deleteManualMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("customer_compliance_requests").delete().eq("id", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unified-inbox-manual"] });
      toast.success(isNb ? "Melding slettet" : "Message deleted");
    },
  });

  // Merge & sort
  const merged = useMemo(() => {
    const lara = (laraItems as any[]).map((x) => ({ ...x, __source: "lara" as const, __ts: x.received_at }));
    const manual = (manualItems as any[]).map((x) => ({ ...x, __source: "manual" as const, __ts: x.created_at }));
    return [...lara, ...manual].sort((a, b) => +new Date(b.__ts) - +new Date(a.__ts));
  }, [laraItems, manualItems]);

  // Filter buckets
  const buckets = useMemo(() => {
    const needsYou = merged.filter((i) => {
      if (i.__source === "lara") {
        return (i.status === "new" || i.status === "auto_matched") && i.analysis_status === "analyzed";
      }
      return i.status === "new" || i.status === "read";
    });
    const done = merged.filter((i) => {
      if (i.__source === "lara") return i.status === "manually_assigned" || i.status === "rejected";
      return i.status === "responded" || i.status === "archived";
    });
    return { all: merged, needs_you: needsYou, done };
  }, [merged]);

  const filtered = buckets[filter];

  const filterTabs: { key: FilterKey; label: string; count: number }[] = [
    { key: "all", label: isNb ? "Alle" : "All", count: buckets.all.length },
    { key: "needs_you", label: isNb ? "Venter deg" : "Needs you", count: buckets.needs_you.length },
    { key: "done", label: isNb ? "Ferdig" : "Done", count: buckets.done.length },
  ];

  const isLoading = laraLoading || manualLoading;

  // Group filtered items by month (newest first)
  const groupedByMonth = useMemo(() => {
    const groups: { key: string; label: string; items: any[] }[] = [];
    const map = new Map<string, { label: string; items: any[] }>();
    for (const item of filtered) {
      const d = new Date(item.__ts);
      const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
      const label = d.toLocaleDateString(locale, { month: "long", year: "numeric" }).toUpperCase();
      if (!map.has(key)) {
        map.set(key, { label, items: [] });
        groups.push({ key, label, items: [] });
      }
      map.get(key)!.items.push(item);
    }
    return groups.map((g) => ({ ...g, items: map.get(g.key)!.items }));
  }, [filtered, locale]);

  return (
    <div className="space-y-6">
      {/* Filter chips */}
      <div className="flex items-center gap-1 border-b border-border">
        {filterTabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5",
              filter === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[11px]">{t.count}</Badge>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-lg">
          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{emptyMessage || (isNb ? "Ingen meldinger her" : "No messages here")}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByMonth.map((group) => (
            <div key={group.key} className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[12px] font-semibold tracking-wider text-muted-foreground">{group.label}</span>
                <div className="flex-1 h-px bg-border" />
                <span className="text-[12px] text-muted-foreground tabular-nums">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item: any) =>
                  item.__source === "lara" ? renderLaraItem(item) : renderManualItem(item)
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={(v) => !v && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.file_name || previewItem?.subject}</DialogTitle>
            <DialogDescription>{isNb ? "Forhåndsvisning av dokumentet" : "Document preview"}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded-md border bg-muted/20 p-4">
            <p className="text-xs text-muted-foreground italic">
              {isNb ? "Demo-modus: faktisk dokument-forhåndsvisning vises her i produksjon." : "Demo mode: actual document preview shown here in production."}
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ApprovalSuccessDialog data={approvedItem} onClose={() => setApprovedItem(null)} />
    </div>
  );

  // ───────────── Renderers ─────────────

  function renderLaraItem(item: any) {
    const asset = item.assets;
    const docTypeLabel = DOC_TYPE_LABELS[item.matched_document_type] || item.matched_document_type || (isNb ? "Dokument" : "Document");
    const summary = item.analysis_summary || {};
    const receivedDate = new Date(item.received_at).toLocaleDateString(locale, { day: "numeric", month: "numeric", year: "numeric" });
    const validUntilLabel = summary.valid_until
      ? new Date(summary.valid_until).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
      : null;

    const isAnalyzed = item.analysis_status === "analyzed";
    const isAnalyzing = item.analysis_status === "analyzing";
    const isQueued = !item.analysis_status || item.analysis_status === "pending";
    const isDone = item.status === "manually_assigned" || item.status === "rejected";

    // Default expanded only for "ready for approval" items
    const isExpanded = isAnalyzed && !isDone && !collapsedIds.has(item.id);

    let statusLabel = "";
    let statusClass = "";
    if (isDone && item.status === "manually_assigned") { statusLabel = isNb ? "Godkjent" : "Approved"; statusClass = "bg-success/10 text-success border-success/20"; }
    else if (isDone && item.status === "rejected") { statusLabel = isNb ? "Avvist" : "Rejected"; statusClass = "bg-muted text-muted-foreground border-border"; }
    else if (isAnalyzed) { statusLabel = isNb ? "Klar for godkjenning" : "Ready for approval"; statusClass = "bg-warning/10 text-warning border-warning/20"; }
    else if (isAnalyzing) { statusLabel = isNb ? "Lara analyserer" : "Lara analyzing"; statusClass = "bg-primary/10 text-primary border-primary/20"; }
    else { statusLabel = isNb ? "I kø" : "Queued"; statusClass = "bg-muted text-muted-foreground border-border"; }

    return (
      <div key={item.id} className="rounded-lg border border-border bg-card overflow-hidden">
        <button
          type="button"
          onClick={() => isAnalyzed && !isDone && toggleCollapsed(item.id)}
          className={cn(
            "w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors",
            isAnalyzed && !isDone && "hover:bg-muted/40 cursor-pointer",
            (!isAnalyzed || isDone) && "cursor-default"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />
            ) : isQueued ? (
              <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-foreground flex items-center gap-1.5">
                {item.file_name || item.subject}
                <span
                  title={isNb ? "Mottatt og behandlet automatisk av Lara" : "Received and processed automatically by Lara"}
                  className="inline-flex items-center text-muted-foreground/70"
                >
                  <Sparkles className="h-3 w-3" />
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                {asset?.name || (isNb ? "Ukjent leverandør" : "Unknown vendor")} · {docTypeLabel} · {receivedDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {summary.score_impact && isAnalyzed && !isDone && (
              <Badge variant="secondary" className="gap-1 text-[12px]">
                <TrendingUp className="h-3 w-3" />+{summary.score_impact}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-[12px]", statusClass)}>{statusLabel}</Badge>
            {isAnalyzed && !isDone && (
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
            )}
          </div>
        </button>

        {isExpanded && (
          <>
            <Separator />
            <div className="px-4 py-3 space-y-2">
              {summary.note && (
                <p className="text-xs text-foreground leading-relaxed">{summary.note}</p>
              )}
              <div className="flex flex-wrap gap-1.5 text-[12px]">
                {asset?.name ? (
                  <Badge variant="secondary" className="font-normal">
                    {isNb ? "Leverandør" : "Vendor"}: {asset.name}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="font-normal text-warning border-warning/30">
                    {isNb ? "Mangler leverandør" : "No vendor match"}
                  </Badge>
                )}
                <Badge variant="secondary" className="font-normal">{docTypeLabel}</Badge>
                {validUntilLabel && (
                  <Badge variant="secondary" className="font-normal">
                    {isNb ? "Gyldig til" : "Valid until"} {validUntilLabel}
                  </Badge>
                )}
                {summary.score_impact && (
                  <Badge variant="secondary" className="font-normal text-success">
                    +{summary.score_impact} {isNb ? "poeng" : "pts"}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-t border-border">
              <Button size="sm" variant="ghost" className="h-8 text-xs gap-1.5 -ml-2" onClick={() => setPreviewItem(item)}>
                <Eye className="h-3.5 w-3.5" />{isNb ? "Les" : "Read"}
              </Button>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-destructive" onClick={() => rejectMutation.mutate(item.id)}>
                  {isNb ? "Avvis" : "Reject"}
                </Button>
                <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => approveMutation.mutate(item)}>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isNb ? "Godkjenn" : "Approve"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  function renderManualItem(item: any) {
    return (
      <CustomerRequestCard
        key={item.id}
        request={item}
        onArchive={(id) => archiveManualMutation.mutate(id)}
        onDelete={(id) => deleteManualMutation.mutate(id)}
      />
    );
  }
}
