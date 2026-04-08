import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Bot,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Shield,
  Eye,
  Users,
  FileText,
  Server,
  AlertCircle,
   ShieldAlert,
   Check,
   Edit2,
} from "lucide-react";
import { getProcessAISuggestion, generateFeatureBasedChecks, type ProcessAISuggestion } from "@/lib/processAISuggestions";
import { useSystemAIFeatures, type AggregatedSystemAI } from "@/hooks/useSystemAIFeatures";
import { useProcessAIDraft, type AutoFilledField } from "@/hooks/useProcessAIDraft";
import { AIGeneratedBadge, AIFieldWrapper, AIBadgeLegend } from "./AIGeneratedBadge";
import { AIRiskSelector, AIRiskPyramidExplainer, RISK_LEVELS } from "./AIRiskPyramid";

interface ProcessAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  processName: string;
  processDescription?: string;
  workAreaId?: string;
  systemId?: string;
}

interface AIFeature {
  id: string;
  name: string;
  selected: boolean;
}

type ChecklistAnswer = 'yes' | 'no' | 'unsure' | null;

interface ChecklistItem {
  id: string;
  question: string;
  answer: ChecklistAnswer;
  helpText?: string;
  isCustom?: boolean;
  systems?: string[];
}

const STEPS = [
  { id: 'identify', title: 'Identifikasjon', icon: Bot },
  { id: 'features', title: 'Funksjoner', icon: Sparkles },
  { id: 'checklist', title: 'Sjekkliste', icon: FileText },
  { id: 'risk', title: 'Risiko', icon: Shield },
  { id: 'transparency', title: 'Transparens', icon: Eye },
  { id: 'dependency', title: 'KI-avhengighet', icon: AlertTriangle },
];

// ── Context summary helper ──
const StepContextSummary = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50 mb-4">
    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
);

