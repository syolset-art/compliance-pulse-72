import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown,
  Send, CheckCircle2, XCircle,
  Shield, Users, Server, Link2, AlertTriangle,
  Building2, Briefcase, ChevronDown, ChevronUp, BookOpen, Fingerprint, HelpCircle, Eye,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTrustControlEvaluation } from "@/hooks/useTrustControlEvaluation";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RequestUpdateDialog } from "../RequestUpdateDialog";
import { TrustControlsPanel } from "@/components/trust-controls/TrustControlsPanel";
import { VendorTrustScoreCard } from "@/components/trust-controls/VendorTrustScoreCard";
import { VendorPrivacyAssessment } from "@/components/trust-controls/VendorPrivacyAssessment";
import { FrameworkMaturityGrid } from "@/components/system-profile/FrameworkMaturityGrid";

interface VendorOverviewTabProps {
  asset: {
    id: string;
    name: string;
    vendor?: string | null;
    risk_level: string | null;
    compliance_score: number | null;
    next_review_date: string | null;
    criticality: string | null;
    asset_type?: string;
    work_area_id?: string | null;
    asset_manager?: string | null;
    asset_owner?: string | null;
    description?: string | null;
    gdpr_role?: string | null;
    contact_person?: string | null;
    contact_email?: string | null;
    updated_at?: string | null;
    metadata?: any;
  };
  tasksCount: number;
  onTrustMetrics?: (metrics: { trustScore: number; confidenceScore: number; lastUpdated: string }) => void;
  onNavigateToTab?: (tab: string) => void;
}


