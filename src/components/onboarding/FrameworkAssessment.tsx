import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Lock, 
  Brain, 
  Scale, 
  HardHat, 
  Globe2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Building2,
  Users,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Framework {
  id: string;
  name: string;
  description: string;
  category: 'privacy' | 'security' | 'ai' | 'other';
  isMandatory?: boolean;
  isRecommended?: boolean;
  triggerQuestion?: string;
}

interface FrameworkAssessmentProps {
  onComplete: () => void;
  companyData?: {
    industry?: string;
    employees?: string;
  };
}

const frameworks: Framework[] = [
  // Privacy
  {
    id: 'gdpr',
    name: 'GDPR / Personvernforordningen',
    description: 'EUs personvernlovgivning - gjelder alle som behandler personopplysninger',
    category: 'privacy',
    isMandatory: true
  },
  {
    id: 'personopplysningsloven',
    name: 'Personopplysningsloven',
    description: 'Norsk lov som utfyller GDPR',
    category: 'privacy',
    isMandatory: true
  },
  
  // Information Security
  {
    id: 'iso27001',
    name: 'ISO 27001',
    description: 'Internasjonal standard for informasjonssikkerhetsstyring',
    category: 'security',
    isRecommended: true,
    triggerQuestion: 'Har dere kunder som krever ISO-sertifisering?'
  },
  {
    id: 'nis2',
    name: 'NIS2-direktivet',
    description: 'EUs direktiv om sikkerhet i nettverks- og informasjonssystemer',
    category: 'security',
    triggerQuestion: 'Er virksomheten innen kritisk infrastruktur eller digital tjenesteleveranse?'
  },
  {
    id: 'nsm',
    name: 'NSMs grunnprinsipper',
    description: 'Nasjonal sikkerhetsmyndighets anbefalinger for IKT-sikkerhet',
    category: 'security',
    isRecommended: true
  },
  
  // AI Governance
  {
    id: 'ai-act',
    name: 'EU AI Act',
    description: 'EUs forordning om kunstig intelligens',
    category: 'ai',
    triggerQuestion: 'Bruker virksomheten AI-systemer eller utvikler AI-løsninger?'
  },
  {
    id: 'ai-ethics',
    name: 'Etiske retningslinjer for AI',
    description: 'Interne retningslinjer for ansvarlig bruk av AI',
    category: 'ai',
    isRecommended: true,
    triggerQuestion: 'Bruker virksomheten AI-systemer?'
  },
  
  // Other
  {
    id: 'apenhetsloven',
    name: 'Åpenhetsloven',
    description: 'Krav til aktsomhetsvurderinger og transparens i leverandørkjeder',
    category: 'other',
    triggerQuestion: 'Har virksomheten over 50 ansatte eller over 70 MNOK i omsetning?'
  },
  {
    id: 'hms',
    name: 'HMS-lovgivningen',
    description: 'Helse, miljø og sikkerhet på arbeidsplassen',
    category: 'other',
    isMandatory: true
  },
  {
    id: 'bokforingsloven',
    name: 'Bokføringsloven',
    description: 'Krav til oppbevaring og dokumentasjon av regnskapsmateriale',
    category: 'other',
    isMandatory: true
  },
  {
    id: 'hvitvasking',
    name: 'Hvitvaskingsloven',
    description: 'Tiltak mot hvitvasking og terrorfinansiering',
    category: 'other',
    triggerQuestion: 'Er virksomheten rapporteringspliktig etter hvitvaskingsloven?'
  }
];

const categories = [
  { id: 'privacy', name: 'Personvern', icon: Shield, color: 'text-blue-500' },
  { id: 'security', name: 'Informasjonssikkerhet', icon: Lock, color: 'text-green-500' },
  { id: 'ai', name: 'AI Governance', icon: Brain, color: 'text-purple-500' },
  { id: 'other', name: 'Øvrig regelverk', icon: Scale, color: 'text-orange-500' }
];

type Step = 'intro' | 'questions' | 'review';

interface QuestionAnswer {
  frameworkId: string;
  question: string;
  answer: boolean | null;
}

