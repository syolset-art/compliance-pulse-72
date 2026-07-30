import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Paperclip,
  FileText,
  Send,
  Trash2,
  RotateCcw,
  Bot,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatOfferDate, type PartnerOffer, type OfferLifecycle } from "./offerTypes";

interface Props {
  offer: PartnerOffer;
  partnerName?: string;
  onAccept?: (offer: PartnerOffer) => void;
  onDecline?: (offer: PartnerOffer) => void;
  onSend?: (offer: PartnerOffer) => void;
  onOpen?: (offer: PartnerOffer) => void;
  onDelete?: (offer: PartnerOffer) => void;
  onDownload?: (offer: PartnerOffer) => void;
  /** Lar partneren sette status manuelt fra statusfeltet. */
  onSetState?: (offer: PartnerOffer, next: Extract<OfferLifecycle, "accepted" | "declined" | "sent">) => void;
}

function statusVisual(state: OfferLifecycle) {
  if (state === "accepted") return { Icon: CheckCircle2, label: "Akseptert", cls: "text-success" };
  if (state === "declined") return { Icon: XCircle, label: "Avslått", cls: "text-destructive" };
  if (state === "sent") return { Icon: Clock, label: "Venter", cls: "text-muted-foreground" };
  return { Icon: FileText, label: "Utkast", cls: "text-muted-foreground" };
}

function StatusPill({ offer, onSetState }: { offer: PartnerOffer; onSetState?: Props["onSetState"] }) {
  const { Icon, label, cls } = statusVisual(offer.offerState);
  const editable = offer.offerState !== "draft" && !!onSetState;

  const content = (
    <span className={cn("inline-flex items-center gap-1 text-[11px] font-medium", cls)}>
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );

  if (!editable) return content;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Endre status — nå: ${label}`}
        >
          {content}
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        {offer.offerState !== "accepted" && (
          <DropdownMenuItem onSelect={() => onSetState?.(offer, "accepted")}>
            <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-success" /> Marker som godkjent
          </DropdownMenuItem>
        )}
        {offer.offerState !== "declined" && (
          <DropdownMenuItem onSelect={() => onSetState?.(offer, "declined")}>
            <XCircle className="mr-2 h-3.5 w-3.5 text-destructive" /> Marker som avslått
          </DropdownMenuItem>
        )}
        {offer.offerState !== "sent" && (
          <DropdownMenuItem onSelect={() => onSetState?.(offer, "sent")}>
            <RotateCcw className="mr-2 h-3.5 w-3.5 text-muted-foreground" /> Sett tilbake til venter
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-[11px]">
          <Bot className="mr-2 h-3.5 w-3.5" /> Automatisk oppdatering via agent — kommer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


export function OfferListRow({
  offer,
  partnerName = "Mynder AS",
  onAccept,
  onDecline,
  onSend,
  onOpen,
  onDelete,
  onDownload,
  onSetState,
}: Props) {
  const [open, setOpen] = useState(false);
  const isDraft = offer.offerState === "draft";
  const Chevron = open ? ChevronDown : ChevronRight;

  const meta = isDraft
    ? `Opprettet ${formatOfferDate(offer.createdAt)} · ${offer.createdBy}`
    : [
        `Sendt ${formatOfferDate(offer.sentAt ?? offer.createdAt)}`,
        offer.respondedAt ? `Besvart ${formatOfferDate(offer.respondedAt)}` : null,
        partnerName,
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          aria-expanded={open}
        >
          <Chevron className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium text-foreground">
                {offer.frameworkLabel ?? offer.serviceTitle}
              </span>
              {!isDraft && (
                <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                  Mottatt
                </Badge>
              )}
              <span className="truncate text-[11px] text-muted-foreground">
                {offer.offerNumber}
              </span>
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{meta}</p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <StatusPill offer={offer} onSetState={onSetState} />
          {onDownload && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              title="Last ned tilbud"
              onClick={() => onDownload(offer)}
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Foreslåtte aktiviteter
            </p>
            <div className="space-y-1">
              {(offer.tasks ?? [{ label: offer.serviceTitle, hours: offer.totalHours }]).map(
                (t, i) => (
                  <div
                    key={`${t.label}-${i}`}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="truncate text-foreground">{t.label}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">{t.hours} t</span>
                  </div>
                ),
              )}
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-[12px]">
              <span className="text-muted-foreground">
                {offer.totalHours} timer
                {offer.hourlyRate ? ` · ${offer.hourlyRate.toLocaleString("nb-NO")} kr/t` : ""}
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {offer.totalPrice.toLocaleString("nb-NO")} kr
              </span>
            </div>
          </div>

          {offer.attachmentLabel && (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              Vedlegg: {offer.attachmentLabel}
            </div>
          )}

          {offer.approval && (
            <div className="rounded-md border border-success/20 bg-success/5 px-2.5 py-2 text-[11px] text-foreground">
              <span className="font-medium">Godkjent av {offer.approval.approvedBy}</span>
              {offer.approval.approverRole ? ` (${offer.approval.approverRole})` : ""} ·{" "}
              {offer.approval.method} · {formatOfferDate(offer.approval.date)}
              {offer.approval.reference ? ` · ${offer.approval.reference}` : ""}
            </div>
          )}

          {offer.declineReason && (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 px-2.5 py-2 text-[11px] text-foreground">
              Avslått: {offer.declineReason}
            </div>
          )}

          {offer.statusSetBy && offer.offerState !== "draft" && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {offer.statusSource === "agent" ? (
                <Bot className="h-3 w-3" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              )}
              {offer.statusSource === "agent" ? "Satt automatisk av" : "Satt manuelt av"}{" "}
              {offer.statusSetBy}
            </p>
          )}



          <div className={cn("flex flex-wrap items-center gap-2 pt-0.5")}>
            {isDraft ? (
              <>
                {onOpen && (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => onOpen(offer)}>
                    Åpne utkast
                  </Button>
                )}
                {onSend && (
                  <Button size="sm" className="h-8 gap-1.5" onClick={() => onSend(offer)}>
                    <Send className="h-3.5 w-3.5" /> Send til kunde
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-muted-foreground"
                    onClick={() => onDelete(offer)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Slett utkast
                  </Button>
                )}
              </>
            ) : offer.offerState === "sent" ? (
              <>
                {onAccept && (
                  <Button size="sm" className="h-8" onClick={() => onAccept(offer)}>
                    Aksepter tilbud
                  </Button>
                )}
                {onDecline && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-destructive hover:text-destructive"
                    onClick={() => onDecline(offer)}
                  >
                    Avslå tilbud
                  </Button>
                )}
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
