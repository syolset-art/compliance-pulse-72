import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Upload } from "lucide-react";
import {
  frameworkDocumentationCatalog,
  hasDocumentationCatalog,
} from "@/lib/requirementDocumentationHints";
import { McpDocumentDiscoveryPanel } from "./McpDocumentDiscoveryPanel";
import type { HubDocument } from "@/lib/documentHub";

interface Props {
  frameworks: { framework_id: string; framework_name: string }[];
  documents: HubDocument[];
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

export function GuidingDocumentsTab({ frameworks, documents, onUpload }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);

  const groups = useMemo(
    () =>
      frameworks
        .map((f) => {
          // Foretrekk den kuraterte katalogen; ellers utled forventet dokumentasjon
          // fra kravene i regelverket (frameworkEvidenceExpectations).
          let entries: { key: string; label: string; docs: string[] }[];
          if (hasDocumentationCatalog(f.framework_id)) {
            entries = frameworkDocumentationCatalog(f.framework_id).map((e) => ({
              key: e.requirementId,
              label: e.label,
              docs: e.docs,
            }));
          } else {
            const byArea: Record<string, string[]> = {};
            for (const req of getRequirementsByFramework(f.framework_id)) {
              const area = toCanonicalArea(req.sla_category);
              const label = expectedDocLabel(req, isNb);
              byArea[area] ??= [];
              if (!byArea[area].includes(label)) byArea[area].push(label);
            }
            entries = Object.entries(byArea).map(([area, docs]) => ({
              key: area,
              label: area,
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
        })
        .filter((g) => g.entries.length > 0),
    [frameworks, documents, isNb],
  );



  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {L(
          "Dokumentasjon som er veiledende for regelverkene dere har aktivert. Laster dere opp disse, øker modenheten på kravene de treffer.",
          "Documentation that is guiding for the regulations you have activated. Uploading these increases maturity on the requirements they address.",
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
        groups.map((group) => (
          <div key={group.framework.framework_id} className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground">
                {group.framework.framework_name}
              </h2>
              <Badge variant="outline" className="text-[12px] font-normal">
                {group.entries.reduce(
                  (n, e) => n + e.docs.filter((d) => d.existing).length,
                  0,
                )}
                /{group.entries.reduce((n, e) => n + e.docs.length, 0)}{" "}
                {L("finnes", "present")}
              </Badge>
            </div>

            <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
              {group.entries.map((entry) =>
                entry.docs.map((doc) => (
                  <div
                    key={`${entry.requirementId}-${doc.name}`}
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
          </div>
        ))
      )}

      <McpDocumentDiscoveryPanel />
    </div>
  );
}
