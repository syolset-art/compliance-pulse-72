import { useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Settings, Download, CheckCircle2, Minus, FileText, Upload, Info, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

type CoreTier = "Basic" | "Premium" | "Enterprise";
type OfferStatus = "accepted" | "pending" | "missing";

interface OfferDoc {
  id: string;
  name: string;
}

interface PartnerCustomer {
  id: string;
  name: string;
  createdAt: string; // ISO
  coreTier: CoreTier;
  vendorModule: boolean;
  frameworks: string[];
  users: number;
  mynderKr: number; // det Mynder fakturerer partneren (Core + modul + regelverk)
  offerPriceKr: number | null; // partnerens tilbudspris til sluttkunden
  offerStatus: OfferStatus;
  offerDoc: OfferDoc | null;
}

// Demo data
const customers: PartnerCustomer[] = [
  { id: "1", name: "Nordic Energy AS", createdAt: "2026-04-08", coreTier: "Enterprise", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "NIS2"], users: 42, mynderKr: 9800, offerPriceKr: 14500, offerStatus: "accepted", offerDoc: { id: "a1", name: "Tilbud_NordicEnergy_v2.pdf" } },
  { id: "2", name: "Fjord Helse", createdAt: "2026-04-22", coreTier: "Premium", vendorModule: true, frameworks: ["GDPR", "ISO 27001"], users: 18, mynderKr: 4900, offerPriceKr: 7200, offerStatus: "accepted", offerDoc: { id: "a2", name: "Tilbud_FjordHelse.pdf" } },
  { id: "3", name: "Bergen Logistikk", createdAt: "2026-05-04", coreTier: "Basic", vendorModule: true, frameworks: ["GDPR"], users: 9, mynderKr: 1990, offerPriceKr: 3200, offerStatus: "pending", offerDoc: { id: "a3", name: "Tilbud_BergenLogistikk.pdf" } },
  { id: "4", name: "Oslo Advokatfirma", createdAt: "2026-05-08", coreTier: "Premium", vendorModule: false, frameworks: ["GDPR", "Åpenhetsloven"], users: 14, mynderKr: 3900, offerPriceKr: 5500, offerStatus: "accepted", offerDoc: { id: "a4", name: "Tilbud_OsloAdvokat.pdf" } },
  { id: "5", name: "Tromsø Tech", createdAt: "2026-05-11", coreTier: "Basic", vendorModule: false, frameworks: ["GDPR"], users: 4, mynderKr: 990, offerPriceKr: null, offerStatus: "missing", offerDoc: null },
  { id: "6", name: "Stavanger Industri", createdAt: "2026-05-14", coreTier: "Premium", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "NIS2"], users: 11, mynderKr: 4900, offerPriceKr: 6800, offerStatus: "pending", offerDoc: { id: "a6", name: "Tilbud_StavangerIndustri.pdf" } },
  { id: "7", name: "Nordfjord Bank", createdAt: "2026-05-17", coreTier: "Enterprise", vendorModule: true, frameworks: ["GDPR", "ISO 27001", "DORA"], users: 22, mynderKr: 9800, offerPriceKr: 15900, offerStatus: "accepted", offerDoc: { id: "a7", name: "Tilbud_NordfjordBank_v3.pdf" } },
];

const tierMeta: Record<CoreTier, string> = {
  Basic: "bg-muted text-foreground",
  Premium: "bg-primary/10 text-primary",
  Enterprise: "bg-primary text-primary-foreground",
};

const offerStatusMeta: Record<OfferStatus, { label: string; cls: string; Icon: typeof CheckCircle2 }> = {
  accepted: { label: "Akseptert", cls: "bg-success/10 text-success border-success/20", Icon: CheckCircle2 },
  pending: { label: "Sendt — venter", cls: "bg-muted text-muted-foreground border-border", Icon: Clock },
  missing: { label: "Ikke registrert", cls: "bg-warning/10 text-warning border-warning/20", Icon: AlertTriangle },
};

const monthKey = (iso: string) => iso.slice(0, 7);
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
};

const fmt = (n: number) => n.toLocaleString("nb-NO");

