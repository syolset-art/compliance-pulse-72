import { useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Loader2, ChevronDown, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { frameworks } from "@/lib/frameworkDefinitions";
import { InlineAgentProposal, buildProposal } from "@/components/asset-profile/gap/InlineAgentProposal";
import { AgentPlanStrip } from "@/components/asset-profile/gap/AgentPlanStrip";

interface VendorGapAnalysisTabProps {
  assetId: string;
  assetName: string;
}

const SUPPORTED_FRAMEWORKS = ["normen", "nis2", "iso27001", "gdpr"];

const DOMAIN_LABELS: Record<string, { nb: string; en: string }> = {
  governance: { nb: "Styring", en: "Governance" },
  operations: { nb: "Drift og sikkerhet", en: "Operations & Security" },
  privacy: { nb: "Personvern og data", en: "Privacy & Data" },
  third_party: { nb: "Tredjepart", en: "Third-Party" },
};

const STATUS_META = {
  implemented: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10", label: { nb: "Oppfylt", en: "Met" } },
  partial: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: { nb: "Delvis", en: "Partial" } },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: { nb: "Mangler", en: "Missing" } },
  not_relevant: { icon: FileText, color: "text-muted-foreground", bg: "bg-muted/30", label: { nb: "Ikke relevant", en: "N/A" } },
} as const;

