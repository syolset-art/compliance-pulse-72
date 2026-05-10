import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Loader2, Search, Sparkles, Building2, CheckCircle2, AlertCircle } from "lucide-react";
import { useBrregLookup } from "@/hooks/useBrregLookup";
import { toast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COUNTRIES = [
  { code: "NO", label: "Norge", registry: "Brønnøysundregistrene", autoLookup: true },
  { code: "SE", label: "Sverige", registry: "Bolagsverket", autoLookup: false },
  { code: "DK", label: "Danmark", registry: "CVR", autoLookup: false },
  { code: "FI", label: "Finland", registry: "PRH", autoLookup: false },
  { code: "DE", label: "Tyskland", registry: "Handelsregister", autoLookup: false },
  { code: "GB", label: "Storbritannia", registry: "Companies House", autoLookup: false },
  { code: "US", label: "USA", registry: "SEC / State registry", autoLookup: false },
  { code: "OTHER", label: "Annet land", registry: "Manuell registrering", autoLookup: false },
];

type Step = 1 | 2 | 3;

export default function CreateTrustProfileModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState<string>("NO");
  const [orgNumber, setOrgNumber] = useState("");
  const [selectedFromRegistry, setSelectedFromRegistry] = useState(false);
  const { searchByName, searchResults, isLoading, clearSuggestion } = useBrregLookup();

  useEffect(() => {
    if (!open) {
      // Reset on close
      setTimeout(() => {
        setStep(1);
        setCompanyName("");
        setCountry("NO");
        setOrgNumber("");
        setSelectedFromRegistry(false);
        clearSuggestion();
      }, 200);
    }
  }, [open, clearSuggestion]);

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const canAutoLookup = selectedCountry?.autoLookup === true;

  const handleNext = async () => {
    if (step === 1) {
      if (!companyName.trim()) {
        toast({ title: "Mangler navn", description: "Skriv inn navnet på selskapet for å fortsette." });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
      if (canAutoLookup) {
        // Auto-search registry on entry
        await searchByName(companyName);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handlePickRegistry = (orgnr: string, navn: string) => {
    setOrgNumber(orgnr);
    setCompanyName(navn);
    setSelectedFromRegistry(true);
  };

  const handleFinish = () => {
    if (!orgNumber.trim()) {
      toast({ title: "Mangler organisasjonsnummer", description: "Oppgi organisasjonsnummeret for å fortsette." });
      return;
    }
    onOpenChange(false);
    navigate("/onboarding", {
      state: {
        prefilled: {
          name: companyName,
          country,
          orgNumber,
          fromRegistry: selectedFromRegistry,
        },
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              Steg {step} av 3
            </span>
          </div>
          <DialogTitle className="text-xl">
            {step === 1 && "Opprett din Trust Profile"}
            {step === 2 && "Hvilket land tilhører selskapet?"}
            {step === 3 && "Bekreft organisasjonsnummer"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Vi starter med navnet på selskapet. Det er det kunder og partnere vil se."}
            {step === 2 && "Vi henter automatisk organisasjonsdetaljer fra landets virksomhetsregister når det er tilgjengelig."}
            {step === 3 &&
              (canAutoLookup
                ? "Velg riktig oppføring fra registeret, eller skriv inn organisasjonsnummeret manuelt."
                : `Automatisk oppslag er ikke tilgjengelig for ${selectedCountry?.label}. Skriv inn organisasjonsnummeret manuelt.`)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="company-name">Selskapsnavn</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="F.eks. Mynder AS"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleNext()}
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label htmlFor="country">Land</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger id="country">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="inline-flex items-center gap-2">
                        {c.label}
                        <span className="text-[11px] text-muted-foreground">· {c.registry}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground pt-1">
                {canAutoLookup
                  ? "Vi henter selskapsdata automatisk fra registeret."
                  : "Vi støtter foreløpig automatisk oppslag kun i Norge. Du kan registrere manuelt for andre land."}
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {canAutoLookup ? (
                <>
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Søker i Brønnøysundregistrene…
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Treff i registeret
                      </p>
                      {searchResults.map((r) => {
                        const isSelected = orgNumber === r.organisasjonsnummer;
                        return (
                          <Card
                            key={r.organisasjonsnummer}
                            className={`p-3 cursor-pointer transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/40"
                            }`}
                            onClick={() => handlePickRegistry(r.organisasjonsnummer, r.navn)}
                          >
                            <div className="flex items-center gap-3">
                              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-foreground truncate">{r.navn}</p>
                                <p className="text-xs text-muted-foreground">
                                  Org.nr {r.organisasjonsnummer}
                                  {r.forretningsadresse?.poststed
                                    ? ` · ${r.forretningsadresse.poststed}`
                                    : ""}
                                </p>
                              </div>
                              {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs">
                      <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      <span className="text-foreground/80">
                        Fant ikke selskapet i registeret. Skriv inn organisasjonsnummeret manuelt nedenfor.
                      </span>
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => searchByName(companyName)}
                      disabled={isLoading}
                      className="gap-2 h-8"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Søk på nytt
                    </Button>
                  </div>
                </>
              ) : null}

              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="org-number">
                  Organisasjonsnummer {canAutoLookup ? "(eller manuell)" : ""}
                </Label>
                <Input
                  id="org-number"
                  value={orgNumber}
                  onChange={(e) => {
                    setOrgNumber(e.target.value);
                    setSelectedFromRegistry(false);
                  }}
                  placeholder={country === "NO" ? "9 sifre" : "Org./registreringsnummer"}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row sm:justify-between gap-2">
          <Button
            variant="ghost"
            onClick={step === 1 ? () => onOpenChange(false) : handleBack}
            className="gap-2"
          >
            {step > 1 && <ArrowLeft className="h-4 w-4" />}
            {step === 1 ? "Avbryt" : "Tilbake"}
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext} className="gap-2">
              Neste
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} className="gap-2">
              Fortsett til onboarding
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