export default function MSPInvoices() {
  const grouped = useMemo(() => {
    const map = new Map<string, PartnerCustomer[]>();
    for (const c of customers) {
      const k = monthKey(c.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, rows]) => ({
        key,
        label: monthLabel(key),
        rows: rows.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
        mynderTotal: rows.reduce((s, c) => s + c.mynderKr, 0),
        offerTotal: rows.reduce((s, c) => s + (c.offerPriceKr ?? 0), 0),
        missingOffers: rows.filter((c) => c.offerStatus === "missing").length,
      }));
  }, []);

  const mynderGrandTotal = customers.reduce((s, c) => s + c.mynderKr, 0);
  const offerGrandTotal = customers.reduce((s, c) => s + (c.offerPriceKr ?? 0), 0);

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
                  Kunder partneren har lagt til — gruppert per måned · {customers.length} kunder ·{" "}
                  <span className="text-foreground font-medium">{fmt(mynderGrandTotal)} kr/mnd</span> til Mynder ·{" "}
                  <span className="text-foreground font-medium">{fmt(offerGrandTotal)} kr/mnd</span> tilbudt sluttkunde
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => toast.success("Eksporterer fakturagrunnlag…")}>
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

            {grouped.map((g) => (
              <Card key={g.key} className="overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border bg-muted/30">
                  <div>
                    <div className="text-sm font-semibold text-foreground capitalize">{g.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {g.rows.length} nye kunder
                      {g.missingOffers > 0 && (
                        <span className="text-warning"> · {g.missingOffers} mangler tilbud</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Til Mynder</div>
                      <div className="text-sm font-semibold text-foreground">{fmt(g.mynderTotal)} kr/mnd</div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Tilbudt sluttkunde</div>
                      <div className="text-sm font-semibold text-foreground">{fmt(g.offerTotal)} kr/mnd</div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20 text-xs text-muted-foreground">
                      <tr>
                        <th className="text-left font-medium px-4 py-2.5">Kunde</th>
                        <th className="text-left font-medium px-4 py-2.5">Mynder Core</th>
                        <th className="text-left font-medium px-4 py-2.5">Leverandørmodul</th>
                        <th className="text-left font-medium px-4 py-2.5">Aktiverte regelverk</th>
                        <th className="text-right font-medium px-4 py-2.5">Brukere</th>
                        <th className="text-right font-medium px-4 py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Mynder kr/mnd <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-xs">
                              Dette faktureres partneren av Mynder. Summen av Core-tier + Leverandørmodul + aktiverte regelverk. Løper uansett om sluttkunden har akseptert tilbudet.
                            </TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-right font-medium px-4 py-2.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 cursor-help">
                                Tilbud kr/mnd <Info className="h-3 w-3" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[260px] text-xs">
                              Det partneren har tilbudt sin sluttkunde. Registreres manuelt — kan avvike fra Mynder-fakturagrunnlaget.
                            </TooltipContent>
                          </Tooltip>
                        </th>
                        <th className="text-left font-medium px-4 py-2.5">Tilbud</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.rows.map((c) => {
                        const status = offerStatusMeta[c.offerStatus];
                        const StatusIcon = status.Icon;
                        return (
                          <tr key={c.id} className="border-t border-border hover:bg-muted/20 align-top">
                            <td className="px-4 py-3">
                              <Link
                                to={`/msp-dashboard/${c.id}`}
                                className="font-medium text-foreground hover:text-primary hover:underline underline-offset-2"
                              >
                                {c.name}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                Lagt til {new Date(c.createdAt).toLocaleDateString("nb-NO")}
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
                            <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                              {fmt(c.mynderKr)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-foreground tabular-nums">
                                  {c.offerPriceKr !== null ? fmt(c.offerPriceKr) : "—"}
                                </span>
                                <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border", status.cls)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {status.label}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {c.offerDoc ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => toast.success("Åpner tilbud…")}
                                      className="inline-flex items-center text-primary hover:opacity-80"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">Se tilbud</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => toast.info("Last opp tilbudsdokument (demo)")}
                                      className="inline-flex items-center text-muted-foreground hover:text-foreground"
                                    >
                                      <Upload className="h-4 w-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">Last opp tilbud</TooltipContent>
                                </Tooltip>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </TooltipProvider>
  );
}
