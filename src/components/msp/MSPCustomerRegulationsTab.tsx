import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Search, Shield, Sparkles, Lightbulb, Paperclip, FileText } from "lucide-react";
import { frameworks, categories, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";
import { FrameworkOrderConfirmDialog, type FrameworkOrderResult } from "./FrameworkOrderConfirmDialog";

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

interface ActivatedRecord {
  id: string;
  orderedAt: string;
  method: "upload" | "declaration" | "legacy";
  evidenceName?: string;
  evidenceSize?: number;
  declarationText?: string;
}

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

function loadActivated(customerId: string, fallbackIds: string[]): ActivatedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Upgrade legacy string[] to ActivatedRecord[]
        if (parsed.length === 0) return [];
        if (typeof parsed[0] === "string") {
          return (parsed as string[]).map((id) => ({
            id,
            orderedAt: new Date(0).toISOString(),
            method: "legacy" as const,
          }));
        }
        return parsed as ActivatedRecord[];
      }
    }
  } catch {}
  return fallbackIds.map((id) => ({
    id,
    orderedAt: new Date(0).toISOString(),
    method: "legacy" as const,
  }));
}

function saveActivated(customerId: string, records: ActivatedRecord[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(records));
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

  if (empNum >= 50) push("apenhetsloven", "Virksomheter over 50 ansatte kan være omfattet");
  if (empNum >= 200) {
    push("csrd", "Store virksomheter omfattes av bærekraftsrapportering");
    push("iso14001", "Anbefalt miljøledelse for større organisasjoner");
  }
  if (empNum >= 10) {
    push("internkontroll", "Lovpålagt systematisk HMS-arbeid");
    push("arbeidsmiljoloven", "Gjelder alle arbeidsgivere");
  }

  push("bokforingsloven", "Lovpålagt for alle registrerte virksomheter");
  push("hms", "Generell HMS-lovgivning gjelder alle arbeidsgivere");

  return recs;
}

function formatOrderedDate(iso: string) {
  try {
    const d = new Date(iso);
    if (d.getTime() === 0) return null;
    return d.toLocaleDateString("nb-NO", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return null;
  }
}

export function MSPCustomerRegulationsTab({ customerId, customerName, customer }: Props) {
  const customerActiveIds = useMemo(
    () => mapActiveFrameworkNames(customer?.active_frameworks),
    [customer?.active_frameworks]
  );
  const [activated, setActivated] = useState<ActivatedRecord[]>(() =>
    loadActivated(customerId, customerActiveIds)
  );
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | "all">("all");
  const [pendingFramework, setPendingFramework] = useState<Framework | null>(null);

  useEffect(() => {
    setActivated(loadActivated(customerId, customerActiveIds));
  }, [customerId, customerActiveIds]);

  const activatedIds = useMemo(() => new Set(activated.map((a) => a.id)), [activated]);
  const activatedById = useMemo(() => {
    const m = new Map<string, ActivatedRecord>();
    activated.forEach((a) => m.set(a.id, a));
    return m;
  }, [activated]);

  const recommendations = useMemo(() => computeRecommendations(customer), [customer]);
  const recommendationMap = useMemo(() => {
    const m = new Map<string, string>();
    recommendations.forEach((r) => m.set(r.id, r.reason));
    return m;
  }, [recommendations]);

  const handleConfirmOrder = (result: FrameworkOrderResult) => {
    if (!pendingFramework) return;
    if (activatedIds.has(pendingFramework.id)) {
      setPendingFramework(null);
      return;
    }
    const record: ActivatedRecord = {
      id: pendingFramework.id,
      orderedAt: new Date().toISOString(),
      method: result.method,
      evidenceName: result.evidenceName,
      evidenceSize: result.evidenceSize,
      declarationText: result.declarationText,
    };
    const next = [...activated, record];
    setActivated(next);
    saveActivated(customerId, next);
    toast.success(`Bestilling registrert — ${pendingFramework.name}`, {
      description: `Regelverket er nå aktivt hos ${customerName}. Faktureres iht. partneravtalen.`,
    });
    setPendingFramework(null);
  };

  const matchesFilters = (f: Framework) => {
    if (filterCat !== "all" && f.category !== filterCat) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    }
    return true;
  };

  const active = frameworks.filter((f) => activatedIds.has(f.id) && matchesFilters(f));
  const recommended = frameworks.filter(
    (f) => !activatedIds.has(f.id) && recommendationMap.has(f.id) && matchesFilters(f)
  );
  const other = frameworks.filter(
    (f) => !activatedIds.has(f.id) && !recommendationMap.has(f.id) && matchesFilters(f)
  );

  const renderFrameworkCard = (
    f: Framework,
    variant: "active" | "recommended" | "other"
  ) => {
    const cat = getCategoryById(f.category);
    const reason = recommendationMap.get(f.id);
    const isActive = variant === "active";
    const isRecommended = variant === "recommended";
    const record = isActive ? activatedById.get(f.id) : undefined;
    const orderedDate = record ? formatOrderedDate(record.orderedAt) : null;

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
          {isActive && record && record.method !== "legacy" && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {record.method === "upload" ? (
                <>
                  <Paperclip className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Bestilt{orderedDate ? ` ${orderedDate}` : ""} · Vedlegg: {record.evidenceName}
                  </span>
                </>
              ) : (
                <>
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    Bestilt{orderedDate ? ` ${orderedDate}` : ""} · Partnerbekreftelse
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        {!isActive && (
          <Button
            size="sm"
            variant={isRecommended ? "default" : "outline"}
            className="gap-1 shrink-0"
            onClick={() => setPendingFramework(f)}
          >
            <Plus className="h-3.5 w-3.5" />
            Bestill
          </Button>
        )}
      </Card>
    );
  };

  const totalActive = activated.length;
  const totalRecommendedOpen = recommendations.filter((r) => !activatedIds.has(r.id)).length;

  return (
    <div className="space-y-5">
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
                <>Som partner kan du bestille regelverk på vegne av kunden. Bestilling krever bekreftelse og faktureres iht. partneravtalen.</>
              )}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-success" />
                <span className="text-muted-foreground">{totalActive} aktivert</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="text-muted-foreground">{totalRecommendedOpen} anbefalt å bestille</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

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

      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Aktivert hos kunden ({active.length})
        </h3>
        {active.length === 0 ? (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Kunden har ikke bestilt noen regelverk ennå.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {active.map((f) => renderFrameworkCard(f, "active"))}
          </div>
        )}
      </section>

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

      <FrameworkOrderConfirmDialog
        open={!!pendingFramework}
        onOpenChange={(o) => !o && setPendingFramework(null)}
        framework={pendingFramework}
        customerName={customerName}
        onConfirm={handleConfirmOrder}
      />
    </div>
  );
}
