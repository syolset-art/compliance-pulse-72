import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, ExternalLink, Server } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { getCriticality } from "@/lib/criticality";
import { cn } from "@/lib/utils";

interface Props {
  isNb: boolean;
  readOnly?: boolean;
}

const CRIT_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const MAX_ITEMS = 10;
const MIN_ITEMS = 3;

function rankByCriticality<T extends { criticality?: string | null; risk_level?: string | null }>(
  items: T[]
): T[] {
  return [...items]
    .map((it) => ({ it, crit: getCriticality(it) }))
    .sort((a, b) => {
      const ca = a.crit ? CRIT_ORDER[a.crit.key] ?? 9 : 9;
      const cb = b.crit ? CRIT_ORDER[b.crit.key] ?? 9 : 9;
      return ca - cb;
    })
    .slice(0, MAX_ITEMS)
    .map(({ it }) => it);
}

export function VendorSystemsRollupSection({ isNb, readOnly = false }: Props) {
  const navigate = useNavigate();

  const { data: vendors = [], isLoading: vLoading } = useQuery({
    queryKey: ["tp-critical-vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assets")
        .select("id, name, criticality, risk_level")
        .eq("asset_type", "vendor");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: systems = [], isLoading: sLoading } = useQuery({
    queryKey: ["tp-critical-systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("systems")
        .select("id, name, criticality, risk_level");
      if (error) throw error;
      return data ?? [];
    },
  });

  const topSystems = rankByCriticality(systems as any[]);
  const topVendors = rankByCriticality(vendors as any[]);

  const renderCard = (
    title: string,
    subtitle: string,
    icon: React.ReactNode,
    items: Array<{ id: string; name: string; criticality?: string | null; risk_level?: string | null }>,
    loading: boolean,
    routeFor: (id: string) => string,
    emptyText: string,
    manageRoute: string
  ) => (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex-1 min-w-0">
      <div className="px-5 py-3.5 flex items-center justify-between gap-2 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs shrink-0"
            onClick={() => navigate(manageRoute)}
          >
            {isNb ? "Administrer" : "Manage"}
          </Button>
        )}
      </div>

      <ul className="divide-y divide-border">
        {loading && (
          <li className="px-5 py-6 text-xs text-muted-foreground">
            {isNb ? "Henter…" : "Loading…"}
          </li>
        )}
        {!loading && items.length === 0 && (
          <li className="px-5 py-6 text-sm text-muted-foreground">{emptyText}</li>
        )}
        {!loading &&
          items.map((it) => {
            const crit = getCriticality(it);
            return (
              <li key={it.id}>
                <button
                  type="button"
                  onClick={() => navigate(routeFor(it.id))}
                  className="w-full px-5 py-2.5 flex items-center gap-3 hover:bg-muted/40 transition-colors text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{it.name}</p>
                  </div>
                  {crit && (
                    <span
                      className={cn(
                        "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full shrink-0",
                        crit.pillClass
                      )}
                    >
                      {isNb ? crit.labelNb : crit.labelEn}
                    </span>
                  )}
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary shrink-0" />
                </button>
              </li>
            );
          })}
      </ul>
      {!loading && items.length > 0 && items.length < MIN_ITEMS && (
        <div className="px-5 py-2 text-[11px] text-muted-foreground border-t border-border/60 bg-muted/20">
          {isNb
            ? `Tips: vis 3–10 elementer for et godt bilde (nå: ${items.length}).`
            : `Tip: show 3–10 items for a clear picture (now: ${items.length}).`}
        </div>
      )}
    </div>
  );

  return (
    <>
      <section id="tc-section-vendors" className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            {isNb ? "Kritiske avhengigheter" : "Critical dependencies"}
          </h2>
        </div>
        <div className="flex flex-col lg:flex-row gap-4">
          {renderCard(
            isNb ? "Kritiske systemer" : "Critical systems",
            isNb ? "Systemer vi er mest avhengige av" : "Systems we depend on most",
            <Server className="h-4 w-4" />,
            topSystems as any,
            sLoading,
            (id) => `/systems/${id}`,
            isNb ? "Ingen systemer kartlagt ennå." : "No systems mapped yet.",
            "/assets"
          )}
          {renderCard(
            isNb ? "Kritiske leverandører" : "Critical vendors",
            isNb ? "Tredjeparter vi er mest avhengige av" : "Third parties we depend on most",
            <Building2 className="h-4 w-4" />,
            topVendors as any,
            vLoading,
            (id) => `/vendors/${id}`,
            isNb ? "Ingen leverandører kartlagt ennå." : "No vendors mapped yet.",
            "/vendors"
          )}
        </div>
      </section>
      <div className="border-t border-border" />
    </>
  );
}
