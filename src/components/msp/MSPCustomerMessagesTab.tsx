import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, CheckCircle2, Clock, MessageSquare, XCircle, Send, ShieldCheck, Download, Inbox, Archive } from "lucide-react";

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
      <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Godkjent
      </Badge>
    );
  }
  if (s === "pending") {
    return (
      <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/30 gap-1">
        <Clock className="h-3 w-3" /> Avventer svar
      </Badge>
    );
  }
  if (s === "declined") {
    return (
      <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 gap-1">
        <XCircle className="h-3 w-3" /> Avslått
      </Badge>
    );
  }
  return null;
}

function OfferCard({ o }: { o: Item }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-foreground">{o.title}</p>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{o.desc}</p>
        </div>
        {statusBadge(o.status)}
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
        <span className="text-[11px] text-muted-foreground">Sendt {o.date}</span>
        <span className="text-[12px] font-semibold text-foreground">{o.amount}</span>
      </div>
      {o.status === "approved" && o.approval && (
        <details className="group">
          <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors list-none [&::-webkit-details-marker]:hidden">
            <ShieldCheck className="h-3 w-3 text-success" />
            <span>Bevis på godkjenning</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="truncate">{o.approval.approvedBy}, {o.approval.approvedAt}</span>
          </summary>
          <div className="mt-2 pl-4 border-l-2 border-success/30 space-y-1 text-[11px]">
            <div>
              <span className="text-muted-foreground">Godkjent av: </span>
              <span className="text-foreground">{o.approval.approvedBy} ({o.approval.approverRole})</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tidspunkt: </span>
              <span className="text-foreground">{o.approval.approvedAt}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Metode: </span>
              <span className="text-foreground">{o.approval.method}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Referanse: </span>
              <span className="text-foreground font-mono">{o.approval.reference}</span>
            </div>
            {o.approval.ipAddress && (
              <div>
                <span className="text-muted-foreground">IP: </span>
                <span className="text-foreground font-mono">{o.approval.ipAddress}</span>
              </div>
            )}
            <button type="button" className="inline-flex items-center gap-1 text-primary hover:underline pt-1">
              <Download className="h-3 w-3" /> Last ned signert tilbud
            </button>
          </div>
        </details>
      )}
    </div>
  );
}

function MessageCard({ m }: { m: Item }) {
  return (
    <div className="rounded-lg border border-border/60 p-3 space-y-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-foreground">{m.title}</p>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{m.date}</span>
      </div>
      <p className="text-[12px] text-muted-foreground leading-snug">{m.desc}</p>
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

  const allOffers = items.filter(i => i.type === "offer");
  const sent = allOffers.filter(o => o.status === "pending");
  const approvedOffers = allOffers.filter(o => o.status === "approved");
  const closedOffers = allOffers.filter(o => o.status === "declined");
  const received = items.filter(i => i.type === "message" && !i.archived);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sendte tilbud</p>
          <p className="text-2xl font-bold text-foreground mt-1">{allOffers.length}</p>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Godkjent</p>
          <p className="text-2xl font-bold text-success mt-1">{approvedOffers.length}</p>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avventer svar</p>
          <p className="text-2xl font-bold text-warning mt-1">{sent.length}</p>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="sent" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Send className="h-3 w-3" /> Sendt
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{sent.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="approved" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <CheckCircle2 className="h-3 w-3" /> Godkjent
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{approvedOffers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Inbox className="h-3 w-3" /> Mottatt
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{received.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="closed" className="text-xs gap-1.5 data-[state=active]:bg-background">
              <Archive className="h-3 w-3" /> Avsluttet
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{closedOffers.length}</Badge>
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
              <div className="space-y-2">
                {sent.map(o => <OfferCard key={o.id} o={o} />)}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold text-foreground">Godkjente tilbud</h3>
              <span className="text-[11px] text-muted-foreground">Med signert bevis</span>
            </div>
            {approvedOffers.length === 0 ? (
              <EmptyState icon={CheckCircle2} label="Ingen godkjente tilbud ennå." />
            ) : (
              <div className="space-y-2">
                {approvedOffers.map(o => <OfferCard key={o.id} o={o} />)}
              </div>
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
              <div className="space-y-2">
                {received.map(m => <MessageCard key={m.id} m={m} />)}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="mt-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Avsluttede tilbud</h3>
              <span className="text-[11px] text-muted-foreground">Avslåtte eller trukne tilbud</span>
            </div>
            {closedOffers.length === 0 ? (
              <EmptyState icon={Archive} label="Ingen avsluttede tilbud." />
            ) : (
              <div className="space-y-2">
                {closedOffers.map(o => <OfferCard key={o.id} o={o} />)}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
