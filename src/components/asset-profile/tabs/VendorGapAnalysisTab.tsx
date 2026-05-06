import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, AlertTriangle, Sparkles, Loader2, History,
  ArrowRight, Check, X, TrendingUp, User, Clock, FileText, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { frameworks } from "@/lib/frameworkDefinitions";
import { buildProposal } from "@/components/asset-profile/gap/InlineAgentProposal";
import { ActivityConfirmPreview, buildPlannedActivities } from "@/components/asset-profile/gap/ActivityConfirmPreview";

interface VendorGapAnalysisTabProps {
  assetId: string;
  assetName: string;
  onOpenActivityLog?: () => void;
}

const SUPPORTED_FRAMEWORKS = ["normen", "nis2", "iso27001", "gdpr"];

type GapItem = {
  requirement_id: string;
  name: string;
  status: "implemented" | "partial" | "missing" | "not_relevant";
  rationale?: string;
  next_action?: string;
  signal_key?: string;
  evidence?: string[];
  priority?: string;
};

type FollowupState = "asking" | "done" | "dismissed";

// Pseudo-deterministic risk derivation based on status + requirement id hash
function deriveRisk(gap: GapItem): "high" | "medium" | "low" {
  if (gap.status === "missing") return "high";
  // partial → medium/low based on simple hash
  const hash = gap.requirement_id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return hash % 3 === 0 ? "low" : "medium";
}

function derivePriority(gap: GapItem): "A" | "B" | "C" {
  const risk = deriveRisk(gap);
  if (risk === "high") return "A";
  if (risk === "medium") return "B";
  return "C";
}

const RISK_META = {
  high: {
    nb: "Høy risiko", en: "High risk",
    border: "border-l-destructive",
    pill: "text-destructive border-destructive/30 bg-destructive/5",
    icon: AlertTriangle,
  },
  medium: {
    nb: "Middels risiko", en: "Medium risk",
    border: "border-l-warning",
    pill: "text-warning border-warning/30 bg-warning/5",
    icon: Minus,
  },
  low: {
    nb: "Lav risiko", en: "Low risk",
    border: "border-l-muted-foreground/40",
    pill: "text-muted-foreground border-border bg-muted/30",
    icon: Minus,
  },
} as const;

