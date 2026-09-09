import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

/** Virksomhetens egne vedtatte dokumenter — én rad per dokument. */
export function GoverningDocumentsTab({ documents, governance, onSelect }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const L = (nb: string, en: string) => (isNb ? nb : en);

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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {L(
          "Dokumentene dere selv har vedtatt – deres egen regelbok. Dette er det en revisor spør etter først ved ISO-sertifisering eller NIS2-revisjon.",
          "The documents you have decided yourselves – your own rulebook. This is what an auditor asks for first in an ISO certification or NIS2 audit.",
        )}
      </p>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{L("Dokument", "Document")}</TableHead>
              <TableHead className="hidden sm:table-cell">{L("Kontrollområde", "Control area")}</TableHead>
              <TableHead className="hidden md:table-cell">{L("Eier", "Owner")}</TableHead>
              <TableHead className="hidden lg:table-cell">{L("Neste gjennomgang", "Next review")}</TableHead>
              <TableHead>{L("Status", "Status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => {
              const g = governance[doc.id] ?? {};
              return (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer"
                  onClick={() => onSelect(doc)}
                >
                  <TableCell className="py-2">
                    <p className="truncate text-[13px] font-medium text-foreground">{doc.name}</p>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {documentTypeLabel(doc.documentType, isNb)}
                    </p>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell py-2 text-[13px] text-muted-foreground">
                    {getControlAreaLabel(docControlArea(doc.documentType), isNb ? "nb" : "en")}
                  </TableCell>
                  <TableCell className="hidden md:table-cell py-2 text-[13px]">
                    {g.owner ? (
                      <span className="text-foreground">{g.owner}</span>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">
                        {L("Mangler eier", "No owner")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell py-2 text-[13px] text-muted-foreground">
                    {g.nextReview
                      ? new Date(g.nextReview).toLocaleDateString(isNb ? "nb-NO" : "en-GB")
                      : "—"}
                  </TableCell>
                  <TableCell className="py-2 text-[12px] text-muted-foreground">
                    {STATUS_LABELS[doc.status][isNb ? "nb" : "en"]}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
