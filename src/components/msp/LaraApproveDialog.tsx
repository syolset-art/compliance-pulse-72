import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LARA_KIND_LABELS, type LaraQueueItem } from "@/lib/laraWorkQueue";

interface Props {
  item: LaraQueueItem | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: LaraQueueItem) => void;
}

export function LaraApproveDialog({ item, onOpenChange, onConfirm }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (item) setChecked(false);
  }, [item]);

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {isNb ? "Bekreft godkjenning" : "Confirm approval"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Se gjennom hva Lara vil gjøre før du godkjenner. Handlingen iverksettes umiddelbart."
              : "Review what Lara will do before approving. The action is carried out immediately."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {isNb ? LARA_KIND_LABELS[item.kind].nb : LARA_KIND_LABELS[item.kind].en}
            </Badge>
            <span className="truncate font-medium">{item.customer}</span>
          </div>
          <p className="text-foreground/90">{isNb ? item.action : item.actionEn}</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-foreground/80">{isNb ? "Begrunnelse" : "Rationale"}:</span>{" "}
              {isNb ? item.rationale : item.rationaleEn}
            </p>
            <p>
              <span className="font-medium text-foreground/80">{isNb ? "Kilde" : "Source"}:</span>{" "}
              {isNb ? item.source : item.sourceEn}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="lara-approve-confirm"
            checked={checked}
            onCheckedChange={(v) => setChecked(v === true)}
            className="mt-0.5"
          />
          <Label htmlFor="lara-approve-confirm" className="text-xs font-normal leading-relaxed text-muted-foreground">
            {isNb
              ? "Jeg har kontrollert grunnlaget og godkjenner at Lara utfører handlingen på vegne av kunden."
              : "I have reviewed the basis and approve Lara carrying out this action on behalf of the customer."}
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button disabled={!checked} onClick={() => onConfirm(item)} className="gap-1.5">
            <Check className="h-4 w-4" />
            {isNb ? "Godkjenn og iverksett" : "Approve and proceed"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
