import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          <FrameworkList frameworks={frameworks} navigate={navigate} getStatusBadge={getStatusBadge} getProgressColor={getProgressColor} />
        )}
      </CardContent>
    </Card>
  );
}
