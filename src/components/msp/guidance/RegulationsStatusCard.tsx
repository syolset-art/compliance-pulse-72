import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Scale, Sparkles, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";
import { PARTNER_SERVICES } from "@/lib/serviceCatalog";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { AiMappingDisclosure } from "@/components/msp/AiMappingDisclosure";
import { cn } from "@/lib/utils";

interface Props {
  customerId: string;
  recommended: FrameworkRecommendation[];
  confirmed: FrameworkRecommendation[];
}

const MAX_CHIPS = 3;

export function RegulationsStatusCard({ customerId, recommended, confirmed }: Props) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const DEMO_ROWS: Array<{ rec: FrameworkRecommendation; isConfirmed: boolean }> = [
    {
      isConfirmed: true,
      rec: {
        frameworkId: "gdpr",
        label: "GDPR / Personvernforordningen",
        confidence: "high",
        reason: "Virksomhet i EØS som behandler personopplysninger om kunder og ansatte.",
      },
    },
    {
      isConfirmed: true,
      rec: {
        frameworkId: "nis2",
        label: "NIS2",
        confidence: "high",
        reason: "Bransje klassifisert som viktig enhet under NIS2 (IKT-tjenester).",
      },
    },
    {
      isConfirmed: false,
      rec: {
        frameworkId: "iso27001",
        label: "ISO/IEC 27001",
        confidence: "medium",
        reason: "Anbefalt styringssystem for informasjonssikkerhet basert på kundens tjenester.",
      },
    },
    {
      isConfirmed: false,
      rec: {
        frameworkId: "dora",
        label: "DORA",
        confidence: "medium",
        reason: "Mulig relevant hvis kunden leverer IKT-tjenester til finanssektoren.",
      },
    },
  ];

  const rows = useMemo(() => {
    const map = new Map<string, { rec: FrameworkRecommendation; isConfirmed: boolean }>();
    for (const r of recommended) map.set(r.frameworkId, { rec: r, isConfirmed: false });
    for (const c of confirmed) map.set(c.frameworkId, { rec: c, isConfirmed: true });
    const real = Array.from(map.values()).sort(
      (a, b) => Number(b.isConfirmed) - Number(a.isConfirmed),
    );
    return real.length === 0 ? DEMO_ROWS : real;
  }, [recommended, confirmed]);

  const servicesFor = (frameworkId: string) => {
    const mineNames = new Set(
      PARTNER_SERVICES.filter(
        (s) =>
          s.status !== "retired" &&
          s.frameworkMappings.some((m) => m.frameworkId === frameworkId),
      ).map((s) => s.name.toLowerCase()),
    );

    const all = SERVICE_LIBRARY.filter((t) =>
      t.mappings.some((m) => m.frameworkId === frameworkId),
    ).map((t) => ({
      id: t.id,
      name: t.name,
      inCatalog: mineNames.has(t.name.toLowerCase()),
    }));

    // I katalogen først
    return all.sort((a, b) => Number(b.inCatalog) - Number(a.inCatalog));
  };

  const persist = async (
    nextConfirmed: FrameworkRecommendation[],
    nextRecommended: FrameworkRecommendation[],
  ) => {
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
      const nextConfirmed = [
        ...confirmed.filter((c) => c.frameworkId !== rec.frameworkId),
        { ...rec, confidence: "high" as const },
      ];
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
            <p className="text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
              Anbefalte tjenester for hvert regelverk — fylte chips ligger allerede i katalogen din.
              <AiMappingDisclosure variant="icon" />
            </p>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">
          Ingen regelverk foreslått ennå. Legg til bransje og land på kunden for at Lara skal foreslå relevante regelverk.
        </p>
      ) : (
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[34%]">Regelverk</TableHead>
                <TableHead className="w-[28%]">Mine tjenester</TableHead>
                <TableHead className="w-[28%]">Anbefalt fra Mynder</TableHead>
                <TableHead className="w-[10%] text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ rec, isConfirmed }) => {
                const { mine, recommended: rec_services } = servicesFor(rec.frameworkId);
                const mineShown = mine.slice(0, MAX_CHIPS);
                const mineMore = mine.length - mineShown.length;
                const recShown = rec_services.slice(0, MAX_CHIPS);
                const recMore = rec_services.length - recShown.length;

                return (
                  <TableRow key={rec.frameworkId} className="align-top">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-foreground">
                          {rec.label}
                        </span>
                        {isConfirmed ? (
                          <Badge className="h-5 gap-1 bg-primary text-primary-foreground text-[10px] font-medium">
                            <Check className="h-2.5 w-2.5" /> Bekreftet
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="h-5 gap-1 border-primary/40 text-primary text-[10px] font-medium"
                          >
                            <Sparkles className="h-2.5 w-2.5" /> AI-anbefalt
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {rec.reason}
                      </p>
                    </TableCell>

                    <TableCell className="py-3">
                      {mineShown.length === 0 ? (
                        <Link
                          to="/msp-service-catalog"
                          className="text-xs text-muted-foreground hover:text-primary underline-offset-2 hover:underline"
                        >
                          Ingen tjeneste dekker dette ennå
                        </Link>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {mineShown.map((s) => (
                            <span
                              key={s.id}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                "bg-primary/10 text-primary border-primary/30",
                              )}
                            >
                              <Check className="h-2.5 w-2.5" />
                              {s.name}
                            </span>
                          ))}
                          {mineMore > 0 && (
                            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[11px] text-primary">
                              +{mineMore}
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3">
                      {recShown.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {recShown.map((t) => (
                            <Link
                              key={t.id}
                              to={`/msp-service-catalog?tab=all&highlight=${t.id}`}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-[11px]",
                                "border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors",
                              )}
                            >
                              <Sparkles className="h-2.5 w-2.5" />
                              {t.name}
                            </Link>
                          ))}
                          {recMore > 0 && (
                            <Link
                              to="/msp-service-catalog?tab=all"
                              className="inline-flex items-center rounded-full border border-dashed border-muted-foreground/40 px-2 py-0.5 text-[11px] text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                            >
                              +{recMore} flere
                            </Link>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
