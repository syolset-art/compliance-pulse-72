import { useTranslation } from "react-i18next";
import { Cpu, HardDrive } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUsageSummary, formatBytes, formatTokens } from "@/hooks/useUsageSummary";
import { Skeleton } from "@/components/ui/skeleton";

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex-1 min-w-[110px]">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold text-foreground tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function UsageFootprintCard() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const { data, isLoading } = useUsageSummary();

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {isNb ? "Forbruk" : "Usage"}
        </h3>
        <span className="text-[11px] text-muted-foreground">
          {isNb ? "Siste døgn og siste 30 dager" : "Last 24 hours and last 30 days"}
        </span>
      </div>

      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {isNb ? "AI-tokens" : "AI tokens"}
              </span>
            </div>
            <div className="flex gap-4">
              <Metric
                label={isNb ? "Siste døgn" : "Last 24h"}
                value={formatTokens(data.tokens_day)}
              />
              <Metric
                label={isNb ? "Siste 30 dager" : "Last 30 days"}
                value={formatTokens(data.tokens_month)}
                sub={
                  isNb
                    ? `${data.calls_month} AI-kall`
                    : `${data.calls_month} AI calls`
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-border/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <HardDrive className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-foreground">
                {isNb ? "Lagringsplass" : "Storage"}
              </span>
            </div>
            <div className="flex gap-4">
              <Metric
                label={isNb ? "Siste døgn" : "Last 24h"}
                value={formatBytes(data.bytes_day)}
              />
              <Metric
                label={isNb ? "Siste 30 dager" : "Last 30 days"}
                value={formatBytes(data.bytes_month)}
                sub={
                  isNb
                    ? `${formatBytes(data.bytes_total)} totalt · ${data.files_total} filer`
                    : `${formatBytes(data.bytes_total)} total · ${data.files_total} files`
                }
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