export function VendorGapAnalysisTab({ assetId, assetName }: VendorGapAnalysisTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [framework, setFramework] = useState<string>("normen");
  const [openDomains, setOpenDomains] = useState<Record<string, boolean>>({ governance: true });

  const availableFrameworks = useMemo(
    () => frameworks.filter((f) => SUPPORTED_FRAMEWORKS.includes(f.id)),
    []
  );

  // Latest analysis for chosen framework
  const { data: latest, isLoading } = useQuery({
    queryKey: ["vendor-gap", assetId, framework],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_gap_analyses")
        .select("*")
        .eq("asset_id", assetId)
        .eq("framework_id", framework)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const runMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("analyze-vendor-gap", {
        body: { asset_id: assetId, framework_id: framework },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-gap", assetId, framework] });
      toast.success(isNb ? "Gap-analyse fullført" : "Gap analysis complete");
    },
    onError: (e: any) => {
      toast.error(isNb ? "Kunne ikke kjøre analyse" : "Analysis failed", { description: e?.message });
    },
  });

  const results = (latest?.results as any[]) || [];
  const summary = (latest?.summary as Record<string, any>) || {};
  const score = latest?.score ?? 0;

  const domainGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    results.forEach((r) => {
      groups[r.domain] = groups[r.domain] || [];
      groups[r.domain].push(r);
    });
    return groups;
  }, [results]);

  // Build aggregated proposal counts for the plan strip
  const openItems = useMemo(
    () => results.filter((r) => r.status !== "implemented" && r.status !== "not_relevant"),
    [results]
  );
  const proposalsByKind = useMemo(() => {
    let documents = 0, policies = 0, followUps = 0, other = 0;
    openItems.forEach((it) => {
      const p = buildProposal(it, assetName, isNb);
      if (p.kind === "request_document" || p.kind === "renew_document") documents += 1;
      else if (p.kind === "draft_policy") policies += 1;
      else if (p.kind === "review_task" || p.kind === "find_contact") followUps += 1;
      else other += 1;
    });
    return { documents, policies, followUps, other };
  }, [openItems, assetName, isNb]);

  const listRef = useRef<HTMLDivElement>(null);
  const [bulkConfirmedAt, setBulkConfirmedAt] = useState<number>(0);

  const handleReviewOne = () => {
    // Open all domains and scroll to first open proposal
    setOpenDomains((p) => {
      const next = { ...p };
      Object.keys(domainGroups).forEach((d) => (next[d] = true));
      return next;
    });
    requestAnimationFrame(() => {
      const el = listRef.current?.querySelector<HTMLElement>("[data-proposal-id]");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus?.();
    });
  };


  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
              {isNb ? "Test mot rammeverk" : "Test against framework"}
            </p>
            <Select value={framework} onValueChange={setFramework}>
              <SelectTrigger className="w-full sm:w-[320px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableFrameworks.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="gap-2 w-full sm:w-auto"
          >
            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {latest ? (isNb ? "Kjør på nytt" : "Re-run") : (isNb ? "Kjør analyse" : "Run analysis")}
          </Button>
        </CardContent>
      </Card>

      {!latest && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-primary mx-auto" />
            <p className="text-sm font-medium">
              {isNb ? `Klar for å analysere ${assetName} mot rammeverket?` : `Ready to analyze ${assetName}?`}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isNb
                ? "Vi sammenstiller leverandørens dokumentasjon, metadata og signaler mot kravene og viser tydelige gap med konkrete neste steg."
                : "We assess vendor documentation, metadata and signals against requirements and surface concrete next steps."}
            </p>
          </CardContent>
        </Card>
      )}

      {latest && (
        <>
          {/* Score summary */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{score}%</span>
                  <span className="text-xs text-muted-foreground">
                    {isNb ? "samsvar" : "compliance"}
                  </span>
                </div>
                <Progress
                  value={score}
                  className={cn(
                    "flex-1 h-2",
                    score >= 75 ? "[&>div]:bg-success" : score >= 50 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive"
                  )}
                />
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  <strong>{latest.implemented_count}</strong> {isNb ? "oppfylt" : "met"}
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                  <strong>{latest.partial_count}</strong> {isNb ? "delvis" : "partial"}
                </span>
                <span className="flex items-center gap-1.5">
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  <strong>{latest.missing_count}</strong> {isNb ? "mangler" : "missing"}
                </span>
                <span className="ml-auto text-muted-foreground">
                  {new Date(latest.created_at).toLocaleString(isNb ? "nb-NO" : "en-US")}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Domain summary chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(summary).map(([domain, s]: [string, any]) => {
              const dl = DOMAIN_LABELS[domain] || { nb: domain, en: domain };
              const dColor = s.score >= 75 ? "text-success" : s.score >= 50 ? "text-warning" : "text-destructive";
              return (
                <div key={domain} className="rounded-lg border border-border p-3 bg-card">
                  <p className="text-[11px] uppercase text-muted-foreground font-medium">{isNb ? dl.nb : dl.en}</p>
                  <p className={cn("text-lg font-bold tabular-nums", dColor)}>{s.score}%</p>
                  <p className="text-[11px] text-muted-foreground">
                    {s.implemented}/{s.total} {isNb ? "oppfylt" : "met"}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Agent plan strip */}
          <AgentPlanStrip
            total={openItems.length}
            byKind={proposalsByKind}
            onReviewOne={handleReviewOne}
            onBulkConfirmDocuments={() => setBulkConfirmedAt(Date.now())}
          />

          {/* Per-domain results */}
          <div ref={listRef} className="space-y-2">
            {Object.entries(domainGroups).map(([domain, items]) => {
              const dl = DOMAIN_LABELS[domain] || { nb: domain, en: domain };
              const isOpen = openDomains[domain] ?? false;
              return (
                <Collapsible key={domain} open={isOpen} onOpenChange={() => setOpenDomains((p) => ({ ...p, [domain]: !p[domain] }))}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                          <span className="font-semibold text-sm">{isNb ? dl.nb : dl.en}</span>
                          <Badge variant="outline" className="text-xs">{items.length}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />{items.filter((i: any) => i.status === "implemented").length}</span>
                          <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" />{items.filter((i: any) => i.status === "partial").length}</span>
                          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{items.filter((i: any) => i.status === "missing").length}</span>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="border-t border-border divide-y divide-border">
                        {items.map((item: any) => {
                          const meta = STATUS_META[item.status as keyof typeof STATUS_META] || STATUS_META.missing;
                          const Icon = meta.icon;
                          return (
                            <div key={item.requirement_id} className="p-4 space-y-2">
                              <div className="flex items-start gap-3">
                                <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", meta.bg)}>
                                  <Icon className={cn("h-4 w-4", meta.color)} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-mono text-muted-foreground">{item.requirement_id}</span>
                                    <Badge variant="outline" className={cn("text-[10px]", meta.color)}>
                                      {isNb ? meta.label.nb : meta.label.en}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium mt-0.5">{item.name}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{item.rationale}</p>
                                  {item.evidence?.length > 0 && (
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                      <FileText className="h-3 w-3 inline mr-1" />
                                      {isNb ? "Bevis: " : "Evidence: "}{item.evidence.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {item.status !== "implemented" && item.status !== "not_relevant" && (() => {
                                const proposal = buildProposal(item, assetName, isNb);
                                const isDocReq =
                                  proposal.kind === "request_document" ||
                                  proposal.kind === "renew_document";
                                return (
                                  <div className="ml-10">
                                    <InlineAgentProposal
                                      key={`${item.requirement_id}-${isDocReq ? bulkConfirmedAt : 0}`}
                                      proposal={proposal}
                                      vendorName={assetName}
                                      requirementId={item.requirement_id}
                                      autoStart={isDocReq && bulkConfirmedAt > 0}
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              {isNb ? "Eksporter PDF" : "Export PDF"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
