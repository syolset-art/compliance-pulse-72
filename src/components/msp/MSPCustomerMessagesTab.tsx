import { useEffect, useState, Fragment } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Clock, MessageSquare, XCircle, Send, ShieldCheck, Download, Inbox, Archive, Sparkles, ThumbsUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  getDeliveryReports,
  subscribeDeliveryReports,
  updateDeliveryReport,
  type DeliveryReport,
} from "@/lib/deliveryReports";
import { toast } from "sonner";

type OfferStatus = "approved" | "pending" | "declined";
type ItemType = "offer" | "message";

interface Approval {
  approvedBy: string;
  approverRole: string;
  approvedAt: string;
  method: "E-signatur" | "E-post" | "Portal";
  reference: string;
  ipAddress?: string;
}

interface Item {
  id: string;
  type: ItemType;
  title: string;
  desc: string;
  date: string;
  status?: OfferStatus;
  amount?: string;
  from: "partner" | "customer";
  archived?: boolean;
  approval?: Approval;
}

const items: Item[] = [
  {
    id: "1",
    type: "offer",
    title: "NIS2-klargjøring – full leveranse",
    desc: "Gap-analyse, risikovurdering og rapporteringsrutiner. Estimert 6 ukers leveranse.",
    date: "22. april 2026",
    status: "approved",
    amount: "kr 145 000",
    from: "partner",
    approval: {
      approvedBy: "Marte Solheim",
      approverRole: "CISO, Nordvik AS",
      approvedAt: "24. april 2026 kl. 14:32",
      method: "E-signatur",
      reference: "OFFER-2026-0042",
      ipAddress: "85.166.x.x",
    },
  },
  {
    id: "2",
    type: "offer",
    title: "ISO 27001-klargjøring",
    desc: "Strukturert løp mot sertifisering. Vi tar styringssystem og dokumentasjon.",
    date: "18. april 2026",
    status: "pending",
    amount: "kr 220 000",
    from: "partner",
  },
  {
    id: "3",
    type: "message",
    title: "Spørsmål om SOC 2-rapport",
    desc: "Kunden ber om en oppdatert SOC 2-rapport for sin underleverandør-vurdering.",
    date: "15. april 2026",
    from: "customer",
  },
  {
    id: "4",
    type: "offer",
    title: "Awareness-program (årlig abonnement)",
    desc: "Trening, phishing-simulering og rapportering for 45 ansatte.",
    date: "10. april 2026",
    status: "declined",
    amount: "kr 38 000 / år",
    from: "partner",
    archived: true,
  },
  {
    id: "5",
    type: "message",
    title: "Bekreftelse på personvernombud",
    desc: "Kunden bekrefter at de har utnevnt internt personvernombud — trenger ikke ekstern DPO-tjeneste.",
    date: "5. april 2026",
    from: "customer",
    archived: true,
  },
];

function statusBadge(s?: OfferStatus) {
  if (s === "approved") {
    return (
      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Godkjent
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30 gap-1">
        <Clock className="h-3 w-3" /> Avventer svar
      </Badge>
    );
  }
  if (s === "declined") {
    return (
      <Badge variant="outline" className="text-xs bg-destructive/10 text-destructive border-destructive/30 gap-1">
        <XCircle className="h-3 w-3" /> Avslått
      </Badge>
    );
  }
  return null;
}

