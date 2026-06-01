import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ShieldCheck, Mail, Clock, CheckCircle2, FileSignature, Send, X } from "lucide-react";
import { toast } from "sonner";

type TakeoverStatus = "none" | "pending" | "granted";
type TakeoverSource = "contract" | "customer-grant";

interface TakeoverState {
  status: TakeoverStatus;
  source?: TakeoverSource;
  at?: string; // ISO timestamp
}

interface TakeoverTrustProfileCardProps {
  customerId: string;
  customerName: string;
  contactName?: string | null;
  contactEmail?: string | null;
}

const PARTNER_NAME = "Nordlys Sikkerhet AS"; // demo

function storageKey(customerId: string) {
  return `mynder:takeover:${customerId}`;
}

function loadState(customerId: string): TakeoverState {
  try {
    const raw = localStorage.getItem(storageKey(customerId));
    if (!raw) return { status: "none" };
    return JSON.parse(raw) as TakeoverState;
  } catch {
    return { status: "none" };
  }
}

function saveState(customerId: string, state: TakeoverState) {
  localStorage.setItem(storageKey(customerId), JSON.stringify(state));
}

function formatNo(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("nb-NO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TakeoverTrustProfileCard({
  customerId,
  customerName,
  contactName,
  contactEmail,
}: TakeoverTrustProfileCardProps) {
  const [state, setState] = useState<TakeoverState>({ status: "none" });
  const [contractOpen, setContractOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);

  useEffect(() => {
    setState(loadState(customerId));
  }, [customerId]);

  const update = (next: TakeoverState) => {
    setState(next);
    saveState(customerId, next);
  };

  return (
    <>
      <Card className="p-5 border-primary/20 bg-primary/[0.03]">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-foreground">
                  Overta {customerName}s Trust Profile
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  For å jobbe i kundens profil må du ha fullmakt — enten via signert
                  leveranseavtale, eller ved å be kunden bekrefte direkte.
                </p>
              </div>
              <StatusBadge state={state} />
            </div>

            {state.status === "none" && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button size="sm" className="gap-1.5" onClick={() => setContractOpen(true)}>
                  <FileSignature className="h-3.5 w-3.5" />
                  Jeg har avtale med kunden
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setGrantOpen(true)}
                >
                  <Mail className="h-3.5 w-3.5" />
                  Be kunden om fullmakt
                </Button>
              </div>
            )}

            {state.status === "pending" && (
              <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-warning" />
                  <span>
                    Venter på fullmakt fra{" "}
                    <strong>{contactName || contactEmail || "kunden"}</strong>
                  </span>
                  <span className="text-muted-foreground">· sendt {formatNo(state.at)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1.5"
                    onClick={() => {
                      update({ status: "pending", source: "customer-grant", at: new Date().toISOString() });
                      toast.success("Påminnelse sendt", {
                        description: `Vi har sendt en ny e-post til ${contactEmail || "kunden"}.`,
                      });
                    }}
                  >
                    <Send className="h-3 w-3" />
                    Send påminnelse
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground gap-1"
                    onClick={() => {
                      update({ status: "none" });
                      toast.info("Forespørsel avbrutt");
                    }}
                  >
                    <X className="h-3 w-3" />
                    Avbryt forespørsel
                  </Button>
                </div>
              </div>
            )}

            {state.status === "granted" && (
              <div className="rounded-md border border-success/30 bg-success/5 px-3 py-2.5 space-y-2">
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="font-semibold">Fullmakt aktiv</span>
                  <span className="text-muted-foreground">
                    ·{" "}
                    {state.source === "contract"
                      ? "Signert avtale bekreftet"
                      : "Kunde ga fullmakt"}{" "}
                    {formatNo(state.at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Du kan nå utføre aktiviteter, laste opp dokumentasjon og svare på
                  henvendelser på vegne av {customerName}.
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-muted-foreground gap-1"
                  onClick={() => {
                    update({ status: "none" });
                    toast.info("Fullmakt trukket tilbake");
                  }}
                >
                  Trekk tilbake fullmakt
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      <ConfirmContractDialog
        open={contractOpen}
        onOpenChange={setContractOpen}
        customerName={customerName}
        onConfirm={() => {
          update({ status: "granted", source: "contract", at: new Date().toISOString() });
          setContractOpen(false);
          toast.success("Overtakelse bekreftet", {
            description: `Du har nå fullmakt til å jobbe i ${customerName}s Trust Profile.`,
          });
        }}
      />

      <RequestGrantDialog
        open={grantOpen}
        onOpenChange={setGrantOpen}
        customerName={customerName}
        contactName={contactName}
        contactEmail={contactEmail}
        onSend={() => {
          update({ status: "pending", source: "customer-grant", at: new Date().toISOString() });
          setGrantOpen(false);
          toast.success("Forespørsel sendt", {
            description: `Vi har bedt ${contactEmail || customerName} om fullmakt.`,
          });
        }}
      />
    </>
  );
}

function StatusBadge({ state }: { state: TakeoverState }) {
  if (state.status === "pending") {
    return (
      <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30 gap-1">
        <Clock className="h-3 w-3" /> Venter på fullmakt
      </Badge>
    );
  }
  if (state.status === "granted") {
    return (
      <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Fullmakt aktiv
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground border-border gap-1">
      Ingen fullmakt
    </Badge>
  );
}

function ConfirmContractDialog({
  open,
  onOpenChange,
  customerName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  onConfirm: () => void;
}) {
  const [agreed1, setAgreed1] = useState(false);
  const [agreed2, setAgreed2] = useState(false);

  useEffect(() => {
    if (!open) {
      setAgreed1(false);
      setAgreed2(false);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-4 w-4 text-primary" />
            Bekreft overtakelse
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Bekreft at du har gyldig avtale og fullmakt til å jobbe i {customerName}s Trust
            Profile. Bekreftelsen logges som bevis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <label className="flex items-start gap-2.5 cursor-pointer rounded-md border border-border p-3 hover:bg-muted/30">
            <Checkbox
              checked={agreed1}
              onCheckedChange={(c) => setAgreed1(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              Vi har en signert leveranseavtale med {customerName}.
            </span>
          </label>
          <label className="flex items-start gap-2.5 cursor-pointer rounded-md border border-border p-3 hover:bg-muted/30">
            <Checkbox
              checked={agreed2}
              onCheckedChange={(c) => setAgreed2(c === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              Jeg bekrefter at jeg har fullmakt til å handle på vegne av kunden i deres Trust
              Profile.
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button disabled={!agreed1 || !agreed2} onClick={onConfirm}>
            Bekreft overtakelse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestGrantDialog({
  open,
  onOpenChange,
  customerName,
  contactName,
  contactEmail,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  onSend: () => void;
}) {
  const defaultSubject = `Gi ${PARTNER_NAME} fullmakt til å jobbe i din Trust Profile`;
  const defaultBody = `Hei ${contactName || ""},

Vi i ${PARTNER_NAME} har satt opp en Trust Profile for ${customerName} i Mynder. For at vi skal kunne utføre aktiviteter, oppdatere dokumentasjon og svare på henvendelser på vegne av dere, trenger vi at du gir oss fullmakt.

Klikk lenken nedenfor for å logge inn og bekrefte fullmakten:

[Lenke til Trust Profile]

Du kan når som helst trekke tilbake fullmakten fra innstillingene.

Vennlig hilsen,
${PARTNER_NAME}`;

  const [email, setEmail] = useState(contactEmail || "");
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);

  useEffect(() => {
    if (open) {
      setEmail(contactEmail || "");
      setSubject(defaultSubject);
      setBody(defaultBody);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, contactEmail, contactName, customerName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4 text-primary" />
            Be kunden om fullmakt
          </DialogTitle>
          <DialogDescription className="text-[13px]">
            Send en e-post til kunden der de blir bedt om å gi {PARTNER_NAME} fullmakt til å
            jobbe i deres Trust Profile.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Til</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kontakt@kunde.no"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Emne</label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Melding</label>
            <Textarea
              rows={10}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="font-sans text-sm leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button disabled={!email} onClick={onSend} className="gap-1.5">
            <Send className="h-3.5 w-3.5" />
            Send forespørsel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
