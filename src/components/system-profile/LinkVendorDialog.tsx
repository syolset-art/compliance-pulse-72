import { useCallback, useEffect, useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Check,
  Loader2,
  Search,
  Sparkles,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVendorLookup, type VendorSearchResult } from "@/hooks/useVendorLookup";
import { resolveVendorCapacity } from "@/lib/vendorCapacity";
import { isModuleDeactivated, activateModule } from "@/lib/moduleActivationState";
import { notifyModuleActivated, notifyModuleActivating } from "@/lib/moduleActivationEvents";

interface LinkVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: { id: string; name: string; vendor?: string | null; url?: string | null };
  onLinked?: () => void;
}

type Step = "suggest" | "search" | "activate";

function hostToName(url?: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
    const base = host.replace(/^www\./, "").split(".")[0];
    return base ? base.charAt(0).toUpperCase() + base.slice(1) : null;
  } catch {
    return null;
  }
}

export function LinkVendorDialog({ open, onOpenChange, system, onLinked }: LinkVendorDialogProps) {
  const { search, results, isLoading } = useVendorLookup();
  const [step, setStep] = useState<Step>("suggest");
  const [suggestion, setSuggestion] = useState<VendorSearchResult | null>(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [selected, setSelected] = useState<VendorSearchResult | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  const seed = system.vendor || hostToName(system.url) || system.name;

  const loadSuggestion = useCallback(async () => {
    setSuggestLoading(true);
    try {
      const { data } = await supabase
        .from("assets")
        .select("id, name, org_number, country, url")
        .eq("asset_type", "vendor")
        .ilike("name", `%${seed}%`)
        .limit(1);
      if (data && data.length > 0) {
        const a = data[0] as any;
        setSuggestion({
          source: "internal",
          name: a.name,
          orgNumber: a.org_number ?? null,
          country: a.country || "NO",
          industry: null,
          address: null,
          employees: null,
          url: a.url ?? null,
          existingId: a.id,
        });
        return;
      }
      const res = await fetch(
        `https://data.brreg.no/enhetsregisteret/api/enheter?navn=${encodeURIComponent(seed)}&size=1`,
      );
      if (res.ok) {
        const json = await res.json();
        const e = json?._embedded?.enheter?.[0];
        if (e) {
          setSuggestion({
            source: "brreg",
            name: e.navn,
            orgNumber: e.organisasjonsnummer,
            country: "NO",
            industry: e.naeringskode1?.beskrivelse ?? null,
            address: e.forretningsadresse?.poststed ?? null,
            employees: e.antallAnsatte ?? null,
            url: e.hjemmeside ?? null,
          });
          return;
        }
      }
      setSuggestion(null);
    } catch {
      setSuggestion(null);
    } finally {
      setSuggestLoading(false);
    }
  }, [seed]);

  useEffect(() => {
    if (!open) return;
    setStep("suggest");
    setSelected(null);
    setQuery(seed);
    loadSuggestion();
  }, [open, seed, loadSuggestion]);

  const chosen = selected ?? suggestion;

  const doLink = async () => {
    if (!chosen) return;
    setSaving(true);
    try {
      let vendorId = chosen.existingId;

      if (!vendorId) {
        const { count } = await supabase
          .from("assets")
          .select("id", { count: "exact", head: true })
          .eq("asset_type", "vendor");
        const used = count ?? 0;
        const capacity = resolveVendorCapacity(used);
        if (used + 1 > capacity.limit) {
          toast.error(
            `Nivået «${capacity.tier.label.toLowerCase()}» er fullt (${used} av ${capacity.limit}). Endre nivå for å legge til flere leverandører.`,
          );
          setSaving(false);
          return;
        }
        const { data: inserted, error } = await supabase
          .from("assets")
          .insert({
            name: chosen.name,
            asset_type: "vendor",
            org_number: chosen.orgNumber,
            country: chosen.country,
            url: chosen.url,
          } as any)
          .select("id")
          .single();
        if (error) throw error;
        vendorId = inserted?.id;
      }

      const { error: linkError } = await supabase.from("system_vendors").insert({
        system_id: system.id,
        name: chosen.name,
        source: `verified:${chosen.source}`,
        purpose: "Leverandør av systemet",
      });
      if (linkError) throw linkError;

      await supabase.from("systems").update({ vendor: chosen.name }).eq("id", system.id);

      toast.success("Verifisert leverandør koblet til systemet", {
        description: chosen.name,
      });
      onLinked?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Kunne ikke koble leverandøren", { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = () => {
    if (!chosen) return;
    if (isModuleDeactivated("vendors")) {
      setStep("activate");
      return;
    }
    doLink();
  };

  const handleActivate = async () => {
    notifyModuleActivating("vendors");
    activateModule("vendors");
    notifyModuleActivated("vendors");
    await doLink();
  };

  const capacity = resolveVendorCapacity(0);
  const nextTier = capacity.nextTier;

  const VendorRow = ({ v, active }: { v: VendorSearchResult; active: boolean }) => (
    <button
      type="button"
      onClick={() => setSelected(v)}
      className={`w-full text-left rounded-lg border p-3 transition-colors ${
        active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{v.name}</span>
            {active && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {[v.orgNumber, v.country, v.industry].filter(Boolean).join(" · ") || "Ingen registerdata"}
          </p>
        </div>
      </div>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === "activate" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Leverandørmodulen
              </DialogTitle>
              <DialogDescription>
                For å koble en verifisert leverandør til systemet må Leverandørmodulen være aktiv.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
              <p className="text-sm font-semibold text-foreground">Inntil 5 leverandører gratis</p>
              <p className="text-xs text-muted-foreground">
                Du får DPA-sporing, risikoanalyse og dokumentasjon på leverandørene dine.
                {nextTier
                  ? ` Trenger du flere, koster «${nextTier.label.toLowerCase()}» ${nextTier.monthlyPriceKr} kr/mnd.`
                  : ""}
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep("suggest")} disabled={saving}>
                Tilbake
              </Button>
              <Button onClick={handleActivate} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Godkjenn og koble
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Koble leverandør til {system.name}</DialogTitle>
              <DialogDescription>
                Lara foreslår leverandøren. Du bekrefter — eller søker selv.
              </DialogDescription>
            </DialogHeader>

            {step === "suggest" ? (
              <div className="space-y-3">
                {suggestLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lara søker etter riktig leverandør …
                  </div>
                ) : suggestion ? (
                  <>
                    <Badge variant="secondary" className="gap-1 text-[11px]">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Foreslått av Lara
                    </Badge>
                    <VendorRow v={suggestion} active={!selected || selected === suggestion} />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Lara fant ingen sikker match. Søk selv nedenfor.
                  </p>
                )}

                {selected && selected !== suggestion && (
                  <VendorRow v={selected} active />
                )}

                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={() => setStep("search")}
                >
                  Ikke riktig? Søk selv
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Søk på navn eller org.nr."
                    onKeyDown={(e) => e.key === "Enter" && search(query, "NO")}
                  />
                  <Button variant="outline" onClick={() => search(query, "NO")} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.map((r, i) => (
                    <VendorRow key={`${r.orgNumber ?? r.name}-${i}`} v={r} active={selected === r} />
                  ))}
                  {!isLoading && results.length === 0 && (
                    <p className="text-sm text-muted-foreground">Ingen treff ennå.</p>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                  onClick={() => setStep("suggest")}
                >
                  <ArrowLeft className="h-3 w-3" />
                  Tilbake til forslaget
                </button>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Avbryt
              </Button>
              <Button onClick={handleConfirm} disabled={!chosen || saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Bekreft leverandør
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
