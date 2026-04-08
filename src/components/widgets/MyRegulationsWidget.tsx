import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import React from "react";
import { 
  Scale, 
  ArrowRight, 
  Shield, 
  Lock, 
  Brain, 
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

interface SelectedFramework {
  id: string;
  framework_id: string;
  framework_name: string;
  category: string;
  is_mandatory: boolean;
  is_selected: boolean;
}

interface FrameworkWithProgress extends SelectedFramework {
  totalTasks: number;
  completedTasks: number;
  progress: number;
  status: 'on_track' | 'needs_attention' | 'not_started';
}

const categoryConfig: Record<string, { icon: typeof Shield; color: string; bgColor: string }> = {
  privacy: { icon: Shield, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  security: { icon: Lock, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  ai: { icon: Brain, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  other: { icon: Scale, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
};

const ITEMS_PER_PAGE = 3;

function FrameworkListSection({ 
  frameworks, 
  navigate, 
  getStatusBadge, 
  getProgressColor 
}: { 
  frameworks: FrameworkWithProgress[]; 
  navigate: (path: string) => void;
  getStatusBadge: (status: 'on_track' | 'needs_attention' | 'not_started') => React.ReactNode;
  getProgressColor: (progress: number) => string;
}) {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const visibleFrameworks = frameworks.slice(0, visibleCount);
  const hasMore = visibleCount < frameworks.length;

  return (
    <>
      <div className="space-y-3">
        {visibleFrameworks.map((framework) => {
          const config = categoryConfig[framework.category] || categoryConfig.other;
          const CategoryIcon = config.icon;

          return (
            <div
              key={framework.id}
              className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => navigate('/regulations')}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-lg ${config.bgColor} flex-shrink-0`}>
                    <CategoryIcon className={`h-3.5 w-3.5 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {framework.framework_name}
                      </span>
                      {framework.is_mandatory && (
                        <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
                {getStatusBadge(framework.status)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Fremgang</span>
                  <span>{framework.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(framework.progress)}`}
                    style={{ width: `${framework.progress}%` }}
                  />
                </div>
                {framework.totalTasks > 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    {framework.completedTasks} av {framework.totalTasks} oppgaver fullført
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
        >
          Vis flere ({frameworks.length - visibleCount} til)
        </Button>
      )}

      <div className="pt-3 mt-3 border-t">
        <Button
          variant="ghost"
          className="w-full text-primary hover:text-primary/80 hover:bg-primary/10"
          onClick={() => navigate('/regulations')}
        >
          Administrer regelverk
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </>
  );
}

export function MyRegulationsWidget() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch active frameworks
  const { data: frameworks = [], isLoading } = useQuery({
    queryKey: ['my-regulations-widget'],
    queryFn: async () => {
      const { data: frameworksData, error } = await supabase
        .from('selected_frameworks')
        .select('*')
        .eq('is_selected', true)
        .order('framework_name');

      if (error) throw error;

      // Fetch task counts per framework (mock for now - would need relevant_for mapping)
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('id, status, relevant_for');

      // Calculate progress for each framework
      const frameworksWithProgress: FrameworkWithProgress[] = (frameworksData || []).map(fw => {
        // Match tasks by framework category in relevant_for array
        const relevantTasks = (tasksData || []).filter(task => {
          const relevantFor = task.relevant_for || [];
          // Map framework to task categories
          if (fw.framework_id === 'gdpr' || fw.framework_id === 'personopplysningsloven') {
            return relevantFor.includes('GDPR') || relevantFor.includes('Personvern');
          }
          if (fw.framework_id === 'iso27001' || fw.framework_id === 'nis2' || fw.framework_id === 'nsm') {
            return relevantFor.includes('ISO 27001') || relevantFor.includes('Informasjonssikkerhet');
          }
          if (fw.framework_id === 'ai-act' || fw.framework_id === 'iso42001') {
            return relevantFor.includes('AI Act') || relevantFor.includes('AI Governance');
          }
          return false;
        });

        const totalTasks = relevantTasks.length;
        const completedTasks = relevantTasks.filter(t => t.status === 'completed').length;
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        let status: 'on_track' | 'needs_attention' | 'not_started' = 'not_started';
        if (totalTasks > 0) {
          status = progress >= 70 ? 'on_track' : 'needs_attention';
        }

        return {
          ...fw,
          totalTasks,
          completedTasks,
          progress,
          status,
        };
      });

      return frameworksWithProgress;
    },
  });

  const getStatusBadge = (status: 'on_track' | 'needs_attention' | 'not_started') => {
    switch (status) {
      case 'on_track':
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            På god vei
          </Badge>
        );
      case 'needs_attention':
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30">
            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
            Trenger oppmerksomhet
          </Badge>
        );
      case 'not_started':
        return (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
            <Clock className="h-2.5 w-2.5 mr-1" />
            Ikke startet
          </Badge>
        );
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return 'bg-green-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-muted-foreground/30';
  };

  const mandatoryCount = frameworks.filter(f => f.is_mandatory).length;
  const voluntaryCount = frameworks.filter(f => !f.is_mandatory).length;

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Mine regelverk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Laster...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Mine regelverk
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {frameworks.length} aktive
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => navigate('/regulations')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {mandatoryCount} obligatoriske · {voluntaryCount} frivillige
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {frameworks.length === 0 ? (
          <div className="py-8 text-center">
            <Scale className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Ingen regelverk aktivert ennå</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/regulations')}>
              Legg til regelverk
            </Button>
          </div>
        ) : (
          <FrameworkListSection frameworks={frameworks} navigate={navigate} getStatusBadge={getStatusBadge} getProgressColor={getProgressColor} />
        )}
      </CardContent>
    </Card>
  );
}
