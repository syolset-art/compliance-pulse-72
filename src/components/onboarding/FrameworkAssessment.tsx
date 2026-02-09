import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Lock, 
  Brain, 
  Scale, 
  ChevronRight,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Framework {
  id: string;
  nameKey: string;
  category: 'privacy' | 'security' | 'ai' | 'other';
  isMandatory?: boolean;
  isRecommended?: boolean;
  triggerKey?: string;
}

interface FrameworkAssessmentProps {
  onComplete: () => void;
  companyData?: {
    industry?: string;
    employees?: string;
  };
}

const frameworkDefs: Framework[] = [
  { id: 'gdpr', nameKey: 'gdpr', category: 'privacy', isMandatory: true },
  { id: 'personopplysningsloven', nameKey: 'personopplysningsloven', category: 'privacy', isMandatory: true },
  { id: 'iso27001', nameKey: 'iso27001', category: 'security', isRecommended: true, triggerKey: 'iso27001' },
  { id: 'nis2', nameKey: 'nis2', category: 'security', triggerKey: 'nis2' },
  { id: 'nsm', nameKey: 'nsm', category: 'security', isRecommended: true },
  { id: 'ai-act', nameKey: 'ai-act', category: 'ai', triggerKey: 'ai-act' },
  { id: 'ai-ethics', nameKey: 'ai-ethics', category: 'ai', isRecommended: true, triggerKey: 'ai-ethics' },
  { id: 'apenhetsloven', nameKey: 'apenhetsloven', category: 'other', triggerKey: 'apenhetsloven' },
  { id: 'hms', nameKey: 'hms', category: 'other', isMandatory: true },
  { id: 'bokforingsloven', nameKey: 'bokforingsloven', category: 'other', isMandatory: true },
  { id: 'hvitvasking', nameKey: 'hvitvasking', category: 'other', triggerKey: 'hvitvasking' }
];

const categoryDefs = [
  { id: 'privacy', icon: Shield, color: 'text-blue-500' },
  { id: 'security', icon: Lock, color: 'text-green-500' },
  { id: 'ai', icon: Brain, color: 'text-purple-500' },
  { id: 'other', icon: Scale, color: 'text-orange-500' }
] as const;

type Step = 'intro' | 'questions' | 'review';

interface QuestionAnswer {
  frameworkId: string;
  triggerKey: string;
  answer: boolean | null;
}

