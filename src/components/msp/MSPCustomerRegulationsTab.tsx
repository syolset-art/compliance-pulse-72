import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Search, Shield, Sparkles, Lightbulb } from "lucide-react";
import { frameworks, categories, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";

interface Props {
  customerId: string;
  customerName: string;
  customer?: {
    industry?: string | null;
    employees?: string | null;
    country_code?: string | null;
    active_frameworks?: string[] | null;
    compliance_score?: number | null;
  };
}

const STORAGE_PREFIX = "msp.customer.activatedFrameworks.";

// Map free-text active_frameworks strings (e.g. "ISO 27001") to catalog ids
function mapActiveFrameworkNames(names: string[] | null | undefined): string[] {
  if (!names?.length) return [];
  const ids: string[] = [];
  for (const n of names) {
    const norm = n.toLowerCase().replace(/[\s/-]/g, "");
    const match = frameworks.find((f) => {
      const fn = f.name.toLowerCase().replace(/[\s/-]/g, "");
      const fid = f.id.toLowerCase().replace(/[\s/-]/g, "");
      return fn.includes(norm) || norm.includes(fid) || fid === norm;
    });
    if (match) ids.push(match.id);
  }
  return ids;
}

function loadActivated(customerId: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return fallback;
}

function saveActivated(customerId: string, ids: string[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(ids));
  } catch {}
}

interface Recommendation {
  id: string;
  reason: string;
}

function computeRecommendations(customer?: Props["customer"]): Recommendation[] {
  const recs: Recommendation[] = [];
  const push = (id: string, reason: string) => {
    if (!recs.find((r) => r.id === id)) recs.push({ id, reason });
  };

  // Universal baseline
  push("gdpr", "Gjelder alle som behandler personopplysninger");
  push("personopplysningsloven", "Norsk utfyllende lov til GDPR");

  const industry = (customer?.industry || "").toLowerCase();
  const employees = customer?.employees || "";
  const empNum = parseInt(employees.split("-")[0] || employees.replace("+", ""), 10) || 0;

  if (industry.includes("helse")) {
    push("normen", "Obligatorisk bransjenorm for helsesektoren");
    push("iso27701", "Anbefalt for behandling av sensitive helseopplysninger");
  }
  if (industry.includes("finans")) {
    push("dora", "Påkrevd for finanssektoren fra 2025");
    push("hvitvasking", "Rapporteringsplikt for finansforetak");
    push("iso27001", "Forventet standard hos finanskunder");
  }
  if (industry.includes("energi") || industry.includes("transport") || industry.includes("offentlig")) {
    push("nis2", "Kritisk sektor – omfattet av NIS2");
    push("nsm", "NSMs grunnprinsipper anbefales for kritisk infrastruktur");
  }
  if (industry.includes("teknologi")) {
    push("iso27001", "Forventet av B2B-kunder i teknologibransjen");
    push("soc2", "Ofte krevd av internasjonale (særlig amerikanske) kunder");
    push("ai-act", "Relevant hvis virksomheten utvikler eller bruker AI-systemer");
    push("cra", "Gjelder produkter med digitale elementer i EU");
  }
  if (industry.includes("bygg") || industry.includes("anlegg")) {
    push("iso45001", "Anbefalt HMS-standard for bygg og anlegg");
    push("internkontroll", "Pålagt for systematisk HMS-arbeid");
  }
  if (industry.includes("handel")) {
    push("apenhetsloven", "Relevant for leverandørkjeder i handel");
    push("bokforingsloven", "Krav til regnskap og dokumentasjon");
  }
  if (industry.includes("utdanning")) {
    push("normen", "Relevant ved behandling av elev-/studentopplysninger");
  }

  // Size-based
  if (empNum >= 50) {
    push("apenhetsloven", "Virksomheter over 50 ansatte kan være omfattet");
  }
  if (empNum >= 200) {
    push("csrd", "Store virksomheter omfattes av bærekraftsrapportering");
    push("iso14001", "Anbefalt miljøledelse for større organisasjoner");
  }
  if (empNum >= 10) {
    push("internkontroll", "Lovpålagt systematisk HMS-arbeid");
    push("arbeidsmiljoloven", "Gjelder alle arbeidsgivere");
  }

  // Mandatory baseline always relevant
  push("bokforingsloven", "Lovpålagt for alle registrerte virksomheter");
  push("hms", "Generell HMS-lovgivning gjelder alle arbeidsgivere");

  return recs;
}

