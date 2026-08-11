import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileText, ListChecks, Send, Info } from "lucide-react";
import { LaraAvatar } from "@/components/asset-profile/LaraAvatar";
import { cn } from "@/lib/utils";
import {
  CRITICALITY_STYLE,
  type VendorFrameworkAction,
} from "@/lib/vendorFrameworkSuggestions";

interface Props {
  actions: VendorFrameworkAction[];
  onRequestDocumentation: (action: VendorFrameworkAction) => void;
  onCreateActivity: (action: VendorFrameworkAction) => void;
  onRequestAllMissing: () => void;
}

/**
 * Anbefalte tiltak utledet av regelverkene leverandøren skal etterleve.
 * Hvert tiltak viser hvilket krav det dekker og kan handles på direkte.
 */
export function VendorRecommendedActionsCard({
  actions,
  onRequestDocumentation,
  onCreateActivity,
  onRequestAllMissing,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const criticalCount = actions.filter((a) => a.criticality === "kritisk").length;
  const docCount = actions.filter((a) => a.documentType).length;
  // Hold listen kort — Lara viser de viktigste tiltakene først.
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? actions : actions.slice(0, 4);

  return (
    <Card className="p-5 flex flex-col">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 basis-[60%] flex items-start gap-2">
          <LaraAvatar size={28} />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">
              {isNb ? "Anbefalte tiltak" : "Recommended actions"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNb
                ? `${actions.length} tiltak · ${criticalCount} kritiske — utledet av regelverkene til venstre.`
                : `${actions.length} actions · ${criticalCount} critical — derived from the frameworks on the left.`}
            </p>
          </div>
        </div>
        {docCount > 0 && (
          <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onRequestAllMissing}>
            <Send className="h-3 w-3 mr-1" />
            {isNb ? "Be om alt som mangler" : "Request all missing"}
          </Button>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {isNb
              ? "Legg til et regelverk til venstre, så foreslår Lara tiltak her."
              : "Add a framework on the left and Lara will suggest actions here."}
          </p>
        )}

        {visible.map((a) => {
          const crit = CRITICALITY_STYLE[a.criticality];
          return (
            <div
              key={a.id}
              className="rounded-lg border border-border p-3 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">
                    {isNb ? a.titleNb : a.titleEn}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isNb ? "Dekker" : "Covers"}: {a.requirement}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      crit.className,
                    )}
                  >
                    {isNb ? crit.nb : crit.en}
                  </span>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span tabIndex={0} className="text-muted-foreground cursor-help">
                          <Info className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[280px] text-xs leading-relaxed">
                        {isNb ? a.reasonNb : a.reasonEn}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {a.documentType && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => onRequestDocumentation(a)}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    {isNb ? "Be om dokumentasjon" : "Request documentation"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-primary"
                  onClick={() => onCreateActivity(a)}
                >
                  <ListChecks className="h-3 w-3 mr-1" />
                  {isNb ? "Opprett aktivitet" : "Create activity"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
