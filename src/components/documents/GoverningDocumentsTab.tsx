import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getControlAreaLabel } from "@/lib/controlAreas";
import {
  docControlArea,
  documentTypeLabel,
  STATUS_LABELS,
  type HubDocument,
} from "@/lib/documentHub";
import type { DocGovernance } from "@/lib/documentGovernance";

interface Props {
  documents: HubDocument[];
  governance: Record<string, DocGovernance>;
  onSelect: (doc: HubDocument) => void;
}

/** Virksomhetens egne vedtatte dokumenter, gruppert etter kontrollområde. */
export function GoverningDocumentsTab({ documents, governance, onSelect }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);

  const groups = useMemo(() => {
    const byArea: Record<string, HubDocument[]> = {};
    documents.forEach((d) => {
      const area = docControlArea(d.documentType);
      byArea[area] ??= [];
      byArea[area].push(d);
    });
    return Object.entries(byArea).sort((a, b) => b[1].length - a[1].length);
  }, [documents]);

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          {L(
            "Ingen dokumenter er merket som styrende ennå. Åpne et dokument i listen og sett klassen «Styrende».",
            "No documents are marked as governing yet. Open a document in the list and set the class to “Governing”.",
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {L(
          "Dokumentene dere selv har vedtatt – deres egen regelbok. Dette er det en revisor spør etter først ved ISO-sertifisering eller NIS2-revisjon.",
          "The documents you have decided yourselves – your own rulebook. This is what an auditor asks for first in an ISO certification or NIS2 audit.",
        )}
      </p>

      {groups.map(([area, docs]) => (
        <div key={area} className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {getControlAreaLabel(area, isNb ? "nb" : "en")}
            </h2>
            <span className="text-[12px] text-muted-foreground">{docs.length}</span>
          </div>
          <div className="rounded-lg border border-border divide-y divide-border overflow-hidden">
            {docs.map((doc) => {
              const g = governance[doc.id] ?? {};
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => onSelect(doc)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">{doc.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {documentTypeLabel(doc.documentType, isNb)}
                      {g.owner ? ` · ${L("Eier", "Owner")}: ${g.owner}` : ""}
                      {g.nextReview
                        ? ` · ${L("Neste gjennomgang", "Next review")}: ${new Date(
                            g.nextReview,
                          ).toLocaleDateString(isNb ? "nb-NO" : "en-GB")}`
                        : ""}
                    </p>
                  </div>
                  {!g.owner && (
                    <Badge variant="outline" className="shrink-0 text-[12px] font-normal">
                      {L("Mangler eier", "No owner")}
                    </Badge>
                  )}
                  <span className="shrink-0 text-[12px] text-muted-foreground">
                    {STATUS_LABELS[doc.status][isNb ? "nb" : "en"]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
