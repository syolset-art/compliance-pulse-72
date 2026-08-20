import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VERIFIER_TYPES, VERIFICATION_BASIS, appendAudit, type AuditEvent } from "@/lib/evidenceStatus";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  existingAudit?: AuditEvent[];
}

export function AddVerificationDialog({ open, onOpenChange, documentId, documentName, existingAudit }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const qc = useQueryClient();

  const [verifiedBy, setVerifiedBy] = useState("");
  const [verifierType, setVerifierType] = useState<string>("external_auditor");
  const [verificationDate, setVerificationDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [basis, setBasis] = useState<string>("iso_audit");
  const [notes, setNotes] = useState("");
  const [expiry, setExpiry] = useState<string>("");

  const reset = () => {
    setVerifiedBy(""); setVerifierType("external_auditor"); setBasis("iso_audit");
    setVerificationDate(new Date().toISOString().slice(0, 10)); setNotes(""); setExpiry("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const trail = appendAudit(existingAudit, {
        action: "verified",
        actor: verifiedBy,
        actor_role: VERIFIER_TYPES.find(v => v.value === verifierType)?.[isNb ? "labelNb" : "labelEn"],
        note: VERIFICATION_BASIS.find(v => v.value === basis)?.[isNb ? "labelNb" : "labelEn"],
      });
      const { error } = await supabase.from("vendor_documents").update({
        evidence_status: "verified",
        verified_by: verifiedBy,
        verifier_type: verifierType,
        verification_date: verificationDate,
        verification_basis: basis,
        verification_notes: notes || null,
        verification_expiry_date: expiry || null,
        expires_at: expiry ? new Date(expiry).toISOString() : null,
        audit_trail: trail,
      }).eq("id", documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-documents-evidence"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents-tc"] });
      qc.invalidateQueries({ queryKey: ["vendor-documents"] });
      toast.success(isNb ? "Verifikasjon registrert" : "Verification recorded");
      reset();
      onOpenChange(false);
    },
    onError: () => toast.error(isNb ? "Kunne ikke lagre" : "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isNb ? "Legg til verifikasjon" : "Add verification"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Verifisering betyr at en uavhengig part har gjennomgått dokumentet."
              : "Verification means an independent party has reviewed this document."}
            {" "}<span className="font-medium text-foreground">{documentName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1 max-h-[60vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">{isNb ? "Verifisert av" : "Verified by"} *</Label>
              <Input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} placeholder={isNb ? "Navn / organisasjon" : "Name / organisation"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Verifikatortype" : "Verifier type"}</Label>
              <Select value={verifierType} onValueChange={setVerifierType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERIFIER_TYPES.map(v => (
                    <SelectItem key={v.value} value={v.value}>{isNb ? v.labelNb : v.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Verifikasjonsdato" : "Verification date"} *</Label>
              <Input type="date" value={verificationDate} onChange={(e) => setVerificationDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">{isNb ? "Verifikasjonsgrunnlag" : "Verification basis"}</Label>
              <Select value={basis} onValueChange={setBasis}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VERIFICATION_BASIS.map(v => (
                    <SelectItem key={v.value} value={v.value}>{isNb ? v.labelNb : v.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">{isNb ? "Notater" : "Notes"}</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs">{isNb ? "Utløpsdato (valgfritt)" : "Expiry date (optional)"}</Label>
              <Input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{isNb ? "Avbryt" : "Cancel"}</Button>
          <Button onClick={() => mut.mutate()} disabled={!verifiedBy || mut.isPending}>
            {isNb ? "Registrer verifikasjon" : "Record verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
