import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CheckCircle2, ChevronDown, Circle, Upload } from "lucide-react";
import {
  frameworkDocumentationCatalog,
  hasDocumentationCatalog,
} from "@/lib/requirementDocumentationHints";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { toCanonicalArea, getControlAreaLabel } from "@/lib/controlAreas";
import { expectedDocLabel } from "@/lib/frameworkEvidenceExpectations";

import type { HubDocument } from "@/lib/documentHub";

interface Props {
  frameworks: { framework_id: string; framework_name: string }[];
  documents: HubDocument[];
  /** Eksterne standarder/veiledere dere har lastet opp – vises lavprofil nederst. */
  guidanceDocs?: HubDocument[];
  onUpload: (preset: { name: string; frameworkId: string }) => void;
}

function normalise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .split(/[^a-zà-ÿ0-9]+/i)
    .filter((t) => t.length > 2);
}

/** Finnes dokumentet allerede i huben? Enkel navnematching. */
function findExisting(docName: string, documents: HubDocument[]): HubDocument | undefined {
  const wanted = normalise(docName);
  if (!wanted.length) return undefined;
  return documents.find((d) => {
    const hay = normalise(`${d.name} ${d.fileName ?? ""}`);
    const hits = wanted.filter((w) => hay.some((h) => h.includes(w) || w.includes(h)));
    return hits.length / wanted.length >= 0.5;
  });
}

export function GuidingDocumentsTab({ frameworks, documents, guidanceDocs = [], onUpload }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);

  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  const groups = useMemo(
    () =>
      frameworks.map((f) => {
        // Regelverk-IDer i basen matcher ikke alltid katalognøklene.
        const catalogId = FRAMEWORK_ID_ALIASES[f.framework_id] ?? f.framework_id;

        // Foretrekk den kuraterte katalogen; ellers utled forventet dokumentasjon
        // fra kravene i regelverket (frameworkEvidenceExpectations).
        let entries: { key: string; label: string; docs: string[] }[] = [];
        if (hasDocumentationCatalog(catalogId)) {
          entries = frameworkDocumentationCatalog(catalogId).map((e) => ({
            key: e.requirementId,
            label: e.label,
            docs: e.docs,
          }));
        } else {
          const byArea: Record<string, string[]> = {};
          for (const req of getRequirementsByFramework(catalogId)) {
            const area = toCanonicalArea(req.sla_category);
            const label = expectedDocLabel(req, isNb);
            byArea[area] ??= [];
            if (!byArea[area].includes(label)) byArea[area].push(label);
          }
          entries = Object.entries(byArea).map(([area, docs]) => ({
            key: area,
            label: getControlAreaLabel(area, isNb ? "nb" : "en"),
            docs,
          }));
        }

        return {
          framework: f,
          entries: entries.map((entry) => ({
            ...entry,
            docs: entry.docs.map((d) => ({ name: d, existing: findExisting(d, documents) })),
          })),
        };
      }),
    [frameworks, documents, isNb],
  );




  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {L(
          "Forventet dokumentasjon for regelverkene dere har aktivert. Laster dere opp disse, øker modenheten på kravene de treffer.",
          "Expected documentation for the regulations you have activated. Uploading these increases maturity on the requirements they address.",
        )}
      </p>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {L(
              "Aktiver et regelverk for å se hvilken dokumentasjon som er veiledende.",
              "Activate a regulation to see which documentation is guiding.",
            )}
          </CardContent>
        </Card>
      ) : (
        groups.map((group) => {
          const fwId = group.framework.framework_id;
          const present = group.entries.reduce(
            (n, e) => n + e.docs.filter((d) => d.existing).length,
            0,
          );
          const total = group.entries.reduce((n, e) => n + e.docs.length, 0);
          const isOpen = openGroups.has(fwId);

          return (
            <Collapsible
              key={fwId}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenGroups((prev) => {
                  const next = new Set(prev);
                  if (open) next.add(fwId);
                  else next.delete(fwId);
                  return next;
                });
              }}
              className="rounded-lg border border-border overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-sm font-semibold text-foreground truncate">
                      {group.framework.framework_name}
                    </h2>
                    <Badge variant="outline" className="text-[12px] font-normal shrink-0">
                      {present}/{total} {L("finnes", "present")}
                    </Badge>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="divide-y divide-border border-t border-border">
                  {group.entries.map((entry) =>
                    entry.docs.map((doc) => (
                      <div
                        key={`${entry.key}-${doc.name}`}
                        className="flex items-center gap-3 px-3 py-2"
                      >
                        {doc.existing ? (
                          <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-hidden="true" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-foreground truncate">{doc.name}</p>
                          <p className="text-[12px] text-muted-foreground truncate">{entry.label}</p>
                        </div>
                        {doc.existing ? (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-success bg-success/10 text-foreground text-[12px] font-normal"
                          >
                            {L("Finnes", "Present")}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className="border-border bg-muted text-foreground text-[12px] font-normal"
                            >
                              {L("Mangler", "Missing")}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1.5 shrink-0"
                              onClick={() =>
                                onUpload({ name: doc.name, frameworkId: group.framework.framework_id })
                              }
                            >
                              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                              {L("Last opp", "Upload")}
                            </Button>
                          </div>
                        )}
                      </div>
                    )),
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })
      )}

      {guidanceDocs.length > 0 && (
        <div className="space-y-1.5 pt-2">
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">
            {L("Veiledende kilder", "Guidance sources")}
          </h2>
          <p className="text-[12px] text-muted-foreground">
            {L(
              "Eksterne standarder og veiledere dere støtter dere på. Ikke bindende for dere.",
              "External standards and guides you rely on. Not binding for you.",
            )}
          </p>
          <ul className="space-y-0.5 pt-1">
            {guidanceDocs.map((d) => (
              <li key={d.id} className="truncate text-[13px] text-muted-foreground">
                {d.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
