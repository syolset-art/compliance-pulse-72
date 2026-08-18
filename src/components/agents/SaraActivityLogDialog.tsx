import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Bot, CheckCircle2, Clock, FileText } from "lucide-react";
import { SARA_RECENT_FINDINGS } from "@/lib/saraAgent";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isNb?: boolean;
}

/** Aktivitetslogg for funn Sara har levert. */
export function SaraActivityLogDialog({ open, onOpenChange, isNb = true }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" aria-hidden="true" />
            {isNb ? "Siste funn fra Sara" : "Latest findings from Sara"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Dokumentene ble prosessert lokalt. Bare funnene er sendt til Mynder — de må bekreftes av en navngitt person før de teller som bevis."
              : "Documents were processed locally. Only the findings were sent to Mynder — they must be confirmed by a named person before they count as evidence."}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {SARA_RECENT_FINDINGS.map((f) => (
            <li
              key={f.id}
              className="rounded-lg border border-border p-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{f.requirement}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground truncate">
                    <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {f.source}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 text-[10px] font-normal"
                >
                  {f.confirmed ? (
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Clock className="h-3 w-3" aria-hidden="true" />
                  )}
                  {f.confirmed
                    ? isNb
                      ? "Bekreftet"
                      : "Confirmed"
                    : isNb
                      ? "Venter bekreftelse"
                      : "Awaiting confirmation"}
                </Badge>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">{f.at}</p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
