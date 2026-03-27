import { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Scale,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Info,
  Plus,
  Lightbulb,
  FileText,
  ShieldCheck,
  ToggleRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { frameworks, categories, getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FrameworkActivationDialog } from "@/components/dialogs/FrameworkActivationDialog";
import { FrameworkDocumentsDialog } from "@/components/regulations/FrameworkDocumentsDialog";
import { LaraAgent } from "@/components/LaraAgent";

interface SelectedFramework {
  id: string;
  framework_id: string;
  framework_name: string;
  category: string;
  is_mandatory: boolean;
  is_recommended: boolean;
  is_selected: boolean;
  notes: string | null;
}

interface CompanyProfile {
  id: string;
  name: string;
  industry: string | null;
  employees: string | null;
  use_cases: string[] | null;
}

interface RecommendedFramework {
  framework: Framework;
  reason: string;
  priority: "high" | "medium" | "low";
}

export default function TrustCenterRegulations() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFramework[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["privacy", "security", "ai", "other"])
  );
  const [updating, setUpdating] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [activatedFramework, setActivatedFramework] = useState<Framework | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [docsDialogFramework, setDocsDialogFramework] = useState<{ id: string; name: string } | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("company_profile")
          .select("*")
          .maybeSingle();
        setCompanyProfile(profileData);

        const { data: frameworkData, error } = await supabase
          .from("selected_frameworks")
          .select("*")
          .order("framework_name");
        if (error) throw error;
        setSelectedFrameworks(frameworkData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ title: "Feil ved lasting", description: "Kunne ikke laste regelverk", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  const fetchDocCounts = useCallback(async () => {
    const { data, error } = await supabase.from("framework_documents").select("framework_id");
    if (!error && data) {
      const counts: Record<string, number> = {};
      (data as any[]).forEach((d) => {
        counts[d.framework_id] = (counts[d.framework_id] || 0) + 1;
      });
      setDocCounts(counts);
    }
  }, []);

  useEffect(() => {
    fetchDocCounts();
  }, [fetchDocCounts]);

  // Auto-initialize mandatory frameworks
  useEffect(() => {
    const initializeMandatoryFrameworks = async () => {
      if (loading || initializing) return;
      const mandatoryFrameworks = frameworks.filter((f) => f.isMandatory);
      const missingMandatory = mandatoryFrameworks.filter(
        (mf) => !selectedFrameworks.some((sf) => sf.framework_id === mf.id)
      );
      if (missingMandatory.length === 0) return;
      setInitializing(true);
      try {
        const inserts = missingMandatory.map((framework) => ({
          framework_id: framework.id,
          framework_name: framework.name,
          category: framework.category,
          is_mandatory: true,
          is_recommended: false,
          is_selected: true,
        }));
        const { error } = await supabase.from("selected_frameworks").insert(inserts);
        if (error) throw error;
        const { data } = await supabase.from("selected_frameworks").select("*").order("framework_name");
        setSelectedFrameworks(data || []);
        toast({ title: "Obligatoriske regelverk aktivert", description: `${missingMandatory.length} lovpålagte regelverk lagt til` });
      } catch (error) {
        console.error("Error initializing mandatory frameworks:", error);
      } finally {
        setInitializing(false);
      }
    };
    initializeMandatoryFrameworks();
  }, [loading, selectedFrameworks, initializing, toast]);

  const getFrameworkStatus = (frameworkId: string) => selectedFrameworks.find((f) => f.framework_id === frameworkId);
  const isFrameworkActive = (frameworkId: string) => {
    const status = getFrameworkStatus(frameworkId);
    return status?.is_selected || status?.is_mandatory || false;
  };

  const getTotalActiveCount = () => frameworks.filter((f) => isFrameworkActive(f.id)).length;
  const getMandatoryCount = () => selectedFrameworks.filter((f) => f.is_mandatory && f.is_selected).length;
  const getVoluntaryActiveCount = () => selectedFrameworks.filter((f) => !f.is_mandatory && f.is_selected).length;

  // Recommendations
  const getRecommendations = useCallback((): RecommendedFramework[] => {
    if (!companyProfile) return [];
    const recommendations: RecommendedFramework[] = [];
    const industry = companyProfile.industry?.toLowerCase() || "";
    const useCases = companyProfile.use_cases || [];
    const employees = companyProfile.employees || "";

    if (industry.includes("saas") || industry.includes("it") || industry.includes("tech") || industry.includes("software")) {
      if (!isFrameworkActive("iso27001")) recommendations.push({ framework: frameworks.find((f) => f.id === "iso27001")!, reason: "Essensiell for SaaS-selskaper.", priority: "high" });
      if (!isFrameworkActive("soc2")) recommendations.push({ framework: frameworks.find((f) => f.id === "soc2")!, reason: "Kreves av internasjonale kunder.", priority: "medium" });
      if (!isFrameworkActive("nis2")) recommendations.push({ framework: frameworks.find((f) => f.id === "nis2")!, reason: "Relevant for digitale tjenesteleverandører i EU.", priority: "medium" });
    }
    if (useCases.some((uc) => uc.toLowerCase().includes("ai")) || industry.includes("ai")) {
      if (!isFrameworkActive("ai-act")) recommendations.push({ framework: frameworks.find((f) => f.id === "ai-act")!, reason: "EU AI Act blir obligatorisk.", priority: "high" });
      if (!isFrameworkActive("iso42001")) recommendations.push({ framework: frameworks.find((f) => f.id === "iso42001")!, reason: "Strukturerer AI-governance.", priority: "high" });
    }
    const employeeCount = parseInt(employees.replace(/\D/g, "")) || 0;
    if (employeeCount >= 50 || employees.includes("50")) {
      if (!isFrameworkActive("apenhetsloven")) recommendations.push({ framework: frameworks.find((f) => f.id === "apenhetsloven")!, reason: "Lovpålagt for >50 ansatte.", priority: "high" });
    }
    if (!isFrameworkActive("nsm")) recommendations.push({ framework: frameworks.find((f) => f.id === "nsm")!, reason: "Anbefalt for alle norske virksomheter.", priority: "low" });

    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations.filter((r) => r.framework).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).slice(0, 5);
  }, [companyProfile, selectedFrameworks]);

  const toggleFramework = async (frameworkId: string, currentlySelected: boolean) => {
    const existingFramework = selectedFrameworks.find((f) => f.framework_id === frameworkId);
    if (existingFramework?.is_mandatory) {
      toast({ title: "Obligatorisk regelverk", description: "Kan ikke deaktiveres", variant: "destructive" });
      return;
    }
    setUpdating(frameworkId);
    try {
      if (existingFramework) {
        const { error } = await supabase.from("selected_frameworks").update({ is_selected: !currentlySelected }).eq("id", existingFramework.id);
        if (error) throw error;
      } else {
        const framework = frameworks.find((f) => f.id === frameworkId);
        if (!framework) return;
        const { error } = await supabase.from("selected_frameworks").insert({
          framework_id: framework.id,
          framework_name: framework.name,
          category: framework.category,
          is_mandatory: framework.isMandatory || false,
          is_recommended: framework.isRecommended || false,
          is_selected: true,
        });
        if (error) throw error;
      }
      const { data } = await supabase.from("selected_frameworks").select("*").order("framework_name");
      setSelectedFrameworks(data || []);
      if (!currentlySelected) {
        const framework = frameworks.find((f) => f.id === frameworkId);
        if (framework) { setActivatedFramework(framework); setShowActivationDialog(true); }
      } else {
        toast({ title: "Regelverk deaktivert" });
      }
    } catch (error) {
      toast({ title: "Feil", description: "Kunne ikke oppdatere regelverk", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const scrollToCategory = (categoryId: string) => {
    setExpandedCategories((prev) => new Set(prev).add(categoryId));
    setTimeout(() => categoryRefs.current[categoryId]?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const recommendations = getRecommendations();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 md:pt-0">
        <div className="container max-w-5xl mx-auto p-4 md:p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Regelverk og omfang
            </h1>
            <p className="text-muted-foreground mt-1">
              Konfigurer hvilke regelverk som gjelder for {companyProfile?.name || "din virksomhet"} — obligatoriske og valgfrie
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getTotalActiveCount()}</p>
                    <p className="text-sm text-muted-foreground">Aktive regelverk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                    <Lock className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getMandatoryCount()}</p>
                    <p className="text-sm text-muted-foreground">Obligatoriske</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <ToggleRight className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{getVoluntaryActiveCount()}</p>
                    <p className="text-sm text-muted-foreground">Frivillige valgt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Anbefalt for {companyProfile?.name || "din virksomhet"}
                </CardTitle>
                <CardDescription>Basert på virksomhetsprofilen din</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {recommendations.map(({ framework, reason, priority }) => {
                    const category = getCategoryById(framework.category);
                    const CategoryIcon = category?.icon || Scale;
                    return (
                      <div key={framework.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border bg-background">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${category?.bgColor || "bg-muted"}`}>
                            <CategoryIcon className={`h-4 w-4 ${category?.color || "text-muted-foreground"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{framework.name}</span>
                              <Badge variant={priority === "high" ? "default" : "outline"} className="text-[10px] px-1.5 py-0">
                                {priority === "high" ? "Høy prioritet" : priority === "medium" ? "Anbefalt" : "Valgfritt"}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => toggleFramework(framework.id, false)} disabled={updating === framework.id}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Aktiver
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category sections */}
          {categories.map((category) => {
            const categoryFrameworks = frameworks.filter((f) => f.category === category.id);
            const isExpanded = expandedCategories.has(category.id);
            const activeCount = categoryFrameworks.filter((f) => isFrameworkActive(f.id)).length;
            const CategoryIcon = category.icon;

            return (
              <div key={category.id} ref={(el) => { categoryRefs.current[category.id] = el; }} className="scroll-mt-24">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <div className="text-left">
                      <h2 className="font-semibold text-foreground">{category.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        {activeCount} av {categoryFrameworks.length} aktive
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{activeCount}/{categoryFrameworks.length}</Badge>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 pl-2">
                    {categoryFrameworks.map((framework) => {
                      const status = getFrameworkStatus(framework.id);
                      const isActive = isFrameworkActive(framework.id);
                      const isMandatory = status?.is_mandatory || framework.isMandatory;
                      const docs = docCounts[framework.id] || 0;

                      return (
                        <div
                          key={framework.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            isActive ? "bg-card border-primary/20" : "bg-muted/30 border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isActive ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                                  {framework.name}
                                </span>
                                {isMandatory && (
                                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0 gap-1">
                                    <Lock className="h-2.5 w-2.5" />
                                    Obligatorisk
                                  </Badge>
                                )}
                                {framework.isRecommended && !isMandatory && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Anbefalt
                                  </Badge>
                                )}
                                {framework.comingSoon && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    Kommer
                                  </Badge>
                                )}
                                {docs > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDocsDialogFramework({ id: framework.id, name: framework.name }); }}
                                    className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                                  >
                                    <FileText className="h-2.5 w-2.5" />
                                    {docs} dok.
                                  </button>
                                )}
                              </div>
                              {framework.description && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{framework.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {isMandatory ? (
                              <Tooltip>
                                <TooltipTrigger>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Lock className="h-3.5 w-3.5" />
                                    Alltid på
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>Dette regelverket er lovpålagt og kan ikke deaktiveres</TooltipContent>
                              </Tooltip>
                            ) : framework.comingSoon ? (
                              <Badge variant="outline" className="text-xs">Ikke tilgjengelig ennå</Badge>
                            ) : (
                              <Switch
                                checked={isActive}
                                onCheckedChange={() => toggleFramework(framework.id, isActive)}
                                disabled={updating === framework.id}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <LaraAgent />

      {showActivationDialog && activatedFramework && (
        <FrameworkActivationDialog
          open={showActivationDialog}
          onOpenChange={setShowActivationDialog}
          framework={activatedFramework}
        />
      )}

      {docsDialogFramework && (
        <FrameworkDocumentsDialog
          open={!!docsDialogFramework}
          onOpenChange={() => setDocsDialogFramework(null)}
          frameworkId={docsDialogFramework.id}
          frameworkName={docsDialogFramework.name}
          onDocumentsChange={fetchDocCounts}
        />
      )}
    </div>
  );
}
