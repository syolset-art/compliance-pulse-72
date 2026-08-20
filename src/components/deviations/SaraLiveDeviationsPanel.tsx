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



  return (
    <div className="rounded-lg border border-border bg-muted/20">
      {/* Compact header line */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2">
        <SaraIcon className="h-4 w-4" />
        <span className="text-[13px] font-medium text-foreground">
          {isNb ? "Sara – lokal agent" : "Sara – local agent"}
        </span>
        <span className="text-xs text-muted-foreground">
          v{SARA_AGENT_VERSION} · {inScope.length} {isNb ? "kobling" : "connection"}
          {inScope.length === 1 ? "" : isNb ? "er" : "s"} · {types.length}{" "}
          {isNb ? "avvikstyper" : "deviation types"} · {SARA_RECENT_DEVIATIONS.length}{" "}
          {isNb ? "funn" : "findings"}
          {criticalCount > 0 && (
            <span className="text-destructive">
              {" "}
              ({criticalCount} {isNb ? "kritiske" : "critical"})
            </span>
          )}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? (isNb ? "Skjul funn" : "Hide findings") : isNb ? "Se funn" : "View findings"}
            {showAll ? <ChevronUp className="ml-1 h-3 w-3" /> : <ChevronDown className="ml-1 h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => navigate("/settings/integrations")}
          >
            <Settings2 className="mr-1 h-3.5 w-3.5" />
            {isNb ? "Om Sara" : "About Sara"}
          </Button>
        </div>
      </div>

      {/* Findings, only on demand */}
      {showAll && (
        <ul className="divide-y divide-border/60 border-t border-border/60 px-3">
          {SARA_RECENT_DEVIATIONS.map((f) => {
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
      )}
    </div>
  );
}

