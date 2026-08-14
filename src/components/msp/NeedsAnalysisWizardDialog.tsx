import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronRight, Loader2, Search, ScanSearch, Sparkles, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";
import { matchAll, type CustomerGapMatch } from "@/lib/gapServiceMatcher";
import { matchCustomersToFrameworks, type CustomerFrameworkMatch } from "@/lib/needsMatcher";
import { saveOffer, normalizeServiceKey } from "@/lib/customerOffers";
import { toast } from "sonner";
import { Zap } from "lucide-react";
import { BulkActivateFrameworksDialog } from "./BulkActivateFrameworksDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: any[];
}

const STEPS = ["Regelverk", "Match", "Analyse", "Kampanje"] as const;


const fwName = (id: string) => ALL_FRAMEWORKS.find((f) => f.id === id)?.name ?? id;

function StepHeader({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-medium",
                done && "bg-primary text-primary-foreground border-primary",
                active && "border-primary text-primary",
                !done && !active && "border-border text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : n}
            </span>
            <span className={cn("font-medium", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {n < STEPS.length && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

const PHASES = [
  "Leser krav i valgte regelverk",
  "Matcher kundenes dokumentasjon mot krav",
  "Finner tjenester i din portefølje som kan lukke gap",
  "Grupperer kundene etter hva de mangler",
];

function AnalyzingIndicator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % PHASES.length), 1400);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      <span key={i} className="animate-in fade-in duration-300">{PHASES[i]}</span>
    </div>
  );
}

export function NeedsAnalysisWizardDialog({ open, onOpenChange, customers }: Props) {
  const [step, setStep] = useState(1);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [minMatches, setMinMatches] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<CustomerGapMatch[]>([]);
  const [campaignName, setCampaignName] = useState("");
  const [bulkActivateOpen, setBulkActivateOpen] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedFrameworks([]);
        setMinMatches(1);
        setSelectedCustomers([]);
        setCustomerSearch("");
        setAnalyzing(false);
        setResults([]);
        setCampaignName("");
      }, 200);
    }
  }, [open]);

  // Kunder som matcher valgte regelverk
  const matches: CustomerFrameworkMatch[] = useMemo(
    () => matchCustomersToFrameworks(customers, selectedFrameworks, minMatches),
    [customers, selectedFrameworks, minMatches],
  );

  // Forhåndsvelg alle treff når matchsettet endres
  useEffect(() => {
    setSelectedCustomers(matches.map((m) => m.customerId));
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return matches;
    return matches.filter((m) =>
      [m.customerName, m.customer.industry, m.customer.country_code].some((v) =>
        (v || "").toLowerCase().includes(q),
      ),
    );
  }, [matches, customerSearch]);

  const toggleFramework = (id: string) =>
    setSelectedFrameworks((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleCustomer = (id: string) =>
    setSelectedCustomers((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allFilteredSelected =
    filteredMatches.length > 0 && filteredMatches.every((m) => selectedCustomers.includes(m.customerId));
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedCustomers((s) => s.filter((id) => !filteredMatches.some((m) => m.customerId === id)));
    } else {
      const add = filteredMatches.map((m) => m.customerId).filter((id) => !selectedCustomers.includes(id));
      setSelectedCustomers((s) => [...s, ...add]);
    }
  };

  const runAnalysis = () => {
    setAnalyzing(true);
    const chosen = customers.filter((c) => selectedCustomers.includes(c.id));
    setTimeout(() => {
      const res = matchAll(chosen, selectedFrameworks);
      setResults(res);
      setAnalyzing(false);
      setStep(4);
    }, 2600);
  };

  const totals = useMemo(() => {
    const gaps = results.reduce((s, r) => s + r.gapCount, 0);
    const serviceIds = new Set<string>();
    results.forEach((r) => r.services.forEach((s) => serviceIds.add(s.service.id)));
    return { gaps, services: serviceIds.size };
  }, [results]);

  const canNext =
    (step === 1 && selectedFrameworks.length > 0) ||
    (step === 2 && selectedCustomers.length > 0) ||
    step === 3 ||
    step === 4;

  const effectiveCampaignName =
    campaignName.trim() ||
    `Behovsanalyse ${selectedFrameworks.map(fwName).slice(0, 2).join(" + ")}${selectedFrameworks.length > 2 ? " m.fl." : ""}`;

  const handleCreateBulkOffers = () => {
    const stamp = Date.now();
    results.forEach((r, i) => {
      saveOffer({
        offerNumber: `T-${stamp}-${i + 1}`,
        name: `${effectiveCampaignName} – ${r.customerName}`,
        customerId: r.customerId,
        customerName: r.customerName,
        templateIds: r.services.map((s) => s.service.id),
        serviceKeys: r.services.map((s) => normalizeServiceKey(s.service.name)),
        frameworkIds: selectedFrameworks,
        status: "draft",
      });
    });
    toast.success(`${results.length} tilbud opprettet`, {
      description: `Kampanje «${effectiveCampaignName}» – ${totals.gaps} identifiserte behov.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">Behovsanalyse</DialogTitle>
          <DialogDescription className="text-sm">
            Finn hvilke kunder som matcher valgte regelverk, og opprett tilbud til alle i én kampanje.
          </DialogDescription>
          <div className="pt-3">
            <StepHeader step={step} />
          </div>
        </DialogHeader>

        <div className="px-6 py-5 min-h-[380px] max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">Hvilke regelverk skal vurderes?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_FRAMEWORKS.map((fw) => {
                  const sel = selectedFrameworks.includes(fw.id);
                  return (
                    <button
                      key={fw.id}
                      type="button"
                      onClick={() => toggleFramework(fw.id)}
                      className={cn(
                        "flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
                        sel ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                      )}
                    >
                      <Checkbox checked={sel} className="mt-0.5 pointer-events-none" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">{fw.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{fw.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">Kunden må matche minst</p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: Math.max(1, selectedFrameworks.length) }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMinMatches(n)}
                      className={cn(
                        "h-8 min-w-8 rounded-md border px-2 text-sm font-medium transition-colors",
                        minMatches === n
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                  <span className="self-center text-xs text-muted-foreground ml-1">
                    av {selectedFrameworks.length || 0} valgte regelverk
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">
                  {matches.length} kunde{matches.length === 1 ? "" : "r"} matcher minst {minMatches} av{" "}
                  {selectedFrameworks.length} regelverk
                </p>
                <button type="button" onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
                  {allFilteredSelected ? "Fjern alle" : "Velg alle"}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Søk kunde…"
                  className="pl-9 h-9"
                />
              </div>
              <ScrollArea className="h-[280px] rounded-lg border">
                <div className="divide-y">
                  {filteredMatches.map((m) => {
                    const sel = selectedCustomers.includes(m.customerId);
                    const missing = selectedFrameworks.length - m.matchCount;
                    return (
                      <button
                        key={m.customerId}
                        type="button"
                        onClick={() => toggleCustomer(m.customerId)}
                        className={cn(
                          "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                          sel ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <Checkbox checked={sel} className="mt-0.5 pointer-events-none" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{m.customerName}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {m.customer.industry || "—"}
                            {m.customer.country_code ? ` · ${m.customer.country_code}` : ""}
                            {missing > 0 ? ` · ${missing} uten treff` : ""}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {m.recommendedIds.map((id) => (
                              <Badge key={id} className="text-[11px] font-normal bg-primary/10 text-primary hover:bg-primary/10 border-transparent">
                                {fwName(id)} · anbefalt
                              </Badge>
                            ))}
                            {m.activatedIds.map((id) => (
                              <Badge key={id} variant="outline" className="text-[11px] font-normal text-muted-foreground">
                                {fwName(id)} · aktivert
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredMatches.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      Ingen kunder matcher kriteriet. Prøv færre regelverk eller lavere terskel.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedCustomers.length} av {matches.length} matchende kunder valgt
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] gap-5 text-center">
              {!analyzing ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <ScanSearch className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-foreground font-medium">
                      Kjør behovsanalyse for {selectedCustomers.length} kunde
                      {selectedCustomers.length === 1 ? "" : "r"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFrameworks.length} regelverk · matcher behov mot dine tjenester
                    </p>
                  </div>
                  <Button onClick={runAnalysis} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Kjør analyse
                  </Button>
                </>
              ) : (
                <>
                  <AnalyzingIndicator />
                  <div className="text-xs text-muted-foreground">
                    {selectedCustomers.length} kunder · {selectedFrameworks.length} regelverk
                  </div>
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Kunder i kampanjen</div>
                  <div className="text-xl font-semibold tabular-nums">{results.length}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Identifiserte behov</div>
                  <div className="text-xl font-semibold tabular-nums">{totals.gaps}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Tjenester som dekker</div>
                  <div className="text-xl font-semibold tabular-nums">{totals.services}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Kampanjenavn</p>
                <Input
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder={effectiveCampaignName}
                  className="h-9"
                />
              </div>

              {/* Per-customer results */}
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.customerId} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{r.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.gapCount} behov · {r.industry || "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {r.services.map((s) => (
                        <Badge
                          key={s.service.id}
                          variant="outline"
                          className="text-[11px] font-normal gap-1"
                          title={s.service.description}
                        >
                          <FileText className="h-3 w-3" />
                          {s.service.name}
                          <span className="text-muted-foreground">· {s.coveredGaps}</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((s) => Math.max(1, s - 1)))}
            disabled={analyzing}
          >
            {step === 1 ? "Avbryt" : "Tilbake"}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 && (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={!canNext}>
                Neste
              </Button>
            )}
            {step === 4 && (
              <>
                <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                  Lukk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setBulkActivateOpen(true)}
                  disabled={results.length === 0}
                >
                  <Zap className="h-4 w-4" />
                  Aktiver regelverk ({results.length})
                </Button>
                <Button size="sm" className="gap-2" onClick={handleCreateBulkOffers} disabled={results.length === 0}>
                  <Send className="h-4 w-4" />
                  Opprett bulk-tilbud ({results.length})
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      <BulkActivateFrameworksDialog
        open={bulkActivateOpen}
        onOpenChange={setBulkActivateOpen}
        frameworkNames={selectedFrameworks.map(fwName)}
        customers={results.map((r) => {
          const c = customers.find((x) => x.id === r.customerId);
          return {
            id: r.customerId,
            name: r.customerName,
            activeFrameworks: ((c?.active_frameworks || []) as any[])
              .map((f) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? "")))
              .filter(Boolean),
          };
        })}
        onActivated={() => onOpenChange(false)}
      />
    </Dialog>
  );
}
