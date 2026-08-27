import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BadgeCheck, ExternalLink, History, ShieldAlert } from "lucide-react";
import { PartnerRow } from "./adminDemoData";
import { usePartnerAgreements } from "@/hooks/useMynderAdmin";

interface Props {
  partner: PartnerRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PartnerAgreementPanel({ partner, open, onOpenChange }: Props) {
  const { byPartner, eventsFor, save } = usePartnerAgreements();
  const agreement = partner ? byPartner(partner.id) : null;

  const [sharePct, setSharePct] = useState(30);
  const [validFrom, setValidFrom] = useState("");
  const [agreementUrl, setAgreementUrl] = useState("");
  const [verified, setVerified] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState("");
  const [note, setNote] = useState("");
  const [changeNote, setChangeNote] = useState("");

  useEffect(() => {
    if (!open || !partner) return;
    setSharePct(agreement ? Number(agreement.share_pct) : partner.commissionPct);
    setValidFrom(agreement?.valid_from ?? partner.since ?? "");
    setAgreementUrl(agreement?.agreement_url ?? "");
    setVerified(!!agreement?.agent_verified);
    setVerifiedBy(agreement?.agent_verified_by ?? "");
    setNote(agreement?.note ?? "");
    setChangeNote("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, partner?.id, agreement?.id]);

  if (!partner) return null;
  const history = eventsFor(agreement?.id);

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        partnerKey: partner.id,
        partnerName: partner.name,
        sharePct,
        validFrom,
        agreementUrl,
        agentVerified: verified,
        agentVerifiedBy: verified ? verifiedBy || "Mynder-agent" : null,
        note,
        changeNote,
      });
      toast.success("Partneravtalen er lagret");
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Kunne ikke lagre", { description: e.message });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{partner.name}</SheetTitle>
          <SheetDescription>
            Partneravtale og prosentandel. Kun Mynder kan endre dette — partneren ser satsen som lesefelt.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Partnerandel</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={sharePct}
                  onChange={(e) => setSharePct(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gjelder fra</Label>
              <Input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Begrunnelse for endring</Label>
            <Input
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="F.eks. reforhandlet avtale 2026"
            />
            <p className="text-xs text-muted-foreground">Logges i avtalehistorikken når satsen endres.</p>
          </div>

          <div className="rounded-lg border p-3 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium flex items-center gap-2">
                  {verified ? (
                    <BadgeCheck className="h-4 w-4 text-success" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-warning" />
                  )}
                  Avtale verifisert av agent
                </div>
                <p className="text-xs text-muted-foreground">
                  Vi lagrer ikke avtaledokumentet her — kun bekreftelse på at den finnes, og en lenke.
                </p>
              </div>
              <Switch checked={verified} onCheckedChange={setVerified} />
            </div>
            {verified && (
              <div className="space-y-2">
                <Label className="text-xs">Verifisert av</Label>
                <Input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} placeholder="Mynder-agent" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs">Lenke til partneravtalen</Label>
              <Input
                value={agreementUrl}
                onChange={(e) => setAgreementUrl(e.target.value)}
                placeholder="https://..."
              />
              {agreementUrl && (
                <a
                  href={agreementUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> Åpne partneravtale
                </a>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notat</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <History className="h-4 w-4 text-muted-foreground" />
              Avtalehistorikk
            </div>
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground">Ingen registrerte endringer ennå.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((e) => (
                  <li key={e.id} className="rounded-md border p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">
                        {e.old_share_pct != null ? `${e.old_share_pct} % → ` : ""}
                        {e.new_share_pct} %
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(e.created_at).toLocaleDateString("nb-NO")}
                      </span>
                    </div>
                    <div className="text-muted-foreground mt-0.5">
                      {e.note || "Ingen begrunnelse"}
                      {e.effective_from ? ` · gjelder fra ${new Date(e.effective_from).toLocaleDateString("nb-NO")}` : ""}
                    </div>
                    {e.changed_by_name && (
                      <Badge variant="outline" className="mt-1.5 text-[11px]">
                        {e.changed_by_name}
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 pb-6">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              Lagre avtale
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
