import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Scale, 
  ChevronDown, 
  ChevronRight,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  Plus
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

const Regulations = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [selectedFrameworks, setSelectedFrameworks] = useState<SelectedFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['privacy', 'security', 'ai', 'other']));
  const [showAvailable, setShowAvailable] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      const { data, error } = await supabase
        .from('selected_frameworks')
        .select('*')
        .order('framework_name');

      if (error) throw error;
      setSelectedFrameworks(data || []);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste regelverk",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

      await fetchFrameworks();
      
      toast({
        title: currentlySelected ? "Regelverk deaktivert" : "Regelverk aktivert",
        description: currentlySelected 
          ? "Regelverket er fjernet fra listen din" 
          : "Regelverket er lagt til i listen din"
      });
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
    return frameworks.filter(f => f.isMandatory).length;
  };

  const getVoluntaryActiveCount = () => {
    return frameworks.filter(f => !f.isMandatory && isFrameworkActive(f.id)).length;
  };

  const getAvailableFrameworks = () => {
    return frameworks.filter(f => !isFrameworkActive(f.id));
  };

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
              <p className="text-muted-foreground">Administrer hvilke regelverk din virksomhet følger</p>
            </div>
          </div>

          {/* Summary Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Scale className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{getTotalActiveCount()}</span>
                    <span className="text-muted-foreground">regelverk aktive</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getMandatoryCount()} obligatoriske · {getVoluntaryActiveCount()} frivillige
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAvailable(!showAvailable)}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Legg til flere
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Available frameworks to add */}
          {showAvailable && getAvailableFrameworks().length > 0 && (
            <Card className="mb-6 border-dashed border-2 border-primary/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Tilgjengelige regelverk
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
                    
                    return (
                      <div 
                        key={framework.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${category?.bgColor || 'bg-muted'}`}>
                            <CategoryIcon className={`h-4 w-4 ${category?.color || 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{framework.name}</span>
                              {framework.isRecommended && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                                  Anbefalt
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{framework.description}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => toggleFramework(framework.id, false)}
                          disabled={updating === framework.id}
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

              if (activeInCategory.length === 0 && !showAvailable) return null;

              return (
                <Card key={category.id}>
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
                          {getActiveCount(category.id)} av {categoryFrameworks.length} aktivert
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-xs">
                        {getActiveCount(category.id)}
                      </Badge>
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
                      <div className="space-y-3">
                        {categoryFrameworks
                          .filter(f => isFrameworkActive(f.id) || showAvailable)
                          .map(framework => {
                            const status = getFrameworkStatus(framework.id);
                            const isActive = isFrameworkActive(framework.id);
                            const isMandatory = framework.isMandatory;

                            return (
                              <div 
                                key={framework.id}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                  isActive 
                                    ? 'bg-primary/5 border-primary/20' 
                                    : 'bg-muted/30 border-border'
                                }`}
                              >
                                <div className="flex items-start gap-3 flex-1">
                                  <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                                    isActive ? 'bg-primary/20' : 'bg-muted'
                                  }`}>
                                    {isActive ? (
                                      <CheckCircle2 className="h-4 w-4 text-primary" />
                                    ) : (
                                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                                    )}
                                  </div>
                                  <div className="flex-1">
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
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {framework.description}
                                    </p>
                                  </div>
                                </div>
                                <Switch
                                  checked={isActive}
                                  onCheckedChange={() => toggleFramework(framework.id, isActive)}
                                  disabled={isMandatory || updating === framework.id}
                                  className="ml-4"
                                />
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
        </div>
      </main>
    </div>
  );
};

export default Regulations;
