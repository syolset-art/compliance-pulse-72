import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import {
  SARA_MONITORED_SYSTEMS,
  SARA_RECENT_DEVIATIONS,
  getSaraDeviationTypes,
} from "@/lib/saraDeviationScope";
import { SARA_AGENT_VERSION } from "@/lib/saraScope";

interface Props {
  isNb?: boolean;
}

const severityLabel: Record<string, { nb: string; en: string; cls: string }> = {
  critical: { nb: "Kritisk", en: "Critical", cls: "text-destructive border-destructive/30 bg-destructive/10" },
  high: { nb: "Høy", en: "High", cls: "text-warning border-warning/30 bg-warning/10" },
  medium: { nb: "Middels", en: "Medium", cls: "text-warning border-warning/30 bg-warning/10" },
  low: { nb: "Lav", en: "Low", cls: "text-muted-foreground border-border" },
};

export function SaraLiveDeviationsPanel({ isNb = true }: Props) {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  const { data: activeFrameworkIds = [] } = useQuery({
    queryKey: ["sara-active-frameworks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("selected_frameworks")
        .select("framework_id, is_selected")
        .eq("is_selected", true);
      return (data || []).map((f: any) => f.framework_id as string);
    },
  });

  const types = getSaraDeviationTypes(activeFrameworkIds);
  const inScope = SARA_MONITORED_SYSTEMS.filter((s) => s.status === "connected");
  const criticalCount = SARA_RECENT_DEVIATIONS.filter((d) => d.severity === "critical").length;

  const stats = [
    { value: inScope.length, nb: "Koblinger", en: "Connections" },
    { value: types.length, nb: "Avvikstyper", en: "Deviation types" },
    { value: SARA_RECENT_DEVIATIONS.length, nb: "Funn", en: "Findings" },
    { value: criticalCount, nb: "Kritiske", en: "Critical", alert: criticalCount > 0 },
  ];

  const visible = showAll ? SARA_RECENT_DEVIATIONS : SARA_RECENT_DEVIATIONS.slice(0, 3);

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/[0.03]">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border/60 px-3 py-2">
        <SaraIcon className="h-5 w-5" />
        <span className="text-sm font-medium text-foreground">
          {isNb ? "Sara – lokal agent" : "Sara – local agent"}
        </span>
        <span className="text-xs text-muted-foreground">
          v{SARA_AGENT_VERSION} · {isNb ? "sist kjørt" : "last run"} {inScope[0]?.lastRun ?? "—"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs text-primary"
          onClick={() => navigate("/settings/integrations")}
        >
          <Settings2 className="mr-1 h-3.5 w-3.5" />
          {isNb ? "Innstillinger for Sara" : "Sara settings"}
        </Button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 divide-x divide-y divide-border/60 sm:grid-cols-4 sm:divide-y-0">
        {stats.map((s) => (
          <div key={s.nb} className="px-3 py-2.5">
            <p className={cn("text-lg font-semibold leading-none", s.alert ? "text-destructive" : "text-foreground")}>
              {s.value}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              {isNb ? s.nb : s.en}
            </p>
          </div>
        ))}
      </div>

      {/* Latest findings */}
      <div className="border-t border-border/60 px-3 py-2">
        <p className="mb-1 text-xs font-medium text-foreground">
          {isNb ? "Siste avvik fra Sara" : "Latest deviations from Sara"}
        </p>
        <ul className="divide-y divide-border/60">
          {visible.map((f) => {
            const sev = severityLabel[f.severity];
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-xs">
                <span className="font-medium text-foreground">{f.summary}</span>
                <Badge variant="outline" className={cn("text-[11px] font-normal", sev.cls)}>
                  {isNb ? sev.nb : sev.en}
                </Badge>
                <span className="w-full text-muted-foreground sm:ml-auto sm:w-auto">
                  {f.system} · {f.owner} · {f.at}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex items-center gap-2">
          {SARA_RECENT_DEVIATIONS.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll
                ? isNb ? "Vis færre" : "Show fewer"
                : isNb ? `Vis alle (${SARA_RECENT_DEVIATIONS.length})` : `Show all (${SARA_RECENT_DEVIATIONS.length})`}
              {showAll ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => navigate("/settings/integrations")}
          >
            {isNb ? "Koblinger, avvikstyper og personverngrense" : "Connections, deviation types and privacy boundary"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
