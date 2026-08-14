import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, ChevronLeft, Download, Handshake, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { countryFlag } from "./adminDemoData";
import {
  buildCsv,
  currentPeriod,
  directRecipients,
  downloadCsv,
  formatPeriod,
  isEndedInPeriod,
  isNewInPeriod,
  partnerRecipients,
  setCommissionPct,
  shiftPeriod,
  type Period,
  type RecipientBasis,
} from "./invoiceBasis";

const kr = (n: number) => `${n.toLocaleString("nb-NO")} kr`;
const dato = (iso: string) => new Date(iso).toLocaleDateString("nb-NO");

function RecipientCard({ r, period }: { r: RecipientBasis; period: Period }) {
  const [open, setOpen] = useState(false);
  const isPartner = !!r.partner;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 md:gap-4 hover:bg-muted/30 transition-colors text-left"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
        {isPartner ? (
          <Handshake className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Building2 className="h-4 w-4 text-primary shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-foreground truncate">{r.name}</div>
          <div className="text-xs text-muted-foreground">
            {isPartner
              ? `${r.customers.length} ${r.customers.length === 1 ? "kunde" : "kunder"}`
              : `${countryFlag(r.customers[0]?.customer.country ?? "NO")} ${r.customers[0]?.customer.industry ?? ""}`}
            {r.newCount > 0 && <> · {r.newCount} nye i perioden</>}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-base md:text-lg font-semibold tabular-nums text-foreground">{kr(r.toInvoice)}</div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Å fakturere</div>
        </div>
      </button>

      {open && (
        <div className="border-t border-border bg-muted/10 px-4 py-3 space-y-4">
          {r.customers.map((c) => (
            <div key={c.customer.id}>
              {isPartner && (
                <div className="text-sm font-medium text-foreground mb-1">
                  {countryFlag(c.customer.country)} {c.customer.name}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <tbody>
                    {c.lines.map((l) => (
                      <tr key={l.id} className="border-t border-border/60">
                        <td className="py-1.5 pr-3 text-foreground">
                          <span className="mr-2">{l.label}</span>
                          {isNewInPeriod(l, period) && (
                            <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                              NY
                            </Badge>
                          )}
                          {isEndedInPeriod(l, period) && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Avsluttet
                            </Badge>
                          )}
                        </td>
                        <td className="py-1.5 pr-3 text-xs text-muted-foreground whitespace-nowrap">
                          aktivert {dato(l.activatedAt)}
                        </td>
                        <td className="py-1.5 text-right tabular-nums text-foreground whitespace-nowrap">
                          {kr(l.monthlyNok)}
                        </td>
                      </tr>
                    ))}
                    {c.lines.length === 0 && (
                      <tr>
                        <td className="py-2 text-sm text-muted-foreground">Ingen aktive linjer i perioden</td>
                      </tr>
                    )}
                    <tr className="border-t border-border">
                      <td className="py-1.5 text-sm font-medium text-foreground" colSpan={2}>
                        Sum kunde
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-foreground">{kr(c.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="border-t border-border pt-3 space-y-1 text-sm">
            {isPartner && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sum før provisjon</span>
                  <span className="tabular-nums text-foreground">{kr(r.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partnerprovisjon {r.commissionPct} %</span>
                  <span className="tabular-nums text-foreground">−{kr(r.commission)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">Å fakturere (eks. mva)</span>
              <span className="tabular-nums text-foreground">{kr(r.toInvoice)}</span>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => downloadCsv(`fakturagrunnlag-${r.name}.csv`, buildCsv([r], period))}
          >
            <Download className="h-4 w-4" />
            Eksporter denne
          </Button>
        </div>
      )}
    </Card>
  );
}

function RateInput({ id, value, onChange }: { id: string; value: number; onChange: (n: number) => void }) {
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    const n = Number(draft.replace(",", "."));
    const safe = Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n))) : value;
    setDraft(String(safe));
    setCommissionPct(id, safe);
    onChange(safe);
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number"
        min={0}
        max={100}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        onClick={(e) => e.stopPropagation()}
        aria-label="Partnersats i prosent"
        className="w-16 rounded-md border border-input bg-background px-2 py-1 text-right text-sm tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <span className="text-sm text-muted-foreground">%</span>
    </span>
  );
}

export function InvoiceBasisView() {
  const [period, setPeriod] = useState<Period>(currentPeriod());
  const [rateVersion, setRateVersion] = useState(0);

  const partners = useMemo(() => partnerRecipients(period), [period, rateVersion]);
  const direct = useMemo(() => directRecipients(period), [period]);

  const partnerTotal = partners.reduce((s, r) => s + r.toInvoice, 0);
  const partnerGross = partners.reduce((s, r) => s + r.subtotal, 0);
  const commissionTotal = partners.reduce((s, r) => s + r.commission, 0);
  const directTotal = direct.reduce((s, r) => s + r.toInvoice, 0);
  const newCount = [...partners, ...direct].reduce((s, r) => s + r.newCount, 0);
  const recipientCount = partners.filter((p) => p.subtotal > 0).length + direct.filter((d) => d.subtotal > 0).length;
  const grossAll = partnerGross + directTotal;
  const directShare = grossAll > 0 ? Math.round((directTotal / grossAll) * 100) : 0;

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Mynders eget fakturagrunnlag: alle partnere med sine kunder, og direktekunder uten partner. Partnersatsen er
        andelen av abonnementet partneren beholder — den kan justeres per partner.
      </p>

      {/* Periodevelger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setPeriod(shiftPeriod(period, -1))} aria-label="Forrige måned">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-foreground capitalize min-w-[140px] text-center">
            {formatPeriod(period)}
          </span>
          <Button variant="outline" size="icon" onClick={() => setPeriod(shiftPeriod(period, 1))} aria-label="Neste måned">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 self-start"
          onClick={() => downloadCsv(`fakturagrunnlag-${period.year}-${period.month + 1}.csv`, buildCsv([...partners, ...direct], period))}
        >
          <Download className="h-4 w-4" />
          Eksporter alt (CSV)
        </Button>
      </div>

      {/* Sammendrag */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Fakturagrunnlag totalt</div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums text-foreground mt-1">
            {kr(partnerTotal + directTotal)}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">eks. mva</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Partnerkanal</div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums text-foreground mt-1">{kr(partnerTotal)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">etter {kr(commissionTotal)} i provisjon</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Direktekunder</div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums text-foreground mt-1">{kr(directTotal)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{recipientCount} fakturamottakere</div>
        </Card>
        <Card className="p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Andel direktesalg</div>
          <div className="text-xl md:text-2xl font-semibold tabular-nums text-foreground mt-1">{directShare} %</div>
          <div className="text-xs text-muted-foreground mt-0.5">{newCount} nye aktiveringer i perioden</div>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Partnere</h2>

        {/* Oversikt per partner */}
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2 font-medium">Partner</th>
                <th className="px-4 py-2 font-medium">Kunder</th>
                <th className="px-4 py-2 font-medium text-right">Abonnement/mnd</th>
                <th className="px-4 py-2 font-medium text-right">Sats</th>
                <th className="px-4 py-2 font-medium text-right">Provisjon</th>
                <th className="px-4 py-2 font-medium text-right">Å fakturere</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-2 text-muted-foreground tabular-nums">{r.customers.length}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-foreground">{kr(r.subtotal)}</td>
                  <td className="px-4 py-2 text-right">
                    <RateInput id={r.id} value={r.commissionPct} onChange={() => setRateVersion((v) => v + 1)} />
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">−{kr(r.commission)}</td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">{kr(r.toInvoice)}</td>
                </tr>
              ))}
              <tr className="border-t border-border bg-muted/30">
                <td className="px-4 py-2 font-medium text-foreground" colSpan={2}>
                  Totalt partnerkanal
                </td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">{kr(partnerGross)}</td>
                <td />
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">−{kr(commissionTotal)}</td>
                <td className="px-4 py-2 text-right tabular-nums font-semibold text-foreground">{kr(partnerTotal)}</td>
              </tr>
            </tbody>
          </table>
        </Card>

        {partners.map((r) => (
          <RecipientCard key={r.id} r={r} period={period} />
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-foreground">Direktekunder (uten partner)</h2>
        {direct.map((r) => (
          <RecipientCard key={r.id} r={r} period={period} />
        ))}
        <Card className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Totalt direktesalg</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">{kr(directTotal)}</span>
        </Card>
      </section>
    </div>
  );
}

