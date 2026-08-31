import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/** Kompakt liste over hva agenten kan gjøre – brukes i toppseksjonen. */
export function CapabilityList() {
  const { t } = useTranslation();
  const readCount = CAPABILITIES.filter((c) => !c.writes).length;

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {t("byoa.tools.title")}
      </h3>
      <p className="mt-1 text-[13px] text-muted-foreground">
        {t("byoa.tools.summary", {
          total: CAPABILITIES.length,
          read: readCount,
          write: CAPABILITIES.length - readCount,
        })}
      </p>

      <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
        {CAPABILITIES.map(({ name, icon: Icon, writes }) => (
          <li key={name}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex cursor-help items-start gap-3 px-3 py-2.5">
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      writes ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-foreground">
                        {t(`byoa.tools.items.${name}.title`)}
                      </span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          writes
                            ? "border border-accent/40 bg-accent/10 text-accent"
                            : "border border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {writes ? t("byoa.tools.badgeWrites") : t("byoa.tools.badgeReads")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {t(`byoa.tools.items.${name}.body`)}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-[13px]">{t(`byoa.tools.items.${name}.body`)}</p>
                <p className="mt-1 text-[12px] italic text-muted-foreground">
                  {t("byoa.tools.exampleLabel")} «{t(`byoa.tools.items.${name}.example`)}»
                </p>
              </TooltipContent>
            </Tooltip>
          </li>
        ))}
      </ul>

      <p className="mt-3 flex items-start gap-2 text-[12px] text-muted-foreground">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {t("byoa.tools.completeness")}
      </p>
    </div>
  );
}

/** Teknisk detalj for utviklere – lukket som standard. */
export function AgentDeveloperDetails() {
  const { t } = useTranslation();
  const [showDev, setShowDev] = useState(false);

  return (
    <section className="mt-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
              <dt className="w-32 shrink-0 text-muted-foreground">{t("byoa.tools.devAuth")}</dt>
              <dd className="font-mono text-foreground">Authorization: Bearer &lt;kode&gt;</dd>
            </div>
          </dl>
        )}
      </Card>
    </section>
  );
}
