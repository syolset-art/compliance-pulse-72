import { useMemo, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, Search, Shield, Sparkles } from "lucide-react";
import { frameworks, categories, getCategoryById } from "@/lib/frameworkDefinitions";
import { toast } from "sonner";

interface Props {
  customerId: string;
  customerName: string;
}

const STORAGE_PREFIX = "msp.customer.activatedFrameworks.";
// Demo: pretend a few are already activated by the customer
const DEFAULT_CUSTOMER_ACTIVE = ["gdpr", "personopplysningsloven"];

function loadActivated(customerId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + customerId);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_CUSTOMER_ACTIVE;
}

function saveActivated(customerId: string, ids: string[]) {
  try {
    localStorage.setItem(STORAGE_PREFIX + customerId, JSON.stringify(ids));
  } catch {}
}

export function MSPCustomerRegulationsTab({ customerId, customerName }: Props) {
  const [activated, setActivated] = useState<string[]>(() => loadActivated(customerId));
  const [query, setQuery] = useState("");
  const [filterCat, setFilterCat] = useState<string | "all">("all");

  useEffect(() => {
    setActivated(loadActivated(customerId));
  }, [customerId]);

  const handleActivate = (id: string, name: string) => {
    if (activated.includes(id)) return;
    const next = [...activated, id];
    setActivated(next);
    saveActivated(customerId, next);
    toast.success(`${name} aktivert for ${customerName}`, {
      description: "Regelverket er nå en del av kundens compliance-portefølje.",
    });
  };

  const filtered = useMemo(() => {
    return frameworks.filter((f) => {
      if (filterCat !== "all" && f.category !== filterCat) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [query, filterCat]);

  const inactive = filtered.filter((f) => !activated.includes(f.id));
  const active = filtered.filter((f) => activated.includes(f.id));

  return (
    <div className="space-y-5">
      {/* Intro */}
      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Aktiver regelverk på vegne av {customerName}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Som partner kan du legge til regelverk kunden ikke har aktivert selv.
              Dette utvider compliance-porteføljen og synliggjør nye krav i kundens dashbord.
            </p>
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
      {active.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Aktivert hos kunden ({active.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {active.map((f) => {
              const cat = getCategoryById(f.category);
              return (
                <Card key={f.id} className="p-3 flex items-start gap-3 bg-muted/30">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-foreground truncate">{f.name}</p>
                      {cat && (
                        <Badge variant="secondary" className="text-[10px]">
                          {cat.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {f.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Inactive — activatable */}
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Tilgjengelig å aktivere ({inactive.length})
        </h3>
        {inactive.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Ingen flere regelverk tilgjengelig i dette filteret.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {inactive.map((f) => {
              const cat = getCategoryById(f.category);
              return (
                <Card key={f.id} className="p-3 flex items-start gap-3 hover:border-primary/40 transition-colors">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Shield className="h-4 w-4 text-muted-foreground" />
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
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {f.description}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 shrink-0"
                    onClick={() => handleActivate(f.id, f.name)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Aktiver
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
