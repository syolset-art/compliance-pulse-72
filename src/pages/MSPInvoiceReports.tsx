import { useState } from "react";
import { Link } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft, Download, History } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { useMSPInvoiceBasis } from "@/hooks/useMSPInvoiceBasis";
import { ExportInvoiceBasisDialog } from "@/components/msp/ExportInvoiceBasisDialog";
import { CustomerInvoiceHistorySheet } from "@/components/msp/CustomerInvoiceHistorySheet";

const fmt = (n: number) => n.toLocaleString("nb-NO");

export default function MSPInvoiceReports() {
  const {
    branding,
    tax,
    invoiceTax,
    rows,
    monthlyTotal,
    payingCount,
    productCounts,
    industryCounts,
    exportRows,
    periodLabel,
  } = useMSPInvoiceBasis();

  const [exportOpen, setExportOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const historyCustomer = rows.find((r) => r.id === historyId) ?? null;
  const [subPeriod, setSubPeriod] = useState<"month" | "year">("year");
  const subTotal = subPeriod === "month" ? monthlyTotal : monthlyTotal * 12;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-8 space-y-6">
            <Link
              to="/msp-invoices"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline underline-offset-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Fakturagrunnlag
            </Link>

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground">Faktureringsrapporter</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Rapporter og uttak knyttet til fakturering av kundene dine. Alle tall er oppgitt{" "}
                  <span className="font-medium text-foreground">eks. {tax.label}</span>.
                </p>
              </div>
              <Button size="sm" className="gap-2 shrink-0" onClick={() => setExportOpen(true)}>
                <Download className="h-4 w-4" />
                Hent ut rapport
              </Button>
            </div>

            {/* Nøkkeltall */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-[12px] uppercase tracking-wide text-muted-foreground">Kunder med abonnement</div>
                <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">{payingCount}</div>
              </Card>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-[12px] uppercase tracking-wide text-muted-foreground">
                    {subPeriod === "month" ? "Abonnement per måned" : "Abonnement per år"}
                  </div>
                  <div className="flex rounded-md border border-border p-0.5">
                    {([
                      { value: "month" as const, label: "Mnd" },
                      { value: "year" as const, label: "År" },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSubPeriod(opt.value)}
                        aria-pressed={subPeriod === opt.value}
                        className={cn(
                          "rounded px-2 py-0.5 text-[11px] font-medium transition-colors",
                          subPeriod === opt.value
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-semibold text-foreground tabular-nums">{fmt(subTotal)} kr</span>
                  <span className="text-[11px] font-medium text-muted-foreground">eks. {tax.label}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">moduler og betalte regelverk</div>
              </Card>
            </div>

            {/* Rapporter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-[12px] uppercase tracking-wide text-muted-foreground mb-3">Topp 3 produkter</div>
                {productCounts.length > 0 ? (
                  <div className="space-y-2">
                    {productCounts.map(([label, count], i) => (
                      <div key={label} className="flex items-center gap-3">
                        <div className="w-5 text-xs font-medium text-muted-foreground">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="truncate text-foreground">{label}</span>
                            <span className="text-xs tabular-nums text-muted-foreground ml-2">{count} kunder</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(count / productCounts[0][1]) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Ingen aktive produkter</div>
                )}
              </Card>
              <Card className="p-4">
                <div className="text-[12px] uppercase tracking-wide text-muted-foreground mb-2">Fordeling bransje</div>
                <div className="h-40">
                  {industryCounts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={industryCounts}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={2}
                        >
                          {industryCounts.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number, _name, props: any) => [`${value} kunder`, props?.payload?.name]}
                          contentStyle={{ borderRadius: 8, fontSize: 12 }}
                        />
                        <Legend
                          verticalAlign="middle"
                          align="right"
                          layout="vertical"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11, paddingLeft: 8 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      Ingen bransjedata
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Rapport per kunde */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Rapport per kunde</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Åpne fakturahistorikken for å se grunnlaget måned for måned.
                </p>
              </div>
              <div className="divide-y divide-border">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/msp-dashboard/${r.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-2 block truncate"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-muted-foreground truncate">{r.meta || "—"}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-semibold text-foreground tabular-nums">
                          {r.monthly > 0 ? `${fmt(r.monthly)} kr` : "—"}
                        </div>
                        <div className="text-[11px] text-muted-foreground">per mnd eks. {tax.label}</div>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => setHistoryId(r.id)}
                          >
                            <History className="h-3.5 w-3.5" />
                            Fakturahistorikk
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-[240px] text-xs">
                          Se fakturagrunnlaget per måned for denne kunden.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
                {rows.length === 0 && (
                  <div className="p-10 text-center text-sm text-muted-foreground">Ingen kunder ennå</div>
                )}
              </div>
            </Card>

            <CustomerInvoiceHistorySheet
              open={historyId !== null}
              onOpenChange={(o) => !o && setHistoryId(null)}
              customer={historyCustomer}
              tax={invoiceTax}
            />

            <ExportInvoiceBasisDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              rows={exportRows}
              branding={branding}
              tax={invoiceTax}
              periodLabel={periodLabel}
            />
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