export const FrameworkAssessment = ({ onComplete, companyData }: FrameworkAssessmentProps) => {
  const [step, setStep] = useState<Step>('intro');
  const [selectedFrameworks, setSelectedFrameworks] = useState<Set<string>>(new Set());
  const [questionAnswers, setQuestionAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Initialize with mandatory frameworks
  useEffect(() => {
    const mandatory = frameworks
      .filter(f => f.isMandatory)
      .map(f => f.id);
    setSelectedFrameworks(new Set(mandatory));

    // Build questions from frameworks with trigger questions
    const questions = frameworks
      .filter(f => f.triggerQuestion && !f.isMandatory)
      .map(f => ({
        frameworkId: f.id,
        question: f.triggerQuestion!,
        answer: null
      }));
    setQuestionAnswers(questions);
  }, []);

  const handleStartQuestions = () => {
    setStep('questions');
  };

  const handleQuestionAnswer = (answer: boolean) => {
    const updated = [...questionAnswers];
    updated[currentQuestionIndex].answer = answer;
    setQuestionAnswers(updated);

    // If yes, add framework to selected
    if (answer) {
      const frameworkId = updated[currentQuestionIndex].frameworkId;
      setSelectedFrameworks(prev => new Set([...prev, frameworkId]));
    }

    // Move to next question or review
    if (currentQuestionIndex < questionAnswers.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep('review');
    }
  };

  const handleSkipQuestions = () => {
    // Add all recommended frameworks
    const recommended = frameworks
      .filter(f => f.isRecommended)
      .map(f => f.id);
    setSelectedFrameworks(prev => new Set([...prev, ...recommended]));
    setStep('review');
  };

  const toggleFramework = (frameworkId: string) => {
    const framework = frameworks.find(f => f.id === frameworkId);
    if (framework?.isMandatory) return; // Can't toggle mandatory

    setSelectedFrameworks(prev => {
      const next = new Set(prev);
      if (next.has(frameworkId)) {
        next.delete(frameworkId);
      } else {
        next.add(frameworkId);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Clear existing frameworks
      await supabase
        .from('selected_frameworks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      // Insert selected frameworks
      const frameworksToInsert = frameworks.map(f => ({
        framework_id: f.id,
        framework_name: f.name,
        category: f.category,
        is_mandatory: f.isMandatory || false,
        is_recommended: f.isRecommended || false,
        is_selected: selectedFrameworks.has(f.id)
      }));

      const { error } = await supabase
        .from('selected_frameworks')
        .insert(frameworksToInsert);

      if (error) throw error;

      toast({
        title: "Regelverk lagret",
        description: `${selectedFrameworks.size} regelverk er nå registrert for din virksomhet.`
      });

      onComplete();
    } catch (error) {
      console.error('Error saving frameworks:', error);
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre regelverk. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.icon || Scale;
  };

  const getCategoryColor = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.color || 'text-muted-foreground';
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
            <h3 className="font-semibold text-foreground">Hvilke regelverk gjelder?</h3>
            <p className="text-xs text-muted-foreground">La oss kartlegge relevante krav</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Jeg stiller noen spørsmål for å finne ut hvilke regelverk din virksomhet må eller bør følge innen:
        </p>

        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => {
            const Icon = cat.icon;
            return (
              <div 
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
              >
                <Icon className={`h-4 w-4 ${cat.color}`} />
                <span className="text-xs font-medium">{cat.name}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Noen regelverk er obligatoriske for alle norske virksomheter. Andre avhenger av bransje, størrelse og aktiviteter.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleStartQuestions} 
            className="flex-1"
          >
            Start kartlegging
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <button
          onClick={handleSkipQuestions}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Hopp over og velg manuelt
        </button>
      </div>
    );
  }

  // Questions step
  if (step === 'questions') {
    const currentQuestion = questionAnswers[currentQuestionIndex];
    const framework = frameworks.find(f => f.id === currentQuestion.frameworkId);
    const CategoryIcon = getCategoryIcon(framework?.category || 'other');
    const progress = ((currentQuestionIndex + 1) / questionAnswers.length) * 100;

    return (
      <div className="space-y-4">
        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Spørsmål {currentQuestionIndex + 1} av {questionAnswers.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CategoryIcon className={`h-4 w-4 ${getCategoryColor(framework?.category || 'other')}`} />
            <Badge variant="outline" className="text-xs">
              {framework?.name}
            </Badge>
          </div>

          <p className="text-sm font-medium text-foreground mb-4">
            {currentQuestion.question}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleQuestionAnswer(false)}
            >
              Nei
            </Button>
            <Button
              className="flex-1"
              onClick={() => handleQuestionAnswer(true)}
            >
              Ja
            </Button>
          </div>
        </div>

        {/* Skip remaining */}
        <button
          onClick={handleSkipQuestions}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Hopp over resten
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
          <h3 className="font-semibold text-foreground">Bekreft regelverk</h3>
          <p className="text-xs text-muted-foreground">
            {selectedFrameworks.size} regelverk valgt
          </p>
        </div>
      </div>

      <ScrollArea className="h-[280px] pr-2">
        <div className="space-y-4">
          {categories.map(category => {
            const categoryFrameworks = frameworks.filter(f => f.category === category.id);
            const CategoryIcon = category.icon;

            return (
              <div key={category.id}>
                <div className="flex items-center gap-2 mb-2">
                  <CategoryIcon className={`h-4 w-4 ${category.color}`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </div>

                <div className="space-y-1.5 ml-6">
                  {categoryFrameworks.map(framework => {
                    const isSelected = selectedFrameworks.has(framework.id);
                    const isMandatory = framework.isMandatory;

                    return (
                      <div
                        key={framework.id}
                        className={`flex items-start gap-2 p-2 rounded-lg border transition-colors ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/30' 
                            : 'bg-muted/30 border-border'
                        }`}
                      >
                        <Checkbox
                          id={framework.id}
                          checked={isSelected}
                          onCheckedChange={() => toggleFramework(framework.id)}
                          disabled={isMandatory}
                          className="mt-0.5"
                        />
                        <label 
                          htmlFor={framework.id}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                              {framework.name}
                            </span>
                            {isMandatory && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Obligatorisk
                              </Badge>
                            )}
                            {framework.isRecommended && !isMandatory && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-primary border-primary/30">
                                Anbefalt
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {framework.description}
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

      <Button 
        onClick={handleSubmit} 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Lagrer...' : 'Bekreft og fortsett'}
      </Button>
    </div>
  );
};
