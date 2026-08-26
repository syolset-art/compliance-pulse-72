import { useMemo } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { computeTaxBreakdown, type PartnerTaxSettings } from "@/lib/partnerTax";

const fmt = (n: number) => n.toLocaleString("nb-NO");

export interface InvoiceHistoryCustomer {
  id: string;
  name: string;
  meta: string;
  activated: string[];
  monthly: number;
  fixed: number;
  setup: number;
  /** Når kunden ble opprettet — første faktureringsperiode. */
  createdAt?: string | null;
}

interface Period {
  key: string;
  label: string;
  subscription: number;
  oneTime: number;
  isCurrent: boolean;
}

function monthLabel(d: Date) {
  const s = d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Fakturaperioder fra kunden ble opprettet til inneværende måned (maks 12). */
function buildPeriods(customer: InvoiceHistoryCustomer): Period[] {
  const now = new Date();
  const start = customer.createdAt ? new Date(customer.createdAt) : now;
  const months: Period[] = [];
  const cursor = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
  let guard = 0;
  while (cursor >= startMonth && guard < 12) {
    const isFirst = cursor.getTime() === startMonth.getTime();
    months.push({
      key: `${cursor.getFullYear()}-${cursor.getMonth()}`,
      label: monthLabel(cursor),
      subscription: customer.monthly,
      // Engangsbeløp (fastpris og etablering) faktureres i første periode.
      oneTime: isFirst ? customer.fixed + customer.setup : 0,
      isCurrent: guard === 0,
    });
    cursor.setMonth(cursor.getMonth() - 1);
    guard += 1;
  }
  return months;
}

export function CustomerInvoiceHistorySheet({
  open,
  onOpenChange,
  customer,
  tax,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: InvoiceHistoryCustomer | null;
  tax: PartnerTaxSettings;
}) {
  const periods = useMemo(() => (customer ? buildPeriods(customer) : []), [customer]);

  const netTotal = periods.reduce((s, p) => s + p.subscription + p.oneTime, 0);
  const totals = computeTaxBreakdown(netTotal, tax);
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            Fakturahistorikk
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[280px] text-xs">
                Historikken er bygget på kundens aktive abonnement og engangsbeløp. Engangsbeløp (fastpris og
                etablering) føres i første faktureringsperiode. Alle beløp er eks. {tax.label}.
              </TooltipContent>
            </Tooltip>
          </SheetTitle>
          <SheetDescription>
            {customer?.name}
            {customer?.meta ? ` · ${customer.meta}` : ""}
          </SheetDescription>
        </SheetHeader>

        {customer && (
          <div className="mt-5 space-y-5">
            {customer.activated.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {customer.activated.map((label) => (
                  <Badge key={label} variant="outline" className="text-[11px] font-normal bg-muted/60">
                    {label}
                  </Badge>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground/80">Periode</TableHead>
                    <TableHead className="text-right text-foreground/80 whitespace-nowrap">Abonnement</TableHead>
                    <TableHead className="text-right text-foreground/80 whitespace-nowrap">Engangs</TableHead>
                    <TableHead className="text-right text-foreground/80 whitespace-nowrap">
                      Total inkl. {tax.label}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((p) => {
                    const net = p.subscription + p.oneTime;
                    const gross = computeTaxBreakdown(net, tax).gross;
                    return (
                      <TableRow key={p.key}>
                        <TableCell className="font-medium text-foreground">
                          {p.label}
                          {p.isCurrent && (
                            <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                              inneværende
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-foreground">
                          {p.subscription > 0 ? `${fmt(p.subscription)} kr` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {p.oneTime > 0 ? `${fmt(p.oneTime)} kr` : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-foreground">
                          {net > 0 ? `${fmt(gross)} kr` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {periods.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        Ingen faktureringsperioder ennå
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Sum eks. {tax.label}</span>
                <span className="tabular-nums text-foreground">{fmt(netTotal)} kr</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{taxLabel}</span>
                <span className="tabular-nums text-foreground">{fmt(totals.taxAmount)} kr</span>
              </div>
              <div className="flex items-center justify-between font-semibold pt-1 border-t border-border">
                <span className="text-foreground">Total inkl. {tax.label}</span>
                <span className="tabular-nums text-foreground">{fmt(totals.gross)} kr</span>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
