import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Archive, Info } from "lucide-react";

export interface RetireServiceOptions {
  reason?: string;
  replacedById?: string;
}

interface RetireServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  /** Andre aktive tjenester som kan velges som erstatning. */
  replacementOptions?: Array<{ id: string; name: string }>;
  /** Antall aktive leveranser/kampanjer som berøres (valgfritt). */
  affectedCount?: number;
  onConfirm: (opts: RetireServiceOptions) => void;
}

export function RetireServiceDialog({
  open,
  onOpenChange,
  serviceName,
  replacementOptions = [],
  affectedCount,
  onConfirm,
}: RetireServiceDialogProps) {
  const [reason, setReason] = useState("");
  const [replacedById, setReplacedById] = useState<string>("none");

  const handleConfirm = () => {
    onConfirm({
      reason: reason.trim() || undefined,
      replacedById: replacedById !== "none" ? replacedById : undefined,
    });
    setReason("");
    setReplacedById("none");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            Avslutt tjeneste
          </DialogTitle>
          <DialogDescription>
            «{serviceName}» skjules fra kundens portal og fra nye tilbud, men
            eksisterende leveranser og historikk bevares.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {typeof affectedCount === "number" && affectedCount > 0 && (
            <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-foreground/80">
              <Info className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
              <span>
                {affectedCount} aktive leveranser bruker denne tjenesten. De
                fullføres normalt — kun nye bestillinger blokkeres.
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="retire-reason" className="text-xs">
              Årsak <span className="text-muted-foreground">(valgfritt)</span>
            </Label>
            <Textarea
              id="retire-reason"
              placeholder="F.eks. erstattet av nyere pakke, lav etterspørsel …"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          {replacementOptions.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor="retire-replacement" className="text-xs">
                Erstattes av{" "}
                <span className="text-muted-foreground">(valgfritt)</span>
              </Label>
              <Select value={replacedById} onValueChange={setReplacedById}>
                <SelectTrigger id="retire-replacement" className="h-9 text-sm">
                  <SelectValue placeholder="Velg tjeneste …" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen erstatning</SelectItem>
                  {replacementOptions.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleConfirm} className="gap-1.5">
            <Archive className="h-3.5 w-3.5" />
            Avslutt tjeneste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
