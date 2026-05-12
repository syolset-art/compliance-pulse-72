import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle2, Clock, MessageSquare, XCircle, Send, ShieldCheck, Download } from "lucide-react";

type OfferStatus = "approved" | "pending" | "declined";
type MessageType = "offer" | "message";

interface Item {
  id: string;
  type: MessageType;
  title: string;
  desc: string;
  date: string;
  status?: OfferStatus;
  amount?: string;
  from: "partner" | "customer";
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
  },
  {
    id: "5",
    type: "message",
    title: "Bekreftelse på personvernombud",
    desc: "Kunden bekrefter at de har utnevnt internt personvernombud — trenger ikke ekstern DPO-tjeneste.",
    date: "5. april 2026",
    from: "customer",
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

export function MSPCustomerMessagesTab() {
  const offers = items.filter(i => i.type === "offer");
  const messages = items.filter(i => i.type === "message");
  const approved = offers.filter(o => o.status === "approved").length;
  const pending = offers.filter(o => o.status === "pending").length;

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Sendte tilbud</p>
          <p className="text-2xl font-bold text-foreground mt-1">{offers.length}</p>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Godkjent</p>
          <p className="text-2xl font-bold text-success mt-1">{approved}</p>
        </Card>
        <Card className="p-3 bg-muted/30 border-border/60">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avventer svar</p>
          <p className="text-2xl font-bold text-warning mt-1">{pending}</p>
        </Card>
      </div>

      {/* Offers */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Tilbud sendt til kunde</h3>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
            <Send className="h-3 w-3" /> Nytt tilbud
          </Button>
        </div>
        <div className="space-y-2">
          {offers.map(o => (
            <div key={o.id} className="rounded-lg border border-border/60 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground">{o.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">{o.desc}</p>
                </div>
                {statusBadge(o.status)}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                <span className="text-[11px] text-muted-foreground">{o.date}</span>
                <span className="text-[12px] font-semibold text-foreground">{o.amount}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Messages */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Meldinger fra kunde</h3>
          </div>
        </div>
        <div className="space-y-2">
          {messages.map(m => (
            <div key={m.id} className="rounded-lg border border-border/60 p-3 space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] font-semibold text-foreground">{m.title}</p>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">{m.date}</span>
              </div>
              <p className="text-[12px] text-muted-foreground leading-snug">{m.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
