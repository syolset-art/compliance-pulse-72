import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BadgeCheck, ExternalLink, Handshake, Pencil, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { PARTNERS, CUSTOMERS, PARTNER_TYPE_COLOR, countryFlag, PartnerRow } from "./adminDemoData";
import { usePartnerAgreements } from "@/hooks/useMynderAdmin";
import { PartnerAgreementPanel } from "./PartnerAgreementPanel";

export function PartnersView() {
  const { byPartner, eventsFor } = usePartnerAgreements();
  const [selected, setSelected] = useState<PartnerRow | null>(null);
  const [open, setOpen] = useState(false);

  const rows = PARTNERS.map((p) => {
    const cs = CUSTOMERS.filter((c) => c.salesChannel === "partner" && c.partnerId === p.id);
    const mrr = cs.reduce((s, c) => s + c.mrrNok, 0);
    const agreement = byPartner(p.id);
    const share = agreement ? Number(agreement.share_pct) : p.commissionPct;
    return { partner: p, customers: cs.length, mrr, agreement, share, changes: eventsFor(agreement?.id).length };
  });

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Handshake className="h-4 w-4 text-primary" />
            Partnere og avtaler
          </h3>
          <span className="text-xs text-muted-foreground">{rows.length} partnere</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="text-center font-medium px-3 py-2.5 w-12">Land</th>
                <th className="text-left font-medium px-4 py-2.5">Partner</th>
                <th className="text-left font-medium px-4 py-2.5">Type</th>
                <th className="text-right font-medium px-3 py-2.5">Kunder</th>
                <th className="text-right font-medium px-4 py-2.5">MRR (kr)</th>
                <th className="text-right font-medium px-3 py-2.5">Partnerandel</th>
                <th className="text-left font-medium px-4 py-2.5">Avtale</th>
                <th className="text-right font-medium px-3 py-2.5">Endringer</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ partner, customers, mrr, agreement, share, changes }) => (
                <tr key={partner.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-3 py-2.5 text-center">
                    <span className="text-base leading-none">{countryFlag(partner.country)}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-foreground">{partner.name}</div>
                    <div className="text-xs text-muted-foreground">{partner.contactEmail}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className={cn("text-[11px]", PARTNER_TYPE_COLOR[partner.type])}>
                      {partner.type}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{customers}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{mrr.toLocaleString("nb-NO")}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium">{share} %</td>
                  <td className="px-4 py-2.5">
                    {agreement?.agent_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-success">
                        <BadgeCheck className="h-3.5 w-3.5" />
                        Verifisert{agreement.agent_verified_by ? ` av ${agreement.agent_verified_by}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-warning">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Ikke verifisert
                      </span>
                    )}
                    {agreement?.agreement_url && (
                      <a
                        href={agreement.agreement_url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-2 text-xs text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Åpne
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{changes}</td>
                  <td className="px-3 py-2.5 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Rediger avtale"
                      onClick={() => {
                        setSelected(partner);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <PartnerAgreementPanel partner={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
