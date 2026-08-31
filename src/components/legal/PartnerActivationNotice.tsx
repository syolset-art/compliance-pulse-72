import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTerms } from "@/hooks/useTerms";
import { CUSTOMER_TERMS } from "@/content/legal";

const FLAG = "mynder_partner_activation_notice";

export interface PartnerActivationInfo {
  partnerName: string;
  /** Tilganger som er aktive, f.eks. «Driftspartner – Leverandørmodulen». */
  accesses: string[];
}

/** Leses av oppsettet som markerer at kunden er aktivert via partner. */
export function readPartnerActivationInfo(): PartnerActivationInfo | null {
  try {
    const raw = localStorage.getItem(FLAG);
    return raw ? (JSON.parse(raw) as PartnerActivationInfo) : null;
  } catch {
    return null;
  }
}

/**
 * Vises ved sluttkundens første innlogging når løsningen er aktivert via partner.
 * Kunden må selv akseptere sluttkundevilkårene før ordinær tilgang gis.
 */
export function PartnerActivationNotice() {
  const { current, acceptTerms } = useTerms();
  const [info, setInfo] = useState<PartnerActivationInfo | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInfo(readPartnerActivationInfo());
  }, []);

  if (!info) return null;

  const handleAccept = async () => {
    setSaving(true);
    try {
      await acceptTerms("signup", "partner_activation");
      localStorage.removeItem(FLAG);
      setInfo(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base">Mynder er aktivert av din partner</DialogTitle>
          <DialogDescription>
            {info.partnerName} har aktivert Mynder for virksomheten din. Før du får ordinær
            tilgang må du selv godta sluttkundevilkårene.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1 rounded-lg border border-border p-3">
          <p className="text-xs font-medium text-foreground">Aktive tilganger</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            {info.accesses.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          Vilkårene som gjelder finner du under{" "}
          <Link to="/dokumenter" className="text-foreground underline underline-offset-2">
            Dokumenter
          </Link>
          .
        </p>

        <div className="flex items-start gap-2">
          <Checkbox
            id="partner-activation-accept"
            checked={accepted}
            disabled={saving}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="partner-activation-accept"
            className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
          >
            Jeg har lest og godtar{" "}
            <a
              href={`/dokumenter/${CUSTOMER_TERMS.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              {CUSTOMER_TERMS.title} v{current?.version ?? CUSTOMER_TERMS.version}
            </a>
            .
          </label>
        </div>

        <DialogFooter>
          <Button onClick={handleAccept} disabled={!accepted || saving}>
            {saving ? "Lagrer…" : "Godta og fortsett"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
