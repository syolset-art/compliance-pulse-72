import { Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText } from "lucide-react";
import { documentsForAudience } from "@/content/legal";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { useTerms } from "@/hooks/useTerms";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" });

export default function Documents() {
  const { mode } = useWorkspaceMode();
  const { currentByType, acceptedAtFor } = useTerms();
  const docs = documentsForAudience(mode === "partner");

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16">
        <div className="mx-auto max-w-3xl space-y-6 px-6 pb-16">
          <header>
            <h1 className="text-2xl font-semibold text-foreground">Dokumenter</h1>
            <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
              Her finner du vilkårene som gjelder for din bruk av Mynder. Du kan lese hele
              teksten, se hvilken versjon som gjelder, og når du eventuelt godtok den.
            </p>
          </header>

          <ul className="space-y-3">
            {docs.map((doc) => {
              const dbDoc = currentByType[doc.docType];
              const accepted = acceptedAtFor(dbDoc?.id);
              return (
                <li key={doc.slug}>
                  <Link
                    to={`/dokumenter/${doc.slug}`}
                    className="flex items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{doc.title}</span>
                        <Badge variant="secondary" className="text-[11px]">{doc.status}</Badge>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Versjon {doc.version} · Sist oppdatert {doc.lastUpdatedLabel}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        Gjelder for: {doc.appliesTo}
                      </span>
                      {accepted && (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          Godtatt av deg {formatDate(accepted)} (versjon {dbDoc?.version})
                        </span>
                      )}
                    </span>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </div>
  );
}