export const FrameworkAssessment = ({ onComplete }: FrameworkAssessmentProps) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('intro');
  const [selectedFrameworks, setSelectedFrameworks] = useState<Set<string>>(new Set());
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const mandatory = frameworkDefs.filter(f => f.isMandatory).map(f => f.id);
    setSelectedFrameworks(new Set(mandatory));

    const questions = frameworkDefs
      .filter(f => f.triggerKey && !f.isMandatory)
      .map(f => ({ frameworkId: f.id, triggerKey: f.triggerKey!, answer: null }));
    setQuestionAnswers(questions);
  }, []);

  const handleQuestionAnswer = (answer: boolean) => {
    const updated = [...questionAnswers];
    updated[currentQuestionIndex].answer = answer;
    setQuestionAnswers(updated);

    if (answer) {
      const frameworkId = updated[currentQuestionIndex].frameworkId;
      setSelectedFrameworks(prev => new Set([...prev, frameworkId]));
    }

    if (currentQuestionIndex < questionAnswers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep('review');
    }
  };

  const handleSkipQuestions = () => {
    const recommended = frameworkDefs.filter(f => f.isRecommended).map(f => f.id);
    setSelectedFrameworks(prev => new Set([...prev, ...recommended]));
    setStep('review');
  };

  const toggleFramework = (frameworkId: string) => {
    const framework = frameworkDefs.find(f => f.id === frameworkId);
    if (framework?.isMandatory) return;

    setSelectedFrameworks(prev => {
      const next = new Set(prev);
      if (next.has(frameworkId)) next.delete(frameworkId);
      else next.add(frameworkId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await supabase.from('selected_frameworks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const frameworksToInsert = frameworkDefs.map(f => ({
        framework_id: f.id,
        framework_name: t(`frameworkAssessment.frameworks.${f.nameKey}.name`),
        category: f.category,
        is_mandatory: f.isMandatory || false,
        is_recommended: f.isRecommended || false,
        is_selected: selectedFrameworks.has(f.id)
      }));

      const { error } = await supabase.from('selected_frameworks').insert(frameworksToInsert);
      if (error) throw error;

      toast({
        title: t("frameworkAssessment.savedTitle"),
        description: t("frameworkAssessment.savedDesc", { count: selectedFrameworks.size })
      });

      onComplete();
    } catch (error) {
      console.error('Error saving frameworks:', error);
      toast({
        title: t("frameworkAssessment.saveErrorTitle"),
        description: t("frameworkAssessment.saveErrorDesc"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    return categoryDefs.find(c => c.id === categoryId)?.icon || Scale;
  };

  const getCategoryColor = (categoryId: string) => {
    return categoryDefs.find(c => c.id === categoryId)?.color || 'text-muted-foreground';
  };

  // Intro step
  if (step === 'intro') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("frameworkAssessment.title")}</h3>
            <p className="text-xs text-muted-foreground">{t("frameworkAssessment.subtitle")}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {t("frameworkAssessment.introText")}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {categoryDefs.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border">
                <Icon className={`h-4 w-4 ${cat.color}`} />
                <span className="text-xs font-medium">{t(`frameworkAssessment.categories.${cat.id}`)}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              {t("frameworkAssessment.aiNote")}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => setStep('questions')} className="flex-1">
            {t("frameworkAssessment.startMapping")}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <button onClick={handleSkipQuestions} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
          {t("frameworkAssessment.skipAndChoose")}
        </button>
      </div>
    );
  }

  // Questions step
  if (step === 'questions') {
    const currentQuestion = questionAnswers[currentQuestionIndex];
    const framework = frameworkDefs.find(f => f.id === currentQuestion.frameworkId);
    const CategoryIcon = getCategoryIcon(framework?.category || 'other');
    const progress = ((currentQuestionIndex + 1) / questionAnswers.length) * 100;

    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t("frameworkAssessment.questionOf", { current: currentQuestionIndex + 1, total: questionAnswers.length })}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CategoryIcon className={`h-4 w-4 ${getCategoryColor(framework?.category || 'other')}`} />
            <Badge variant="outline" className="text-xs">
              {framework ? t(`frameworkAssessment.frameworks.${framework.nameKey}.name`) : ''}
            </Badge>
          </div>

          <p className="text-sm font-medium text-foreground mb-4">
            {framework?.triggerKey ? t(`frameworkAssessment.frameworks.${framework.triggerKey}.trigger`) : ''}
          </p>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleQuestionAnswer(false)}>
              {t("frameworkAssessment.no")}
            </Button>
            <Button className="flex-1" onClick={() => handleQuestionAnswer(true)}>
              {t("frameworkAssessment.yes")}
            </Button>
          </div>
        </div>

        <button onClick={handleSkipQuestions} className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
          {t("frameworkAssessment.skipRemaining")}
        </button>
      </div>
    );
  }

  // Review step
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-full bg-success/10">
          <CheckCircle2 className="h-5 w-5 text-success" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{t("frameworkAssessment.confirmTitle")}</h3>
          <p className="text-xs text-muted-foreground">
            {t("frameworkAssessment.frameworksSelected", { count: selectedFrameworks.size })}
          </p>
        </div>
      </div>

      <ScrollArea className="h-[280px] pr-2">
        <div className="space-y-4">
          {categoryDefs.map(category => {
            const categoryFrameworks = frameworkDefs.filter(f => f.category === category.id);
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-sm font-medium">{t(`frameworkAssessment.categories.${category.id}`)}</span>
                </div>

                <div className="space-y-1.5 ml-6">
                  {categoryFrameworks.map(framework => {
                    const isSelected = selectedFrameworks.has(framework.id);
                    const isMandatory = framework.isMandatory;

                    return (
                      <div
                        key={framework.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                          isSelected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 border-border'
                        }`}
                      >
                        <Checkbox
                          id={framework.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleFramework(framework.id)}
                          disabled={isMandatory}
                          className="mt-0.5"
                        />
                        <label htmlFor={framework.id} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                              {t(`frameworkAssessment.frameworks.${framework.nameKey}.name`)}
                            </span>
                            {isMandatory && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {t("frameworkAssessment.mandatory")}
                              </Badge>
                            )}
                            {framework.isRecommended && !isMandatory && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                                {t("frameworkAssessment.recommended")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t(`frameworkAssessment.frameworks.${framework.nameKey}.description`)}
                          </p>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("frameworkAssessment.saving") : t("frameworkAssessment.confirmAndContinue")}
      </Button>
    </div>
  );
};
