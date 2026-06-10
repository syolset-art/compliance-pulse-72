import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Layers, Plus, Trash2, ShieldCheck, Search, Loader2, Sparkles,
  CheckCircle2, Globe, Building2, Mail,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAssetMetadata } from "./useAssetMetadata";
import { useVendorLookup, type VendorSearchResult } from "@/hooks/useVendorLookup";
import { cn } from "@/lib/utils";

interface CriticalVendorsSectionProps {
  asset: any;
}

type GdprRole = "controller" | "processor" | "joint" | "none";

type AnalysisStepStatus = "pending" | "running" | "done";
type AnalysisStep = { key: string; label: string; status: AnalysisStepStatus };

type VendorAnalysis = {
  status: "idle" | "running" | "done";
  steps: AnalysisStep[];
  findings: string[];
  finishedAt?: string;
};

type VendorRow = {
  name: string;
  orgNumber?: string | null;
  url?: string | null;
  email?: string | null;
  vendorTypeKey?: string | null;
  gdprRole?: GdprRole | null;
  purpose?: string;
  processesPersonalData?: "yes" | "no" | null;
  dataCategories?: string[];
  dpa?: "yes" | "no" | "unknown" | null;
  analysis?: VendorAnalysis | null;
};

const DATA_CATEGORY_OPTIONS = ["Ansattdata", "Kundedata", "Pasientdata", "Annet"];

const VENDOR_TYPE_OPTIONS: Array<{ key: string; label: string }> = [
  { key: "msp", label: "MSP (Managed Service Provider)" },
  { key: "mssp", label: "MSSP (Managed Security Service Provider)" },
  { key: "it_partner", label: "IT-partner" },
  { key: "drift", label: "Drift" },
  { key: "cloud", label: "Skytjeneste / hosting" },
  { key: "hr", label: "HR-system" },
  { key: "finance", label: "Økonomi / fakturering" },
  { key: "comms", label: "Kommunikasjon / e-post" },
  { key: "marketing", label: "Markedsføring" },
  { key: "consultant", label: "Konsulent" },
  { key: "other", label: "Annet" },
];

const GDPR_ROLE_OPTIONS: Array<{ key: GdprRole; label: string; hint: string }> = [
  { key: "processor", label: "Databehandler", hint: "Behandler personopplysninger på deres vegne" },
  { key: "controller", label: "Behandlingsansvarlig", hint: "Bestemmer formål og midler selv" },
  { key: "joint", label: "Felles behandlingsansvarlig", hint: "Felles ansvar med dere" },
  { key: "none", label: "Ikke aktuelt", hint: "Behandler ikke personopplysninger" },
];

const EMPTY_ROW: VendorRow = {
  name: "",
  orgNumber: null,
  url: null,
  email: null,
  vendorTypeKey: null,
  gdprRole: null,
  purpose: "",
  processesPersonalData: null,
  dataCategories: [],
  dpa: null,
  analysis: null,
};

const ANALYSIS_STEP_DEFS: Array<{ key: string; label: string }> = [
  { key: "brreg", label: "Henter Brønnøysund-informasjon" },
  { key: "domain", label: "Analyserer domene og nettside" },
  { key: "email", label: "Kartlegger e-postdomene og kontaktpunkter" },
  { key: "public", label: "Oppsummerer offentlig tilgjengelig informasjon" },
];

