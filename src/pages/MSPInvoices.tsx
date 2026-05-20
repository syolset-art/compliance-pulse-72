import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Download, CheckCircle2, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type CoreTier = "Basic" | "Premium" | "Enterprise";

interface PartnerCustomer {
  id: string;
  name: string;
  createdAt: string; // ISO
  coreTier: CoreTier;
  vendorModule: boolean;
  frameworks: string[];
  users: number;
  monthlyKr: number;
}

// Demo data — customers created within the last month (invoice basis for partner)
const customers: PartnerCustomer[] = [
  { id: "1", name: "Nordic Energy AS", createdAt: "2026-04-28", coreTier: "Enterprise", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "NIS2"], users: 42, monthlyKr: 9800 },
  { id: "2", name: "Fjord Helse", createdAt: "2026-05-02", coreTier: "Premium", vendorModule: true, frameworks: ["GDPR", "ISO 27001"], users: 18, monthlyKr: 4900 },
  { id: "3", name: "Bergen Logistikk", createdAt: "2026-05-04", coreTier: "Basic", vendorModule: true, frameworks: ["GDPR"], users: 9, monthlyKr: 1990 },
  { id: "4", name: "Oslo Advokatfirma", createdAt: "2026-05-08", coreTier: "Premium", vendorModule: false, frameworks: ["GDPR", "Åpenhetsloven"], users: 14, monthlyKr: 3900 },
  { id: "5", name: "Tromsø Tech", createdAt: "2026-05-11", coreTier: "Basic", vendorModule: false, frameworks: ["GDPR"], users: 4, monthlyKr: 990 },
  { id: "6", name: "Stavanger Industri", createdAt: "2026-05-14", coreTier: "Premium", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "NIS2"], users: 11, monthlyKr: 4900 },
  { id: "7", name: "Nordfjord Bank", createdAt: "2026-05-17", coreTier: "Enterprise", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "DORA"], users: 22, monthlyKr: 9800 },
];

const tierMeta: Record<CoreTier, string> = {
  Basic: "bg-muted text-foreground",
  Premium: "bg-primary/10 text-primary",
  Enterprise: "bg-primary text-primary-foreground",
};

export default function MSPInvoices() {
  const total = customers.reduce((s, c) => s + c.monthlyKr, 0);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-6xl mx-auto py-8 px-4 md:px-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Fakturagrunnlag</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Kunder opprettet siste måned — {customers.length} kunder · {total.toLocaleString("nb-NO")} kr/mnd
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
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

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Kunde</th>
                    <th className="text-left font-medium px-4 py-2.5">Mynder Core</th>
                    <th className="text-left font-medium px-4 py-2.5">Leverandørmodul</th>
                    <th className="text-left font-medium px-4 py-2.5">Regelverk</th>
                    <th className="text-right font-medium px-4 py-2.5">Brukere</th>
                    <th className="text-right font-medium px-4 py-2.5">Kr/mnd</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Opprettet {new Date(c.createdAt).toLocaleDateString("nb-NO")}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-xs", tierMeta[c.coreTier])}>
                          {c.coreTier}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {c.vendorModule ? (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aktiv
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Minus className="h-3.5 w-3.5" /> Ikke aktiv
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.frameworks.map((f) => (
                            <span key={f} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {f}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">{c.users}</td>
                      <td className="px-4 py-3 text-right text-foreground">{c.monthlyKr.toLocaleString("nb-NO")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={5} className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground">
                      Totalt fakturagrunnlag
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                      {total.toLocaleString("nb-NO")} kr
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
