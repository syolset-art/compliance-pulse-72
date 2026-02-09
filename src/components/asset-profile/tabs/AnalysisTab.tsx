import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, Lock, Sparkles, ShieldCheck, Database, Eye, Server } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

interface AnalysisTabProps {
  assetId: string;
  assetName: string;
}

const CATEGORY_ICONS: Record<string, typeof ShieldCheck> = {
  security: ShieldCheck,
  data_handling: Database,
  privacy: Eye,
  availability: Server,
};

const CATEGORY_LABELS: Record<string, { nb: string; en: string }> = {
  security: { nb: "Sikkerhet", en: "Security" },
  data_handling: { nb: "Datahåndtering", en: "Data Handling" },
  privacy: { nb: "Personvern", en: "Privacy" },
  availability: { nb: "Tilgjengelighet", en: "Availability" },
};

export function AnalysisTab({ assetId, assetName }: AnalysisTabProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { subscription } = useSubscription();
  const [analyzing, setAnalyzing] = useState(false);

  const planName = subscription?.plan?.name || "starter";
  const canAnalyze = planName === "professional" || planName === "enterprise";

  // Fetch latest analysis
  const { data: analysis } = useQuery({
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
  });

  // Fetch documents count
  const { data: docCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count", assetId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("vendor_documents")
        .select("*", { count: "exact", head: true })
        .eq("asset_id", assetId);
      if (error) throw error;
      return count || 0;
    },
  });

  const handleAnalyze = async () => {
    if (docCount === 0) {
      toast.error(t("vendorAnalysis.noDocuments", "Last opp dokumenter først under Dokumenter-fanen"));
      return;
    }
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-vendor", {
        body: { assetId, assetName },
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["vendor-analysis", assetId] });
      toast.success(t("vendorAnalysis.success", "Analyse fullført"));
    } catch (e) {
      toast.error(t("vendorAnalysis.error", "Kunne ikke fullføre analysen"));
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-destructive";
  };

  // Upgrade prompt for Starter users
  if (!canAnalyze) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
          <h3 className="text-lg font-semibold mb-2">
            {t("vendorAnalysis.lockedTitle", "AI-drevet leverandøranalyse")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {t("vendorAnalysis.lockedDesc", "Få en automatisk compliance-vurdering av leverandøren basert på opplastede rapporter og dokumenter. Inkluderer score per kategori og konkrete anbefalinger.")}
          </p>
          <Button onClick={() => toast.info(t("vendorAnalysis.contactSales", "Kontakt oss for å oppgradere"))}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("vendorAnalysis.upgradeToPro", "Oppgrader til Professional")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trigger analysis */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              {t("vendorAnalysis.title", "AI Compliance-analyse")}
            </CardTitle>
            <Button onClick={handleAnalyze} disabled={analyzing || docCount === 0} size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              {analyzing
                ? t("vendorAnalysis.analyzing", "Analyserer...")
                : t("vendorAnalysis.runAnalysis", "Kjør analyse")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("vendorAnalysis.subtitle", "Basert på {{count}} opplastede dokumenter", { count: docCount })}
          </p>
        </CardHeader>
      </Card>

      {/* Analysis results */}
      {analysis ? (
        <>
          {/* Overall score */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className={`text-5xl font-bold ${getScoreColor(analysis.overall_score || 0)}`}>
                    {analysis.overall_score || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">/ 100</p>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">
                    {t("vendorAnalysis.overallScore", "Samlet compliance-score")}
                  </h3>
                  <Progress
                    value={analysis.overall_score || 0}
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("vendorAnalysis.lastAnalyzed", "Sist analysert")}:{" "}
                    {new Date(analysis.created_at).toLocaleDateString(i18n.language === "nb" ? "nb-NO" : "en-US")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries((analysis.category_scores as Record<string, number>) || {}).map(([key, score]) => {
              const Icon = CATEGORY_ICONS[key] || ShieldCheck;
              const label = CATEGORY_LABELS[key]?.[i18n.language === "nb" ? "nb" : "en"] || key;
              return (
                <Card key={key}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                      <span className={`ml-auto text-lg font-bold ${getScoreColor(score)}`}>
                        {score}
                      </span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Key findings */}
          {(analysis.analysis_result as any)?.findings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {t("vendorAnalysis.findings", "Nøkkelfunn")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {((analysis.analysis_result as any).findings as string[]).map((finding: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-0.5">•</span>
                      <span className="text-muted-foreground">{finding}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Brain className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">
              {t("vendorAnalysis.noAnalysis", "Ingen analyse utført ennå. Last opp dokumenter og klikk «Kjør analyse».")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
