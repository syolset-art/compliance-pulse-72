import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTerms } from "@/hooks/useTerms";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaceMode } from "@/contexts/WorkspaceModeContext";
import { PARTNER_TERMS } from "@/content/legal";

/**
 * Partneren aksepterer partnervilkårene i egen flyt — ved registrering eller
 * aktivering av Partner Workspace. Aksepten logges med identitet, tidspunkt
 * og versjon. Ingen forhåndsavkryssing.
 */
export function PartnerTermsGateDialog() {
  const { user } = useAuth();
  const { mode } = useWorkspaceMode();
  const { currentByType, acceptedAtFor, acceptDocument, loading } = useTerms();
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const partnerDoc = currentByType.partner;
  const alreadyAccepted = Boolean(acceptedAtFor(partnerDoc?.id));

  if (loading || !user || mode !== "partner" || !partnerDoc || alreadyAccepted) return null;

  const handleAccept = async () => {
    setSaving(true);
    try {
      await acceptDocument("partner", "partner_workspace");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base">Aktiver Partner Workspace</DialogTitle>
          <DialogDescription>
            Før du tar i bruk Partner Workspace må virksomheten din godta vilkårene for
            partnere. Vi registrerer hvem som godtar, når, og hvilken versjon.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-3">
          <p className="text-sm font-medium text-foreground">{PARTNER_TERMS.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Versjon {partnerDoc.version} · Sist oppdatert {PARTNER_TERMS.lastUpdatedLabel}
          </p>
          <a
            href={`/dokumenter/${PARTNER_TERMS.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-foreground underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Les hele teksten
          </a>
        </div>

        <div className="flex items-start gap-2">
          <Checkbox
            id="partner-terms-accept"
            checked={accepted}
            disabled={saving}
            onCheckedChange={(v) => setAccepted(v === true)}
            className="mt-0.5"
          />
          <label
            htmlFor="partner-terms-accept"
            className="cursor-pointer text-xs leading-relaxed text-muted-foreground"
          >
            Jeg har lest og godtar {PARTNER_TERMS.title} v{partnerDoc.version}, og jeg har
            fullmakt til å binde virksomheten min.
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
