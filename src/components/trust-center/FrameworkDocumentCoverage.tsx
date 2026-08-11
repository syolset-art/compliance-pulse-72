import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, Circle, ChevronDown, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { CoverageSummary, RequirementCoverage } from "@/lib/complianceDocumentCoverage";

interface Props {
  coverage: CoverageSummary;
  /** Åpner opplastingsdialogen, evt. forhåndsutfylt med dokumentnavn. */
  onUpload: (suggestedName?: string) => void;
  /** Klikk på et koblet dokument. */
  onOpenDoc?: (docId: string) => void;
}

const StateIcon = ({ state }: { state: RequirementCoverage["state"] }) => {
  if (state === "covered") return <CheckCircle2 className="h-4 w-4 text-success shrink-0" />;
  if (state === "renew") return <AlertTriangle className="h-4 w-4 text-warning shrink-0" />;
  return <Circle className="h-4 w-4 text-muted-foreground/60 shrink-0" />;
};

export const FrameworkDocumentCoverage = ({ coverage, onUpload, onOpenDoc }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [frameworkFilter, setFrameworkFilter] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const shown = useMemo(
    () =>
      coverage.frameworks
        .filter((f) => frameworkFilter === "all" || f.frameworkId === frameworkFilter)
        .map((f) => ({
          ...f,
          requirements: onlyMissing
            ? f.requirements.filter((r) => r.state !== "covered")
            : f.requirements,
        })),
    [coverage.frameworks, frameworkFilter, onlyMissing],
  );

  if (coverage.frameworks.length === 0) {
    return (
      <div className="mb-8 rounded-lg border bg-card p-6 text-center">
        <ShieldCheck className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isNb
            ? "Ingen regelverk er aktivert ennå. Aktiver regelverk for å se hvilken dokumentasjon som kreves."
            : "No frameworks activated yet. Activate frameworks to see which documentation is required."}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <Link to="/regulations">{isNb ? "Gå til regelverk" : "Go to frameworks"}</Link>
        </Button>
      </div>
    );
  }

  const pct = coverage.total > 0 ? Math.round((coverage.covered / coverage.total) * 100) : 0;

  return (
    <div className="mb-8 space-y-4">
      {/* Sammendrag */}
      <div className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {isNb ? "Påkrevd compliance-dokumentasjon" : "Required compliance documentation"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isNb
                ? `${coverage.covered} av ${coverage.total} påkrevde dokumenter er på plass`
                : `${coverage.covered} of ${coverage.total} required documents in place`}
              {coverage.renew > 0 && (
                <> · <span className="text-warning">{coverage.renew} {isNb ? "må fornyes" : "need renewal"}</span></>
              )}
              {coverage.missing > 0 && (
                <> · <span className="text-destructive">{coverage.missing} {isNb ? "mangler" : "missing"}</span></>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="only-missing" checked={onlyMissing} onCheckedChange={setOnlyMissing} />
              <Label htmlFor="only-missing" className="text-xs text-muted-foreground">
                {isNb ? "Vis kun mangler" : "Show gaps only"}
              </Label>
            </div>
            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger className="h-8 w-[190px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isNb ? "Alle regelverk" : "All frameworks"}</SelectItem>
                {coverage.frameworks.map((f) => (
                  <SelectItem key={f.frameworkId} value={f.frameworkId}>
                    {f.frameworkName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Progress value={pct} className="mt-3 h-1.5" />
      </div>

      {/* Per regelverk */}
      {shown.map((f) => {
        const open = openMap[f.frameworkId] ?? f.missing + f.renew > 0;
        const fpct = f.total > 0 ? Math.round((f.covered / f.total) * 100) : 0;
        return (
          <Collapsible
            key={f.frameworkId}
            open={open}
            onOpenChange={(v) => setOpenMap((p) => ({ ...p, [f.frameworkId]: v }))}
            className="rounded-lg border bg-card"
          >
            <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-4 text-left">
              <div className="flex min-w-0 items-center gap-3">
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                <span className="truncate font-medium">{f.frameworkName}</span>
                <Badge variant="outline" className="shrink-0 text-[12px] font-normal">
                  {f.covered}/{f.total} {isNb ? "på plass" : "in place"}
                </Badge>
                {f.renew > 0 && (
                  <Badge className="shrink-0 border-warning/30 bg-warning/15 text-[12px] font-normal text-warning">
                    {f.renew} {isNb ? "må fornyes" : "to renew"}
                  </Badge>
                )}
                {f.missing > 0 && (
                  <Badge className="shrink-0 border-destructive/30 bg-destructive/10 text-[12px] font-normal text-destructive">
                    {f.missing} {isNb ? "mangler" : "missing"}
                  </Badge>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{fpct}%</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y border-t">
                {f.requirements.length === 0 && (
                  <p className="p-4 text-sm text-muted-foreground">
                    {isNb ? "Ingen mangler for dette regelverket." : "No gaps for this framework."}
                  </p>
                )}
                {f.requirements.map((r) => (
                  <div key={r.key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
                    <StateIcon state={r.state} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.state !== "missing" && r.doc && onOpenDoc ? (
                          <button
                            type="button"
                            onClick={() => onOpenDoc(r.doc!.id)}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {r.name}
                          </button>
                        ) : (
                          <span className={cn("truncate text-sm", r.state === "missing" ? "text-foreground" : "font-medium")}>
                            {r.name}
                          </span>
                        )}
                        {r.alsoRequiredBy.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            {isNb ? "dekker også" : "also covers"} {r.alsoRequiredBy.join(", ")}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.articleLabel}
                        {r.doc && ` · ${r.doc.display_name || r.doc.file_name}`}
                        {r.state === "renew" && ` · ${isNb ? r.renewReasonNb : r.renewReasonEn}`}
                      </p>
                    </div>
                    {r.state === "missing" && (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onUpload(r.name)}>
                          <Plus className="h-3 w-3" />
                          {isNb ? "Last opp" : "Upload"}
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-primary" onClick={() => onUpload(r.name)}>
                          <Sparkles className="h-3 w-3" />
                          {isNb ? "Lara-utkast" : "Lara draft"}
                        </Button>
                      </div>
                    )}
                    {r.state === "renew" && (
                      <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={() => onUpload(r.name)}>
                        {isNb ? "Last opp ny versjon" : "Upload new version"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};
