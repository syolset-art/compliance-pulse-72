import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SHARING_LEVELS, appendAudit, type AuditEvent, type SharingLevel } from "@/lib/evidenceStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  existingAudit?: AuditEvent[];
  defaultSharingLevel?: SharingLevel;
}

export function ConfirmAsEvidenceDialog({ open, onOpenChange, documentId, documentName, existingAudit, defaultSharingLevel }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const qc = useQueryClient();

  const [confirmedBy, setConfirmedBy] = useState("");
  const [role, setRole] = useState("");
  const [sharing, setSharing] = useState<SharingLevel>(defaultSharingLevel ?? "internal");
  const [useForScore, setUseForScore] = useState<"yes" | "no">("yes");

  const mut = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const trail = appendAudit(existingAudit, {
        action: "confirmed",
        actor: confirmedBy,
        actor_role: role || undefined,
      });
      const { error } = await supabase.from("vendor_documents").update({
        evidence_status: "confirmed",
        confirmed_by: confirmedBy,
        confirmed_role: role || null,
        confirmed_at: now,
        sharing_level: sharing,
        used_for_trust_score: useForScore === "yes",
        audit_trail: trail as unknown as never,
      } as never).eq("id", documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
      toast.success(isNb ? "Bekreftet som bevis" : "Confirmed as evidence");
      onOpenChange(false);
    },
    onError: () => toast.error(isNb ? "Kunne ikke lagre" : "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            {isNb ? "Bekreft som bevis" : "Confirm as evidence"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Bekrefter du at dette dokumentet er gjeldende, relevant og kan brukes som bevis i Trust Profile?"
              : "Do you confirm that this document is current, relevant and can be used as evidence in your Trust Profile?"}
            <br />
            <span className="font-medium text-foreground">{documentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Bekreftet av" : "Confirmed by"} *</Label>
              <Input value={confirmedBy} onChange={(e) => setConfirmedBy(e.target.value)} placeholder={isNb ? "Navn" : "Name"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Rolle" : "Role"}</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} placeholder={isNb ? "F.eks. CISO, DPO" : "e.g. CISO, DPO"} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Delingsnivå" : "Sharing level"}</Label>
            <Select value={sharing} onValueChange={(v) => setSharing(v as SharingLevel)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SHARING_LEVELS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{isNb ? s.labelNb : s.labelEn}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isNb ? "Brukes i Trust Score" : "Use for Trust Score"}</Label>
            <Select value={useForScore} onValueChange={(v) => setUseForScore(v as "yes" | "no")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">{isNb ? "Ja" : "Yes"}</SelectItem>
                <SelectItem value="no">{isNb ? "Nei" : "No"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{isNb ? "Avbryt" : "Cancel"}</Button>
          <Button onClick={() => mut.mutate()} disabled={!confirmedBy || mut.isPending}>
            {isNb ? "Bekreft" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
