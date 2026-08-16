import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2, Circle, AlertCircle, FileText, ShieldCheck,
  FileSignature, ClipboardCheck, ExternalLink, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTROL_AREA_BY_KEY, toCanonicalArea, type ControlAreaKey } from "@/lib/controlAreas";
import {
  REQUIREMENT_CATEGORY_GROUPS,
  categoryGroupLabel,
  requirementCategoryGroup,
  documentControlArea,
  isResourceDocument,
  type RequirementCategoryGroup,
} from "@/lib/controlAreaMapping";
import { useDocumentHub } from "@/hooks/useDocumentHub";
import {
  MODULE_LABELS, STATUS_LABELS, documentTypeLabel, typeGroup,
  type HubDocument,
} from "@/lib/documentHub";
import { getFrameworkById } from "@/lib/frameworkDefinitions";

interface Props {
  areaKey: ControlAreaKey | null;
  onOpenChange: (open: boolean) => void;
  requirements: any[];
  score: number;
  levelLabel: string;
  levelTextClass: string;
  levelProgressClass: string;
}

type StatusFilter = "all" | "fulfilled" | "remaining";

const TYPE_ICON: Record<string, typeof FileText> = {
  certification: ShieldCheck,
  policy: FileText,
  agreement: FileSignature,
  report: ClipboardCheck,
  evidence: CheckCircle2,
  other: FileText,
};

function isFulfilled(status: string) {
  return status === "completed" || status === "verified";
}