export function MSPCustomerRegulationsTab({ customerId, customerName, customer }: Props) {
  // Initial active list = MSP override (localStorage) OR customer's reported active_frameworks
  const customerActiveIds = useMemo(
    () => mapActiveFrameworkNames(customer?.active_frameworks),
    [customer?.active_frameworks]
  );
  const [activated, setActivated] = useState<string[]>(() =>
    loadActivated(customerId, customerActiveIds)
  );
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | "all">("all");

  useEffect(() => {
    setActivated(loadActivated(customerId, customerActiveIds));
  }, [customerId, customerActiveIds]);

  const recommendations = useMemo(() => computeRecommendations(customer), [customer]);
  const recommendationMap = useMemo(() => {
    const m = new Map<string, string>();
    recommendations.forEach((r) => m.set(r.id, r.reason));
    return m;
  }, [recommendations]);

  const handleActivate = (id: string, name: string) => {
    if (activated.includes(id)) return;
    const next = [...activated, id];
    setActivated(next);
    saveActivated(customerId, next);
    toast.success(`${name} aktivert for ${customerName}`, {
      description: "Regelverket er nå en del av kundens compliance-portefølje.",
    });
  };

  const matchesFilters = (f: Framework) => {
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    }
    return true;
  };

  const active = frameworks.filter((f) => activated.includes(f.id) && matchesFilters(f));
  const recommended = frameworks.filter(
    (f) => !activated.includes(f.id) && recommendationMap.has(f.id) && matchesFilters(f)
  );
  const other = frameworks.filter(
    (f) => !activated.includes(f.id) && !recommendationMap.has(f.id) && matchesFilters(f)
  );

  const renderFrameworkCard = (
    f: Framework,
    variant: "active" | "recommended" | "other"
  ) => {
    const cat = getCategoryById(f.category);
    const reason = recommendationMap.get(f.id);
    const isActive = variant === "active";
    const isRecommended = variant === "recommended";

    return (
      <Card
        key={f.id}
        className={`p-3 flex items-start gap-3 transition-colors ${
          isActive
            ? "bg-muted/30"
            : isRecommended
            ? "border-primary/30 bg-primary/5 hover:border-primary/50"
            : "hover:border-primary/40"
        }`}
      >
        <div
          className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
            isActive
              ? "bg-success/15"
              : isRecommended
              ? "bg-primary/15"
              : "bg-muted"
          }`}
        >
          {isActive ? (
            <CheckCircle2 className="h-4 w-4 text-success" />
          ) : isRecommended ? (
            <Lightbulb className="h-4 w-4 text-primary" />
          ) : (
            <Shield className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
            {cat && (
              <Badge variant="secondary" className="text-[10px]">
                {cat.name}
              </Badge>
            )}
            {f.isMandatory && (
              <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
                Obligatorisk
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.description}</p>
          {isRecommended && reason && (
            <p className="text-[11px] text-primary mt-1.5 flex items-start gap-1">
              <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{reason}</span>
            </p>
          )}
        </div>
        {!isActive && (
          <Button
            size="sm"
            variant={isRecommended ? "default" : "outline"}
            className="gap-1 shrink-0"
            onClick={() => handleActivate(f.id, f.name)}
          >
            <Plus className="h-3.5 w-3.5" />
            Aktiver
          </Button>
        )}
      </Card>
    );
  };

  // Counters for intro (ignore filters in the summary)
  const totalActive = activated.length;
  const totalRecommendedOpen = recommendations.filter((r) => !activated.includes(r.id)).length;

  return (
    <div className="space-y-5">
      {/* Intro with context */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Regelverk for {customerName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {customer?.industry ? (
                <>Anbefalinger er basert på bransje (<span className="font-medium">{customer.industry}</span>)
                {customer?.employees && <> og størrelse (<span className="font-medium">{customer.employees}</span> ansatte)</>}.
                </>
              ) : (
                <>Som partner kan du aktivere regelverk på vegne av kunden.</>
              )}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">{totalActive} aktivert</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{totalRecommendedOpen} anbefalt å aktivere</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i regelverk…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            variant={filterCat === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterCat("all")}
          >
            Alle
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={filterCat === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterCat(c.id)}
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Active */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aktivert hos kunden ({active.length})
        </h3>
        {active.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Kunden har ikke aktivert noen regelverk ennå.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {active.map((f) => renderFrameworkCard(f, "active"))}
          </div>
        )}
      </section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-primary">
              Anbefalt for denne kunden ({recommended.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recommended.map((f) => renderFrameworkCard(f, "recommended"))}
          </div>
        </section>
      )}

      {/* Inactive — activatable */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Øvrige tilgjengelige regelverk ({other.length})
        </h3>
        {other.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Ingen flere regelverk tilgjengelig i dette filteret.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {other.map((f) => renderFrameworkCard(f, "other"))}
          </div>
        )}
      </section>
    </div>
  );
}
