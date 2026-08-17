import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTerms, type LegalDocType } from "@/hooks/useTerms";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { LegalDocumentView } from "@/components/legal/LegalDocumentView";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Download, ExternalLink, Loader2 } from "lucide-react";

const DOC_LABELS: Record<LegalDocType, string> = {
  terms: "Vilkår",
  partner: "Partnervilkår",
  privacy: "Personvernerklæring",
  dpa: "Databehandleravtale",
};


const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function Legal() {
  const [params, setParams] = useSearchParams();
  const { i18n } = useTranslation();
  const { mode } = useWorkspaceMode();
  const { currentByType, acceptedAtFor, loading } = useTerms();

  const isNb = i18n.language === "nb" || i18n.language === "no";
  const lang = isNb ? "no" : "en";

  // Personvernerklæring, databehandleravtale og sikkerhet ligger samlet i Trust Center.
  const EXTERNAL_DOCS = [
    {
      label: "Trust Center",
      description: "mynder.no",
      href: `https://mynder.no/${lang}/trust-center`,
    },
  ];

  const docs: LegalDocType[] = mode === "partner" ? ["terms", "partner"] : ["terms"];

  const initial = (params.get("doc") as LegalDocType) || "terms";
  const [tab, setTab] = useState<LegalDocType>(docs.includes(initial) ? initial : "terms");

  useEffect(() => {
    const doc = params.get("doc") as LegalDocType;
    if (doc && docs.includes(doc) && doc !== tab) setTab(doc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, mode]);

  useEffect(() => {
    if (!docs.includes(tab)) setTab("terms");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
            <h1 className="text-2xl font-semibold text-foreground">Dokumenter</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Vilkår for bruk av Mynder, og lenke til Trust Center på mynder.no
              hvor personvernerklæring, databehandleravtale og sikkerhet ligger.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Laster dokumenter…
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as LegalDocType)}>
              <TabsList>
                {docs.map((d) => (
                  <TabsTrigger key={d} value={d}>
                    {DOC_LABELS[d]}
                  </TabsTrigger>
                ))}
              </TabsList>

              {docs.map((d) => {
                const doc = currentByType[d];
                const accepted = acceptedAtFor(doc?.id);
                return (
                  <TabsContent key={d} value={d} className="mt-8 space-y-6">
                    {!doc ? (
                      <p className="text-sm text-muted-foreground">
                        {DOC_LABELS[d]} er ikke publisert ennå. Dokumentet kommer her så snart
                        det er klart.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              Sist oppdatert {formatDate(doc.effective_date)}
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

          <section className="space-y-2 pt-2">
            <h2 className="text-sm font-semibold text-foreground">Relaterte dokumenter</h2>
            <p className="text-xs text-muted-foreground">
              Personvernerklæring, databehandleravtale og sikkerhet ligger i Trust Center på mynder.no (ekstern lenke).
            </p>
            <div className="rounded-lg border border-border divide-y divide-border">
              {EXTERNAL_DOCS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-4 px-3 py-2.5 hover:bg-muted/50 transition-colors"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">{item.label}</span>
                    <span className="block text-xs text-muted-foreground truncate">
                      {item.description}
                    </span>
                  </span>
                  <ExternalLink
                    className="h-3.5 w-3.5 text-muted-foreground shrink-0"
                    aria-hidden="true"
                  />
                </a>
              ))}
            </div>
          </section>

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
                      const doc = versionById[a.terms_version_id];
                      const label = doc ? DOC_LABELS[doc.doc_type] ?? "Vilkår" : "Vilkår";
                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-4 px-3 py-2 text-sm"
                        >
                          <span className="text-foreground flex items-center gap-2">
                            {label}
                            {doc ? ` · v${doc.version}` : ""}
                            {a.operator_role && (
                              <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                                Driftpartner
                              </span>
                            )}
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