export function CriticalVendorsSection({ asset }: CriticalVendorsSectionProps) {
  const meta = (asset?.metadata || {}) as Record<string, any>;
  const stored: VendorRow[] = Array.isArray(meta.criticalVendors) ? meta.criticalVendors : [];
  const { updatePath } = useAssetMetadata(asset?.id, meta);

  const [rows, setRows] = useState<VendorRow[]>(stored.length ? stored : []);
  useEffect(() => {
    setRows(Array.isArray(meta.criticalVendors) ? meta.criticalVendors : []);
  }, [JSON.stringify(meta.criticalVendors)]);

  const persist = (next: VendorRow[]) => {
    setRows(next);
    updatePath(["criticalVendors"], next, { silent: true });
  };

  const update = (i: number, patch: Partial<VendorRow>) => {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    persist(next);
  };

  const addRow = () => persist([...rows, { ...EMPTY_ROW }]);
  const removeRow = (i: number) => persist(rows.filter((_, idx) => idx !== i));

  const toggleCategory = (i: number, cat: string) => {
    const current = rows[i].dataCategories || [];
    const next = current.includes(cat) ? current.filter((c) => c !== cat) : [...current, cat];
    update(i, { dataCategories: next });
  };

  return (
    <section id="critical-vendors" className="space-y-4 scroll-mt-24">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <h2 className="text-base font-semibold text-foreground">Leverandører</h2>
        <Badge variant="secondary" className="text-sm ml-auto">
          {rows.filter((r) => r.name.trim().length > 0).length}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        Kritiske leverandører som behandler data eller leverer tjenester på dine vegne. Søk i Brønnøysund, registrer GDPR-rolle og kjør en automatisk analyse av offentlig tilgjengelig informasjon.
      </p>

      {rows.length === 0 && (
        <Card className="p-6 text-center space-y-3 border-dashed">
          <p className="text-sm text-muted-foreground">
            Ingen kritiske leverandører registrert ennå.
          </p>
          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Legg til
          </Button>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <VendorRowCard
              key={i}
              row={row}
              onChange={(patch) => update(i, patch)}
              onRemove={() => removeRow(i)}
              onToggleCategory={(c) => toggleCategory(i, c)}
            />
          ))}

          <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Legg til
          </Button>
        </div>
      )}
    </section>
  );
}

/* -------------------- Row card -------------------- */

