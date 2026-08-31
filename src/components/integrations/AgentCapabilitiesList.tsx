import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  Gauge,
  Scale,
  Sparkles,
} from "lucide-react";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";

type Capability = {
  /** Matcher verktøynavnet MCP-serveren eksponerer. */
  name: string;
  icon: typeof Building2;
  writes?: boolean;
};

const CAPABILITIES: Capability[] = [
  { name: "list_vendors", icon: Building2 },
  { name: "list_requirements", icon: Scale },
  { name: "get_documentation_status", icon: Gauge },
  { name: "report_document_coverage", icon: FileCheck2 },
  { name: "create_activity", icon: CheckSquare, writes: true },
];

/** Hva agenten kan gjøre – lukket som standard, med klarspråk per oppgave. */
export function AgentCapabilitiesList() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showDev, setShowDev] = useState(false);

  const readCount = CAPABILITIES.filter((c) => !c.writes).length;
  const writeCount = CAPABILITIES.length - readCount;

  return (
    <section className="mt-8">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-2xl">
              <h2 className="text-base font-semibold text-foreground">
                {t("byoa.tools.title")}
              </h2>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t("byoa.tools.intro")}
              </p>
              <p className="mt-2 text-[13px] font-medium text-foreground">
                {t("byoa.tools.summary", {
                  total: CAPABILITIES.length,
                  read: readCount,
                  write: writeCount,
                })}
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-[13px]">
                {open ? t("byoa.tools.hide") : t("byoa.tools.show")}
                {open ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {CAPABILITIES.map(({ name, icon: Icon, writes }) => (
                <div
                  key={name}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
                        writes ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          {t(`byoa.tools.items.${name}.title`)}
                        </h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            writes
                              ? "border border-accent/40 bg-accent/10 text-accent"
                              : "border border-border bg-muted text-muted-foreground"
                          }`}
                        >
                          {writes ? t("byoa.tools.badgeWrites") : t("byoa.tools.badgeReads")}
                        </span>
                      </div>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        {t(`byoa.tools.items.${name}.body`)}
                      </p>
                      <p className="mt-2 text-[13px] text-foreground">
                        <span className="text-muted-foreground">
                          {t("byoa.tools.exampleLabel")}{" "}
                        </span>
                        <span className="italic">
                          «{t(`byoa.tools.items.${name}.example`)}»
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-start gap-2 text-[13px] text-muted-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("byoa.tools.completeness")}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <p className="text-[13px] text-muted-foreground">{t("byoa.tools.devQuestion")}</p>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-[13px]"
                aria-expanded={showDev}
                onClick={() => setShowDev((s) => !s)}
              >
                {t("byoa.tools.devButton")}
                {showDev ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>

            {showDev && (
              <dl className="mt-3 space-y-2 rounded-lg bg-muted p-4 text-[13px]">
                <div className="flex flex-wrap gap-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {t("byoa.tools.devEndpoint")}
                  </dt>
                  <dd className="font-mono text-foreground">{mcpServerUrl()}</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {t("byoa.tools.devTransport")}
                  </dt>
                  <dd className="text-foreground">MCP Streamable HTTP</dd>
                </div>
                <div className="flex flex-wrap gap-2">
                  <dt className="w-32 shrink-0 text-muted-foreground">
                    {t("byoa.tools.devAuth")}
                  </dt>
                  <dd className="font-mono text-foreground">Authorization: Bearer &lt;kode&gt;</dd>
                </div>
              </dl>
            )}
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </section>
  );
}
