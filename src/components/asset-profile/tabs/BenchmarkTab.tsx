import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

interface BenchmarkTabProps {
  assetId: string;
  assetCategory?: string;
}

const CATEGORY_LABELS: Record<string, { nb: string; en: string }> = {
  security: { nb: "Sikkerhet", en: "Security" },
  data_handling: { nb: "Datahåndtering", en: "Data Handling" },
  privacy: { nb: "Personvern", en: "Privacy" },
  availability: { nb: "Tilgjengelighet", en: "Availability" },
};

export function BenchmarkTab({ assetId, assetCategory }: BenchmarkTabProps) {
  const { t, i18n } = useTranslation();
  const { subscription } = useSubscription();

  const planName = subscription?.plan?.name || "starter";
  const canBenchmark = planName === "enterprise";

  // Fetch this vendor's latest analysis
  const { data: vendorAnalysis } = useQuery({
    queryKey: ["vendor-analysis", assetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_analyses")
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: canBenchmark,
  });

  // Fetch category averages (all analyses for same-category assets)
  const { data: categoryAvg } = useQuery({
    queryKey: ["vendor-benchmark-avg", assetCategory],
    queryFn: async () => {
      // Get all asset IDs in the same category
      const { data: assets, error: assetError } = await supabase
        .from("assets")
        .select("id")
        .eq("category", assetCategory || "");
      if (assetError) throw assetError;

      const assetIds = assets?.map((a) => a.id) || [];
      if (assetIds.length === 0) return null;

      const { data: analyses, error } = await supabase
        .from("vendor_analyses")
        .select("category_scores")
        .in("asset_id", assetIds);
      if (error) throw error;

      if (!analyses || analyses.length === 0) return null;

      // Average across category scores
      const totals: Record<string, number> = {};
      const counts: Record<string, number> = {};

      analyses.forEach((a) => {
        const scores = (a.category_scores || {}) as Record<string, number>;
        Object.entries(scores).forEach(([key, val]) => {
          totals[key] = (totals[key] || 0) + val;
          counts[key] = (counts[key] || 0) + 1;
        });
      });

      const avg: Record<string, number> = {};
      Object.keys(totals).forEach((key) => {
        avg[key] = Math.round(totals[key] / counts[key]);
      });

      return { averages: avg, count: analyses.length };
    },
    enabled: canBenchmark && !!assetCategory,
  });

  // Upgrade prompt for non-Enterprise users
  if (!canBenchmark) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">
            {t("vendorBenchmark.lockedTitle", "Leverandør-benchmarking")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t("vendorBenchmark.lockedDesc", "Sammenlign leverandørens compliance-score mot gjennomsnittet i samme kategori. Se styrker og svakheter relativt til bransjen.")}
          </p>
          <Button onClick={() => toast.info(t("vendorBenchmark.contactSales", "Kontakt oss for å oppgradere"))}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("vendorBenchmark.upgradeToEnterprise", "Oppgrader til Enterprise")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const vendorScores = (vendorAnalysis?.category_scores || {}) as Record<string, number>;
  const avgScores = categoryAvg?.averages || {};

  // Build radar chart data
  const radarData = Object.keys(CATEGORY_LABELS).map((key) => ({
    subject: CATEGORY_LABELS[key][i18n.language === "nb" ? "nb" : "en"],
    vendor: vendorScores[key] || 0,
    average: avgScores[key] || 0,
  }));

  const hasData = vendorAnalysis && Object.keys(vendorScores).length > 0;

  return (
    <div className="space-y-6">
      {hasData ? (
        <>
          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("vendorBenchmark.title", "Benchmarking mot kategori")}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t("vendorBenchmark.comparedTo", "Sammenlignet med {{count}} leverandører i samme kategori", {
                  count: categoryAvg?.count || 0,
                })}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={t("vendorBenchmark.thisVendor", "Denne leverandøren")}
                    dataKey="vendor"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                  />
                  <Radar
                    name={t("vendorBenchmark.categoryAvg", "Kategori-gjennomsnitt")}
                    dataKey="average"
                    stroke="hsl(var(--muted-foreground))"
                    fill="hsl(var(--muted-foreground))"
                    fillOpacity={0.1}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Score comparison table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("vendorBenchmark.comparison", "Detaljert sammenligning")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.keys(CATEGORY_LABELS).map((key) => {
                  const vendorVal = vendorScores[key] || 0;
                  const avgVal = avgScores[key] || 0;
                  const diff = vendorVal - avgVal;
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm font-medium">
                        {CATEGORY_LABELS[key][i18n.language === "nb" ? "nb" : "en"]}
                      </span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-bold">{vendorVal}</span>
                        <span className="text-xs text-muted-foreground">vs {avgVal}</span>
                        <Badge
                          variant={diff > 0 ? "default" : diff < 0 ? "destructive" : "secondary"}
                          className="text-xs min-w-[60px] justify-center"
                        >
                          {diff > 0 ? (
                            <><TrendingUp className="h-3 w-3 mr-1" />+{diff}</>
                          ) : diff < 0 ? (
                            <><TrendingDown className="h-3 w-3 mr-1" />{diff}</>
                          ) : (
                            <><Minus className="h-3 w-3 mr-1" />0</>
                          )}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {t("vendorBenchmark.noData", "Kjør en AI-analyse først for å se benchmarking-data.")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
