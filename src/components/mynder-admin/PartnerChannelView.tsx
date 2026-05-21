import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Handshake, Mail, Server, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PARTNERS,
  CUSTOMERS,
  PLAN_META,
  PARTNER_TYPE_COLOR,
  countryFlag,
} from "./adminDemoData";

export function PartnerChannelView() {
  const [expanded, setExpanded] = useState<string | null>(PARTNERS[0]?.id ?? null);

  const partnerCustomers = PARTNERS.map((p) => {
    const cs = CUSTOMERS.filter((c) => c.salesChannel === "partner" && c.partnerId === p.id);
    const mrr = cs.reduce((s, c) => s + c.mrrNok, 0);
    return { ...p, customers: cs, customerCount: cs.length, mrr };
  });

  return (
    <div className="space-y-4">
      {partnerCustomers.map((p) => {
        const isOpen = expanded === p.id;
        return (
          <Card key={p.id} className="overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : p.id)}
              className="w-full px-4 py-3 flex items-center gap-4 hover:bg-muted/30 transition-colors text-left"
            >
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Handshake className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="font-semibold text-foreground truncate">{p.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <span>{countryFlag(p.country)} {p.country}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{p.contactEmail}</span>
                  </div>
                </div>
              </div>
              <Badge variant="outline" className={cn("text-[10px]", PARTNER_TYPE_COLOR[p.type])}>
                {p.type}
              </Badge>
              <div className="hidden md:flex items-center gap-6 text-right">
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">{p.customerCount}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Kunder</div>
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">{p.mrr.toLocaleString("nb-NO")}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">MRR kr</div>
                </div>
                <div>
                  <div className="text-lg font-bold tabular-nums text-foreground">{p.commissionPct}%</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Provisjon</div>
                </div>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-border bg-muted/10">
                {p.customers.length === 0 ? (
                  <div className="p-6 text-sm text-muted-foreground text-center">
                    Ingen kunder registrert under denne partneren.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-muted-foreground">
                        <tr>
                          <th className="text-center font-medium px-3 py-2 w-12">Land</th>
                          <th className="text-left font-medium px-4 py-2">Kunde</th>
                          <th className="text-left font-medium px-4 py-2">Bransje</th>
                          <th className="text-left font-medium px-4 py-2">Plan</th>
                          <th className="text-left font-medium px-4 py-2">Moduler</th>
                          <th className="text-left font-medium px-4 py-2">Regelverk</th>
                          <th className="text-right font-medium px-3 py-2" title="Systemer"><Server className="h-3.5 w-3.5 inline" /></th>
                          <th className="text-right font-medium px-3 py-2" title="Leverandører"><Truck className="h-3.5 w-3.5 inline" /></th>
                          <th className="text-right font-medium px-3 py-2">Brukere</th>
                          <th className="text-right font-medium px-4 py-2">MRR (kr)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.customers.map((c) => (
                          <tr key={c.id} className="border-t border-border hover:bg-background/50">
                            <td className="px-3 py-2 text-center">
                              <span className="text-base leading-none">{countryFlag(c.country)}</span>
                            </td>
                            <td className="px-4 py-2 font-medium text-foreground">{c.name}</td>
                            <td className="px-4 py-2 text-muted-foreground">{c.industry}</td>
                            <td className="px-4 py-2">
                              <Badge variant="outline" className={cn("text-xs", PLAN_META[c.plan].color)}>{c.plan}</Badge>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {c.modules.map((m) => (
                                  <span key={m} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{m}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex flex-wrap gap-1">
                                {c.frameworks.map((f) => (
                                  <span key={f} className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{f}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-foreground">{c.systems}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-foreground">{c.vendors}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-foreground">{c.users}</td>
                            <td className="px-4 py-2 text-right tabular-nums font-medium text-foreground">{c.mrrNok.toLocaleString("nb-NO")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