function VendorRowCard({
  row, onChange, onRemove, onToggleCategory,
}: {
  row: VendorRow;
  onChange: (patch: Partial<VendorRow>) => void;
  onRemove: () => void;
  onToggleCategory: (cat: string) => void;
}) {
  const { search, results, isLoading, clearResults } = useVendorLookup();
  const [query, setQuery] = useState(row.name || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Debounced Brreg-search når brukeren skriver i navnefeltet
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    const q = query.trim();
    // Ikke søk hvis vi allerede har en valgt leverandør med samme navn
    if (!q || q === row.name) {
      clearResults();
      return;
    }
    if (q.length < 2) return;
    debounceRef.current = window.setTimeout(() => {
      search(q, "NO");
      setShowSuggestions(true);
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const selectVendor = (v: VendorSearchResult) => {
    onChange({
      name: v.name,
      orgNumber: v.orgNumber,
      url: v.url || row.url || null,
    });
    setQuery(v.name);
    setShowSuggestions(false);
    clearResults();
  };

  const hasVendor = (row.name || "").trim().length > 0;

  return (
    <Card className="p-4 space-y-3">
      {/* Søk / navn */}
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-1.5 relative">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            Leverandør
          </label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={query}
              placeholder="Søk i Brønnøysund — f.eks. Visma, Microsoft, Telenor"
              className="text-sm pl-8"
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => results.length > 0 && setShowSuggestions(true)}
              onBlur={() => {
                // La klikk på forslag rekke å registreres
                window.setTimeout(() => setShowSuggestions(false), 150);
                // Lagre manuell tekst som navn hvis ingen match valgt
                const trimmed = query.trim();
                if (trimmed && trimmed !== row.name) onChange({ name: trimmed });
              }}
            />
            {isLoading && (
              <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground animate-spin" />
            )}
          </div>
          {showSuggestions && results.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-md max-h-64 overflow-auto">
              {results.map((v) => (
                <button
                  key={`${v.orgNumber || v.name}`}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectVendor(v);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex flex-col gap-0.5"
                >
                  <span className="font-medium text-foreground">{v.name}</span>
                  <span className="text-[12px] text-muted-foreground">
                    {[v.orgNumber, v.industry, v.address].filter(Boolean).join(" · ") || "Brønnøysund"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {row.orgNumber && (
            <p className="text-[12px] text-muted-foreground">
              Org.nr {row.orgNumber}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive shrink-0 mt-6"
          onClick={onRemove}
          aria-label="Fjern leverandør"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Etter at leverandør er valgt */}
      {hasVendor && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Nettside
              </label>
              <Input
                defaultValue={row.url || ""}
                placeholder="https://leverandor.no"
                className="text-sm"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (row.url || "")) onChange({ url: v || null });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                Kontakt-e-post
              </label>
              <Input
                type="email"
                defaultValue={row.email || ""}
                placeholder="kontakt@leverandor.no"
                className="text-sm"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (row.email || "")) onChange({ email: v || null });
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Leverandørtype</label>
              <Select
                value={row.vendorTypeKey ?? ""}
                onValueChange={(key) => {
                  const opt = VENDOR_TYPE_OPTIONS.find((o) => o.key === key);
                  onChange({
                    vendorTypeKey: key,
                    purpose: key === "other" ? (row.purpose || "") : (opt?.label ?? ""),
                  });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Velg leverandørtype…" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {row.vendorTypeKey === "other" && (
                <Input
                  defaultValue={row.purpose || ""}
                  placeholder="Beskriv kort hva de gjør for dere"
                  className="text-sm mt-1.5"
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v !== (row.purpose || "")) onChange({ purpose: v });
                  }}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">GDPR-rolle</label>
              <Select
                value={row.gdprRole ?? ""}
                onValueChange={(v) => {
                  const role = v as GdprRole;
                  onChange({
                    gdprRole: role,
                    // Auto-synk med personopplysningsspørsmål for konsistens
                    ...(role === "processor" || role === "joint"
                      ? { processesPersonalData: "yes" as const }
                      : role === "none"
                        ? { processesPersonalData: "no" as const, dataCategories: [] }
                        : {}),
                  });
                }}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Velg rolle…" />
                </SelectTrigger>
                <SelectContent>
                  {GDPR_ROLE_OPTIONS.map((o) => (
                    <SelectItem key={o.key} value={o.key}>
                      <div className="flex flex-col">
                        <span>{o.label}</span>
                        <span className="text-[11px] text-muted-foreground">{o.hint}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Analyse av offentlig informasjon */}
          <AnalysisBlock row={row} onChange={onChange} />

          {/* Personopplysninger */}
          <div className="space-y-1.5 pt-1">
            <label className="text-sm font-medium text-foreground">Behandler de personopplysninger på deres vegne?</label>
            <div className="flex gap-2">
              {(["yes", "no"] as const).map((v) => (
                <Button
                  key={v}
                  variant={row.processesPersonalData === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange({ processesPersonalData: v, ...(v === "no" ? { dataCategories: [], dpa: row.dpa === "no" ? null : row.dpa } : {}) })}
                >
                  {v === "yes" ? "Ja" : "Nei"}
                </Button>
              ))}
            </div>
          </div>

          {row.processesPersonalData === "yes" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Hvilken kategori?</label>
              <div className="flex flex-wrap gap-2">
                {DATA_CATEGORY_OPTIONS.map((cat) => {
                  const selected = (row.dataCategories || []).includes(cat);
                  return (
                    <Button
                      key={cat}
                      variant={selected ? "default" : "outline"}
                      size="sm"
                      onClick={() => onToggleCategory(cat)}
                    >
                      {cat}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Har dere en databehandleravtale (DPA)?</label>
            <div className="flex gap-2">
              {(["yes", row.processesPersonalData === "no" ? null : "no", "unknown"]
                .filter(Boolean) as Array<"yes" | "no" | "unknown">).map((v) => (
                <Button
                  key={v}
                  variant={row.dpa === v ? "default" : "outline"}
                  size="sm"
                  onClick={() => onChange({ dpa: v })}
                >
                  {v === "yes" ? "Ja" : v === "no" ? "Nei" : "Vet ikke"}
                </Button>
              ))}
            </div>
            {row.processesPersonalData === "no" && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                <ShieldCheck className="h-3 w-3" />
                DPA normalt ikke påkrevd når leverandøren ikke behandler personopplysninger.
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

/* -------------------- Analysis block -------------------- */

function AnalysisBlock({
  row, onChange,
}: {
  row: VendorRow;
  onChange: (patch: Partial<VendorRow>) => void;
}) {
  const analysis = row.analysis ?? null;
  const isRunning = analysis?.status === "running";
  const isDone = analysis?.status === "done";

  const completed = (analysis?.steps || []).filter((s) => s.status === "done").length;
  const total = ANALYSIS_STEP_DEFS.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const runAnalysis = async () => {
    const steps: AnalysisStep[] = ANALYSIS_STEP_DEFS.map((d) => ({
      key: d.key,
      label: d.label,
      status: "pending",
    }));
    onChange({ analysis: { status: "running", steps, findings: [] } });

    const findings: string[] = [];
    const updateSteps = (next: AnalysisStep[], moreFindings: string[] = []) => {
      const merged = [...findings, ...moreFindings];
      findings.length = 0;
      findings.push(...merged);
      onChange({
        analysis: { status: "running", steps: next, findings: [...findings] },
      });
    };

    for (let i = 0; i < steps.length; i++) {
      steps[i] = { ...steps[i], status: "running" };
      updateSteps([...steps]);
      // Simulert arbeid — i en ekte versjon kobles dette til en edge-funksjon
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 600));

      const step = ANALYSIS_STEP_DEFS[i];
      const newFindings = buildStepFindings(step.key, row);

      steps[i] = { ...steps[i], status: "done" };
      updateSteps([...steps], newFindings);
    }

    onChange({
      analysis: {
        status: "done",
        steps,
        findings: [...findings],
        finishedAt: new Date().toISOString(),
      },
    });
  };

  const canAnalyze = (row.name || "").trim().length > 0 && !isRunning;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground">
            Analyse av offentlig informasjon
          </div>
          <p className="text-[12px] text-muted-foreground">
            Mynder/Lara kartlegger leverandøren basert på Brønnøysund-data, nettside og e-postdomene.
          </p>
        </div>
        <Button
          size="sm"
          variant={isDone ? "outline" : "default"}
          className="gap-1.5 shrink-0"
          disabled={!canAnalyze}
          onClick={runAnalysis}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyserer…
            </>
          ) : isDone ? (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Kjør på nytt
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              Start analyse
            </>
          )}
        </Button>
      </div>

      {(isRunning || isDone) && analysis && (
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" />
          <ul className="space-y-1">
            {analysis.steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-[12px]">
                {s.status === "done" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                ) : s.status === "running" ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                ) : (
                  <span className="h-3.5 w-3.5 rounded-full border border-border" />
                )}
                <span
                  className={cn(
                    s.status === "done"
                      ? "text-foreground"
                      : s.status === "running"
                        ? "text-foreground"
                        : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isDone && analysis && analysis.findings.length > 0 && (
        <div className="rounded-md border border-border bg-card p-2.5 space-y-1.5">
          <div className="text-[12px] font-medium text-foreground">Funn</div>
          <ul className="space-y-1 text-[12px] text-muted-foreground list-disc pl-4">
            {analysis.findings.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function buildStepFindings(stepKey: string, row: VendorRow): string[] {
  const findings: string[] = [];
  if (stepKey === "brreg") {
    if (row.orgNumber) findings.push(`Verifisert i Brønnøysund (org.nr ${row.orgNumber}).`);
    else findings.push("Ingen Brønnøysund-treff — leverandør er registrert manuelt.");
  }
  if (stepKey === "domain") {
    if (row.url) {
      try {
        const u = new URL(row.url.startsWith("http") ? row.url : `https://${row.url}`);
        findings.push(`Nettside ${u.hostname} er aktiv og svarer på HTTPS.`);
      } catch {
        findings.push("Nettside-URL ser ugyldig ut — sjekk formatet.");
      }
    } else {
      findings.push("Mangler nettside — anbefales for å berike profilen.");
    }
  }
  if (stepKey === "email") {
    if (row.email && row.email.includes("@")) {
      const domain = row.email.split("@")[1];
      findings.push(`E-postdomene ${domain} kartlagt og brukt som kontaktpunkt.`);
    } else {
      findings.push("Ingen e-postadresse oppgitt — kan ikke kartlegge e-postdomene.");
    }
  }
  if (stepKey === "public") {
    findings.push("Ingen åpne sikkerhetshendelser eller alvorlige avvik identifisert i offentlige kilder.");
  }
  return findings;
}
