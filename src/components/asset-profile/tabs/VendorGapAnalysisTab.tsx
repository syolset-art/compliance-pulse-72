import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CheckCircle2, AlertTriangle, XCircle, Sparkles, Loader2, FileText,
  ArrowRight, Check, X, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { frameworks } from "@/lib/frameworkDefinitions";
import { buildProposal } from "@/components/asset-profile/gap/InlineAgentProposal";

interface VendorGapAnalysisTabProps {
  assetId: string;
  assetName: string;
  onOpenActivityLog?: () => void;
}

const SUPPORTED_FRAMEWORKS = ["normen", "nis2", "iso27001", "gdpr"];

const STATUS_META = {
  partial: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/30",
    label: { nb: "Delvis", en: "Partial" },
  },
  missing: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    border: "border-destructive/30",
    label: { nb: "Mangler", en: "Missing" },
  },
} as const;

type GapItem = {
  requirement_id: string;
  name: string;
  status: "implemented" | "partial" | "missing" | "not_relevant";
  rationale?: string;
  next_action?: string;
  signal_key?: string;
  evidence?: string[];
};

type FollowupState = "idle" | "asking" | "done";

export function VendorGapAnalysisTab({ assetId, assetName, onOpenActivityLog }: VendorGapAnalysisTabProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const queryClient = useQueryClient();

  const [framework, setFramework] = useState<string>("normen");
  const [followupState, setFollowupState] = useState<FollowupState>("asking");
  const [createdSummary, setCreatedSummary] = useState<{ auto: number; pending: number } | null>(null);
  const [showGapList, setShowGapList] = useState(false);

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
      setShowGapList(false);
      toast.success(isNb ? "Gap-analyse fullført" : "Gap analysis complete");
    },
    onError: (e: any) => {
      toast.error(isNb ? "Kunne ikke kjøre analyse" : "Analysis failed", { description: e?.message });
    },
  });

  const allResults: GapItem[] = (latest?.results as any[]) || [];
  const score = latest?.score ?? 0;

  // Flat list of gaps (missing first, then partial)
  const gaps = useMemo(() => {
    const missing = allResults.filter((r) => r.status === "missing");
    const partial = allResults.filter((r) => r.status === "partial");
    return [...missing, ...partial];
  }, [allResults]);

  const handleConfirm = () => {
    // Mode: assisted by default — half automatic, half pending confirmation
    // Real persistence would happen here; for now we simulate with toast + summary
    const auto = Math.ceil(gaps.length * 0.6);
    const pending = gaps.length - auto;
    setCreatedSummary({ auto, pending });
    setFollowupState("done");
    toast.success(
      isNb
        ? `Lara satte opp ${gaps.length} aktiviteter`
        : `Lara created ${gaps.length} activities`,
      {
        description: isNb
          ? `${auto} utført automatisk · ${pending} venter på din bekreftelse`
          : `${auto} done automatically · ${pending} awaiting your confirmation`,
      }
    );
  };

  const handleDecline = () => {
    setFollowupState("done");
    setCreatedSummary({ auto: 0, pending: 0 });
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
              {isNb ? "Velg rammeverk" : "Choose framework"}
            </p>
            <Select value={framework} onValueChange={(v) => { setFramework(v); setFollowupState("asking"); setCreatedSummary(null); setShowGapList(false); }}>
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
                ? "Lara sammenholder dokumentasjon og signaler mot kravene, og viser tydelige mangler du kan handle på."
                : "Lara compares documentation and signals against the requirements, surfacing concrete gaps you can act on."}
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

          {/* Lara presents the gaps + asks the question */}
          {gaps.length > 0 && followupState === "asking" && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {isNb
                        ? `Jeg fant ${gaps.length} ${gaps.length === 1 ? "mangel" : "mangler"} hos ${assetName} mot ${availableFrameworks.find(f => f.id === framework)?.name || framework}.`
                        : `I found ${gaps.length} gap${gaps.length === 1 ? "" : "s"} for ${assetName} against ${availableFrameworks.find(f => f.id === framework)?.name || framework}.`}
                    </p>
                    <p className="text-sm text-foreground/80 mt-2">
                      {isNb
                        ? "Skal jeg sette opp oppfølgingsaktiviteter for disse?"
                        : "Should I set up follow-up activities for these?"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {isNb
                        ? "Modus: Assistert — jeg utfører enkle handlinger autonomt og ber om bekreftelse på de viktigste."
                        : "Mode: Assisted — I'll act autonomously on simple items and ask for confirmation on the rest."}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button onClick={handleConfirm} size="sm" className="gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        {isNb ? "Ja, sett opp aktiviteter" : "Yes, set up activities"}
                      </Button>
                      <Button onClick={handleDecline} size="sm" variant="outline" className="gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        {isNb ? "Nei, ikke nå" : "Not now"}
                      </Button>
                      <Button
                        onClick={() => setShowGapList((s) => !s)}
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 ml-auto"
                      >
                        {showGapList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        {showGapList
                          ? (isNb ? "Skjul mangler" : "Hide gaps")
                          : (isNb ? `Vis manglene (${gaps.length})` : `Show gaps (${gaps.length})`)}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No gaps state */}
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

          {/* Gap list — only when user opts in */}
          {gaps.length > 0 && showGapList && (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    {isNb ? "Mangler" : "Gaps"}
                    <span className="ml-2 text-muted-foreground font-normal">({gaps.length})</span>
                  </h3>
                </div>
                <div className="divide-y divide-border">
                  {gaps.map((gap) => {
                    const meta = STATUS_META[gap.status as "partial" | "missing"];
                    const Icon = meta.icon;
                    const proposal = buildProposal(gap, assetName, isNb);
                    return (
                      <div key={gap.requirement_id} className="p-4 flex items-start gap-3">
                        <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0", meta.bg)}>
                          <Icon className={cn("h-4 w-4", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-muted-foreground">{gap.requirement_id}</span>
                            <Badge variant="outline" className={cn("text-[10px]", meta.color, meta.border)}>
                              {isNb ? meta.label.nb : meta.label.en}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium mt-0.5">{gap.name}</p>
                          {gap.rationale && (
                            <p className="text-xs text-muted-foreground mt-1">{gap.rationale}</p>
                          )}
                          <p className="text-xs text-primary mt-1.5 inline-flex items-start gap-1.5">
                            <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>
                              <span className="font-medium">{isNb ? "Lara: " : "Lara: "}</span>
                              {proposal.title}
                            </span>
                          </p>
                          {gap.evidence && gap.evidence.length > 0 && (
                            <p className="text-[11px] text-muted-foreground mt-1">
                              <FileText className="h-3 w-3 inline mr-1" />
                              {isNb ? "Bevis: " : "Evidence: "}{gap.evidence.join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Result after confirm */}
          {followupState === "done" && createdSummary && createdSummary.auto + createdSummary.pending > 0 && (
            <Card className="border-success/30 bg-success/5">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                    <Check className="h-4 w-4 text-success" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {isNb
                        ? `Lara satte opp ${createdSummary.auto + createdSummary.pending} aktiviteter`
                        : `Lara created ${createdSummary.auto + createdSummary.pending} activities`}
                    </p>
                    <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                      {createdSummary.auto > 0 && (
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {isNb
                            ? `${createdSummary.auto} utført automatisk (e-post sendt, oppgaver opprettet)`
                            : `${createdSummary.auto} done automatically (emails sent, tasks created)`}
                        </li>
                      )}
                      {createdSummary.pending > 0 && (
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          {isNb
                            ? `${createdSummary.pending} venter på din bekreftelse`
                            : `${createdSummary.pending} awaiting your confirmation`}
                        </li>
                      )}
                    </ul>
                    <Button
                      variant="link"
                      size="sm"
                      className="px-0 h-auto mt-2 gap-1 text-primary"
                      onClick={() => {
                        document.querySelector('[role="tab"][value="activity"]')?.dispatchEvent(
                          new MouseEvent("click", { bubbles: true })
                        );
                      }}
                    >
                      {isNb ? "Se aktivitetsloggen" : "Open activity log"}
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