export const VendorOverviewTab = ({ asset, tasksCount, onTrustMetrics, onNavigateToTab }: VendorOverviewTabProps) => {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const evaluation = useTrustControlEvaluation(asset.id);
  const [requestOpen, setRequestOpen] = useState(false);
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [frameworksExpanded, setFrameworksExpanded] = useState(false);
  const [baselineExpanded, setBaselineExpanded] = useState(false);
  const tasksRef = useRef<HTMLDivElement>(null);

  const handleScrollToTasks = useCallback(() => {
    setTasksExpanded(true);
    setTimeout(() => {
      tasksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll-to-tasks", handleScrollToTasks);
    return () => window.removeEventListener("scroll-to-tasks", handleScrollToTasks);
  }, [handleScrollToTasks]);

  const trustScore = evaluation?.trustScore ?? 0;
  const confidenceScore = evaluation?.confidenceScore ?? 0;

  const strengths: string[] = [];
  const concerns: string[] = [];

  if (evaluation) {
    const { allControls } = evaluation;
    const implemented = allControls.filter(c => c.status === "implemented");
    const missing = allControls.filter(c => c.status === "missing");
    implemented.slice(0, 3).forEach(c => strengths.push(isNb ? c.labelNb : c.labelEn));
    missing.slice(0, 3).forEach(c => concerns.push(isNb ? c.labelNb : c.labelEn));
  }

  const { data: docsCount = 0 } = useQuery({
    queryKey: ["vendor-documents-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id")
        .eq("asset_id", asset.id);
      if (error) return 0;
      return (data || []).length;
    },
  });

  const { data: relationsCount = 0 } = useQuery({
    queryKey: ["asset-relations-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asset_relationships")
        .select("id")
        .or(`source_asset_id.eq.${asset.id},target_asset_id.eq.${asset.id}`);
      if (error) return 0;
      return (data || []).length;
    },
  });

  // Only vendor-relevant frameworks for "Modenhet per regelverk"
  const VENDOR_RELEVANT_FRAMEWORKS = ["gdpr", "iso27001", "nis2", "dora", "iso27701"];

  const { data: frameworks = [] } = useQuery({
    queryKey: ["selected-frameworks-active-vendor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("selected_frameworks")
        .select("framework_id, framework_name")
        .eq("is_selected", true);
      if (error) return [];
      return (data || [])
        .filter((fw: any) => VENDOR_RELEVANT_FRAMEWORKS.some(vf => fw.framework_id?.toLowerCase().includes(vf)))
        .map((fw: any) => ({
          framework_id: fw.framework_id,
          framework_name: fw.framework_name,
        }));
    },
  });

  const { data: expiredCount = 0 } = useQuery({
    queryKey: ["expired-docs-count", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_documents")
        .select("id, valid_to")
        .eq("asset_id", asset.id)
        .not("valid_to", "is", null);
      if (error) throw error;
      const now = new Date();
      return (data || []).filter((d: any) => new Date(d.valid_to) < now).length;
    },
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["asset-tasks", asset.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .contains("relevant_for", [asset.id])
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const openTasks = tasks.filter((t: any) => t.status !== "completed");
  const responsiblePerson = asset.asset_manager || (isNb ? "Ikke tildelt" : "Not assigned");

  return (
    <div className="space-y-8">
      {/* Expired documents warning */}
      {expiredCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm font-medium text-destructive">
              {isNb
                ? `${expiredCount} dokument${expiredCount > 1 ? "er" : ""} er utløpt`
                : `${expiredCount} document${expiredCount > 1 ? "s" : ""} expired`}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 w-full sm:w-auto"
            onClick={() => setRequestOpen(true)}
          >
            <Send className="h-3 w-3" />
            {isNb ? "Be om oppdatering" : "Request update"}
          </Button>
        </div>
      )}

      {/* ─── SECTION 1: Our Maturity Work ─── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {isNb ? "Vårt modenhetsarbeid" : "Our Maturity Work"}
          </h2>
        </div>

        <div className="space-y-4">
          {/* Tasks card */}
          <div ref={tasksRef}>
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
          </div>

          {/* Trust Controls Panel — maturity per control area */}
          <TrustControlsPanel
            asset={asset}
            docsCount={docsCount}
            relationsCount={relationsCount}
            onTrustMetrics={onTrustMetrics}
            frameworks={frameworks}
            onNavigateToTab={onNavigateToTab}
          />




          {/* Collapsible Framework Maturity */}
          {frameworks.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setFrameworksExpanded(prev => !prev)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-semibold text-foreground">
                    {isNb ? "Modenhet per regelverk" : "Maturity per regulation"}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                    {frameworks.length}
                  </Badge>
                </div>
                {frameworksExpanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {frameworksExpanded && (
                <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                  <FrameworkMaturityGrid frameworks={frameworks} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 2: Vendor Baseline (collapsible) ─── */}
      <section>
        <button
          onClick={() => setBaselineExpanded(prev => !prev)}
          className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/30 transition-all group"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-semibold text-foreground">
              {isNb ? "Leverandørens baseline" : "Vendor Baseline"}
            </span>
          </div>
          {baselineExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {baselineExpanded && (
          <div className="space-y-4 mt-3 animate-in slide-in-from-top-1 duration-150">
            <VendorTrustScoreCard
              trustScore={trustScore}
              confidenceScore={confidenceScore}
              lastUpdated={new Date().toLocaleDateString()}
              assetId={asset.id}
            />

            {/* Strengths / Concerns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-success">
                    <TrendingUp className="h-4 w-4" />
                    {isNb ? "Styrker" : "Strengths"}
                  </div>
                  {strengths.length > 0 ? strengths.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <span>{s}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen data ennå" : "No data yet"}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <TrendingDown className="h-4 w-4" />
                    {isNb ? "Bekymringer" : "Concerns"}
                  </div>
                  {concerns.length > 0 ? concerns.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                      <span>{c}</span>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground italic">{isNb ? "Ingen bekymringer" : "No concerns"}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <VendorPrivacyAssessment
              vendorName={asset.vendor || asset.name}
            />
          </div>
        )}
      </section>

      {requestOpen && (
        <RequestUpdateDialog
          assetId={asset.id}
          assetName={asset.name || ""}
          vendorName={asset.vendor || undefined}
          open={requestOpen}
          onOpenChange={setRequestOpen}
        />
      )}
    </div>
  );
};
