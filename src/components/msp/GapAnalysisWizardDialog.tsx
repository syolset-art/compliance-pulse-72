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
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customers: any[];
}

const STEPS = ["Regelverk", "Kunder", "Analyse", "Rapport"] as const;

const CURRENCY = "NOK";
const LOCALE = "nb-NO";
function formatCurrency(n: number, compact = true) {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      maximumFractionDigits: 0,
      notation: compact ? "compact" : "standard",
    }).format(n);
  } catch {
    return `${n} ${CURRENCY}`;
  }
}

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
  "Beregner salgspotensial per kunde",
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

export function GapAnalysisWizardDialog({ open, onOpenChange, customers }: Props) {
  const [step, setStep] = useState(1);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<CustomerGapMatch[]>([]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setSelectedFrameworks([]);
        setSelectedCustomers([]);
        setCustomerSearch("");
        setAnalyzing(false);
        setResults([]);
      }, 200);
    }
  }, [open]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.customer_name, c.industry, c.country_code].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [customers, customerSearch]);

  const toggleFramework = (id: string) =>
    setSelectedFrameworks((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const toggleCustomer = (id: string) =>
    setSelectedCustomers((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allFilteredSelected =
    filteredCustomers.length > 0 && filteredCustomers.every((c) => selectedCustomers.includes(c.id));
  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelectedCustomers((s) => s.filter((id) => !filteredCustomers.some((c) => c.id === id)));
    } else {
      const add = filteredCustomers.map((c) => c.id).filter((id) => !selectedCustomers.includes(id));
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
    const potential = results.reduce((s, r) => s + r.totalPotential, 0);
    const serviceIds = new Set<string>();
    results.forEach((r) => r.services.forEach((s) => serviceIds.add(s.service.id)));
    return { gaps, potential, services: serviceIds.size };
  }, [results]);

  const canNext =
    (step === 1 && selectedFrameworks.length > 0) ||
    (step === 2 && selectedCustomers.length > 0) ||
    step === 3 ||
    step === 4;

  const handleCreateOffer = () => {
    toast.success("Tilbud opprettet", {
      description: `Utkast klar for ${results.length} kunde${results.length === 1 ? "" : "r"} – total ${formatCurrency(totals.potential, false)}.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl">GAP-analyse</DialogTitle>
          <DialogDescription className="text-sm">
            Velg regelverk og kunder, kjør analysen, og se hvilke av dine tjenester som kan lukke gapene.
          </DialogDescription>
          <div className="pt-3">
            <StepHeader step={step} />
          </div>
        </DialogHeader>

        <div className="px-6 py-5 min-h-[380px] max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-3">
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
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground">Hvilke kunder skal analyseres?</p>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-medium text-primary hover:underline"
                >
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
                  {filteredCustomers.map((c) => {
                    const sel = selectedCustomers.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCustomer(c.id)}
                        className={cn(
                          "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          sel ? "bg-primary/5" : "hover:bg-muted/40",
                        )}
                      >
                        <Checkbox checked={sel} className="pointer-events-none" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{c.customer_name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {c.industry || "—"}{c.country_code ? ` · ${c.country_code}` : ""}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {filteredCustomers.length === 0 && (
                    <div className="p-6 text-center text-sm text-muted-foreground">Ingen kunder matcher søket.</div>
                  )}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedCustomers.length} av {customers.length} kunder valgt
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
                      Kjør compliance-analyse for {selectedCustomers.length} kunde
                      {selectedCustomers.length === 1 ? "" : "r"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFrameworks.length} regelverk · matcher gap mot dine tjenester
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
                  <div className="text-xs text-muted-foreground">Identifiserte gap</div>
                  <div className="text-xl font-semibold tabular-nums">{totals.gaps}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">Tjenester som matcher</div>
                  <div className="text-xl font-semibold tabular-nums">{totals.services}</div>
                </div>
                <div className="rounded-lg border bg-primary/5 border-primary/20 p-3">
                  <div className="text-xs text-primary/80">Salgspotensial</div>
                  <div className="text-xl font-semibold tabular-nums text-primary">
                    {formatCurrency(totals.potential)}
                  </div>
                </div>
              </div>

              {/* Per-customer results */}
              <div className="space-y-2">
                {results.map((r) => (
                  <div key={r.customerId} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{r.customerName}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.gapCount} gap · {r.industry || "—"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums text-primary shrink-0">
                        {formatCurrency(r.totalPotential)}
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
                <Button size="sm" className="gap-2" onClick={handleCreateOffer}>
                  <Send className="h-4 w-4" />
                  Opprett tilbud
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