export function ControlAreaDetailSheet({
  areaKey, onOpenChange, requirements, score,
  levelLabel, levelTextClass, levelProgressClass,
}: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const { documents } = useDocumentHub();

  const [catFilter, setCatFilter] = useState<RequirementCategoryGroup | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const area = areaKey ? CONTROL_AREA_BY_KEY[areaKey] : null;

  const areaRequirements = useMemo(() => {
    if (!areaKey) return [];
    return requirements.filter((r) => toCanonicalArea(r.sla_category) === areaKey);
  }, [requirements, areaKey]);

  const filtered = useMemo(() => {
    return areaRequirements.filter((r) => {
      if (catFilter !== "all" && requirementCategoryGroup(r.category) !== catFilter) return false;
      if (statusFilter === "fulfilled" && !isFulfilled(r.status)) return false;
      if (statusFilter === "remaining" && isFulfilled(r.status)) return false;
      return true;
    });
  }, [areaRequirements, catFilter, statusFilter]);

  const fulfilledCount = areaRequirements.filter((r) => isFulfilled(r.status)).length;

  const areaDocuments: HubDocument[] = useMemo(() => {
    if (!areaKey) return [];
    return documents
      .filter(isResourceDocument)
      .filter((d) => documentControlArea(d) === areaKey);
  }, [documents, areaKey]);

  const catCounts = useMemo(() => {
    const map: Record<string, number> = {};
    areaRequirements.forEach((r) => {
      const g = requirementCategoryGroup(r.category);
      map[g] = (map[g] || 0) + 1;
    });
    return map;
  }, [areaRequirements]);

  const AreaIcon = area?.icon ?? FileText;

  return (
    <Sheet open={!!areaKey} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0">
        {area && (
          <>
            <SheetHeader className="p-5 pb-4 space-y-3 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <AreaIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base">
                    {isNb ? area.labelNb : area.labelEn}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {isNb ? area.descriptionNb : area.descriptionEn}
                  </SheetDescription>
                </div>
                <div className="text-right shrink-0">
                  <div className={cn("text-lg font-bold tabular-nums", levelTextClass)}>{score}%</div>
                  <div className={cn("text-[10px] font-semibold uppercase tracking-wider", levelTextClass)}>
                    {levelLabel}
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Progress value={score} className={cn("h-2", levelProgressClass)} />
                <p className="text-xs text-muted-foreground">
                  {fulfilledCount}/{areaRequirements.length} {isNb ? "krav oppfylt" : "requirements fulfilled"}
                  {" · "}
                  {areaDocuments.length} {isNb ? "dokumenter" : "documents"}
                </p>
              </div>
            </SheetHeader>

            <Tabs defaultValue="controls" className="flex-1 flex flex-col min-h-0">
              <div className="px-5 pt-4">
                <TabsList className="w-full">
                  <TabsTrigger value="controls" className="flex-1 text-xs">
                    {isNb ? "Kontroller" : "Controls"} ({areaRequirements.length})
                  </TabsTrigger>
                  <TabsTrigger value="resources" className="flex-1 text-xs">
                    {isNb ? "Ressurser" : "Resources"} ({areaDocuments.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Kontroller */}
              <TabsContent value="controls" className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 mt-0">
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill
                    active={catFilter === "all"}
                    onClick={() => setCatFilter("all")}
                    label={`${isNb ? "Alle" : "All"} (${areaRequirements.length})`}
                  />
                  {REQUIREMENT_CATEGORY_GROUPS.filter((g) => (catCounts[g.key] || 0) > 0).map((g) => (
                    <FilterPill
                      key={g.key}
                      active={catFilter === g.key}
                      onClick={() => setCatFilter(g.key)}
                      label={`${categoryGroupLabel(g.key, isNb)} (${catCounts[g.key]})`}
                    />
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(["all", "fulfilled", "remaining"] as StatusFilter[]).map((s) => (
                    <FilterPill
                      key={s}
                      active={statusFilter === s}
                      onClick={() => setStatusFilter(s)}
                      label={
                        s === "all" ? (isNb ? "Alle statuser" : "All statuses")
                          : s === "fulfilled" ? (isNb ? "Oppfylt" : "Fulfilled")
                            : (isNb ? "Gjenstår" : "Remaining")
                      }
                    />
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">
                    {isNb ? "Ingen krav med dette filteret." : "No requirements match this filter."}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filtered.map((req) => {
                      const done = isFulfilled(req.status);
                      const inProgress = req.status === "in_progress";
                      const Icon = done ? CheckCircle2 : inProgress ? AlertCircle : Circle;
                      const fw = getFrameworkById(req.framework_id);
                      return (
                        <div
                          key={`${req.framework_id}-${req.requirement_id}`}
                          className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2"
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 mt-0.5 shrink-0",
                              done ? "text-success" : inProgress ? "text-warning" : "text-muted-foreground/40",
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-foreground leading-snug">
                              {isNb ? (req.name_no || req.name) : req.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {req.requirement_id}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                · {fw?.name || req.framework_id}
                              </span>
                              <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                {categoryGroupLabel(requirementCategoryGroup(req.category), isNb)}
                              </Badge>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px] shrink-0",
                              done && "border-success/30 text-success",
                              inProgress && "border-warning/30 text-warning",
                            )}
                          >
                            {done ? (isNb ? "Oppfylt" : "Fulfilled")
                              : inProgress ? (isNb ? "Pågår" : "In progress")
                                : (isNb ? "Ikke påbegynt" : "Not started")}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Ressurser */}
              <TabsContent value="resources" className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 mt-0">
                <p className="text-xs text-muted-foreground">
                  {isNb
                    ? "Sertifikater, policyer og avtaler som er bekreftet som dokumentasjon for dette kontrollområdet."
                    : "Certificates, policies and agreements confirmed as documentation for this control area."}
                </p>
                {areaDocuments.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {isNb
                        ? "Ingen dokumentasjon er knyttet til dette kontrollområdet ennå."
                        : "No documentation is linked to this control area yet."}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => navigate("/documents")}>
                      {isNb ? "Last opp dokumentasjon" : "Upload documentation"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {areaDocuments.map((doc) => {
                      const group = typeGroup(doc.documentType);
                      const Icon = TYPE_ICON[group] || FileText;
                      return (
                        <button
                          key={doc.id}
                          onClick={() => navigate(doc.sourceRoute || "/documents")}
                          className="w-full flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 px-3 py-2 text-left hover:bg-muted/40 hover:border-primary/40 transition-colors"
                        >
                          <Icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[11px] text-muted-foreground">
                                {documentTypeLabel(doc.documentType, isNb)}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                · {MODULE_LABELS[doc.module][isNb ? "nb" : "en"]}
                              </span>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 px-1.5 text-[10px] shrink-0",
                              doc.status === "current" && "border-success/30 text-success",
                              doc.status === "expiring" && "border-warning/30 text-warning",
                              doc.status === "expired" && "border-destructive/30 text-destructive",
                            )}
                          >
                            {STATUS_LABELS[doc.status][isNb ? "nb" : "en"]}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between text-xs"
                  onClick={() => navigate("/documents")}
                >
                  {isNb ? "Se alle dokumenter" : "See all documents"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </TabsContent>
            </Tabs>

            <div className="border-t border-border p-4">
              <Button className="w-full" size="sm" onClick={() => navigate("/regulations")}>
                {isNb ? "Jobb med kravene i regelverk" : "Work on requirements in regulations"}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function FilterPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:bg-muted/50",
      )}
    >
      {label}
    </button>
  );
}
