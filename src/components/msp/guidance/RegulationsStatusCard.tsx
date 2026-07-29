import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scale, Sparkles, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";

interface Props {
  customerId: string;
  recommended: FrameworkRecommendation[];
  confirmed: FrameworkRecommendation[];
}

/**
 * Viser hvilke regelverk kunden må følge, med tydelig markering av hva som er
 * AI-anbefalt versus bekreftet av partneren. Partneren kan bekrefte eller
 * fjerne med ett klikk direkte fra Veiledning-tab.
 */
export function RegulationsStatusCard({ customerId, recommended, confirmed }: Props) {

  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const rows = useMemo(() => {
    const map = new Map<string, { rec: FrameworkRecommendation; isConfirmed: boolean }>();
    for (const r of recommended) map.set(r.frameworkId, { rec: r, isConfirmed: false });
    for (const c of confirmed) map.set(c.frameworkId, { rec: c, isConfirmed: true });
    return Array.from(map.values()).sort((a, b) => Number(b.isConfirmed) - Number(a.isConfirmed));
  }, [recommended, confirmed]);

  const persist = async (nextConfirmed: FrameworkRecommendation[], nextRecommended: FrameworkRecommendation[]) => {
    const { error } = await supabase
      .from("msp_customers" as any)
      .update({
        confirmed_frameworks: nextConfirmed as any,
        recommended_frameworks: nextRecommended as any,
      })
      .eq("id", customerId);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] });
  };

  const confirmOne = async (rec: FrameworkRecommendation) => {
    setBusyId(rec.frameworkId);
    try {
      const nextConfirmed = [...confirmed.filter((c) => c.frameworkId !== rec.frameworkId), { ...rec, confidence: "high" as const }];
      const nextRecommended = recommended.filter((r) => r.frameworkId !== rec.frameworkId);
      await persist(nextConfirmed, nextRecommended);
      toast.success(`${rec.label} bekreftet`);
    } catch (e: any) {
      toast.error("Kunne ikke bekrefte", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  const removeOne = async (rec: FrameworkRecommendation) => {
    setBusyId(rec.frameworkId);
    try {
      const nextConfirmed = confirmed.filter((c) => c.frameworkId !== rec.frameworkId);
      const nextRecommended = recommended.filter((r) => r.frameworkId !== rec.frameworkId);
      await persist(nextConfirmed, nextRecommended);
      toast.success(`${rec.label} fjernet`);
    } catch (e: any) {
      toast.error("Kunne ikke fjerne", { description: e.message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <Scale className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">Regelverk kunden må følge</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Bekreftet av deg = aktivt for kunden. AI-anbefalt = ett klikk for å aktivere.
            </p>
          </div>
        </div>

      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Ingen regelverk foreslått ennå. Legg til bransje og land på kunden for at Lara skal foreslå relevante regelverk.
        </p>
      ) : (
        <ul className="divide-y divide-border/60">
          {rows.map(({ rec, isConfirmed }) => (
            <li key={rec.frameworkId} className="py-2.5 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-medium text-foreground">{rec.label}</span>
                  {isConfirmed ? (
                    <Badge className="h-5 gap-1 bg-primary text-primary-foreground text-[10px] font-medium">
                      <Check className="h-2.5 w-2.5" /> Bekreftet
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="h-5 gap-1 border-primary/40 text-primary text-[10px] font-medium">
                      <Sparkles className="h-2.5 w-2.5" /> AI-anbefalt
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{rec.reason}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isConfirmed && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmOne(rec)}
                    disabled={busyId === rec.frameworkId}
                    className="h-7 text-xs"
                  >
                    Bekreft
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOne(rec)}
                  disabled={busyId === rec.frameworkId}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Fjern ${rec.label}`}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
