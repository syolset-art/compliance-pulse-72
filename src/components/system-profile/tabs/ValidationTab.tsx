import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, Clock, Bot, Building2, Briefcase, ChevronDown, ChevronUp } from "lucide-react";
import { TrustControlsPanel } from "@/components/trust-controls/TrustControlsPanel";
import { FrameworkMaturityGrid } from "@/components/system-profile/FrameworkMaturityGrid";
import { VendorTrustScoreCard } from "@/components/trust-controls/VendorTrustScoreCard";
import { VendorPrivacyAssessment } from "@/components/trust-controls/VendorPrivacyAssessment";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { useState } from "react";

interface ValidationTabProps {
  systemId: string;
  systemAsAsset?: {
    id: string;
    name: string;
    vendor?: string | null;
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
    work_area_id?: string | null;
    asset_manager?: string | null;
    asset_owner?: string | null;
    description?: string | null;
    gdpr_role?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    updated_at?: string | null;
    asset_type?: string;
  };
  tasksCount?: number;
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
}

export const ValidationTab = ({ systemId, systemAsAsset, tasksCount, onTrustMetrics }: ValidationTabProps) => {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(systemId);
  const [tasksExpanded, setTasksExpanded] = useState(false);

  const { data: compliance } = useQuery({
    queryKey: ["system-compliance", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_compliance")
        .select("*")
        .eq("system_id", systemId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["system-tasks", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [systemId])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("asset_id", systemId);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: relationsCount = 0 } = useQuery({
    queryKey: ["asset-relations-count", systemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("id")
        .or(`source_asset_id.eq.${systemId},target_asset_id.eq.${systemId}`);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return (data || []).map((fw: any) => ({
        framework_id: fw.framework_id,
        framework_name: fw.framework_name,
      }));
    },
  });

  const standards = ["GDPR", "NIS2", "CRA", "AIAACT"];
  const complianceMap = compliance?.reduce((acc, item) => {
    acc[item.standard] = item;
    return acc;
  }, {} as Record<string, typeof compliance[0]>) || {};

  const totalScore = compliance?.length
    ? Math.round(compliance.reduce((sum, item) => sum + (item.score || 0), 0) / compliance.length)
    : 0;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "compliant":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "non_compliant":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-destructive";
  };

  const openTasks = tasks.filter((t: any) => t.status !== "completed");
  const responsiblePerson = systemAsAsset?.asset_manager || (isNb ? "Ikke tildelt" : "Not assigned");

  return (
    <div className="space-y-8">
      {/* ─── SECTION 1: Our Maturity Work ─── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Vårt modenhetsarbeid" : "Our Maturity Work"}
          </h2>
        </div>

        <div className="space-y-6">
          {/* Tasks card */}
          <Card>
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
              onClick={() => setTasksExpanded(!tasksExpanded)}
            >
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {isNb ? "Oppgaver" : "Tasks"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isNb
                    ? "Oppgaver som må følges opp for å løfte samsvar og dokumentasjon."
                    : "Tasks to follow up to improve compliance and documentation."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {openTasks.length > 0 && (
                  <Badge className="bg-warning/15 text-warning border-warning/30 text-[10px]">
                    {openTasks.length} {isNb ? "ÅPNE" : "OPEN"}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {isNb ? "Ansvarlig:" : "Responsible:"} {responsiblePerson}
                </span>
                {tasksExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>
            {tasksExpanded && (
              <CardContent className="pt-0 pb-4 px-4">
                {openTasks.length > 0 ? (
                  <div className="space-y-2 border-t border-border pt-3">
                    {openTasks.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-2 w-2 rounded-full shrink-0 ${
                            task.status === "in_progress" ? "bg-warning" : "bg-muted-foreground/40"
                          }`} />
                          <span className="text-sm text-foreground">{task.title}</span>
                        </div>
                        {task.priority && (
                          <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-[10px]">
                            {task.priority}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic border-t border-border pt-3">
                    {isNb ? "Ingen åpne oppgaver" : "No open tasks"}
                  </p>
                )}
              </CardContent>
            )}
          </Card>



          {/* Framework Maturity Grid */}
          {frameworks.length > 0 && (
            <FrameworkMaturityGrid frameworks={frameworks} />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Compliance per standard */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("trustProfile.complianceByStandard")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {standards.map((standard) => {
                      const item = complianceMap[standard];
                      const score = item?.score || 0;
                      return (
                        <div key={standard} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(item?.status)}
                              <span className="font-medium">{standard}</span>
                            </div>
                            <span className="text-sm text-muted-foreground">{score}%</span>
                          </div>
                          <Progress value={score} className={`h-2 ${getStatusColor(score)}`} />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Total Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("trustProfile.totalCompliance")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center">
                    <div className="relative h-32 w-32">
                      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="stroke-muted"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={totalScore >= 80 ? "stroke-green-500" : totalScore >= 50 ? "stroke-yellow-500" : "stroke-destructive"}
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${totalScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold">{totalScore}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    {t("trustProfile.aiInsights")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t("trustProfile.aiInsightsPlaceholder")}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: Vendor Baseline ─── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Leverandørens baseline" : "Vendor Baseline"}
          </h2>
        </div>

        {systemAsAsset && (
          <div className="space-y-6">
            <VendorTrustScoreCard
              trustScore={evaluation?.trustScore ?? 0}
              confidenceScore={evaluation?.confidenceScore ?? 0}
              lastUpdated={new Date().toLocaleDateString()}
            />
            <VendorPrivacyAssessment
              vendorName={systemAsAsset.vendor || systemAsAsset.name}
            />
          </div>
        )}
      </section>
    </div>
  );
};
