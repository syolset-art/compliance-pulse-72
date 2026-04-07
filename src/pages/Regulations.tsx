import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
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
  FileText
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
import { DomainSummarySection } from "@/components/regulations/DomainSummarySection";
import { FrameworkDocumentsDialog } from "@/components/regulations/FrameworkDocumentsDialog";

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
  priority: 'high' | 'medium' | 'low';
}

const Regulations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFramework[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['privacy', 'security', 'ai', 'other']));
  const [showAvailable, setShowAvailable] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [activatedFramework, setActivatedFramework] = useState<Framework | null>(null);
  const [showActivationDialog, setShowActivationDialog] = useState(false);
  const [docCounts, setDocCounts] = useState<Record<string, number>>({});
  const [docsDialogFramework, setDocsDialogFramework] = useState<{ id: string; name: string } | null>(null);
  
  // Refs for scrolling to category sections
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Fetch company profile and frameworks
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company profile
        const { data: profileData } = await supabase
          .from('company_profile')
          .select('*')
          .maybeSingle();
        
        setCompanyProfile(profileData);

        // Fetch frameworks
        const { data: frameworkData, error } = await supabase
          .from('selected_frameworks')
          .select('*')
          .order('framework_name');

        if (error) throw error;
        setSelectedFrameworks(frameworkData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Feil ved lasting",
          description: "Kunne ikke laste regelverk",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Fetch document counts per framework
  const fetchDocCounts = useCallback(async () => {
    const { data, error } = await supabase
      .from("framework_documents")
      .select("framework_id");
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

  // Auto-initialize mandatory frameworks if missing
  useEffect(() => {
    const initializeMandatoryFrameworks = async () => {
      if (loading || initializing) return;
      
      const mandatoryFrameworks = frameworks.filter(f => f.isMandatory);
      const missingMandatory = mandatoryFrameworks.filter(
        mf => !selectedFrameworks.some(sf => sf.framework_id === mf.id)
      );

      if (missingMandatory.length === 0) return;

      setInitializing(true);
      
      try {
        const inserts = missingMandatory.map(framework => ({
          framework_id: framework.id,
          framework_name: framework.name,
          category: framework.category,
          is_mandatory: true,
          is_recommended: false,
          is_selected: true
        }));

        const { error } = await supabase
          .from('selected_frameworks')
          .insert(inserts);

        if (error) throw error;

        // Refetch frameworks
        const { data } = await supabase
          .from('selected_frameworks')
          .select('*')
          .order('framework_name');

        setSelectedFrameworks(data || []);
        
        toast({
          title: "Obligatoriske regelverk aktivert",
          description: `${missingMandatory.length} lovpålagte regelverk er lagt til automatisk`
        });
      } catch (error) {
        console.error('Error initializing mandatory frameworks:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeMandatoryFrameworks();
  }, [loading, selectedFrameworks, initializing, toast]);

  // Calculate recommendations based on company profile
  const getRecommendations = useCallback((): RecommendedFramework[] => {
    if (!companyProfile) return [];

    const recommendations: RecommendedFramework[] = [];
    const industry = companyProfile.industry?.toLowerCase() || '';
    const useCases = companyProfile.use_cases || [];
    const employees = companyProfile.employees || '';

    // SaaS/IT company recommendations
    if (industry.includes('saas') || industry.includes('it') || industry.includes('tech') || industry.includes('software')) {
      if (!isFrameworkActive('iso27001')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'iso27001')!,
          reason: 'Essensiell for SaaS-selskaper. Kunder forventer ISO 27001-sertifisering.',
          priority: 'high'
        });
      }
      if (!isFrameworkActive('soc2')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'soc2')!,
          reason: 'Kreves ofte av internasjonale kunder, spesielt i USA.',
          priority: 'medium'
        });
      }
      if (!isFrameworkActive('nis2')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'nis2')!,
          reason: 'Relevant for digitale tjenesteleverandører i EU.',
          priority: 'medium'
        });
      }
    }

    // AI-related recommendations
    if (useCases.some(uc => uc.toLowerCase().includes('ai')) || 
        industry.includes('ai') || 
        useCases.includes('compliance')) {
      if (!isFrameworkActive('ai-act')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'ai-act')!,
          reason: 'Dere bruker AI-teknologi. EU AI Act trer snart i kraft og blir obligatorisk.',
          priority: 'high'
        });
      }
      if (!isFrameworkActive('iso42001')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'iso42001')!,
          reason: 'AI Management System. Bygger tillit og strukturerer AI-governance.',
          priority: 'high'
        });
      }
      if (!isFrameworkActive('ai-ethics')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'ai-ethics')!,
          reason: 'Viktig for ansvarlig AI-bruk og kundetillit.',
          priority: 'medium'
        });
      }
    }

    // Size-based recommendations
    const employeeCount = parseInt(employees.replace(/\D/g, '')) || 0;
    if (employeeCount >= 50 || employees.includes('50')) {
      if (!isFrameworkActive('apenhetsloven')) {
        recommendations.push({
          framework: frameworks.find(f => f.id === 'apenhetsloven')!,
          reason: 'Lovpålagt for virksomheter med >50 ansatte eller >70 MNOK omsetning.',
          priority: 'high'
        });
      }
    }

    // Security recommendations for all companies
    if (!isFrameworkActive('nsm')) {
      recommendations.push({
        framework: frameworks.find(f => f.id === 'nsm')!,
        reason: 'NSMs grunnprinsipper er anbefalt for alle norske virksomheter.',
        priority: 'low'
      });
    }

    // Filter out undefined frameworks and sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return recommendations
      .filter(r => r.framework)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      .slice(0, 5); // Max 5 recommendations
  }, [companyProfile, selectedFrameworks]);

  const toggleFramework = async (frameworkId: string, currentlySelected: boolean) => {
    const existingFramework = selectedFrameworks.find(f => f.framework_id === frameworkId);
    
    if (existingFramework?.is_mandatory) {
      toast({
        title: "Obligatorisk regelverk",
        description: "Dette regelverket er obligatorisk og kan ikke deaktiveres",
        variant: "destructive"
      });
      return;
    }

    setUpdating(frameworkId);
    
    try {
      if (existingFramework) {
        // Update existing
        const { error } = await supabase
          .from('selected_frameworks')
          .update({ is_selected: !currentlySelected })
          .eq('id', existingFramework.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const framework = frameworks.find(f => f.id === frameworkId);
        if (!framework) return;

        const { error } = await supabase
          .from('selected_frameworks')
          .insert({
            framework_id: framework.id,
            framework_name: framework.name,
            category: framework.category,
            is_mandatory: framework.isMandatory || false,
            is_recommended: framework.isRecommended || false,
            is_selected: true
          });
        
        if (error) throw error;
      }

      // Refetch frameworks
      const { data } = await supabase
        .from('selected_frameworks')
        .select('*')
        .order('framework_name');
      
      setSelectedFrameworks(data || []);
      
      // Show activation dialog when activating (not deactivating)
      if (!currentlySelected) {
        const framework = frameworks.find(f => f.id === frameworkId);
        if (framework) {
          setActivatedFramework(framework);
          setShowActivationDialog(true);
        }
      } else {
        toast({
          title: "Regelverk deaktivert",
          description: "Regelverket er fjernet fra listen din"
        });
      }
    } catch (error) {
      console.error('Error toggling framework:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere regelverk",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const getFrameworkStatus = (frameworkId: string) => {
    return selectedFrameworks.find(f => f.framework_id === frameworkId);
  };

  const isFrameworkActive = (frameworkId: string) => {
    const status = getFrameworkStatus(frameworkId);
    return status?.is_selected || status?.is_mandatory || false;
  };

  const getActiveCount = (categoryId: string) => {
    return frameworks
      .filter(f => f.category === categoryId)
      .filter(f => isFrameworkActive(f.id))
      .length;
  };

  const getTotalActiveCount = () => {
    return frameworks.filter(f => isFrameworkActive(f.id)).length;
  };

  const getMandatoryCount = () => {
    return selectedFrameworks.filter(f => f.is_mandatory && f.is_selected).length;
  };

  const getVoluntaryActiveCount = () => {
    return selectedFrameworks.filter(f => !f.is_mandatory && f.is_selected).length;
  };

  const getAvailableFrameworks = () => {
    return frameworks.filter(f => !isFrameworkActive(f.id));
  };

  const scrollToCategory = (categoryId: string) => {
    // Expand the category first
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.add(categoryId);
      return next;
    });
    
    // Scroll to the category section
    setTimeout(() => {
      categoryRefs.current[categoryId]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }, 100);
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
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-foreground">Regelverk og krav</h1>
              <p className="text-muted-foreground">
                Administrer hvilke regelverk {companyProfile?.name || 'din virksomhet'} følger
              </p>
            </div>
          </div>

          {/* Domain Summary Widgets */}
          <DomainSummarySection 
            onDomainClick={scrollToCategory} 
            onOpenChat={(context) => {
              // TODO: Integrate with chat when GlobalChatProvider is available
              console.log('Open chat with context:', context);
            }}
          />

          {/* Add more button */}
          <div className="flex justify-center sm:justify-end mb-6">
            <Button 
              variant="outline" 
              onClick={() => setShowAvailable(!showAvailable)}
              className="gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              {showAvailable ? 'Skjul tilgjengelige' : 'Legg til flere regelverk'}
            </Button>
          </div>

          {/* Recommendations Section */}
          {recommendations.length > 0 && (
            <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  Anbefalt for {companyProfile?.name || 'din virksomhet'}
                </CardTitle>
                <CardDescription>
                  Basert på din virksomhetsprofil anbefaler vi følgende regelverk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {recommendations.map(({ framework, reason, priority }) => {
                    const category = getCategoryById(framework.category);
                    const CategoryIcon = category?.icon || Scale;
                    
                    return (
                      <div 
                        key={framework.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-background hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${category?.bgColor || 'bg-muted'}`}>
                            <CategoryIcon className={`h-4 w-4 ${category?.color || 'text-muted-foreground'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{framework.name}</span>
                              <Badge 
                                variant={priority === 'high' ? 'default' : 'outline'} 
                                className={`text-[10px] px-1.5 py-0 ${
                                  priority === 'high' 
                                    ? 'bg-primary text-primary-foreground' 
                                    : priority === 'medium'
                                    ? 'text-orange-600 border-orange-300'
                                    : 'text-muted-foreground'
                                }`}
                              >
                                {priority === 'high' ? 'Høy prioritet' : priority === 'medium' ? 'Anbefalt' : 'Valgfritt'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{reason}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => toggleFramework(framework.id, false)}
                          disabled={updating === framework.id}
                          className="w-full sm:w-auto shrink-0"
                        >
                          {updating === framework.id ? 'Aktiverer...' : 'Aktiver'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available frameworks to add */}
          {showAvailable && getAvailableFrameworks().length > 0 && (
            <Card className="mb-6 border-dashed border-2 border-muted-foreground/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-muted-foreground" />
                  Alle tilgjengelige regelverk
                </CardTitle>
                <CardDescription>
                  Aktiver flere regelverk basert på din virksomhets behov
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {getAvailableFrameworks().map(framework => {
                    const category = getCategoryById(framework.category);
                    const CategoryIcon = category?.icon || Scale;
                    const isRecommended = recommendations.some(r => r.framework.id === framework.id);
                    
                    return (
                      <div 
                        key={framework.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`p-2 rounded-lg shrink-0 ${category?.bgColor || 'bg-muted'}`}>
                            <CategoryIcon className={`h-4 w-4 ${category?.color || 'text-muted-foreground'}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-sm">{framework.name}</span>
                              {isRecommended && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                                  Anbefalt
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{framework.description}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toggleFramework(framework.id, false)}
                          disabled={updating === framework.id}
                          className="w-full sm:w-auto shrink-0"
                        >
                          {updating === framework.id ? 'Aktiverer...' : 'Aktiver'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active frameworks by category */}
          <div className="space-y-4">
            {categories.map(category => {
              const categoryFrameworks = frameworks.filter(f => f.category === category.id);
              const activeInCategory = categoryFrameworks.filter(f => isFrameworkActive(f.id));
              const isExpanded = expandedCategories.has(category.id);
              const CategoryIcon = category.icon;
              const isComingSoon = false;

              if (activeInCategory.length === 0 && !showAvailable && !isComingSoon) return null;

              return (
                <Card 
                  key={category.id} 
                  ref={(el) => { categoryRefs.current[category.id] = el; }}
                  className={isComingSoon ? 'opacity-75' : ''}
                >
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${category.bgColor}`}>
                        <CategoryIcon className={`h-5 w-5 ${category.color}`} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-foreground">{category.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {isComingSoon
                            ? `${categoryFrameworks.length} regelverk`
                            : `${getActiveCount(category.id)} av ${categoryFrameworks.length} aktivert`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isComingSoon ? (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          Kommer snart
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {getActiveCount(category.id)}
                        </Badge>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <CardContent className="pt-0 pb-4">
                      <Separator className="mb-4" />

                      {isComingSoon && (
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-dashed border-muted-foreground/30 mb-4">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                          <p className="text-sm text-muted-foreground">
                            Disse regelverkene er under utvikling og vil bli tilgjengelige i en kommende oppdatering. Du kan allerede se hvilke som planlegges.
                          </p>
                        </div>
                      )}

                      <div className="space-y-3">
                        {categoryFrameworks
                          .filter(f => isComingSoon || isFrameworkActive(f.id) || showAvailable)
                          .map(framework => {
                            const status = getFrameworkStatus(framework.id);
                            const isActive = isFrameworkActive(framework.id);
                            const isMandatory = status?.is_mandatory || framework.isMandatory;

                            if (isComingSoon) {
                              return (
                                <div
                                  key={framework.id}
                                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20 border-border"
                                >
                                  <div className="flex items-start gap-3 flex-1 min-w-0">
                                    <div className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 bg-muted">
                                      <Clock className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-sm text-muted-foreground">{framework.name}</span>
                                        {isMandatory && (
                                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                            <Lock className="h-2.5 w-2.5" />
                                            Obligatorisk
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
                                        {framework.description}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] text-muted-foreground shrink-0">
                                    Kommer snart
                                  </Badge>
                                </div>
                              );
                            }

                            return (
                              <div 
                                key={framework.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                                  isActive 
                                    ? 'bg-primary/5 border-primary/20' 
                                    : 'bg-muted/30 border-border'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                                    isActive ? 'bg-primary/20' : 'bg-muted'
                                  }`}>
                                    {isActive ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`font-medium text-sm ${isActive ? '' : 'text-muted-foreground'}`}>
                                        {framework.name}
                                      </span>
                                      {isMandatory && (
                                        <Tooltip>
                                          <TooltipTrigger>
                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                                              <Lock className="h-2.5 w-2.5" />
                                              Obligatorisk
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="text-xs">Dette regelverket er lovpålagt for alle norske virksomheter</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      )}
                                      {framework.isRecommended && !isActive && (
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                                          Anbefalt
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-none">
                                      {framework.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                  {isActive && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDocsDialogFramework({ id: framework.id, name: framework.name });
                                      }}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                      {docCounts[framework.id] ? (
                                        <Badge variant="action" className="text-[10px] px-1.5 py-0 h-4">
                                          {docCounts[framework.id]}
                                        </Badge>
                                      ) : (
                                        <span>Dokumenter</span>
                                      )}
                                    </Button>
                                  )}
                                  <Switch
                                    checked={isActive}
                                    onCheckedChange={() => toggleFramework(framework.id, isActive)}
                                    disabled={isMandatory || updating === framework.id}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Info section */}
          <Card className="mt-6 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Om regelverk og standarder</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Obligatoriske regelverk er lovpålagte og kan ikke deaktiveres. Frivillige standarder som ISO 27001 kan aktiveres 
                    basert på bedriftens behov, kunders krav eller strategiske mål. Når du aktiverer et regelverk, vil relevante 
                    oppgaver og krav automatisk vises i oppgavelisten.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Framework Activation Dialog */}
          <FrameworkActivationDialog
            open={showActivationDialog}
            onOpenChange={setShowActivationDialog}
            framework={activatedFramework}
            onNavigate={(path) => navigate(path)}
            onOpenChat={(message) => {
              navigate('/', { state: { openChat: true, chatMessage: message } });
            }}
          />

          {/* Framework Documents Dialog */}
          {docsDialogFramework && (
            <FrameworkDocumentsDialog
              open={!!docsDialogFramework}
              onOpenChange={(open) => { if (!open) setDocsDialogFramework(null); }}
              frameworkId={docsDialogFramework.id}
              frameworkName={docsDialogFramework.name}
              onCountChange={fetchDocCounts}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Regulations;
