import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTerms, type LegalDocType } from "@/hooks/useTerms";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Download, History, Loader2 } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DOCS: { type: LegalDocType; label: string }[] = [
  { type: "terms", label: "Vilkår" },
  { type: "privacy", label: "Personvernerklæring" },
  { type: "dpa", label: "Databehandleravtale" },
];

const CONTEXT_LABELS: Record<string, string> = {
  module_activation: "Aktivering av modul",
  license_purchase: "Kjøp av lisens",
  framework_activation: "Aktivering av regelverk",
  signup: "Registrering",
  settings: "Innstillinger",
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Legal() {
  const [params, setParams] = useSearchParams();
  const { currentByType, acceptances, acceptedAtFor, loading } = useTerms();
  const initial = (params.get("doc") as LegalDocType) || "terms";
  const [tab, setTab] = useState<LegalDocType>(
    DOCS.some((d) => d.type === initial) ? initial : "terms"
  );
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    const next = new URLSearchParams(params);
    next.set("doc", tab);
    setParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16">
      <div className="max-w-3xl mx-auto px-6 pb-16 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Avtaler og vilkår</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gjeldende avtaledokumenter for Mynder. Alltid tilgjengelig for deg som kunde.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Laster dokumenter…
          </div>
        ) : (
          <Tabs value={tab} onValueChange={(v) => setTab(v as LegalDocType)}>
            <TabsList>
              {DOCS.map((d) => (
                <TabsTrigger key={d.type} value={d.type}>
                  {d.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {DOCS.map((d) => {
              const doc = currentByType[d.type];
              const accepted = acceptedAtFor(doc?.id);
              return (
                <TabsContent key={d.type} value={d.type} className="mt-6 space-y-4">
                  {!doc ? (
                    <p className="text-sm text-muted-foreground">
                      {d.label} er ikke publisert ennå. Dokumentet kommer her så snart det er
                      klart.
                    </p>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">
                            Versjon {doc.version} · gjelder fra {formatDate(doc.effective_date)}
                          </p>
                          {accepted && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Check className="h-3.5 w-3.5 text-primary" />
                              Godtatt av deg {formatDate(accepted)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.print()}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Last ned PDF
                        </Button>
                      </div>

                      <LegalDocumentView markdown={doc.content_md} />
                    </>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {!loading && (
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-0 text-muted-foreground">
                <History className="h-3.5 w-3.5" />
                {historyOpen ? "Skjul historikk" : "Se historikk"}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              {acceptances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen registrerte godkjenninger.</p>
              ) : (
                <div className="rounded-lg border border-border divide-y divide-border">
                  {acceptances.map((a) => {
                    const doc = Object.values(currentByType).find(
                      (d) => d?.id === a.terms_version_id
                    );
                    const label = DOCS.find((d) => d.type === doc?.doc_type)?.label ?? "Vilkår";
                    return (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                      >
                        <span className="text-foreground">
                          {label}
                          {doc ? ` · v${doc.version}` : ""}
                        </span>
                        <span className="text-xs text-muted-foreground text-right">
                          {CONTEXT_LABELS[a.context] ?? a.context} ·{" "}
                          {formatDate(a.accepted_at)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      </main>
    </div>
  );
}
