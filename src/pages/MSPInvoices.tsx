import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Download, Info } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  customerLicenseSummary,
  deriveActivatedFrameworks,
  deriveActivatedProducts,
  moduleKeyForActivatedLabel,
} from "@/lib/offerSuggestions";
import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { CUSTOMER_MODULES_EVENT, getCustomerRetiringModules } from "@/lib/customerModuleState";
import { formatPeriodEnd } from "@/lib/moduleActivationState";
import { computeTaxBreakdown } from "@/lib/partnerTax";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";
import { ExportInvoiceBasisDialog } from "@/components/msp/ExportInvoiceBasisDialog";


const fmt = (n: number) => n.toLocaleString("nb-NO");

/** Fastprisleveranser: leverte tilbud med tjenester som prises som engangsbeløp. */
function fixedPriceForCustomer(customerId: string): { total: number; count: number } {
  const offers = getOffersForCustomer(customerId).filter((o) => o.status === "delivered");
  let total = 0;
  let count = 0;
  for (const offer of offers) {
    const keys = new Set([...(offer.templateIds || []), ...(offer.serviceKeys || [])]);
    for (const t of SERVICE_LIBRARY) {
      const match = keys.has(t.id) || keys.has(normalizeServiceKey(t.name));
      if (!match) continue;
      if (t.recommendedPrice.model !== "fixed") continue;
      total += t.recommendedPrice.min;
      count += 1;
    }
  }
  return { total, count };
}

interface Row {
  id: string;
  name: string;
  meta: string;
  activated: string[];
  monthly: number;
  fixed: number;
  fixedCount: number;
  /** Engangs etableringsgebyr — ikke alle kunder har dette. */
  setup: number;
  /** Avsluttede linjer: etikett → dato de faller bort. */
  retiring: Record<string, string>;
}


function Pills({
  items,
  empty,
  retiring = {},
}: {
  items: string[];
  empty?: string;
  /** Etiketter som er sagt opp, med sluttdato. */
  retiring?: Record<string, string>;
}) {
  if (items.length === 0) {
    return <span className="text-xs text-muted-foreground">{empty ?? "—"}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((label) => {
        const endsAt = retiring[label];
        return (
          <Badge
            key={label}
            variant="outline"
            className={cn(
              "text-[11px] font-normal",
              endsAt
                ? "border-dashed border-border bg-transparent text-muted-foreground"
                : "bg-muted/60 text-foreground/80",
            )}
          >
            <span className={endsAt ? "line-through" : undefined}>{label}</span>
            {endsAt && <span className="ml-1">til {formatPeriodEnd(endsAt)}</span>}
          </Badge>
        );
      })}
    </div>
  );
}