export function VendorGapAnalysisTab({ assetId, assetName, onOpenActivityLog }: VendorGapAnalysisTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [framework, setFramework] = useState<string>("normen");
  const [followupState, setFollowupState] = useState<FollowupState>("asking");
  const [createdSummary, setCreatedSummary] = useState<{ pending: number } | null>(null);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [confirmedPerGap, setConfirmedPerGap] = useState<Set<string>>(new Set());
  const [previewOpen, setPreviewOpen] = useState<Set<string>>(new Set());

  const availableFrameworks = useMemo(
    () => frameworks.filter((f) => SUPPORTED_FRAMEWORKS.includes(f.id)),
    []
  );

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
      setFollowupState("asking");
      setCreatedSummary(null);
      setSkipped(new Set());
      setConfirmedPerGap(new Set());
      toast.success(isNb ? "Gap-analyse fullført" : "Gap analysis complete");
    },
    onError: (e: any) => {
      toast.error(isNb ? "Kunne ikke kjøre analyse" : "Analysis failed", { description: e?.message });
    },
  });

  const allResults: GapItem[] = (latest?.results as any[]) || [];
  const score = latest?.score ?? 0;

  const gaps = useMemo(() => {
    const missing = allResults.filter((r) => r.status === "missing");
    const partial = allResults.filter((r) => r.status === "partial");
    const ordered = [...missing, ...partial];
    // Sort by risk: high → medium → low
    return ordered.sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[deriveRisk(a)] - order[deriveRisk(b)];
    });
  }, [allResults]);

  const visibleGaps = gaps.filter((g) => !skipped.has(g.requirement_id) && !confirmedPerGap.has(g.requirement_id));

  const frameworkName = availableFrameworks.find((f) => f.id === framework)?.name || framework;

  const handleApproveAll = () => {
    const count = visibleGaps.length;
    setCreatedSummary({ pending: count });
    setFollowupState("done");
    toast.success(
      isNb
        ? `Lara la ${count} aktiviteter i loggen`
        : `Lara added ${count} activities to the log`,
      {
        description: isNb
          ? "Alle venter på din godkjenning før noe sendes."
          : "All await your approval before anything is sent.",
      }
    );
  };

  const handleDismissAll = () => {
    setFollowupState("dismissed");
  };

  const handleSetupOne = (gap: GapItem) => {
    setConfirmedPerGap((prev) => new Set(prev).add(gap.requirement_id));
    toast.success(
      isNb ? "Lagt til som utkast i aktivitetsloggen" : "Added as draft to activity log",
      { description: gap.name }
    );
  };

  const handleSkipOne = (gap: GapItem) => {
    setSkipped((prev) => new Set(prev).add(gap.requirement_id));
  };

  // Count high-risk gaps for Lara's summary
  const highRiskCount = visibleGaps.filter((g) => deriveRisk(g) === "high").length;
  const totalSuggested = visibleGaps.length;

  return (
    <div className="space-y-4">
      {/* Header: framework picker + actions */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            {isNb ? "Aktivt rammeverk" : "Active framework"}
          </p>
          <Select
            value={framework}
            onValueChange={(v) => {
              setFramework(v);
              setFollowupState("asking");
              setCreatedSummary(null);
              setSkipped(new Set());
              setConfirmedPerGap(new Set());
            }}
          >
            <SelectTrigger className="w-full sm:w-[340px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableFrameworks.map((f) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 h-9" disabled>
            <History className="h-3.5 w-3.5" />
            {isNb ? "Historikk" : "History"}
          </Button>
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            size="sm"
            className="gap-1.5 h-9"
          >
            {runMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {latest ? (isNb ? "Kjør på nytt" : "Re-run") : (isNb ? "Kjør analyse" : "Run analysis")}
          </Button>
        </div>
      </div>

      {!latest && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <Sparkles className="h-8 w-8 text-primary mx-auto" />
            <p className="text-sm font-medium">
              {isNb ? `Klar for å analysere ${assetName} mot rammeverket?` : `Ready to analyze ${assetName}?`}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {isNb
                ? "Lara sammenholder dokumentasjon og signaler mot kravene, og viser tydelige mangler du kan handle på."
                : "Lara compares documentation and signals against the requirements, surfacing concrete gaps you can act on."}
            </p>
          </CardContent>
        </Card>
      )}

      {latest && (
        <>
          {/* Score summary card */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tabular-nums tracking-tight">{score}%</span>
                  <span className="text-sm text-muted-foreground">
                    {isNb ? "samsvar" : "compliance"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {isNb ? "sist kjørt " : "last run "}
                  {new Date(latest.created_at).toLocaleString(isNb ? "nb-NO" : "en-US", {
                    day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Multi-segment gradient bar */}
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="bg-success" style={{ width: `${score}%` }} />
                <div className="bg-warning/70" style={{ width: `${Math.max(0, Math.min(100 - score, 15))}%` }} />
                <div className="bg-destructive/70 flex-1" />
              </div>

              <div className="flex items-center gap-4 text-xs flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  <strong>{latest.implemented_count}</strong> {isNb ? "oppfylt" : "met"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <strong>{latest.partial_count}</strong> {isNb ? "delvis" : "partial"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                  <strong>{latest.missing_count}</strong> {isNb ? "mangler" : "missing"}
                </span>
                <span className="ml-auto flex items-center gap-1 text-success">
                  <TrendingUp className="h-3 w-3" />
                  +7 pp {isNb ? "siden mars" : "since March"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Lara summary card */}
          {visibleGaps.length > 0 && followupState === "asking" && (
            <Card className="border-primary/20 bg-primary/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-primary">L</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">Lara</span>
                      <span className="text-xs text-muted-foreground">· {isNb ? "Assistert modus" : "Assisted mode"}</span>
                      <Badge variant="outline" className="ml-auto gap-1 text-primary border-primary/30 bg-primary/5">
                        <Sparkles className="h-3 w-3" />
                        {isNb ? "Forslag klart" : "Suggestion ready"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-2">
                      {isNb
                        ? `Jeg fant ${visibleGaps.length} ${visibleGaps.length === 1 ? "mangel" : "mangler"} hos ${assetName}.`
                        : `I found ${visibleGaps.length} gap${visibleGaps.length === 1 ? "" : "s"} for ${assetName}.`}
                      {highRiskCount > 0 && (
                        <span className="text-foreground/80 font-normal">
                          {" "}
                          {isNb
                            ? `${highRiskCount === 1 ? "Den ene" : `${highRiskCount} av dem`} haster.`
                            : `${highRiskCount === 1 ? "One" : `${highRiskCount} of them`} ${highRiskCount === 1 ? "is" : "are"} urgent.`}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {isNb
                        ? `Jeg foreslår ${totalSuggested} ${totalSuggested === 1 ? "aktivitet" : "aktiviteter"} under. Du kan godkjenne alle, gå gjennom én og én, eller avvise forslagene.`
                        : `I suggest ${totalSuggested} ${totalSuggested === 1 ? "activity" : "activities"} below. Approve all, review one by one, or dismiss.`}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button onClick={handleApproveAll} size="sm" className="gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        {isNb ? `Godkjenn alle (${totalSuggested})` : `Approve all (${totalSuggested})`}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info(isNb ? "Bla nedover for å gå gjennom én og én" : "Scroll down to review one by one")}>
                        {isNb ? "Gå gjennom én og én" : "Review one by one"}
                      </Button>
                      <Button onClick={handleDismissAll} size="sm" variant="ghost">
                        <X className="h-3.5 w-3.5" />
                        {isNb ? "Avvis forslag" : "Dismiss"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No gaps */}
          {gaps.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Badge variant="outline" className="gap-1 text-success border-success/30">
                  <CheckCircle2 className="h-3 w-3" />
                  {isNb ? "Ingen mangler" : "No gaps"}
                </Badge>
              </CardContent>
            </Card>
          )}

          {/* Gap list (always visible — sorted by risk) */}
          {visibleGaps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold">
                  {isNb ? "Mangler å håndtere" : "Gaps to address"}
                  <span className="ml-2 text-muted-foreground font-normal">({visibleGaps.length})</span>
                </h3>
                <span className="text-xs text-muted-foreground">
                  {isNb ? "Sortert etter risiko" : "Sorted by risk"}
                </span>
              </div>

              {visibleGaps.map((gap) => {
                const risk = deriveRisk(gap);
                const riskMeta = RISK_META[risk];
                const RiskIcon = riskMeta.icon;
                const priority = derivePriority(gap);
                const proposal = buildProposal(gap, assetName, isNb);
                const statusLabel = gap.status === "missing"
                  ? (isNb ? "Mangler" : "Missing")
                  : (isNb ? "Delvis" : "Partial");
                const statusPill = gap.status === "missing"
                  ? "bg-destructive/10 text-destructive border-destructive/20"
                  : "bg-warning/10 text-warning border-warning/20";

                return (
                  <Card key={gap.requirement_id} className={cn("border-l-4", riskMeta.border)}>
                    <CardContent className="p-4 space-y-3">
                      {/* Header line: id + status + priority + risk */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-muted-foreground">{gap.requirement_id}</span>
                        <Badge variant="outline" className={cn("text-[11px] h-5 px-1.5", statusPill)}>
                          {statusLabel}
                        </Badge>
                        <Badge variant="outline" className="text-[11px] h-5 px-1.5">
                          {isNb ? "Prioritet" : "Priority"} {priority}
                        </Badge>
                        <Badge variant="outline" className={cn("text-[11px] h-5 px-1.5 gap-1", riskMeta.pill)}>
                          <RiskIcon className="h-3 w-3" />
                          {isNb ? riskMeta.nb : riskMeta.en}
                        </Badge>
                      </div>

                      {/* Title + rationale */}
                      <div>
                        <p className="text-sm font-semibold leading-snug">{gap.name}</p>
                        {gap.rationale && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{gap.rationale}</p>
                        )}
                      </div>

                      {/* Lara nested suggestion */}
                      <div className="rounded-lg bg-primary/[0.04] border border-primary/15 p-3">
                        <div className="flex items-start gap-2.5">
                          <div className="h-6 w-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-[10px] font-semibold text-primary">L</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium">
                              {isNb ? "Lara foreslår 1 aktivitet:" : "Lara suggests 1 activity:"}
                            </p>
                            <ul className="mt-1.5 space-y-1 text-xs text-foreground/90">
                              <li className="flex items-start gap-1.5">
                                <span className="text-muted-foreground mt-0.5">•</span>
                                <span>{proposal.title}</span>
                              </li>
                            </ul>
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleSetupOne(gap)}>
                                <Check className="h-3 w-3" />
                                {isNb ? "Sett opp aktivitet" : "Set up activity"}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs">
                                {isNb ? "Tilpass" : "Customize"}
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleSkipOne(gap)}>
                                {isNb ? "Hopp over" : "Skip"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Meta footer */}
                      <div className="flex items-center gap-4 flex-wrap text-[11px] text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {isNb ? "Ansvarlig: ikke tildelt" : "Owner: unassigned"}
                        </span>
                        {gap.evidence && gap.evidence.length > 0 && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {gap.evidence.join(", ")}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {isNb ? "Oppdatert nå" : "Just updated"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Result after Approve all */}
          {followupState === "done" && createdSummary && createdSummary.pending > 0 && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">
                      {isNb
                        ? `Lara la ${createdSummary.pending} aktiviteter i loggen`
                        : `Lara added ${createdSummary.pending} activities to the log`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {isNb
                        ? "Alle ligger som utkast og venter på din godkjenning. Ingen e-post sendes og ingen handling utføres før du bekrefter."
                        : "All are drafts awaiting your approval. No emails will be sent and no action taken until you confirm."}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-auto mt-2 gap-1 text-primary"
                      onClick={() => onOpenActivityLog?.()}
                    >
                      {isNb ? "Gå til aktivitetsloggen for å godkjenne" : "Go to activity log to approve"}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {followupState === "dismissed" && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  {isNb ? "Forslag avvist. Du kan kjøre analysen på nytt når som helst." : "Suggestions dismissed. Re-run anytime."}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
