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
} from "lucide-react";
import { formatOfferDate, type PartnerOffer } from "./offerTypes";

interface Props {
  offer: PartnerOffer;
  partnerName?: string;
  onAccept?: (offer: PartnerOffer) => void;
  onDecline?: (offer: PartnerOffer) => void;
  onSend?: (offer: PartnerOffer) => void;
  onOpen?: (offer: PartnerOffer) => void;
  onDelete?: (offer: PartnerOffer) => void;
  onDownload?: (offer: PartnerOffer) => void;
}

function StatusPill({ offer }: { offer: PartnerOffer }) {
  if (offer.offerState === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" /> Akseptert
      </span>
    );
  }
  if (offer.offerState === "declined") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
        <XCircle className="h-3.5 w-3.5" /> Avslått
      </span>
    );
  }
  if (offer.offerState === "sent") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        <Clock className="h-3.5 w-3.5" /> Venter
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
      <FileText className="h-3.5 w-3.5" /> Utkast
    </span>
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
          <StatusPill offer={offer} />
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
