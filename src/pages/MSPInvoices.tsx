import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, Download, Info, History, BarChart3, Receipt, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatPeriodEnd } from "@/lib/moduleActivationState";
import { useMSPInvoiceBasis, type InvoiceBasisRow } from "@/hooks/useMSPInvoiceBasis";
import { computeTaxBreakdown } from "@/lib/partnerTax";
import { ExportInvoiceBasisDialog } from "@/components/msp/ExportInvoiceBasisDialog";
import { CustomerInvoiceHistorySheet } from "@/components/msp/CustomerInvoiceHistorySheet";
import { CustomerInvoicePreviewDialog } from "@/components/msp/CustomerInvoicePreviewDialog";

const fmt = (n: number) => n.toLocaleString("nb-NO");

type Row = InvoiceBasisRow;

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
  const [first, ...rest] = items;
  const endsAt = retiring[first];
  return (
    <div className="flex items-center gap-1 min-w-0">
      <Badge
        variant="outline"
        className={cn(
          "text-[11px] font-normal max-w-[160px] truncate",
          endsAt
            ? "border-dashed border-border bg-transparent text-muted-foreground"
            : "bg-muted/60 text-foreground/80",
        )}
      >
        <span className={cn("truncate", endsAt && "line-through")}>{first}</span>
        {endsAt && <span className="ml-1 shrink-0">til {formatPeriodEnd(endsAt)}</span>}
      </Badge>
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-help text-[11px] text-muted-foreground whitespace-nowrap">
              +{rest.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[280px] text-xs">
            <div className="font-medium mb-1">Øvrige aktiverte</div>
            <div>{rest.join(", ")}</div>
            <div className="mt-1.5 text-muted-foreground">
              Alle linjer listes ut på fakturaen når den sendes kunden.
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export default function MSPInvoices() {
  const {
    branding,
    tax,
    invoiceTax,
    taxLabel,
    rows,
    monthlyTotal,
    oneTimeTotal,
    payingCount,
    totalBreakdown,
    exportRows,
    periodLabel,
    partnerSharePct,
    partnerShareFor,
    partnerShareTotal,
    mynderMonthlyTotal,
  } = useMSPInvoiceBasis();

  const oneTimeFor = (r: Row) => r.fixed + r.setup;
  const netFor = (r: Row) => r.monthly + r.fixed + r.setup;
  const taxFor = (r: Row) => computeTaxBreakdown(netFor(r), invoiceTax).taxAmount;
  const grossFor = (r: Row) => computeTaxBreakdown(netFor(r), invoiceTax).gross;

  const [exportOpen, setExportOpen] = useState(false);
  const [historyId, setHistoryId] = useState<string | null>(null);
  const historyCustomer = rows.find((r) => r.id === historyId) ?? null;
  const [previewId, setPreviewId] = useState<string | null>(null);
  const previewCustomer = rows.find((r) => r.id === previewId) ?? null;
  const [subPeriod, setSubPeriod] = useState<"month" | "year">("year");
  const subTotal = subPeriod === "month" ? monthlyTotal : monthlyTotal * 12;
  /** Perspektiv: hva partneren fakturerer sine kunder, eller hva Mynder fakturerer partneren. */
  const [view, setView] = useState<"customers" | "mynder">("customers");
  const isMynder = view === "mynder";
  const mynderSubTotal = subPeriod === "month" ? mynderMonthlyTotal : mynderMonthlyTotal * 12;
  const shareSubTotal = subPeriod === "month" ? partnerShareTotal : partnerShareTotal * 12;





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
                  {isMynder ? (
                    <>
                      Grunnlaget Mynder fakturerer deg: abonnementet på aktiverte produkter minus partnerandelen din
                      på <span className="font-medium text-foreground">{partnerSharePct} %</span>. Engangsleveranser du
                      selv utfører er ikke med. Alle priser eks. {tax.label}.
                    </>
                  ) : (
                    <>
                      Aktiverte produkter og regelverk per kunde — grunnlaget du kan fakturere kundene dine for. Alle
                      priser er oppgitt <span className="font-medium text-foreground">eks. {tax.label}</span>;{" "}
                      {tax.label} beregnes i egen kolonne.
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                      <PlusCircle className="h-5 w-5" />
                      <span className="sr-only">Flere handlinger</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/msp-invoices/reports" className="flex items-center gap-2 cursor-pointer">
                        <BarChart3 className="h-4 w-4" />
                        Rapporter
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setExportOpen(true)} className="flex items-center gap-2 cursor-pointer">
                      <Download className="h-4 w-4" />
                      Eksporter
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/msp-billing" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Innstillinger
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Perspektivbytte */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex rounded-md border border-border p-0.5">
                {([
                  { value: "customers" as const, label: "Til dine kunder" },
                  { value: "mynder" as const, label: "Fra Mynder" },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setView(opt.value)}
                    aria-pressed={view === opt.value}
                    className={cn(
                      "rounded px-3 py-1 text-xs font-medium transition-colors",
                      view === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Link
                to="/msp-billing"
                className="text-xs text-muted-foreground hover:text-primary hover:underline underline-offset-2"
              >
                {partnerSharePct} % partnerandel · Partneravtale
              </Link>
            </div>

            {/* Toppsammendrag — kompakt */}
            <Card className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-foreground tabular-nums">{payingCount}</span>
                  <span className="text-xs text-muted-foreground">kunder med abonnement</span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-semibold text-foreground tabular-nums">{fmt(subTotal)} kr</span>
                  <span className="text-xs text-muted-foreground">
                    abonnement {subPeriod === "month" ? "per måned" : "per år"} eks. {tax.label}
                  </span>
                </div>
                {isMynder && (
                  <>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        {fmt(shareSubTotal)} kr
                      </span>
                      <span className="text-xs text-muted-foreground">din andel ({partnerSharePct} %)</span>
                    </div>
                    <div className="h-4 w-px bg-border hidden sm:block" />
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-foreground tabular-nums">
                        {fmt(mynderSubTotal)} kr
                      </span>
                      <span className="text-xs text-muted-foreground">Mynder fakturerer deg</span>
                    </div>
                  </>
                )}
                <div className="ml-auto flex rounded-md border border-border p-0.5">
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
            </Card>




            {/* Desktop: tabell */}
            <Card className="hidden md:block overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px] text-foreground/80">Kunde</TableHead>
                      <TableHead className="text-foreground/80">Aktiverte produkter og regelverk</TableHead>
                      {!isMynder && (
                        <TableHead className="w-[170px] text-right text-foreground/80">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex flex-col items-end gap-0 cursor-help leading-tight">
                                <span className="inline-flex items-center gap-1.5">
                                  Annet <Info className="h-3.5 w-3.5 text-foreground/50" />
                                </span>
                                <span className="text-xs text-foreground/60">eks. {tax.label}</span>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-xs">
                              Tallene er oppgitt eks. {tax.label}. Engangsbeløp: leverte fastprisprosjekter og eventuelt etableringsgebyr. Tom når kunden ikke
                              har noen av delene.
                            </TooltipContent>
                          </Tooltip>
                        </TableHead>
                      )}

                      <TableHead className="w-[160px] text-right text-foreground/80">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex items-center gap-1.5 cursor-help whitespace-nowrap">
                              Abonnement <Info className="h-3.5 w-3.5 text-foreground/50" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            Sum av aktive moduler og betalte regelverk hos kunden. Dette er det du skal fakturere kunden hver måned.
                          </TooltipContent>
                        </Tooltip>
                      </TableHead>
                      <TableHead className="w-[120px] text-right text-foreground/80 whitespace-nowrap">
                        {taxLabel}
                      </TableHead>
                      <TableHead className="w-[140px] text-right text-foreground/80">
                        <div className="flex flex-col items-end leading-tight">
                          <span>Total</span>
                          <span className="text-xs text-foreground/60">inkl. {tax.label}</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] text-right text-foreground/80">
                        <span className="sr-only">Handlinger</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className={cn("align-middle", r.monthly === 0 && "opacity-70")}>
                        <TableCell className="font-medium">
                          <Link
                            to={`/msp-dashboard/${r.id}`}
                            className="text-foreground hover:text-primary hover:underline underline-offset-2 block truncate"
                          >
                            {r.name}
                          </Link>
                          <div className="text-xs text-muted-foreground truncate">{r.meta || "—"}</div>
                        </TableCell>
                        <TableCell>
                          <Pills items={r.activated} retiring={r.retiring} empty="Ingen aktive abonnement" />
                        </TableCell>
                        <TableCell className="text-right text-foreground tabular-nums">
                          {oneTimeFor(r) > 0 ? (
                            r.fixed > 0 && r.setup > 0 ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help whitespace-nowrap">{fmt(oneTimeFor(r))} kr</span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  Fastpris {fmt(r.fixed)} kr · etablering {fmt(r.setup)} kr
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              `${fmt(oneTimeFor(r))} kr`
                            )
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
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-0.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => setPreviewId(r.id)}
                                  aria-label="Se faktura slik kunden ser den"
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Se faktura slik den vil se ut for kunden
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => setHistoryId(r.id)}
                                  aria-label="Fakturahistorikk"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Fakturahistorikk per måned
                              </TooltipContent>
                            </Tooltip>
                          </div>
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
                        <TableCell />
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
                      <div className="text-[11px] text-muted-foreground">per mnd eks. {tax.label}</div>
                    </div>
                  </div>
                  <Pills items={r.activated} retiring={r.retiring} empty="Ingen aktive abonnement" />
                  <div className="pt-2 border-t border-border space-y-1 text-sm">
                    {oneTimeFor(r) > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Fastpris og etablering (eks. {tax.label})
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
                      <span className="text-muted-foreground">Abonnement/mnd (eks. {tax.label})</span>
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
                  <button
                    type="button"
                    onClick={() => setHistoryId(r.id)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <History className="h-3.5 w-3.5" />
                    Se fakturahistorikk
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewId(r.id)}
                    className="ml-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    Se faktura
                  </button>
                </Card>
              ))}
              {rows.length > 0 && (
                <Card className="p-4 bg-muted/30 space-y-1">
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

            <CustomerInvoicePreviewDialog
              open={previewId !== null}
              onOpenChange={(o) => !o && setPreviewId(null)}
              customer={previewCustomer}
              tax={invoiceTax}
              periodLabel={periodLabel}
            />

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
