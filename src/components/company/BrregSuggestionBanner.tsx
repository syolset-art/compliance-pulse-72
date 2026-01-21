import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import { Lightbulb, Check, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrregSuggestionBannerProps {
  orgNumber: string | null;
  currentIndustry: string | null;
  currentEmployees: string | null;
  onApplySuggestion: (industry: string, employees: string) => void;
}

export function BrregSuggestionBanner({
  orgNumber,
  currentIndustry,
  currentEmployees,
  onApplySuggestion,
}: BrregSuggestionBannerProps) {
  const { lookupByOrgNumber, suggestion, isLoading, error, clearSuggestion } = useBrregLookup();
  const [dismissed, setDismissed] = useState(false);
  const [hasLookedUp, setHasLookedUp] = useState(false);

  useEffect(() => {
    // Only lookup if we have an org number and haven't looked up yet
    if (orgNumber && !hasLookedUp) {
      lookupByOrgNumber(orgNumber);
      setHasLookedUp(true);
    }
  }, [orgNumber, hasLookedUp, lookupByOrgNumber]);

  // Reset when org number changes
  useEffect(() => {
    if (orgNumber) {
      setHasLookedUp(false);
      setDismissed(false);
    }
  }, [orgNumber]);

  // Check if we have a suggestion that differs from current values
  const hasDifferentIndustry = suggestion && 
    suggestion.industry && 
    suggestion.industry !== "other" &&
    currentIndustry !== suggestion.industry;

  const hasDifferentEmployees = suggestion && 
    suggestion.employees && 
    currentEmployees !== suggestion.employees;

  const hasSuggestion = hasDifferentIndustry || hasDifferentEmployees;

  if (!orgNumber || dismissed || !hasSuggestion || isLoading) {
    if (isLoading && orgNumber) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Henter forslag fra Brønnøysundregistrene...
        </div>
      );
    }
    return null;
  }

  if (error) {
    return null; // Silently fail, don't show errors
  }

  const handleApply = () => {
    if (suggestion) {
      onApplySuggestion(
        hasDifferentIndustry ? suggestion.industry : currentIndustry || "",
        hasDifferentEmployees ? suggestion.employees : currentEmployees || ""
      );
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    clearSuggestion();
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
      <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-medium text-foreground">
          Forslag basert på org.nr {orgNumber}
        </p>
        <div className="space-y-1">
          {hasDifferentIndustry && (
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Bransje:</span> {suggestion?.industryLabel}
            </p>
          )}
          {hasDifferentEmployees && (
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground">Ansatte:</span> {suggestion?.employeesLabel}
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleApply} className="gap-1">
            <Check className="h-3 w-3" />
            Bruk forslag
          </Button>
          <Button size="sm" variant="ghost" onClick={handleDismiss} className="gap-1">
            <X className="h-3 w-3" />
            Ignorer
          </Button>
        </div>
      </div>
    </div>
  );
}
