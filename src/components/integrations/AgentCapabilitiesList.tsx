import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import { mcpServerUrl } from "@/lib/mcpAgentConnections";

/** Hva agenten kan gjøre – piller basert på verktøyene Mynder eksponerer. */
export function AgentCapabilitiesList() {
  const { t } = useTranslation();
  const [showDev, setShowDev] = useState(false);

  const readPills = [
    t("byoa.tools.readVendors"),
    t("byoa.tools.readRequirements"),
    t("byoa.tools.readDocumentation"),
    t("byoa.tools.reportCoverage"),
  ];

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
        {t("byoa.tools.title")}
      </h2>

      <div className="mt-3 flex flex-wrap gap-2">
        {readPills.map((label) => (
          <span
            key={label}
            className="rounded-full border border-border bg-muted px-3 py-1 text-[13px] text-muted-foreground"
          >
            {label}
          </span>
        ))}
        <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[13px] text-accent-foreground">
          {t("byoa.tools.createActivity")}
          <span className="ml-1.5 text-muted-foreground">{t("byoa.tools.writes")}</span>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
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
        <Card className="mt-3 p-4">
          <dl className="space-y-2 text-[13px]">
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
        </Card>
      )}
    </section>
  );
}