export const ProcessAIDialog = ({
  open,
  onOpenChange,
  processId,
  processName,
  processDescription,
  workAreaId,
  systemId,
}: ProcessAIDialogProps) => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [hasAI, setHasAI] = useState<boolean | null>(null);
  const [aiPurpose, setAiPurpose] = useState("");
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [customCheckQuestion, setCustomCheckQuestion] = useState("");
  const [riskCategory, setRiskCategory] = useState<string>("");
  const [riskJustification, setRiskJustification] = useState("");
  const [isGeneratingJustification, setIsGeneratingJustification] = useState(false);
  const [isGeneratingPurpose, setIsGeneratingPurpose] = useState(false);
  const [isGeneratingFeatures, setIsGeneratingFeatures] = useState(false);
  const [transparencyStatus, setTransparencyStatus] = useState("not_required");
  const [transparencyDescription, setTransparencyDescription] = useState("");
  const [humanOversightRequired, setHumanOversightRequired] = useState(false);
  const [humanOversightLevel, setHumanOversightLevel] = useState("none");
  const [humanOversightDescription, setHumanOversightDescription] = useState("");
  const [affectedPersons, setAffectedPersons] = useState<string[]>([]);
  const [affectedPersonsOther, setAffectedPersonsOther] = useState("");
  const [automatedDecisions, setAutomatedDecisions] = useState(false);
  const [decisionImpact, setDecisionImpact] = useState("");
  const [usageFrequency, setUsageFrequency] = useState("");
  const [estimatedMonthlyDecisions, setEstimatedMonthlyDecisions] = useState<number>(0);
  const [estimatedAffectedPersons, setEstimatedAffectedPersons] = useState<number>(0);
  const [overrideRate, setOverrideRate] = useState("");
  const [aiIntegrationLevel, setAiIntegrationLevel] = useState<string>("");
  const [aiDependencyLevel, setAiDependencyLevel] = useState<string>("");
  const [failureConsequence, setFailureConsequence] = useState("");
  const [isRiskSelectorOpen, setIsRiskSelectorOpen] = useState(false);

  const [suggestions, setSuggestions] = useState<ProcessAISuggestion | null>(null);
  const { data: systemAI } = useSystemAIFeatures(systemId || null);
  const { data: aiDraft } = useProcessAIDraft(processName, processDescription, systemId);

  const isFieldAutoFilled = useMemo(() => {
    const fields = aiDraft?.autoFilledFields || [];
    return (fieldName: string, value?: any) => {
      return fields.find(f => 
        f.field === fieldName && 
        (value === undefined || f.value === value)
      );
    };
  }, [aiDraft?.autoFilledFields]);

  const getFieldSource = (fieldName: string, value?: any): string | undefined => {
    const field = isFieldAutoFilled(fieldName, value);
    return field?.source;
  };

  const { data: existingData } = useQuery({
    queryKey: ["process-ai-usage", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select("*")
        .eq("process_id", processId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch systems linked to this process (via systemId and work area)
  const { data: linkedSystems } = useQuery({
    queryKey: ["process-linked-systems", systemId, workAreaId],
    queryFn: async () => {
      let allSystems: { id: string; name: string }[] = [];
      
      if (systemId) {
        const { data } = await supabase
          .from("systems")
          .select("id, name")
          .eq("id", systemId);
        if (data) allSystems = [...allSystems, ...data];
      }
      
      if (workAreaId) {
        const { data } = await supabase
          .from("systems")
          .select("id, name")
          .eq("work_area_id", workAreaId);
        if (data) {
          const existingIds = new Set(allSystems.map(s => s.id));
          allSystems = [...allSystems, ...data.filter(s => !existingIds.has(s.id))];
        }
      }
      
      return allSystems;
    },
    enabled: open && !!(systemId || workAreaId),
  });

  useEffect(() => {
    if (existingData) {
      setHasAI(existingData.has_ai);
      setAiPurpose(existingData.ai_purpose || "");
      setRiskCategory(existingData.risk_category || "");
      setRiskJustification(existingData.risk_justification || "");
      setTransparencyStatus(existingData.transparency_status || "not_required");
      setTransparencyDescription(existingData.transparency_description || "");
      setHumanOversightRequired(existingData.human_oversight_required || false);
      setHumanOversightLevel(existingData.human_oversight_level || "none");
      setHumanOversightDescription(existingData.human_oversight_description || "");
      const loadedPersons = existingData.affected_persons || [];
      const otherEntry = loadedPersons.find((p: string) => p.startsWith('Andre: '));
      if (otherEntry) {
        setAffectedPersons(loadedPersons.map((p: string) => p.startsWith('Andre: ') ? 'Andre' : p));
        setAffectedPersonsOther(otherEntry.replace('Andre: ', ''));
      } else {
        setAffectedPersons(loadedPersons);
      }
      setAutomatedDecisions(existingData.automated_decisions || false);
      setDecisionImpact(existingData.decision_impact || "");
      const rawFeatures = existingData.ai_features;
      const features: string[] = Array.isArray(rawFeatures) 
        ? rawFeatures.filter((f): f is string => typeof f === 'string')
        : [];
      setAiFeatures(features.map((f, i) => ({ id: `feature-${i}`, name: f, selected: true })));
      const checklistData = existingData.compliance_checklist as unknown as ChecklistItem[] || [];
      setChecklist(Array.isArray(checklistData) ? checklistData : []);
      setAiIntegrationLevel((existingData as any).ai_integration_level || "");
      setAiDependencyLevel((existingData as any).ai_dependency_level || "");
      setFailureConsequence((existingData as any).failure_consequence || "");
    }
  }, [existingData]);

  useEffect(() => {
    if (open && processName) {
      const processSuggestions = getProcessAISuggestion(processName, processDescription);
      setSuggestions(processSuggestions);
      if (!existingData && aiDraft) {
        if (aiDraft.likelyHasAI || aiDraft.hasAI) setHasAI(true);
        if (aiDraft.aiPurpose) setAiPurpose(aiDraft.aiPurpose);
        if (aiDraft.suggestedFeatures && aiDraft.suggestedFeatures.length > 0) {
          setAiFeatures(aiDraft.suggestedFeatures.map((f, i) => ({
            id: `suggested-${i}`, name: f, selected: true,
          })));
        }
        if (processSuggestions.suggestedChecks.length > 0) {
          setChecklist(processSuggestions.suggestedChecks.map((q, i) => ({
            id: `check-${i}`, question: q, answer: null,
          })));
        }
        if (aiDraft.suggestedRisk) setRiskCategory(aiDraft.suggestedRisk);
        else if (processSuggestions.suggestedRiskCategory) setRiskCategory(processSuggestions.suggestedRiskCategory);
        if (systemAI?.suggestedAffectedPersons && systemAI.suggestedAffectedPersons.length > 0) {
          setAffectedPersons(systemAI.suggestedAffectedPersons);
        }
      }
    }
  }, [open, processName, processDescription, existingData, systemAI, aiDraft]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const selectedFeatures = aiFeatures.filter(f => f.selected).map(f => f.name);
      const payload = {
        process_id: processId,
        work_area_id: workAreaId || null,
        has_ai: hasAI ?? false,
        ai_purpose: aiPurpose,
        ai_features: selectedFeatures as unknown as null,
        risk_category: riskCategory || null,
        risk_justification: riskJustification,
        transparency_status: transparencyStatus,
        transparency_description: transparencyDescription,
        human_oversight_required: humanOversightRequired,
        human_oversight_level: humanOversightLevel,
        human_oversight_description: humanOversightDescription,
        affected_persons: affectedPersons.map(p => p === 'Andre' && affectedPersonsOther ? `Andre: ${affectedPersonsOther}` : p),
        automated_decisions: automatedDecisions,
        decision_impact: decisionImpact,
        compliance_checklist: checklist as unknown as null,
        compliance_status: calculateComplianceStatus(),
        last_review_date: new Date().toISOString().split('T')[0],
        usage_frequency: usageFrequency || null,
        estimated_monthly_decisions: estimatedMonthlyDecisions || 0,
        estimated_affected_persons: estimatedAffectedPersons || 0,
        override_rate: overrideRate || null,
        ai_integration_level: aiIntegrationLevel || null,
        ai_dependency_level: aiDependencyLevel || null,
        failure_consequence: failureConsequence || null,
      };
      if (existingData) {
        const { error } = await supabase.from("process_ai_usage").update(payload).eq("id", existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("process_ai_usage").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      queryClient.invalidateQueries({ queryKey: ["process-ai-usage"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(t("common.error"));
      console.error(error);
    },
  });

  const calculateComplianceStatus = () => {
    if (!hasAI) return "not_assessed";
    const answeredYes = checklist.filter(c => c.answer === 'yes').length;
    if (checklist.length === 0) return "not_assessed";
    const ratio = answeredYes / checklist.length;
    if (ratio === 1) return "compliant";
    if (ratio >= 0.5) return "partial";
    return "non_compliant";
  };

  const generateRiskJustification = async () => {
    if (!riskCategory) {
      toast.error("Velg et risikonivå først");
      return;
    }
    setIsGeneratingJustification(true);
    try {
      const selectedFeatureNames = aiFeatures.filter(f => f.selected).map(f => f.name);
      const riskLabel = RISK_LEVELS.find(r => r.id === riskCategory)?.label || riskCategory;
      
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            {
              role: "user",
              content: `Du er en compliance-rådgiver som hjelper med EU AI Act dokumentasjon. Skriv en kort og presis begrunnelse (2-4 setninger) for hvorfor AI-bruken i prosessen "${processName}" er klassifisert som "${riskLabel}" risikonivå under EU AI Act.

Kontekst:
- Prosess: ${processName}${processDescription ? ` - ${processDescription}` : ''}
- AI-funksjoner i bruk: ${selectedFeatureNames.length > 0 ? selectedFeatureNames.join(', ') : 'Ikke spesifisert'}
- Valgt risikonivå: ${riskLabel}
- Berørte personer: ${affectedPersons.length > 0 ? affectedPersons.join(', ') : 'Ikke spesifisert'}

Skriv begrunnelsen på norsk. Vær konkret og referer til relevante artikler i AI Act der det er naturlig.`
            }
          ]
        }
      });

      if (error) throw error;
      
      // Handle both streaming and non-streaming responses
      if (typeof data === 'string') {
        // Parse SSE response
        const lines = data.split('\n');
        let fullText = '';
        for (const line of lines) {
          if (line.startsWith('data: ') && line.slice(6).trim() !== '[DONE]') {
            try {
              const parsed = JSON.parse(line.slice(6));
              const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.message?.content;
              if (content) fullText += content;
            } catch { /* skip */ }
          }
        }
        setRiskJustification(fullText || data);
      } else if (data?.choices?.[0]?.message?.content) {
        setRiskJustification(data.choices[0].message.content);
      }
      
      toast.success("Lara har foreslått en begrunnelse");
    } catch (e) {
      console.error("Failed to generate justification:", e);
      toast.error("Kunne ikke generere forslag. Prøv igjen.");
    } finally {
      setIsGeneratingJustification(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setHasAI(null);
    setAiPurpose("");
    setAiFeatures([]);
    setChecklist([]);
    setRiskCategory("");
    setRiskJustification("");
    setTransparencyStatus("not_required");
    setTransparencyDescription("");
    setHumanOversightRequired(false);
    setHumanOversightLevel("none");
    setHumanOversightDescription("");
    setAffectedPersons([]);
    setAffectedPersonsOther("");
    setAutomatedDecisions(false);
    setDecisionImpact("");
    setUsageFrequency("");
    setEstimatedMonthlyDecisions(0);
    setEstimatedAffectedPersons(0);
    setOverrideRate("");
    setAiIntegrationLevel("");
    setAiDependencyLevel("");
    setFailureConsequence("");
  };

  const handleSuggestPurpose = async () => {
    setIsGeneratingPurpose(true);
    try {
      const systemNames = systemAI?.systems
        ?.filter(s => s.hasAI)
        .map(s => s.systemName) || [];
      const selectedFeatureNames = aiFeatures
        .filter(f => f.selected)
        .map(f => f.name);

      const { data, error } = await supabase.functions.invoke('suggest-ai-purpose', {
        body: {
          processName,
          existingPurpose: aiPurpose || undefined,
          systemNames: systemNames.length > 0 ? systemNames : undefined,
          aiFeatures: selectedFeatureNames.length > 0 ? selectedFeatureNames : undefined,
          language: i18n.language,
        },
      });

      if (error) throw error;
      if (data?.purpose) {
        setAiPurpose(data.purpose);
        toast.success(aiPurpose
          ? (i18n.language === 'nb' ? 'Formålet ble forbedret av Lara' : 'Purpose improved by Lara')
          : (i18n.language === 'nb' ? 'Lara foreslo en formålsbeskrivelse' : 'Lara suggested a purpose description'));
      }
    } catch (e) {
      console.error('suggest-ai-purpose error:', e);
      toast.error(i18n.language === 'nb' ? 'Kunne ikke generere forslag. Prøv igjen.' : 'Could not generate suggestion. Please try again.');
    } finally {
      setIsGeneratingPurpose(false);
    }
  };

  const handleSuggestFeatures = async () => {
    setIsGeneratingFeatures(true);
    try {
      const systemNames = linkedSystems?.map(s => s.name) || [];
      const { data, error } = await supabase.functions.invoke('suggest-ai-features', {
        body: {
          processName,
          purpose: aiPurpose || undefined,
          systemNames: systemNames.length > 0 ? systemNames : undefined,
          language: i18n.language,
        },
      });

      if (error) throw error;
      if (data?.features && Array.isArray(data.features)) {
        const existingNames = new Set(aiFeatures.map(f => f.name.toLowerCase()));
        const newFeatures = data.features
          .filter((f: string) => !existingNames.has(f.toLowerCase()))
          .map((f: string, i: number) => ({
            id: `ai-suggested-${Date.now()}-${i}`,
            name: f,
            selected: true,
          }));
        if (newFeatures.length > 0) {
          setAiFeatures(prev => [...prev, ...newFeatures]);
          toast.success(i18n.language === 'nb'
            ? `Lara foreslo ${newFeatures.length} AI-funksjoner`
            : `Lara suggested ${newFeatures.length} AI features`);
        } else {
          toast.info(i18n.language === 'nb' ? 'Ingen nye forslag – alle er allerede i listen' : 'No new suggestions – all are already in the list');
        }
      } else {
        toast.error(i18n.language === 'nb' ? 'Ingen forslag mottatt. Legg til manuelt nedenfor.' : 'No suggestions received. Add manually below.');
      }
    } catch (e) {
      console.error('suggest-ai-features error:', e);
      toast.error(i18n.language === 'nb' ? 'Kunne ikke generere forslag. Legg til manuelt nedenfor.' : 'Could not generate suggestions. Add manually below.');
    } finally {
      setIsGeneratingFeatures(false);
    }
  };

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      setAiFeatures([...aiFeatures, { id: `custom-${Date.now()}`, name: customFeature.trim(), selected: true }]);
      setCustomFeature("");
    }
  };

  const toggleFeature = (featureId: string) => {
    setAiFeatures(aiFeatures.map(f => f.id === featureId ? { ...f, selected: !f.selected } : f));
  };

  const setChecklistAnswer = (itemId: string, answer: ChecklistAnswer) => {
    setChecklist(checklist.map(c => c.id === itemId ? { ...c, answer, systems: answer === 'yes' ? c.systems : undefined } : c));
  };

  const toggleChecklistSystem = (itemId: string, systemId: string) => {
    setChecklist(checklist.map(c => {
      if (c.id !== itemId) return c;
      const current = c.systems || [];
      const updated = current.includes(systemId)
        ? current.filter(s => s !== systemId)
        : [...current, systemId];
      return { ...c, systems: updated.length > 0 ? updated : undefined };
    }));
  };

  const toggleAffectedPerson = (person: string) => {
    if (affectedPersons.includes(person)) {
      setAffectedPersons(affectedPersons.filter(p => p !== person));
    } else {
      setAffectedPersons([...affectedPersons, person]);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return hasAI !== null;
    if (currentStep === 1) return true;
    return true;
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const selectedFeaturesCount = aiFeatures.filter(f => f.selected).length;
  const answeredChecklistCount = checklist.filter(c => c.answer !== null).length;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // ── Decision-keyword detection for contextual labels ──
  const DECISION_KEYWORDS = ['screening', 'rangering', 'vurdering', 'score',
    'filtrering', 'avslag', 'beslutning', 'godkjenning', 'kredittscore'];

  const hasDecisionFeatures = useMemo(() => {
    const selectedNames = aiFeatures.filter(f => f.selected).map(f => f.name.toLowerCase());
    return selectedNames.some(name =>
      DECISION_KEYWORDS.some(kw => name.includes(kw))
    );
  }, [aiFeatures]);

  const getAffectedPersonsContext = () => {
    const featureList = aiFeatures.filter(f => f.selected).map(f => f.name).join(', ');
    if (hasDecisionFeatures) {
      return {
        label: 'Hvem påvirkes av AI-beslutningene?',
        hint: `Basert på ${featureList} — hvem kan bli direkte påvirket av disse beslutningene?`,
      };
    }
    return {
      label: 'Hvem bruker eller berøres av AI-funksjonene?',
      hint: `Du bruker ${featureList}. Velg hvem som bruker eller berøres av dette.`,
    };
  };

  const selectedRiskLevel = RISK_LEVELS.find(l => l.id === riskCategory);

  // Determine if step is "complete"
  const isStepComplete = (index: number) => {
    if (index === 0) return hasAI !== null;
    if (index === 1) return selectedFeaturesCount > 0;
    if (index === 2) return checklist.length > 0 && answeredChecklistCount > 0;
    if (index === 3) return !!riskCategory;
    if (index === 4) return true; // optional
    if (index === 5) return !!aiDependencyLevel;
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {processName}
          </DialogTitle>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            AI-bruk dokumentasjon
          </p>
        </DialogHeader>

        {/* ── Compact stepper ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            {STEPS.map((step, index) => {
              const isActive = index === currentStep;
              const isDone = index < currentStep || isStepComplete(index);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => (index <= currentStep || isStepComplete(index) || existingData) && setCurrentStep(index)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone || existingData
                      ? 'text-primary hover:bg-primary/10 cursor-pointer'
                      : 'text-muted-foreground cursor-default'
                  }`}
                >
                  {isDone && !isActive ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <step.icon className="h-3 w-3" />
                  )}
                  <span className="hidden md:inline">{step.title}</span>
                </button>
              );
            })}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Legend */}
        {currentStep > 0 && hasAI && aiDraft?.autoFilledFields && aiDraft.autoFilledFields.length > 0 && (
          <AIBadgeLegend />
        )}

        {/* Lara suggestion on step 0 — only show when there's something useful */}
        {currentStep === 0 && (
          (systemAI && systemAI.totalWithAI > 0) || suggestions?.likelyAI
        ) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="font-medium text-sm">Lara foreslår: Ja</p>

                  {/* System-based detection — show each system with AI by name */}
                  {systemAI && systemAI.systems.filter(s => s.hasAI).map((sys) => (
                    <div key={sys.systemId} className="p-3 bg-background/50 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">
                          Lara har oppdaget AI-bruk i{' '}
                          <button
                            type="button"
                            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/systems/${sys.systemId}`, '_blank');
                            }}
                          >
                            {sys.systemName}
                          </button>
                        </span>
                      </div>
                      {sys.aiFeatures.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sys.aiFeatures.slice(0, 5).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">{feature}</Badge>
                          ))}
                          {sys.aiFeatures.length > 5 && (
                            <Badge variant="outline" className="text-xs">+{sys.aiFeatures.length - 5} flere</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Process-analysis based detection (only when no system detection) */}
                  {suggestions?.likelyAI && !(systemAI && systemAI.totalWithAI > 0) && suggestions.aiActNote && (
                    <p className="text-sm text-muted-foreground">{suggestions.aiActNote}</p>
                  )}

                  {/* Use suggestion button */}
                  {hasAI !== true && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setHasAI(true);
                        // Pre-fill purpose from system data if available
                        const firstSystemWithAI = systemAI?.systems.find(s => s.hasAI);
                        if (firstSystemWithAI?.purposeDescription && !aiPurpose) {
                          setAiPurpose(firstSystemWithAI.purposeDescription);
                        }
                      }}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1" />
                      Bruk Laras forslag
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step content ── */}
        <div className="min-h-[280px]">
          {/* Step 1: AI Identification */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Label className="text-base font-medium">Bruker denne prosessen AI?</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Inkluderer maskinlæring, automatiserte beslutninger, chatbots, prediktiv analyse etc.
                  </p>
                </div>
                {isFieldAutoFilled('has_ai') && (
                  <AIGeneratedBadge variant="ai-generated" source={getFieldSource('has_ai')} />
                )}
              </div>

              <RadioGroup
                value={hasAI === null ? "" : hasAI ? "yes" : "no"}
                onValueChange={(v) => setHasAI(v === "yes")}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="ai-yes"
                  className={`relative flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    hasAI === true ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  } ${isFieldAutoFilled('has_ai', true) ? 'ring-2 ring-purple-300 dark:ring-purple-700' : ''}`}
                >
                  <RadioGroupItem value="yes" id="ai-yes" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">Ja</p>
                      {isFieldAutoFilled('has_ai', true) && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} />}
                    </div>
                    <p className="text-sm text-muted-foreground">Prosessen bruker AI</p>
                  </div>
                </Label>
                <Label
                  htmlFor="ai-no"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    hasAI === false ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="no" id="ai-no" />
                  <div>
                    <p className="font-medium">Nei</p>
                    <p className="text-sm text-muted-foreground">Ingen AI-bruk</p>
                  </div>
                </Label>
              </RadioGroup>

              {hasAI && (
                <AIFieldWrapper 
                  isAIGenerated={!!isFieldAutoFilled('ai_purpose')} 
                  source={getFieldSource('ai_purpose')}
                  label="Formål med AI i prosessen"
                >
                  <Textarea
                    value={aiPurpose}
                    onChange={(e) => setAiPurpose(e.target.value)}
                    placeholder="Beskriv hva AI brukes til i denne prosessen..."
                    rows={3}
                    className={isFieldAutoFilled('ai_purpose') ? 'border-purple-300 dark:border-purple-700' : ''}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      Lara bruker prosessnavnet og tilknyttede systemer som kontekst
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSuggestPurpose}
                      disabled={isGeneratingPurpose}
                      className="gap-1.5 text-xs shrink-0"
                    >
                      {isGeneratingPurpose ? (
                        <>
                          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Genererer...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          {aiPurpose.trim() ? 'Forbedre med Lara' : 'Foreslå med Lara'}
                        </>
                      )}
                    </Button>
                  </div>
                </AIFieldWrapper>
              )}

              {hasAI && !isFieldAutoFilled('ai_purpose') && !aiPurpose && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>Beskriv formålet med AI-bruk i denne prosessen</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: AI Features */}
          {currentStep === 1 && hasAI && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Velg AI-funksjoner som brukes</Label>
                <p className="text-sm text-muted-foreground mt-1">Marker alle AI-funksjoner som er aktive i denne prosessen</p>
              </div>

              {/* Suggest AI features button */}
              <Button
                type="button"
                variant={aiFeatures.length === 0 ? "default" : "outline"}
                onClick={handleSuggestFeatures}
                disabled={isGeneratingFeatures}
                className="w-full gap-2"
              >
                {isGeneratingFeatures ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Genererer forslag...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Foreslå AI-funksjoner
                  </>
                )}
              </Button>

              {aiFeatures.length === 0 && !isGeneratingFeatures && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <p>Ingen AI-funksjoner lagt til ennå.</p>
                  <p className="text-xs mt-1">Bruk knappen over for å få forslag, eller legg til manuelt nedenfor.</p>
                </div>
              )}

              <div className="space-y-2">
                {aiFeatures.map((feature) => {
                  const autoFilledFeature = isFieldAutoFilled('ai_features', feature.name);
                  const isAIGenerated = !!autoFilledFeature;
                  return (
                    <Label
                      key={feature.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        feature.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      } ${isAIGenerated ? 'border-l-4 border-l-purple-400 dark:border-l-purple-600' : ''}`}
                    >
                      <Checkbox checked={feature.selected} onCheckedChange={() => toggleFeature(feature.id)} />
                      <span className="flex-1">{feature.name}</span>
                      {isAIGenerated && <AIGeneratedBadge variant="from-system" source={autoFilledFeature?.source} size="sm" />}
                      {!isAIGenerated && feature.id.startsWith('custom-') && (
                        <Badge variant="outline" className="text-[10px]">Egendefinert</Badge>
                      )}
                    </Label>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  placeholder="Legg til annen AI-funksjon..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                />
                <Button type="button" variant="outline" onClick={addCustomFeature}>Legg til</Button>
              </div>
            </div>
          )}

          {/* Step 3: Checklist — Ja / Nei / Vet ikke */}
          {currentStep === 2 && hasAI && (
            <div className="space-y-4">

              <div>
                <Label className="text-base font-medium">Sjekkliste</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Basert på AI-funksjonene du har valgt — svar på om følgende er ivaretatt
                </p>
              </div>

              {checklist.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Ingen spesifikke sjekkpunkter for denne prosesstypen</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      const featureChecks = generateFeatureBasedChecks(
                        aiFeatures.filter(f => f.selected).map(f => f.name)
                      );
                      if (featureChecks.length > 0) {
                        setChecklist(featureChecks.map((c, i) => ({
                          id: `gen-${i}`, question: c.question, helpText: c.helpText, answer: null,
                        })));
                      }
                    }}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generer sjekkpunkter fra funksjoner
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {checklist.map((item) => {
                    const isAISuggested = isFieldAutoFilled('compliance_checklist', item.question);
                    return (
                      <div key={item.id} className="space-y-0">
                        <div
                          className={`p-3 border rounded-lg transition-all ${
                            item.answer === 'yes' ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20' :
                            item.answer === 'no' ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20' :
                            item.answer === 'unsure' ? 'border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20' :
                            'hover:bg-muted/50'
                          } ${isAISuggested ? 'border-l-4 border-l-purple-400 dark:border-l-purple-600' : ''}
                          ${item.answer === 'yes' && linkedSystems && linkedSystems.length > 0 ? 'rounded-b-none' : ''}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.question}</p>
                              {isAISuggested && <AIGeneratedBadge variant="suggested" size="sm" showTooltip={false} className="mt-1" />}
                            </div>
                            {item.isCustom && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => setChecklist(checklist.filter(c => c.id !== item.id))}
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2.5">
                            {[
                              { value: 'yes' as const, label: 'Ja', variant: 'emerald' },
                              { value: 'no' as const, label: 'Nei', variant: 'red' },
                              { value: 'unsure' as const, label: 'Vet ikke', variant: 'amber' },
                            ].map((opt) => (
                              <Button
                                key={opt.value}
                                type="button"
                                size="sm"
                                variant={item.answer === opt.value ? 'default' : 'outline'}
                                className={`h-7 text-xs px-3 ${
                                  item.answer === opt.value
                                    ? opt.variant === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : opt.variant === 'red' ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : ''
                                }`}
                                onClick={() => setChecklistAnswer(item.id, item.answer === opt.value ? null : opt.value)}
                              >
                                {opt.label}
                              </Button>
                            ))}
                          </div>
                          {/* Help text for "Vet ikke" */}
                          {item.answer === 'unsure' && item.helpText && (
                            <div className="mt-2 p-2 rounded bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                              <p className="text-xs text-amber-700 dark:text-amber-300">💡 {item.helpText}</p>
                            </div>
                          )}
                        </div>
                        {item.answer === 'yes' && linkedSystems && linkedSystems.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 border border-t-0 rounded-b-lg bg-muted/30 flex-wrap">
                            <Server className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-xs text-muted-foreground shrink-0">System:</span>
                            {linkedSystems.map((sys) => (
                              <Badge
                                key={sys.id}
                                variant={item.systems?.includes(sys.id) ? 'default' : 'outline'}
                                className="text-xs cursor-pointer"
                                onClick={() => toggleChecklistSystem(item.id, sys.id)}
                              >
                                {sys.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add custom checklist item */}
              <div className="pt-2 border-t">
                <Label className="text-xs text-muted-foreground mb-1.5 block">Legg til eget sjekkpunkt</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="F.eks. «Er det utført en DPIA?»"
                    value={customCheckQuestion}
                    onChange={(e) => setCustomCheckQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customCheckQuestion.trim()) {
                        e.preventDefault();
                        setChecklist([...checklist, {
                          id: `custom-${Date.now()}`,
                          question: customCheckQuestion.trim(),
                          answer: null,
                          isCustom: true,
                        }]);
                        setCustomCheckQuestion("");
                      }
                    }}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!customCheckQuestion.trim()}
                    onClick={() => {
                      setChecklist([...checklist, {
                        id: `custom-${Date.now()}`,
                        question: customCheckQuestion.trim(),
                        answer: null,
                        isCustom: true,
                      }]);
                      setCustomCheckQuestion("");
                    }}
                  >
                    Legg til
                  </Button>
                </div>
              </div>

              {/* Summary */}
              {checklist.length > 0 && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <span className="text-emerald-600">{checklist.filter(c => c.answer === 'yes').length} Ja</span>
                  <span className="text-red-600">{checklist.filter(c => c.answer === 'no').length} Nei</span>
                  <span className="text-amber-600">{checklist.filter(c => c.answer === 'unsure').length} Vet ikke</span>
                  <span>{checklist.filter(c => c.answer === null).length} ubesvart</span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Risk Classification — REDESIGNED */}
          {currentStep === 3 && hasAI && (
            <div className="space-y-5">

              {/* ── Result card: prominent risk classification ── */}
              {riskCategory && selectedRiskLevel && (
                <div className={`p-4 rounded-lg border-2 ${
                  riskCategory === 'unacceptable' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                  riskCategory === 'high' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                  riskCategory === 'limited' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                  'border-green-500 bg-green-50 dark:bg-green-950/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${selectedRiskLevel.bgColor} ${selectedRiskLevel.color}`}>
                      {riskCategory === 'unacceptable' && <ShieldAlert className="h-6 w-6" />}
                      {riskCategory === 'high' && <AlertTriangle className="h-6 w-6" />}
                      {riskCategory === 'limited' && <Eye className="h-6 w-6" />}
                      {riskCategory === 'minimal' && <CheckCircle2 className="h-6 w-6" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold">{selectedRiskLevel.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {riskCategory === 'unacceptable' && 'Forbudt under AI Act — må avvikles umiddelbart.'}
                        {riskCategory === 'high' && 'Strenge krav: samsvarsvurdering, risikovurdering og løpende overvåking.'}
                        {riskCategory === 'limited' && 'Brukere må informeres om at de samhandler med AI.'}
                        {riskCategory === 'minimal' && 'Frivillige retningslinjer — ingen obligatoriske krav.'}
                      </p>
                    </div>
                    {isFieldAutoFilled('risk_category', riskCategory) && (
                      <AIGeneratedBadge variant="suggested" size="sm" />
                    )}
                  </div>
                </div>
              )}

              {/* ── Collapsible risk selector ── */}
              <Collapsible open={isRiskSelectorOpen} onOpenChange={setIsRiskSelectorOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0 h-auto py-1 hover:text-foreground">
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        {isRiskSelectorOpen ? "Klikk for å lukke" : "Endre risikonivå"}
                      </Button>
                    </CollapsibleTrigger>
                  </TooltipTrigger>
                  {!isRiskSelectorOpen && (
                    <TooltipContent>Klikk for å redigere</TooltipContent>
                  )}
                </Tooltip>
                <CollapsibleContent className="pt-2">
                  <AIRiskSelector
                    selectedRisk={riskCategory}
                    onSelectRisk={setRiskCategory}
                    interactive={true}
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* ── Collapsible pyramid explainer ── */}
              <AIRiskPyramidExplainer />

              {/* Risk justification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Begrunnelse for klassifisering</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateRiskJustification}
                    disabled={isGeneratingJustification || !riskCategory}
                    className="gap-1.5 text-xs h-7"
                  >
                    <Sparkles className={`h-3.5 w-3.5 ${isGeneratingJustification ? 'animate-spin' : ''}`} />
                    {isGeneratingJustification ? 'Genererer...' : 'Foreslå med Lara'}
                  </Button>
                </div>
                <div className="relative">
                  <Textarea
                    value={riskJustification}
                    onChange={(e) => setRiskJustification(e.target.value)}
                    placeholder="Forklar hvorfor denne risikoklassifiseringen er valgt..."
                    rows={3}
                  />
                  {!riskJustification && !isGeneratingJustification && (
                    <div className="absolute top-2 right-2">
                      <AIGeneratedBadge variant="requires-input" size="sm" />
                    </div>
                  )}
                </div>
              </div>

              {/* Affected persons — contextual */}
              {selectedFeaturesCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4" />
                      {getAffectedPersonsContext().label}
                    </Label>
                    {affectedPersons.length === 0 && <AIGeneratedBadge variant="requires-input" size="sm" />}
                  </div>
                  <p className="text-xs text-muted-foreground -mt-1">
                    {getAffectedPersonsContext().hint}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Ansatte', 'Kunder', 'Leverandører', 'Publikum', 'Kandidater', 'Andre'].map((person) => (
                      <Badge
                        key={person}
                        variant={affectedPersons.includes(person) ? 'default' : 'outline'}
                        className="cursor-pointer transition-all"
                        onClick={() => toggleAffectedPerson(person)}
                      >
                        {person}
                      </Badge>
                    ))}
                  </div>
                  {affectedPersons.includes('Andre') && (
                    <Input
                      value={affectedPersonsOther}
                      onChange={(e) => setAffectedPersonsOther(e.target.value)}
                      placeholder="Spesifiser hvem andre som berøres..."
                      className="mt-2"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Transparency & Oversight — SIMPLIFIED */}
          {currentStep === 4 && hasAI && (
            <div className="space-y-5">

              {/* Minimal risk: no requirements */}
              {riskCategory === 'minimal' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                  <p className="font-medium">Ingen obligatoriske transparenskrav</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    For minimal risiko anbefales det likevel å informere brukere om AI-bruk som god praksis.
                  </p>
                </div>
              ) : (
                <>
                  <StepContextSummary>
                    Svar på tre enkle påstander om hvordan AI brukes i denne prosessen.
                  </StepContextSummary>

                  {/* Toggle 1: Users know about AI */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="transparency-toggle" className="text-sm font-medium cursor-pointer">
                        Brukerne vet at de interagerer med AI
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        F.eks. via informasjonsbanner, personvernerklæring eller muntlig informasjon
                      </p>
                    </div>
                    <Switch
                      id="transparency-toggle"
                      checked={transparencyStatus === 'implemented'}
                      onCheckedChange={(checked) => setTransparencyStatus(checked ? 'implemented' : 'required')}
                    />
                  </div>

                  {/* Toggle 2: Someone can override */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="oversight-toggle" className="text-sm font-medium cursor-pointer">
                        Noen kan overstyre AI-beslutninger
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        En person kan korrigere, avvise eller endre det AI-en foreslår
                      </p>
                    </div>
                    <Switch
                      id="oversight-toggle"
                      checked={humanOversightRequired}
                      onCheckedChange={setHumanOversightRequired}
                    />
                  </div>

                  {/* Toggle 3: Automated decisions */}
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-0.5 pr-4">
                      <Label htmlFor="automated-toggle" className="text-sm font-medium cursor-pointer">
                        AI tar beslutninger uten at en person ser over
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        AI-en handler automatisk uten at et menneske godkjenner først
                      </p>
                    </div>
                    <Switch
                      id="automated-toggle"
                      checked={automatedDecisions}
                      onCheckedChange={setAutomatedDecisions}
                    />
                  </div>

                  {/* Collapsible: optional description */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0 h-auto py-1 hover:text-foreground">
                        <Edit2 className="h-3.5 w-3.5 mr-1" />
                        Legg til beskrivelse (valgfritt)
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2 space-y-3">
                      <Textarea
                        value={transparencyDescription}
                        onChange={(e) => setTransparencyDescription(e.target.value)}
                        placeholder="Utdyp eventuelt hvordan transparens og tilsyn håndteres..."
                        rows={3}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </>
              )}
            </div>
          )}

          {/* Step 6: KI-avhengighet */}
          {currentStep === 5 && hasAI && (() => {
            const selectedFeatureNames = aiFeatures.filter(f => f.selected).map(f => f.name);

            // Suggest dependency based on features + risk
            const suggestDependency = (): string => {
              if (selectedFeatureNames.length >= 3 && riskCategory === 'high') return 'critically_dependent';
              if (selectedFeatureNames.length >= 2) return 'partially_dependent';
              return 'not_dependent';
            };

            const suggestedDependency = suggestDependency();

            const DEPENDENCY_OPTIONS = [
              { 
                id: 'not_dependent', 
                label: 'Ingenting spesielt', 
                desc: 'Vi klarer oss fint uten, det tar kanskje litt lenger tid',
                icon: '✅',
                integrationLevel: 'supplement',
              },
              { 
                id: 'partially_dependent', 
                label: 'Det merkes', 
                desc: 'Vi må jobbe annerledes, men får gjort jobben',
                icon: '⚠️',
                integrationLevel: 'partial',
              },
              { 
                id: 'critically_dependent', 
                label: 'Stopper opp', 
                desc: 'Prosessen stopper eller kvaliteten blir vesentlig dårligere',
                icon: '🔴',
                integrationLevel: 'core',
              },
            ];

            const handleSelectDependency = (optionId: string) => {
              setAiDependencyLevel(optionId);
              const option = DEPENDENCY_OPTIONS.find(o => o.id === optionId);
              if (option) setAiIntegrationLevel(option.integrationLevel);
            };

            return (
            <div className="space-y-5">

              <StepContextSummary>
                Hva skjer om AI-en i denne prosessen slutter å fungere?
              </StepContextSummary>

              {/* Lara suggestion */}
              {!aiDependencyLevel && suggestedDependency && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Basert på {selectedFeatureNames.length} AI-funksjoner foreslår Lara:{' '}
                    <button type="button" className="font-medium text-primary hover:underline" onClick={() => handleSelectDependency(suggestedDependency)}>
                      {DEPENDENCY_OPTIONS.find(d => d.id === suggestedDependency)?.label}
                    </button>
                  </p>
                </div>
              )}

              {/* Three simple choices */}
              <div className="space-y-2">
                {DEPENDENCY_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleSelectDependency(option.id)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                      aiDependencyLevel === option.id
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-lg mt-0.5">{option.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Collapsible: optional details */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground px-0 h-auto py-1 hover:text-foreground">
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Vil du utdype? (valgfritt)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Estimert antall berørte per gang</Label>
                    <Input
                      type="number"
                      value={estimatedAffectedPersons || ""}
                      onChange={(e) => setEstimatedAffectedPersons(parseInt(e.target.value) || 0)}
                      placeholder="f.eks. 1–5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Beskriv konsekvensen ved bortfall</Label>
                    <Textarea
                      value={failureConsequence}
                      onChange={(e) => setFailureConsequence(e.target.value)}
                      placeholder="f.eks. Manuell onboarding tar 3x lengre tid og gir inkonsistent kvalitet"
                      rows={2}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

            </div>
            );
          })()}

          {/* No AI selected */}
          {currentStep > 0 && !hasAI && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">Ingen AI-bruk registrert</p>
              <p className="text-sm text-muted-foreground mt-2">
                Denne prosessen bruker ikke AI og krever ingen AI Act-dokumentasjon
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={currentStep === 0 ? () => onOpenChange(false) : prevStep}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStep === 0 ? 'Avbryt' : 'Tilbake'}
          </Button>

          {currentStep < STEPS.length - 1 && hasAI ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Neste
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Lagrer...' : 'Lagre'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
