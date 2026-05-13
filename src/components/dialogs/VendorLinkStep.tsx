import { Loader2, Sparkles, Link2, ChevronLeft, ChevronRight, Building2, ShieldCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { VendorMatchResult, VendorMatchCandidate } from "@/hooks/useVendorMatch";

interface VendorLinkStepProps {
  vendorName: string;
  match: VendorMatchResult;
  onLinkExisting: (vendor: VendorMatchCandidate) => void;
  onCreateAndLink: (parentName: string) => void;
  onSkip: () => void;
  onBack: () => void;
}

const BENEFIT_TEXT =
  "Når systemet er koblet til leverandøren arver det leverandørens TPRM-status, dokumenter (DPA, ISO 27001, SOC 2) og overvåkning. Du slipper å laste opp samme dokumentasjon to ganger, og varsler om utløp eller hendelser hos leverandøren treffer automatisk dette systemet.";

const MYNDER_BLUE = "#4F51B6";

export function VendorLinkStep({
  vendorName,
  match,
  onLinkExisting,
  onCreateAndLink,
  onSkip,
  onBack,
}: VendorLinkStepProps) {
  if (match.isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/40 rounded-lg">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm">Sjekker leverandørregisteret...</p>
      </div>
    );
  }

  const candidate = match.exact ?? match.suggested;
  const isSuggestion = !match.exact && !!match.suggested;

  return (
    <div className="space-y-4">
      {candidate && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {isSuggestion ? (
              <>
                <Sparkles className="h-4 w-4" style={{ color: MYNDER_BLUE }} />
                <span className="text-sm font-medium">Lara foreslår en kobling</span>
                <Badge variant="secondary" className="text-xs">Lara-forslag</Badge>
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4" style={{ color: MYNDER_BLUE }} />
                <span className="text-sm font-medium">Leverandøren finnes i registeret</span>
              </>
            )}
          </div>

          <div className="p-4 rounded-lg border bg-card flex items-center gap-4">
            {candidate.logo_url ? (
              <img src={candidate.logo_url} alt={candidate.name} className="h-12 w-12 rounded object-contain bg-white p-1 border" />
            ) : (
              <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{candidate.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {candidate.vendor_category && (
                  <Badge variant="outline" className="text-xs">{candidate.vendor_category}</Badge>
                )}
                {candidate.tprm_status && candidate.tprm_status !== "not_assessed" && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    {candidate.tprm_status}
                  </Badge>
                )}
                {typeof candidate.risk_score === "number" && candidate.risk_score > 0 && (
                  <Badge variant="outline" className="text-xs">Risiko {candidate.risk_score}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
            {BENEFIT_TEXT}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onLinkExisting(candidate)}
              className="flex-1 rounded-full text-white hover:opacity-90"
              style={{ backgroundColor: MYNDER_BLUE }}
            >
              <Link2 className="h-4 w-4 mr-2" />
              {isSuggestion ? "Bekreft kobling" : `Koble til ${candidate.name}`}
            </Button>
            <Button variant="outline" onClick={onSkip} className="rounded-full">
              {isSuggestion ? "Det er en annen leverandør" : "Hopp over"}
            </Button>
          </div>
        </div>
      )}

      {!candidate && match.parentKnown && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" style={{ color: MYNDER_BLUE }} />
            <span className="text-sm font-medium">Lara kjenner leverandøren</span>
          </div>
          <div className="p-4 rounded-lg border bg-card">
            <p className="text-sm">
              <span className="font-medium">{match.parentKnown}</span> er ikke i leverandørregisteret ditt enda.
              Vil du legge dem til og koble {vendorName || "systemet"} samtidig?
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
            {BENEFIT_TEXT}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              onClick={() => onCreateAndLink(match.parentKnown!)}
              className="flex-1 rounded-full text-white hover:opacity-90"
              style={{ backgroundColor: MYNDER_BLUE }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Legg til {match.parentKnown} og koble
            </Button>
            <Button variant="outline" onClick={onSkip} className="rounded-full">
              Bare lagre systemet
            </Button>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-between pt-2">
        <Button variant="ghost" onClick={onBack} className="rounded-full">
          <ChevronLeft className="h-4 w-4 mr-1" />Tilbake
        </Button>
        <Button variant="ghost" onClick={onSkip} className="rounded-full">
          Hopp over <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
