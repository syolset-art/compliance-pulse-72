import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Shield, ChevronDown, ChevronUp, UserCheck } from "lucide-react";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  demoUiStateFor,
  formatEvidenceLabel,
  getEvidenceConfig,
  getProgressConfig,
  type RequirementUiState,
} from "@/lib/requirementStatusModel";
import { cn } from "@/lib/utils";

interface VendorControlsTabProps {
  assetId: string;
}

const AREA_META: Record<string, { labelNb: string; labelEn: string; color: string }> = {
  governance: { labelNb: "Styring", labelEn: "Governance", color: "text-primary" },
  operations: { labelNb: "Drift og sikkerhet", labelEn: "Drift og sikkerhet", color: "text-status-closed" },
  identityAccess: { labelNb: "Personvern og datahåndtering", labelEn: "Privacy & Data Handling", color: "text-accent" },
  vendor: { labelNb: "Tredjepart og verdikjede", labelEn: "Third-Party & Supply Chain", color: "text-warning" },
};

/** Utled ui-state fra kontrollens rå status. */
function uiFor(c: { key: string; status: string }): RequirementUiState {
  if (c.status === "implemented") return demoUiStateFor(c.key, 1);
  if (c.status === "partial") return demoUiStateFor(c.key, 5);
  return { progress: "not_answered", evidence: "required" };
}


export const VendorControlsTab = ({ assetId }: VendorControlsTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(assetId);
  const [openAreas, setOpenAreas] = useState<Record<string, boolean>>({});

  if (!evaluation) {
    return <p className="text-sm text-muted-foreground italic p-4">{isNb ? "Laster…" : "Loading…"}</p>;
  }

  const { allControls, trustScore, implementedCount, partialCount, missingCount } = evaluation;
  const total = allControls.length;

  const areas = Object.keys(AREA_META);
  const areaGroups = areas.map(area => {
    const controls = allControls.filter(c => c.area === area);
    if (controls.length === 0) return null;
    const score = evaluation.areaScore(area as any);
    return { area, controls, score, ...AREA_META[area] };
  }).filter(Boolean) as { area: string; controls: any[]; score: number; labelNb: string; labelEn: string; color: string }[];

  const toggle = (area: string) => setOpenAreas(prev => ({ ...prev, [area]: !prev[area] }));

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{isNb ? "Total score" : "Overall score"}</span>
            </div>
            <span className="text-2xl font-bold">{trustScore}%</span>
            <Progress value={trustScore} className="flex-1 h-2" />
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" />{implementedCount}</span>
              <span className="flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-warning" />{partialCount}</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" />{missingCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain sections */}
      {areaGroups.map(({ area, controls, score, labelNb: lNb, labelEn: lEn, color }) => (
        <Collapsible key={area} open={openAreas[area] ?? false} onOpenChange={() => toggle(area)}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold text-sm ${color}`}>{isNb ? lNb : lEn}</span>
                    <Badge variant="outline" className="text-xs">{controls.length} {isNb ? "kontroller" : "controls"}</Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{score}%</span>
                    <Progress value={score} className="w-20 h-1.5" />
                    {openAreas[area] ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-0 pb-0">
                {controls.map((c: any) => {
                  const ui = uiFor(c);
                  const progressCfg = getProgressConfig(ui.progress);
                  const evidenceCfg = getEvidenceConfig(ui.evidence);
                  const ProgressIcon = progressCfg.icon;
                  const EvidenceIcon = evidenceCfg.icon;
                  const isMuted = ui.progress === "not_applicable" || ui.evidence === "out_of_scope";
                  return (
                    <TooltipProvider key={c.key} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn(
                            "flex items-center justify-between px-4 py-2.5 border-t cursor-pointer hover:bg-muted/30 transition-colors",
                            isMuted && "opacity-60",
                          )}>
                            <div className="flex flex-col min-w-0 gap-0.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <ProgressIcon className={cn("h-4 w-4 shrink-0", progressCfg.iconClass)} />
                                <span className="text-sm truncate">{isNb ? c.labelNb : c.labelEn}</span>
                              </div>
                              {ui.attestedBy && (
                                <span className="text-xs text-success flex items-center gap-1 pl-6">
                                  <UserCheck className="h-3 w-3" />
                                  {isNb ? "Attestert av" : "Attested by"} {ui.attestedBy.name} ({ui.attestedBy.role}) · {ui.attestedBy.date}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {ui.evidence !== "self_reported" && (
                                <Badge variant="outline" className={cn("gap-1 text-xs font-medium", evidenceCfg.badgeClass)}>
                                  <EvidenceIcon className="h-3 w-3" />
                                  {formatEvidenceLabel(ui, isNb)}
                                </Badge>
                              )}
                              {ui.evidenceCount && (
                                <Badge variant="outline" className="text-xs font-mono tabular-nums text-muted-foreground">
                                  {ui.evidenceCount.collected}/{ui.evidenceCount.required}
                                </Badge>
                              )}
                              <Badge variant="outline" className={cn("gap-1 text-xs font-medium", progressCfg.badgeClass)}>
                                {isNb ? progressCfg.labelNb : progressCfg.labelEn}
                              </Badge>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs">
                            {isNb ? "Klikk på kravet for å lese mer og utføre oppgaven" : "Click the requirement to read more and complete the task"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}

              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </div>
  );
};
