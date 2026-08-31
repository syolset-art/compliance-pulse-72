import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Printer } from "lucide-react";
import { getLegalDocument } from "@/content/legal";
import { LegalMarkdown, extractToc } from "@/components/legal/LegalMarkdown";
import { useTerms } from "@/hooks/useTerms";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

export default function LegalDocumentPage() {
  const { slug } = useParams();
  const doc = getLegalDocument(slug);
  const { currentByType, acceptedAtFor } = useTerms();
  const toc = useMemo(() => (doc ? extractToc(doc.markdown) : []), [doc]);

  if (!doc) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 pt-16">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-sm text-muted-foreground">Fant ikke dokumentet.</p>
            <Link to="/dokumenter" className="text-sm text-primary underline underline-offset-2">
              Tilbake til Dokumenter
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const dbDoc = currentByType[doc.docType];
  const accepted = acceptedAtFor(dbDoc?.id);

  return (
    <div className="flex min-h-screen bg-background">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto pt-16 print:pt-0">
        <article className="mx-auto max-w-[75ch] px-6 pb-20 print:max-w-none print:px-0">
          <Link
            to="/dokumenter"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground print:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Dokumenter
          </Link>

          <header className="mt-3 space-y-2 border-b border-border pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{doc.title}</h1>
              <Badge variant="secondary" className="text-[11px]">{doc.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Versjon {doc.version} · Sist oppdatert {doc.lastUpdatedLabel}
            </p>
            <p className="text-xs text-muted-foreground">Gjelder for: {doc.appliesTo}</p>
            {accepted && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                Du godtok versjon {dbDoc?.version} den {formatDate(accepted)}
              </p>
            )}
            <div className="pt-1 print:hidden">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                Skriv ut eller lagre som PDF
              </Button>
            </div>
          </header>

          {toc.length > 0 && (
            <nav aria-label="Innholdsfortegnelse" className="mt-6 rounded-lg border border-border p-4">
              <h2 className="text-sm font-semibold text-foreground">Innhold</h2>
              <ol className="mt-2 space-y-1">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          <div className="mt-8">
            <LegalMarkdown markdown={doc.markdown} />
          </div>
        </article>
      </main>
    </div>
  );
}