export default function MSPInvoices() {
  const { branding } = usePartnerBranding();
  const tax = branding.tax;

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["msp-customers-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Oppdater når partneren aktiverer eller endrer nivå på en modul.
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => {
      setTick((n) => n + 1);
      refetch();
    };
    window.addEventListener(CUSTOMER_MODULES_EVENT, refresh);
    window.addEventListener("modules:changed", refresh);
    return () => {
      window.removeEventListener(CUSTOMER_MODULES_EVENT, refresh);
      window.removeEventListener("modules:changed", refresh);
    };
  }, [refetch]);

  const rows: Row[] = useMemo(() => {
    return customers
      .map((c: any) => {
        const { monthly } = customerLicenseSummary(c);
        const fixed = fixedPriceForCustomer(c.id);
        const retiringModules = getCustomerRetiringModules(c.id);
        const products = deriveActivatedProducts(c);
        const frameworkLabels = deriveActivatedFrameworks(c);
        const retiring: Record<string, string> = {};
        for (const label of products) {
          const key = moduleKeyForActivatedLabel(label);
          if (key && retiringModules[key]) retiring[label] = retiringModules[key];
        }
        if (retiringModules.frameworks) {
          for (const label of frameworkLabels) retiring[label] = retiringModules.frameworks;
        }
        return {
          id: c.id,
          name: c.customer_name || "Uten navn",
          meta: [c.country_code || "NO", c.industry].filter(Boolean).join(" · "),
          activated: [...products, ...frameworkLabels],
          retiring,
          monthly,
          fixed: fixed.total,
          fixedCount: fixed.count,
          setup: Number(c.setup_fee) > 0 ? Number(c.setup_fee) : 0,
        };
      })
      .sort((a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name, "nb-NO"));
  }, [customers]);

  const monthlyTotal = rows.reduce((s, r) => s + r.monthly, 0);
  const fixedTotal = rows.reduce((s, r) => s + r.fixed, 0);
  const setupTotal = rows.reduce((s, r) => s + r.setup, 0);
  const payingCount = rows.filter((r) => r.monthly > 0).length;
  const oneTimeTotal = fixedTotal + setupTotal;

  const oneTimeFor = (r: Row) => r.fixed + r.setup;
  const netFor = (r: Row) => r.monthly + r.fixed + r.setup;

  const taxFor = (r: Row) => computeTaxBreakdown(netFor(r), tax).taxAmount;
  const grossFor = (r: Row) => computeTaxBreakdown(netFor(r), tax).gross;
  const netTotal = monthlyTotal + fixedTotal + setupTotal;
  const totalBreakdown = computeTaxBreakdown(netTotal, tax);
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;

  const [exportOpen, setExportOpen] = useState(false);
  const [subPeriod, setSubPeriod] = useState<"month" | "year">("month");
  const subTotal = subPeriod === "month" ? monthlyTotal : monthlyTotal * 12;
  const periodLabel = new Date().toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
  const exportRows = rows.map((r) => ({
    name: r.name,
    meta: r.meta,
    activated: r.activated,
    monthly: r.monthly,
    oneTime: r.fixed + r.setup,
    fixed: r.fixed,
    setup: r.setup,
  }));



  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-11">
          <div className="container max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-semibold text-foreground">Fakturagrunnlag</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Aktiverte produkter og tjenester per kunde — grunnlaget Mynder fakturerer deg. Alle beløp eks. mva.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4" />
                  Eksporter
                </Button>

                <Link to="/msp-billing">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="h-4 w-4" />
                    Innstillinger
                  </Button>
                </Link>
              </div>
            </div>

            {/* Toppsammendrag */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-2xl font-semibold text-foreground tabular-nums mt-1">{fmt(subTotal)} kr</div>
                <div className="text-xs text-muted-foreground mt-0.5">moduler og betalte regelverk</div>
              </Card>
            </div>


            {/* Desktop: tabell */}
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] text-foreground/80">Kunde</TableHead>
                      <TableHead className="text-foreground/80">Aktiverte produkter og regelverk</TableHead>
                      <TableHead className="w-[170px] text-right text-foreground/80">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 cursor-help">
                              Annet <Info className="h-3.5 w-3.5 text-foreground/50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            Engangsbeløp: leverte fastprisprosjekter og eventuelt etableringsgebyr. Tom når kunden ikke
                            har noen av delene.
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[140px] text-right text-foreground/80">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 cursor-help">
                              Abonnement/mnd <Info className="h-3.5 w-3.5 text-foreground/50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            Sum av aktive moduler og betalte regelverk hos kunden. Faktureres deg av Mynder hver måned.
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[120px] text-right text-foreground/80 whitespace-nowrap">
                        {taxLabel}
                      </TableHead>
                      <TableHead className="w-[140px] text-right text-foreground/80 whitespace-nowrap">
                        Total inkl. {tax.label}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className={cn("align-top", r.monthly === 0 && "opacity-70")}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/msp-dashboard/${r.id}`}
                            className="text-foreground hover:text-primary hover:underline underline-offset-2"
                          >
                            {r.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">{r.meta || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Pills items={r.activated} retiring={r.retiring} empty="Ingen aktive abonnement" />
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums">
                          {oneTimeFor(r) > 0 ? (
                            <>
                              <div>{fmt(oneTimeFor(r))} kr</div>
                              {r.fixed > 0 && r.setup > 0 && (
                                <div className="text-[11px] text-muted-foreground font-normal">
                                  fastpris {fmt(r.fixed)} · etablering {fmt(r.setup)}
                                </div>
                              )}
                            </>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {r.monthly > 0 ? `${fmt(r.monthly)} kr` : "—"}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {netFor(r) > 0 ? `${fmt(taxFor(r))} kr` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {netFor(r) > 0 ? `${fmt(grossFor(r))} kr` : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {rows.length > 0 && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={2} className="text-sm font-medium text-foreground">
                          Totalt
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {oneTimeTotal > 0 ? `${fmt(oneTimeTotal)} kr` : "—"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {fmt(monthlyTotal)} kr
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {fmt(totalBreakdown.taxAmount)} kr
                        </TableCell>
                        <TableCell className="text-right font-semibold text-foreground tabular-nums">
                          {fmt(totalBreakdown.gross)} kr
                        </TableCell>
                      </TableRow>
                    )}

                  </TableBody>
                </Table>
              </div>
              {rows.length === 0 && (
                <div className="p-10 text-center text-sm text-muted-foreground">Ingen kunder ennå</div>
              )}
            </Card>

            {/* Mobil: kortliste */}
            <div className="md:hidden space-y-3">
              {rows.map((r) => (
                <Card key={r.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/msp-dashboard/${r.id}`}
                        className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2 block truncate"
                      >
                        {r.name}
                      </Link>
                      <div className="text-xs text-muted-foreground">{r.meta || "—"}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-foreground tabular-nums">
                        {r.monthly > 0 ? `${fmt(r.monthly)} kr` : "—"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">per mnd</div>
                    </div>
                  </div>
                  <Pills items={r.activated} retiring={r.retiring} empty="Ingen aktive abonnement" />
                  <div className="pt-2 border-t border-border space-y-1 text-sm">
                    {oneTimeFor(r) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Fastpris og etablering
                          {r.fixed > 0 && r.setup > 0 && (
                            <span className="block text-[11px]">
                              fastpris {fmt(r.fixed)} · etablering {fmt(r.setup)}
                            </span>
                          )}
                        </span>
                        <span className="text-foreground tabular-nums">{fmt(oneTimeFor(r))} kr</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Abonnement/mnd</span>
                      <span className="text-foreground tabular-nums">{r.monthly > 0 ? `${fmt(r.monthly)} kr` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{taxLabel}</span>
                      <span className="text-foreground tabular-nums">{fmt(taxFor(r))} kr</span>
                    </div>
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-foreground">Total inkl. {tax.label}</span>
                      <span className="text-foreground tabular-nums">{fmt(grossFor(r))} kr</span>
                    </div>
                  </div>

                </Card>
              ))}
              {rows.length > 0 && (
                <Card className="p-4 bg-muted/30 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Engangsbeløp</span>
                    <span className="text-foreground tabular-nums">{oneTimeTotal > 0 ? `${fmt(oneTimeTotal)} kr` : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Totalt per mnd</span>
                    <span className="text-foreground tabular-nums">{fmt(monthlyTotal)} kr</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="text-foreground">Total inkl. {tax.label}</span>
                    <span className="text-foreground tabular-nums">{fmt(totalBreakdown.gross)} kr</span>
                  </div>
                </Card>
              )}

              {rows.length === 0 && (
                <Card className="p-10 text-center text-sm text-muted-foreground">Ingen kunder ennå</Card>
              )}
            </div>

            <ExportInvoiceBasisDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              rows={exportRows}
              branding={branding}
              tax={tax}
              periodLabel={periodLabel}
            />
          </div>

        </main>
      </div>
    </TooltipProvider>
  );
}
