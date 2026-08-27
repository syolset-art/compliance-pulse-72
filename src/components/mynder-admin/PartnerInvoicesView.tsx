import { Fragment, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARTNERS, CUSTOMERS } from "./adminDemoData";
import { usePartnerAgreements } from "@/hooks/useMynderAdmin";

const MONTHS = 6;

function periods(monthlyBasis: number, sharePct: number) {
  const out: { label: string; basis: number; share: number; mynder: number; status: "sendt" | "kladd" }[] = [];
  const now = new Date();
  for (let i = 0; i < MONTHS; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const share = Math.round((monthlyBasis * sharePct) / 100);
    out.push({
      label: d.toLocaleDateString("nb-NO", { month: "long", year: "numeric" }),
      basis: monthlyBasis,
      share,
      mynder: monthlyBasis - share,
      status: i === 0 ? "kladd" : "sendt",
    });
  }
  return out;
}

export function PartnerInvoicesView() {
  const { byPartner } = usePartnerAgreements();
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = PARTNERS.map((p) => {
    const basis = CUSTOMERS.filter((c) => c.salesChannel === "partner" && c.partnerId === p.id).reduce(
      (s, c) => s + c.mrrNok,
      0
    );
    const agreement = byPartner(p.id);
    const share = agreement ? Number(agreement.share_pct) : p.commissionPct;
    return { partner: p, basis, share, mynder: basis - Math.round((basis * share) / 100), history: periods(basis, share) };
  });

  const totalMynder = rows.reduce((s, r) => s + r.mynder, 0);

  return (
    <div className="space-y-4">
      <Card className="p-4 flex flex-wrap items-center gap-x-8 gap-y-2">
        <div>
          <div className="text-lg font-bold tabular-nums">{totalMynder.toLocaleString("nb-NO")} kr</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Mynder fakturerer per mnd</div>
        </div>
        <div>
          <div className="text-lg font-bold tabular-nums">{(totalMynder * 12).toLocaleString("nb-NO")} kr</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Årlig grunnlag</div>
        </div>
        <p className="text-xs text-muted-foreground ml-auto max-w-sm">
          Alle beløp eks. mva. Grunnlaget er aktiverte abonnement hos partnerens kunder, minus partnerandelen i avtalen.
        </p>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            Fakturaer til partnere
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="w-10 px-3 py-2.5" />
                <th className="text-left font-medium px-4 py-2.5">Partner</th>
                <th className="text-right font-medium px-4 py-2.5">Abonnementsgrunnlag</th>
                <th className="text-right font-medium px-3 py-2.5">Andel</th>
                <th className="text-right font-medium px-4 py-2.5">Mynder fakturerer</th>
                <th className="text-left font-medium px-4 py-2.5">Perioder</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = expanded === r.partner.id;
                return (
                  <Fragment key={r.partner.id}>
                    <tr className="border-t border-border hover:bg-muted/20">
                      <td className="px-3 py-2.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setExpanded(isOpen ? null : r.partner.id)}
                        >
                          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      </td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{r.partner.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{r.basis.toLocaleString("nb-NO")}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{r.share} %</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium">
                        {r.mynder.toLocaleString("nb-NO")}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.history.length} mnd</td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/10">
                        <td />
                        <td colSpan={5} className="px-4 py-3">
                          <table className="w-full text-xs">
                            <thead className="text-muted-foreground">
                              <tr>
                                <th className="text-left font-medium py-1">Periode</th>
                                <th className="text-right font-medium py-1">Grunnlag</th>
                                <th className="text-right font-medium py-1">Partnerandel</th>
                                <th className="text-right font-medium py-1">Fakturert av Mynder</th>
                                <th className="text-right font-medium py-1">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.history.map((h) => (
                                <tr key={h.label} className="border-t border-border/60">
                                  <td className="py-1.5 capitalize">{h.label}</td>
                                  <td className="py-1.5 text-right tabular-nums">{h.basis.toLocaleString("nb-NO")}</td>
                                  <td className="py-1.5 text-right tabular-nums">{h.share.toLocaleString("nb-NO")}</td>
                                  <td className="py-1.5 text-right tabular-nums font-medium">
                                    {h.mynder.toLocaleString("nb-NO")}
                                  </td>
                                  <td className="py-1.5 text-right">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[11px]",
                                        h.status === "sendt"
                                          ? "bg-success/10 text-success border-success/20"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {h.status === "sendt" ? "Sendt" : "Kladd"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