function OfferTable({ offers }: { offers: Item[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="text-xs">Tittel & Beskrivelse</TableHead>
            <TableHead className="w-[120px] text-xs">Sendt</TableHead>
            <TableHead className="w-[120px] text-right text-xs">Beløp</TableHead>
            <TableHead className="w-[120px] text-right text-xs">Status</TableHead>
            <TableHead className="w-[60px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offers.map(o => {
            const hasApproval = o.status === "approved" && o.approval;
            const isExpanded = expandedId === o.id;

            return (
              <Fragment key={o.id}>
                <TableRow 
                  className={cn(
                    "border-b border-border/40 transition-colors hover:bg-muted/30",
                    hasApproval && "cursor-pointer",
                    isExpanded && "bg-muted/30"
                  )}
                  onClick={() => {
                    if (hasApproval) {
                      setExpandedId(isExpanded ? null : o.id);
                    }
                  }}
                >
                  <TableCell className="py-3">
                    <div className="space-y-0.5">
                      <p className="text-[13px] font-semibold text-foreground">{o.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{o.desc}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground py-3">
                    {o.date}
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-semibold text-foreground py-3">
                    {o.amount}
                  </TableCell>
                  <TableCell className="text-right py-3">
                    <div className="flex justify-end">
                      {statusBadge(o.status)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right py-3 pr-4">
                    {hasApproval && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedId(isExpanded ? null : o.id);
                        }}
                      >
                        <ShieldCheck className={cn("h-4 w-4 transition-colors", isExpanded ? "text-success" : "opacity-60")} />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {hasApproval && isExpanded && o.approval && (
                  <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-border/40">
                    <TableCell colSpan={5} className="p-4 bg-muted/[0.02]">
                      <div className="pl-6 py-2 border-l-2 border-success/40 space-y-3 text-xs">
                        <div className="font-semibold text-success flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" /> Bevis på godkjenning
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <span className="text-muted-foreground block mb-0.5">Godkjent av:</span>
                            <span className="text-foreground font-medium">{o.approval.approvedBy}</span>
                            <span className="text-muted-foreground block text-[11px]">{o.approval.approverRole}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-0.5">Tidspunkt:</span>
                            <span className="text-foreground font-medium">{o.approval.approvedAt}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-0.5">Metode:</span>
                            <span className="text-foreground font-medium">{o.approval.method}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block mb-0.5">Referanse:</span>
                            <span className="text-foreground font-mono font-medium">{o.approval.reference}</span>
                          </div>
                        </div>
                        {o.approval.ipAddress && (
                          <div className="pt-1 text-[11px]">
                            <span className="text-muted-foreground">IP-adresse: </span>
                            <span className="text-foreground font-mono">{o.approval.ipAddress}</span>
                          </div>
                        )}
                        <div className="pt-1">
                          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                            <Download className="h-3 w-3" /> Last ned signert tilbud
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function MessageTable({ messages }: { messages: Item[] }) {
  return (
    <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-border/60">
            <TableHead className="text-xs">Emne</TableHead>
            <TableHead className="text-xs">Melding</TableHead>
            <TableHead className="w-[130px] text-xs">Mottatt</TableHead>
            <TableHead className="w-[120px] text-right text-xs pr-4">Handling</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.map(m => (
            <TableRow key={m.id} className="border-b border-border/40 hover:bg-muted/20">
              <TableCell className="py-3 align-top">
                <p className="text-[13px] font-semibold text-foreground">{m.title}</p>
              </TableCell>
              <TableCell className="py-3 align-top">
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{m.desc}</p>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap py-3 align-top">
                {m.date}
              </TableCell>
              <TableCell className="text-right py-3 pr-4 align-top">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Svar
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
      <Icon className="h-6 w-6 mb-2 opacity-60" />
      <p className="text-[13px]">{label}</p>
    </div>
  );
}

export function MSPCustomerMessagesTab() {
  const [tab, setTab] = useState("sent");
  const [reports, setReports] = useState<DeliveryReport[]>(() => getDeliveryReports());

  useEffect(() => {
    return subscribeDeliveryReports(() => setReports(getDeliveryReports()));
  }, []);

  const allOffers = items.filter(i => i.type === "offer");
  const sent = allOffers.filter(o => o.status === "pending");
  const approvedOffers = allOffers.filter(o => o.status === "approved");
  const closedOffers = allOffers.filter(o => o.status === "declined");
  const received = items.filter(i => i.type === "message" && !i.archived);

  const pendingReports = reports.filter(r => r.status === "sent");
  const approvedReports = reports.filter(r => r.status === "approved");

  const handleApproveReport = (r: DeliveryReport) => {
    updateDeliveryReport(r.id, {
      status: "approved",
      approvedAt: new Date().toISOString(),
      approvedBy: r.customerName,
    });
    const delta = r.maturityDeltaPercent ?? 8;
    toast.success(`${r.customerName} godkjente leveranserapporten`, {
      description: `Modenhet på ${r.frameworkLabel ?? "berørte kontroller"} økte med +${delta} %. ${r.controlIds.length} kontrollpunkter ble beriket.`,
    });
  };

  const handleDeclineReport = (r: DeliveryReport) => {
    updateDeliveryReport(r.id, { status: "declined" });
    toast.info("Rapport avvist av kunde");
  };

  return (
    <div className="space-y-5">

      {/* Delivery reports awaiting customer approval */}
      {(pendingReports.length > 0 || approvedReports.length > 0) && (
        <Card className="p-4 space-y-3 border-primary/30 bg-primary/[0.03]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Leveranserapporter</h3>
            <span className="text-xs text-muted-foreground">Sendt til kunde for godkjenning</span>
          </div>
          <div className="space-y-2">
            {pendingReports.map(r => (
              <DeliveryReportRow
                key={r.id}
                r={r}
                onApprove={() => handleApproveReport(r)}
                onDecline={() => handleDeclineReport(r)}
              />
            ))}
            {approvedReports.map(r => (
              <DeliveryReportRow key={r.id} r={r} />
            ))}
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="sent" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Send className="h-3 w-3" /> Sendt
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{sent.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <CheckCircle2 className="h-3 w-3" /> Godkjent
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{approvedOffers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Inbox className="h-3 w-3" /> Mottatt
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{received.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Archive className="h-3 w-3" /> Avsluttet
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-xs">{closedOffers.length}</Badge>
            </TabsTrigger>
          </TabsList>
          {tab === "sent" && (
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
              <Send className="h-3 w-3" /> Nytt tilbud
            </Button>
          )}
        </div>

        <TabsContent value="sent" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Tilbud som avventer svar</h3>
            </div>
            {sent.length === 0 ? (
              <EmptyState icon={Send} label="Ingen tilbud som avventer svar." />
            ) : (
              <OfferTable offers={sent} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Godkjente tilbud</h3>
              <span className="text-xs text-muted-foreground">Med signert bevis</span>
            </div>
            {approvedOffers.length === 0 ? (
              <EmptyState icon={CheckCircle2} label="Ingen godkjente tilbud ennå." />
            ) : (
              <OfferTable offers={approvedOffers} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="received" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Meldinger fra kunde</h3>
            </div>
            {received.length === 0 ? (
              <EmptyState icon={Inbox} label="Ingen nye meldinger fra kunden." />
            ) : (
              <MessageTable messages={received} />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Avsluttede tilbud</h3>
              <span className="text-xs text-muted-foreground">Avslåtte eller trukne tilbud</span>
            </div>
            {closedOffers.length === 0 ? (
              <EmptyState icon={Archive} label="Ingen avsluttede tilbud." />
            ) : (
              <OfferTable offers={closedOffers} />
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DeliveryReportRow({
  r,
  onApprove,
  onDecline,
}: {
  r: DeliveryReport;
  onApprove?: () => void;
  onDecline?: () => void;
}) {
  const approved = r.status === "approved";
  const declined = r.status === "declined";
  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-foreground truncate">
              {r.deliveryTitle}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {r.fileName}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            approved
              ? "text-xs bg-success/10 text-success border-success/30 gap-1"
              : declined
                ? "text-xs bg-destructive/10 text-destructive border-destructive/30 gap-1"
                : "text-xs bg-warning/10 text-warning border-warning/30 gap-1"
          }
        >
          {approved ? (
            <><CheckCircle2 className="h-3 w-3" /> Godkjent</>
          ) : declined ? (
            <><XCircle className="h-3 w-3" /> Avvist</>
          ) : (
            <><Clock className="h-3 w-3" /> Avventer godkjenning</>
          )}
        </Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {r.frameworkLabel && (
          <Badge variant="outline" className="text-xs">{r.frameworkLabel}</Badge>
        )}
        <span>{r.controlIds.length} kontroller</span>
        <span>·</span>
        <span>{r.activitiesCount} aktiviteter</span>
        <span>·</span>
        <span>{r.evidenceCount} vedlegg</span>
        <span className="ml-auto">Sendt {new Date(r.sentAt).toLocaleDateString("nb-NO")}</span>
      </div>
      {approved && r.approvedAt && (
        <div className="flex items-center gap-1.5 text-xs text-success border-t border-success/20 pt-2">
          <ShieldCheck className="h-3 w-3" />
          Godkjent av {r.approvedBy} · {new Date(r.approvedAt).toLocaleString("nb-NO")} · Modenhet +{r.maturityDeltaPercent ?? 0} %
        </div>
      )}
      {!approved && !declined && onApprove && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/60">
          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={onApprove}>
            <ThumbsUp className="h-3 w-3" />
            Simuler kundens godkjenning
          </Button>
          {onDecline && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-muted-foreground"
              onClick={onDecline}
            >
              Avvis
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">
            Ved godkjenning oppdateres modenheten automatisk
          </span>
        </div>
      )}
    </div>
  );
}

