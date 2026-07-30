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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OfferApproval, PartnerOffer } from "./offerTypes";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: PartnerOffer | null;
  customerName?: string;
  onConfirm: (approval: OfferApproval) => void;
}

const METHODS: OfferApproval["method"][] = ["E-post", "E-signatur", "Muntlig", "Portal"];

export function ConfirmOfferAcceptanceDialog({
  open,
  onOpenChange,
  offer,
  customerName,
  onConfirm,
}: Props) {
  const [approvedBy, setApprovedBy] = useState("");
  const [approverRole, setApproverRole] = useState("");
  const [method, setMethod] = useState<OfferApproval["method"]>("E-post");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState("");

  const submit = () => {
    if (!approvedBy.trim()) return;
    onConfirm({
      approvedBy: approvedBy.trim(),
      approverRole: approverRole.trim() || undefined,
      method,
      date,
      reference: reference.trim() || undefined,
    });
    setApprovedBy("");
    setApproverRole("");
    setReference("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bekreft aksept</DialogTitle>
          <DialogDescription>
            Registrer hvem hos {customerName ?? "kunden"} som godkjente{" "}
            {offer?.offerNumber ?? "tilbudet"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="approved-by">Godkjent av</Label>
            <Input
              id="approved-by"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
              placeholder="Navn"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="approver-role">Rolle</Label>
            <Input
              id="approver-role"
              value={approverRole}
              onChange={(e) => setApproverRole(e.target.value)}
              placeholder="F.eks. daglig leder"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Metode</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as OfferApproval["method"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="approval-date">Dato</Label>
              <Input
                id="approval-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="approval-ref">Referanse (valgfritt)</Label>
            <Textarea
              id="approval-ref"
              rows={2}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="F.eks. e-post 30.07.2026 eller signatur-ID"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={submit} disabled={!approvedBy.trim()}>
            Registrer aksept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
