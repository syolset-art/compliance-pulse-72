import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useVendorLookup, VendorSearchResult } from "@/hooks/useVendorLookup";
import {
  Building2,
  Search,
  Users,
  Globe,
  MapPin,
  Briefcase,
  Check,
  ArrowLeft,
  ArrowRight,
  Database,
  PenLine,
  Loader2,
} from "lucide-react";

interface AddVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVendorAdded?: () => void;
}

type Step = "quantity" | "search" | "contact" | "confirm";
type Mode = "single" | "multiple";
type Country = "NO" | "SE" | "DK" | "other";

const STEPS_SINGLE: Step[] = ["quantity", "search", "contact", "confirm"];

const countryFlags: Record<Country, string> = {
  NO: "🇳🇴",
  SE: "🇸🇪",
  DK: "🇩🇰",
  other: "🌍",
};

const countryLabels: Record<Country, string> = {
  NO: "Norge",
  SE: "Sverige",
  DK: "Danmark",
  other: "Annet",
};

export function AddVendorDialog({ open, onOpenChange, onVendorAdded }: AddVendorDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { search, searchInternalOnly, clearResults, results, isLoading, error } = useVendorLookup();

  const [step, setStep] = useState<Step>("quantity");
  const [mode, setMode] = useState<Mode>("single");
  const [country, setCountry] = useState<Country>("NO");
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<VendorSearchResult | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [addedVendors, setAddedVendors] = useState<string[]>([]);

  const resetForm = useCallback(() => {
    setStep("quantity");
    setMode("single");
    setCountry("NO");
    setSearchQuery("");
    setSelected(null);
    setManualMode(false);
    setManualName("");
    setManualUrl("");
    setContactName("");
    setContactEmail("");
    setContactRole("");
    clearResults();
  }, [clearResults]);

  const resetForNext = useCallback(() => {
    setStep("search");
    setSearchQuery("");
    setSelected(null);
    setManualMode(false);
    setManualName("");
    setManualUrl("");
    setContactName("");
    setContactEmail("");
    setContactRole("");
    clearResults();
  }, [clearResults]);

  const createVendor = useMutation({
    mutationFn: async () => {
      const vendor = selected || {
        name: manualName,
        orgNumber: null,
        country: country,
        industry: null,
        url: manualUrl || null,
      };

      const { error: insertError } = await supabase.from("assets").insert({
        name: vendor.name,
        asset_type: "vendor",
        country: vendor.country || country,
        url: vendor.url,
        org_number: vendor.orgNumber,
        contact_person: contactName || null,
        contact_email: contactEmail || null,
        metadata: {
          industry: (vendor as VendorSearchResult).industry,
          contact_role: contactRole || null,
        },
      } as any);

      if (insertError) throw insertError;
      return vendor.name;
    },
    onSuccess: (name) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      toast.success(t("addVendor.success", "{{name}} ble lagt til", { name }));
      onVendorAdded?.();

      if (mode === "multiple") {
        setAddedVendors((prev) => [...prev, name]);
        resetForNext();
      } else {
        onOpenChange(false);
        resetForm();
      }
    },
    onError: () => {
      toast.error(t("addVendor.error", "Kunne ikke legge til leverandør"));
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      search(searchQuery, country);
    }
  };

  const handleSelect = (result: VendorSearchResult) => {
    if (result.existingId) {
      toast.info(t("addVendor.alreadyExists", "Denne leverandøren finnes allerede"));
      return;
    }
    setSelected(result);
    setStep("contact");
  };

  const handleManualConfirm = () => {
    if (!manualName.trim()) return;
    setSelected({
      source: "manual",
      name: manualName,
      orgNumber: null,
      country: country,
      industry: null,
      address: null,
      employees: null,
      url: manualUrl || null,
    });
    setStep("contact");
  };

  const stepIndex = STEPS_SINGLE.indexOf(step);
  const progressPercent = ((stepIndex + 1) / STEPS_SINGLE.length) * 100;

  const sourceLabel = (source: string) => {
    switch (source) {
      case "brreg": return "Brønnøysundregistrene";
      case "cvr": return "CVR (Danmark)";
      case "bolagsverket": return "Bolagsverket";
      case "internal": return t("addVendor.internalDb", "Vår database");
      default: return "";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("addVendor.title", "Legg til leverandør")}</DialogTitle>
          <DialogDescription>
            {t("addVendor.step", "Steg {{current}} av {{total}}", {
              current: stepIndex + 1,
              total: STEPS_SINGLE.length,
            })}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progressPercent} className="h-1.5" />

        {/* Step: Quantity */}
        {step === "quantity" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("addVendor.howMany", "Hvor mange leverandører vil du legge til?")}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMode("single"); setStep("search"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("addVendor.singleVendor", "Én leverandør")}
              >
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t("addVendor.singleVendor", "Én leverandør")}</span>
              </button>
              <button
                onClick={() => { setMode("multiple"); setStep("search"); }}
                className="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("addVendor.multipleVendors", "Flere leverandører")}
              >
                <Users className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">{t("addVendor.multipleVendors", "Flere leverandører")}</span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Search */}
        {step === "search" && !manualMode && (
          <div className="space-y-4 pt-2">
            {mode === "multiple" && addedVendors.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t("addVendor.added", "Lagt til")} ({addedVendors.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {addedVendors.map((v, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      <Check className="h-3 w-3" /> {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="vendor-search">{t("addVendor.searchLabel", "Søk etter leverandør")}</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  id="vendor-search"
                  placeholder={t("addVendor.searchPlaceholder", "Skriv leverandørnavn...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  aria-label={t("addVendor.searchLabel", "Søk etter leverandør")}
                />
                <Button onClick={handleSearch} disabled={isLoading || !searchQuery.trim()} size="icon" aria-label={t("addVendor.searchBtn", "Søk")}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">{t("addVendor.country", "Land")}</Label>
              <div className="flex gap-2 mt-1.5">
                {(["NO", "SE", "DK", "other"] as Country[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCountry(c); clearResults(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      country === c ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-muted-foreground"
                    }`}
                    aria-pressed={country === c}
                    aria-label={countryLabels[c]}
                  >
                    <span>{countryFlags[c]}</span>
                    <span className="hidden sm:inline">{countryLabels[c]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">
                  {t("addVendor.resultsFrom", "Resultater fra {{source}}", { source: sourceLabel(results[0].source) })}
                </p>
                <div className="space-y-1.5" role="listbox" aria-label={t("addVendor.searchResults", "Søkeresultater")}>
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelect(r)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        r.existingId ? "border-muted bg-muted/30 opacity-60" : "border-border"
                      }`}
                      role="option"
                      aria-selected={false}
                      aria-label={`${r.name} ${r.orgNumber || ""}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-sm">{r.name}</span>
                          {r.existingId && (
                            <span className="ml-2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {t("addVendor.existing", "Allerede registrert")}
                            </span>
                          )}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                            {r.industry && (
                              <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{r.industry}</span>
                            )}
                            {r.address && (
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.address}</span>
                            )}
                            {r.employees != null && (
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.employees}+</span>
                            )}
                          </div>
                        </div>
                        {r.orgNumber && (
                          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{r.orgNumber}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error === "no_results" && (
              <div className="text-center py-4 space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("addVendor.noResults", "Fant ikke leverandøren i registeret")}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => searchInternalOnly(searchQuery)} className="gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    {t("addVendor.searchInternal", "Søk i vår database")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setManualMode(true); setManualName(searchQuery); }} className="gap-1.5">
                    <PenLine className="h-3.5 w-3.5" />
                    {t("addVendor.addManually", "Legg inn manuelt")}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => { setStep("quantity"); clearResults(); }}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
            </div>
          </div>
        )}

        {/* Manual mode */}
        {step === "search" && manualMode && (
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="manual-name">{t("addVendor.vendorName", "Leverandørnavn")} *</Label>
              <Input id="manual-name" value={manualName} onChange={(e) => setManualName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="manual-url">{t("addVendor.website", "Nettside")}</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <Input id="manual-url" placeholder="https://" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <Button size="sm" onClick={handleManualConfirm} disabled={!manualName.trim()}>
                {t("addVendor.next", "Neste")} <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Contact */}
        {step === "contact" && (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              {t("addVendor.contactInfo", "Legg til kontaktperson (valgfritt)")}
            </p>
            <div>
              <Label htmlFor="contact-name">{t("addVendor.contactName", "Kontaktperson")}</Label>
              <Input id="contact-name" value={contactName} onChange={(e) => setContactName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="contact-email">{t("addVendor.contactEmail", "E-post")}</Label>
              <Input id="contact-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="contact-role">{t("addVendor.contactRole", "Rolle/tittel")}</Label>
              <Input id="contact-role" value={contactRole} onChange={(e) => setContactRole(e.target.value)} className="mt-1.5" />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("search")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setStep("confirm")}>
                  {t("addVendor.skip", "Hopp over")}
                </Button>
                <Button size="sm" onClick={() => setStep("confirm")}>
                  {t("addVendor.next", "Neste")} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === "confirm" && selected && (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-sm">{selected.name}</h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-xs text-muted-foreground">
                {selected.orgNumber && (
                  <>
                    <span>{t("addVendor.orgNumber", "Org.nr")}</span>
                    <span className="font-mono">{selected.orgNumber}</span>
                  </>
                )}
                {selected.country && (
                  <>
                    <span>{t("addVendor.country", "Land")}</span>
                    <span>{countryFlags[selected.country as Country] || "🌍"} {countryLabels[selected.country as Country] || selected.country}</span>
                  </>
                )}
                {selected.industry && (
                  <>
                    <span>{t("addVendor.industry", "Bransje")}</span>
                    <span>{selected.industry}</span>
                  </>
                )}
                {selected.url && (
                  <>
                    <span>{t("addVendor.website", "Nettside")}</span>
                    <span className="truncate">{selected.url}</span>
                  </>
                )}
                {contactName && (
                  <>
                    <span>{t("addVendor.contactName", "Kontaktperson")}</span>
                    <span>{contactName}</span>
                  </>
                )}
                {contactEmail && (
                  <>
                    <span>{t("addVendor.contactEmail", "E-post")}</span>
                    <span>{contactEmail}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setStep("contact")}>
                <ArrowLeft className="h-4 w-4 mr-1" /> {t("addVendor.back", "Tilbake")}
              </Button>
              <Button onClick={() => createVendor.mutate()} disabled={createVendor.isPending}>
                {createVendor.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {t("addVendor.addVendor", "Legg til leverandør")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
