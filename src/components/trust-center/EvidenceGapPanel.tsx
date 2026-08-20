import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Circle, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CoverageSummary } from "@/lib/complianceDocumentCoverage";
import { flattenRequirements } from "@/lib/evidenceIntelligence";

interface Props {
  coverage: CoverageSummary;
  saraInstalled: boolean;
  onUpload: (suggestedName?: string) => void;
  onAskSara: (requirementName: string) => void;
  onOpenDoc?: (docId: string) => void;
}

type Tab = "missing" | "renew" | "covered";

/** Zone 2 — gapet: krav uten dokumentasjon, krav som må fornyes, og krav som er dekket. */
export const EvidenceGapPanel = ({ coverage, saraInstalled, onUpload, onAskSara, onOpenDoc }: Props) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [tab, setTab] = useState<Tab>("missing");

  const all = useMemo(() => flattenRequirements(coverage), [coverage]);
  const rows = useMemo(
    () =>
      all
        .filter((r) => r.state === tab || (tab === "covered" && r.state === "covered"))
        .filter((r) => (tab === "missing" ? r.state === "missing" : tab === "renew" ? r.state === "renew" : r.state === "covered")),
    [all, tab],
  );

  if (coverage.frameworks.length === 0) return null;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "missing", label: isNb ? "Mangler" : "Missing", count: coverage.missing },
    { id: "renew", label: isNb ? "Må fornyes" : "Needs renewal", count: coverage.renew },
    { id: "covered", label: isNb ? "Dekket" : "Covered", count: coverage.covered },
  ];

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm transition-colors",
              tab === t.id ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs text-muted-foreground">{t.count}</span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          {isNb ? "Ingenting her." : "Nothing here."}
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-card">
          {rows.map((r, i) => (
            <div key={`${r.frameworkId}-${r.key}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {r.state === "covered" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              ) : r.state === "renew" ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {r.frameworkName}
                  {r.articleLabel ? ` · ${r.articleLabel}` : ""}
                  {r.doc ? ` · ${r.doc.display_name || r.doc.file_name}` : ""}
                  {r.state === "renew" && (isNb ? r.renewReasonNb : r.renewReasonEn)
                    ? ` · ${isNb ? r.renewReasonNb : r.renewReasonEn}`
                    : ""}
                </p>
              </div>
              {r.alsoRequiredBy.length > 0 && (
                <Badge variant="outline" className="hidden text-[11px] font-normal sm:inline-flex">
                  {isNb ? "Kreves også av" : "Also required by"} {r.alsoRequiredBy.length}
                </Badge>
              )}
              {r.state === "covered" && r.doc ? (
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => r.doc && onOpenDoc?.(r.doc.id)}>
                  {isNb ? "Se dokument" : "View document"}
                </Button>
              ) : saraInstalled ? (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onAskSara(r.name)}>
                  <Sparkles className="h-3.5 w-3.5" />
                  {isNb ? "Be Sara hente" : "Ask Sara to fetch"}
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onUpload(r.name)}>
                  <Plus className="h-3.5 w-3.5" />
                  {isNb ? "Last opp" : "Upload"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
