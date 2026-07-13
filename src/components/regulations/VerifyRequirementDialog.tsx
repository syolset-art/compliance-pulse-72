import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, Info } from "lucide-react";
import {
  VERIFIER_TYPES,
  suggestValidityMonths,
  type VerifierType,
} from "@/lib/requirementStatusModel";

export interface VerifyRequirementResult {
  verifierType: VerifierType;
  name: string;
  person?: string;
  standard?: string;
  reportRef?: string;
  date: string;        // ISO yyyy-mm-dd
  validUntil: string;  // ISO yyyy-mm-dd
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: VerifyRequirementResult) => void;
  requirementLabel?: string;
}

function addMonthsIso(iso: string, months: number): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const target = new Date(d);
  target.setMonth(target.getMonth() + months);
  return target.toISOString().slice(0, 10);
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export function VerifyRequirementDialog({ open, onOpenChange, onConfirm, requirementLabel }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";

  const [verifierType, setVerifierType] = useState<VerifierType>("iso_certification_body");
  const [name, setName] = useState("");
  const [person, setPerson] = useState("");
  const [standard, setStandard] = useState("");
  const [reportRef, setReportRef] = useState("");
  const [date, setDate] = useState<string>(todayIso());
  const [validUntil, setValidUntil] = useState<string>(addMonthsIso(todayIso(), suggestValidityMonths("iso_certification_body")));
  const [validUntilDirty, setValidUntilDirty] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      const t: VerifierType = "iso_certification_body";
      setVerifierType(t);
      setName("");
      setPerson("");
      setStandard("");
      setReportRef("");
      const today = todayIso();
      setDate(today);
      setValidUntil(addMonthsIso(today, suggestValidityMonths(t)));
      setValidUntilDirty(false);
      setConfirmed(false);
    }
  }, [open]);

  // Recompute validUntil when type or date changes (unless user overrode)
  useEffect(() => {
    if (!validUntilDirty) {
      setValidUntil(addMonthsIso(date, suggestValidityMonths(verifierType)));
    }
  }, [verifierType, date, validUntilDirty]);

  const selectedTypeCfg = useMemo(
    () => VERIFIER_TYPES.find((t) => t.value === verifierType),
    [verifierType],
  );

  const canSubmit = name.trim().length > 0 && confirmed && !!date && !!validUntil;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onConfirm({
      verifierType,
      name: name.trim(),
      person: person.trim() || undefined,
      standard: standard.trim() || undefined,
      reportRef: reportRef.trim() || undefined,
      date,
      validUntil,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-success" />
            {isNb ? "Bekreft ekstern verifikasjon" : "Confirm external verification"}
          </DialogTitle>
          <DialogDescription>
            {isNb
              ? "Verifisert-status krever at en ekstern, uavhengig part har gjennomgått og bekreftet at kravet er oppfylt."
              : "Verified status requires that an external, independent party has reviewed and confirmed the requirement is met."}
            {requirementLabel && (
              <> {" — "}<span className="font-medium text-foreground">{requirementLabel}</span></>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1 max-h-[65vh] overflow-y-auto pr-1">
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {isNb ? "Type verifikator" : "Verifier type"} <span className="text-destructive">*</span>
            </Label>
            <RadioGroup
              value={verifierType}
              onValueChange={(v) => setVerifierType(v as VerifierType)}
              className="grid gap-2"
            >
              {VERIFIER_TYPES.map((t) => (
                <label
                  key={t.value}
                  htmlFor={`vt-${t.value}`}
                  className="flex items-start gap-2 rounded-md border border-input p-2.5 cursor-pointer hover:bg-muted/50 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                >
                  <RadioGroupItem value={t.value} id={`vt-${t.value}`} className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground">
                      {isNb ? t.labelNb : t.labelEn}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {isNb ? t.descriptionNb : t.descriptionEn}
                      {" · "}
                      <span className="text-foreground/70">
                        {isNb ? `Foreslått gyldighet: ${t.defaultMonths} mnd` : `Suggested validity: ${t.defaultMonths} mo`}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-medium">
                {isNb ? "Navn på uavhengig part / organisasjon" : "Name of independent party / organization"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={isNb ? "f.eks. BDO Norge AS, DNV, Nemko" : "e.g. BDO, DNV, Nemko, KPMG"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isNb ? "Person / rolle" : "Person / role"}
              </Label>
              <Input
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder={isNb ? "Erik Solheim, Lead Auditor" : "e.g. Erik Solheim, Lead Auditor"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isNb ? "Standard / rammeverk" : "Standard / framework"}
              </Label>
              <Input
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                placeholder="ISO 27001:2022"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-xs font-medium">
                {isNb ? "Rapport-/dokumentreferanse" : "Report / document reference"}
              </Label>
              <Input
                value={reportRef}
                onChange={(e) => setReportRef(e.target.value)}
                placeholder={isNb ? "f.eks. BDO-2026-0472" : "e.g. BDO-2026-0472"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isNb ? "Verifiseringsdato" : "Verification date"} <span className="text-destructive">*</span>
              </Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isNb ? "Gyldig til" : "Valid until"} <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => {
                  setValidUntil(e.target.value);
                  setValidUntilDirty(true);
                }}
              />
            </div>
            <p className="col-span-2 text-xs text-muted-foreground flex items-start gap-1.5 -mt-1">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                {isNb
                  ? `Foreslått basert på «${selectedTypeCfg && (isNb ? selectedTypeCfg.labelNb : selectedTypeCfg.labelEn)}» (${selectedTypeCfg?.defaultMonths} mnd). Endre om nødvendig.`
                  : `Suggested based on "${selectedTypeCfg?.labelEn}" (${selectedTypeCfg?.defaultMonths} months). Adjust if needed.`}
              </span>
            </p>
          </div>

          <label className="flex items-start gap-2 rounded-md border border-input bg-muted/30 p-3 cursor-pointer">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
              className="mt-0.5"
            />
            <span className="text-xs text-foreground leading-relaxed">
              {isNb
                ? "Jeg bekrefter at ovennevnte part er uavhengig av vår virksomhet og har verifisert at kravet er oppfylt."
                : "I confirm that the party above is independent of our organization and has verified that the requirement is met."}
            </span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {isNb ? "Avbryt" : "Cancel"}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            <ShieldCheck className="h-4 w-4 mr-1.5" />
            {isNb ? "Registrer verifikasjon" : "Record verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
