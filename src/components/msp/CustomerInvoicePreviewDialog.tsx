import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { computeTaxBreakdown, type PartnerTaxSettings } from "@/lib/partnerTax";
import type { InvoiceBasisRow } from "@/hooks/useMSPInvoiceBasis";

const fmt = (n: number) => n.toLocaleString("nb-NO");

/** Viser fakturagrunnlaget slik kunden vil se det på en utsendt faktura. */
export function CustomerInvoicePreviewDialog({
  open,
  onOpenChange,
  customer,
  tax,
  periodLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: InvoiceBasisRow | null;
  tax: PartnerTaxSettings;
  periodLabel: string;
}) {
  if (!customer) return null;

  const lines: { label: string; amount: number; note?: string }[] = [
    ...customer.lines.map((l) => ({ label: l.label, amount: l.price, note: "per måned" })),
  ];
  if (customer.fixed > 0) lines.push({ label: "Fastprisleveranser", amount: customer.fixed, note: "engangs" });
  if (customer.setup > 0) lines.push({ label: "Etableringsgebyr", amount: customer.setup, note: "engangs" });

  const net = customer.monthly + customer.fixed + customer.setup;
  const totals = computeTaxBreakdown(net, tax);
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>Fakturaforhåndsvisning</DialogTitle>
          <DialogDescription>
            {customer.name}
            {customer.meta ? ` · ${customer.meta}` : ""} · {periodLabel}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground/80">Linje</TableHead>
                <TableHead className="text-right text-foreground/80 whitespace-nowrap">
                  Beløp eks. {tax.label}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((l) => (
                <TableRow key={`${l.label}-${l.note}`}>
                  <TableCell className="text-foreground">
                    {l.label}
                    {l.note && <span className="ml-2 text-xs text-muted-foreground">{l.note}</span>}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-foreground">{fmt(l.amount)} kr</TableCell>
                </TableRow>
              ))}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-sm text-muted-foreground py-8">
                    Ingen fakturerbare linjer
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Sum eks. {tax.label}</span>
            <span className="tabular-nums text-foreground">{fmt(net)} kr</span>
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

        <p className="text-xs text-muted-foreground">
          Alle aktiverte produkter og regelverk listes ut som egne linjer på fakturaen som sendes kunden.
        </p>
      </DialogContent>
    </Dialog>
  );
}
