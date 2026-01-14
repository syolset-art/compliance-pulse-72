import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Server
} from "lucide-react";
import { getProcessAISuggestion, type ProcessAISuggestion } from "@/lib/processAISuggestions";
import { useSystemAIFeatures, type AggregatedSystemAI } from "@/hooks/useSystemAIFeatures";

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

interface ChecklistItem {
  id: string;
  question: string;
  checked: boolean;
}

const STEPS = [
  { id: 'identify', title: 'AI-identifikasjon', icon: Bot },
  { id: 'features', title: 'AI-funksjoner', icon: Sparkles },
  { id: 'checklist', title: 'AI Act sjekkliste', icon: FileText },
  { id: 'risk', title: 'Risikoklassifisering', icon: Shield },
  { id: 'transparency', title: 'Transparens og tilsyn', icon: Eye },
];

export const ProcessAIDialog = ({
  open,
  onOpenChange,
  processId,
  processName,
  processDescription,
  workAreaId,
  systemId,
}: ProcessAIDialogProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form state
  const [hasAI, setHasAI] = useState<boolean | null>(null);
  const [aiPurpose, setAiPurpose] = useState("");
  const [aiFeatures, setAiFeatures] = useState<AIFeature[]>([]);
  const [customFeature, setCustomFeature] = useState("");
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [riskCategory, setRiskCategory] = useState<string>("");
  const [riskJustification, setRiskJustification] = useState("");
  const [transparencyStatus, setTransparencyStatus] = useState("not_required");
  const [transparencyDescription, setTransparencyDescription] = useState("");
  const [humanOversightRequired, setHumanOversightRequired] = useState(false);
  const [humanOversightLevel, setHumanOversightLevel] = useState("none");
  const [humanOversightDescription, setHumanOversightDescription] = useState("");
  const [affectedPersons, setAffectedPersons] = useState<string[]>([]);
  const [automatedDecisions, setAutomatedDecisions] = useState(false);
  const [decisionImpact, setDecisionImpact] = useState("");

  // Get AI suggestions based on process name
  const [suggestions, setSuggestions] = useState<ProcessAISuggestion | null>(null);

  // Get system AI features for suggestions
  const { data: systemAI } = useSystemAIFeatures(systemId || null);

  // Fetch existing process AI usage data
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

  // Load existing data when available
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
      setAffectedPersons(existingData.affected_persons || []);
      setAutomatedDecisions(existingData.automated_decisions || false);
      setDecisionImpact(existingData.decision_impact || "");
      
      // Parse features
      const features = (existingData.ai_features as string[]) || [];
      setAiFeatures(features.map((f, i) => ({ id: `feature-${i}`, name: f, selected: true })));
      
      // Parse checklist
      const checklistData = existingData.compliance_checklist as unknown as ChecklistItem[] || [];
      setChecklist(Array.isArray(checklistData) ? checklistData : []);
    }
  }, [existingData]);

  // Get suggestions when dialog opens - combine process suggestions with system AI data
  useEffect(() => {
    if (open && processName) {
      const processSuggestions = getProcessAISuggestion(processName, processDescription);
      setSuggestions(processSuggestions);
      
      // If no existing data, pre-fill with suggestions
      if (!existingData) {
        // Combine process suggestions with system AI features
        let combinedFeatures: string[] = [];
        
        // Add process-based suggestions
        if (processSuggestions.suggestedAIFeatures.length > 0) {
          combinedFeatures = [...processSuggestions.suggestedAIFeatures];
        }
        
        // Add system AI features if available
        if (systemAI?.suggestedFeatures && systemAI.suggestedFeatures.length > 0) {
          combinedFeatures = [...new Set([...combinedFeatures, ...systemAI.suggestedFeatures])];
        }
        
        if (combinedFeatures.length > 0) {
          setAiFeatures(combinedFeatures.map((f, i) => ({
            id: `suggested-${i}`,
            name: f,
            selected: false,
          })));
        }

        // Combine checklist suggestions
        if (processSuggestions.suggestedChecks.length > 0) {
          setChecklist(processSuggestions.suggestedChecks.map((q, i) => ({
            id: `check-${i}`,
            question: q,
            checked: false,
          })));
        }
        
        // Use system risk if available, otherwise use process suggestion
        if (systemAI?.suggestedRisk) {
          setRiskCategory(systemAI.suggestedRisk);
        } else if (processSuggestions.suggestedRiskCategory) {
          setRiskCategory(processSuggestions.suggestedRiskCategory);
        }

        // Pre-fill affected persons from system
        if (systemAI?.suggestedAffectedPersons && systemAI.suggestedAffectedPersons.length > 0) {
          setAffectedPersons(systemAI.suggestedAffectedPersons);
        }

        // If system has AI, suggest that process likely uses AI too
        if (systemAI?.totalWithAI && systemAI.totalWithAI > 0) {
          // Don't auto-set hasAI, but the UI will show a suggestion
        }
      }
    }
  }, [open, processName, processDescription, existingData, systemAI]);

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
        affected_persons: affectedPersons,
        automated_decisions: automatedDecisions,
        decision_impact: decisionImpact,
        compliance_checklist: checklist as unknown as null,
        compliance_status: calculateComplianceStatus(),
        last_review_date: new Date().toISOString().split('T')[0],
      };

      if (existingData) {
        const { error } = await supabase
          .from("process_ai_usage")
          .update(payload)
          .eq("id", existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("process_ai_usage")
          .insert(payload);
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
    
    const checkedCount = checklist.filter(c => c.checked).length;
    if (checklist.length === 0) return "not_assessed";
    
    const ratio = checkedCount / checklist.length;
    if (ratio === 1) return "compliant";
    if (ratio >= 0.5) return "partial";
    return "non_compliant";
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
    setAutomatedDecisions(false);
    setDecisionImpact("");
  };

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      setAiFeatures([...aiFeatures, {
        id: `custom-${Date.now()}`,
        name: customFeature.trim(),
        selected: true,
      }]);
      setCustomFeature("");
    }
  };

  const toggleFeature = (featureId: string) => {
    setAiFeatures(aiFeatures.map(f => 
      f.id === featureId ? { ...f, selected: !f.selected } : f
    ));
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(checklist.map(c => 
      c.id === itemId ? { ...c, checked: !c.checked } : c
    ));
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
    if (currentStep === 1) return !hasAI || aiFeatures.some(f => f.selected);
    return true;
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'unacceptable': return 'destructive';
      case 'high': return 'destructive';
      case 'limited': return 'secondary';
      default: return 'outline';
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t("processAI.title", "AI-bruk dokumentasjon")}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{processName}</p>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex items-center gap-1 ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <step.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Lara suggestion - combined from process and system AI */}
        {currentStep === 0 && (suggestions?.aiActNote || (systemAI?.totalWithAI && systemAI.totalWithAI > 0)) && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="font-medium text-sm">{t("processAI.laraSuggestion", "Lara's vurdering")}</p>
                  
                  {/* Process-based suggestion */}
                  {suggestions?.aiActNote && (
                    <p className="text-sm text-muted-foreground">{suggestions.aiActNote}</p>
                  )}
                  
                  {/* System AI-based suggestion */}
                  {systemAI && systemAI.totalWithAI > 0 && (
                    <div className="p-3 bg-background/50 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">
                          {t("processAI.systemAIDetected", "AI oppdaget i tilknyttet system")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("processAI.systemAIDescription", "Systemet bruker {{count}} AI-funksjon(er). Disse kan være relevante for prosessen:", { count: systemAI.suggestedFeatures.length })}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {systemAI.suggestedFeatures.slice(0, 5).map((feature, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {systemAI.suggestedFeatures.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{systemAI.suggestedFeatures.length - 5} {t("common.more", "flere")}
                          </Badge>
                        )}
                      </div>
                      {systemAI.suggestedRisk && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {t("processAI.systemRisk", "Systemets risikoklassifisering:")} <Badge variant="outline" className="ml-1">{systemAI.suggestedRisk}</Badge>
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {suggestions?.likelyAI && (
                      <Badge variant="secondary">
                        {t("processAI.likelyUsesAI", "Sannsynlig AI-bruk")}
                      </Badge>
                    )}
                    {systemAI && systemAI.totalWithAI > 0 && (
                      <Badge variant="default">
                        {t("processAI.systemHasAI", "System bruker AI")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step content */}
        <div className="min-h-[300px]">
          {/* Step 1: AI Identification */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  {t("processAI.hasAIQuestion", "Bruker denne prosessen AI?")}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("processAI.hasAIDescription", "Inkluderer maskinlæring, automatiserte beslutninger, chatbots, prediktiv analyse etc.")}
                </p>
              </div>

              <RadioGroup
                value={hasAI === null ? "" : hasAI ? "yes" : "no"}
                onValueChange={(v) => setHasAI(v === "yes")}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="ai-yes"
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    hasAI === true ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                >
                  <RadioGroupItem value="yes" id="ai-yes" />
                  <div>
                    <p className="font-medium">{t("common.yes", "Ja")}</p>
                    <p className="text-sm text-muted-foreground">{t("processAI.usesAI", "Prosessen bruker AI")}</p>
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
                    <p className="font-medium">{t("common.no", "Nei")}</p>
                    <p className="text-sm text-muted-foreground">{t("processAI.noAI", "Ingen AI-bruk")}</p>
                  </div>
                </Label>
              </RadioGroup>

              {hasAI && (
                <div className="space-y-2">
                  <Label>{t("processAI.aiPurpose", "Formål med AI i prosessen")}</Label>
                  <Textarea
                    value={aiPurpose}
                    onChange={(e) => setAiPurpose(e.target.value)}
                    placeholder={t("processAI.aiPurposePlaceholder", "Beskriv hva AI brukes til i denne prosessen...")}
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: AI Features */}
          {currentStep === 1 && hasAI && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  {t("processAI.selectFeatures", "Velg AI-funksjoner som brukes")}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("processAI.selectFeaturesDescription", "Marker alle AI-funksjoner som er aktive i denne prosessen")}
                </p>
              </div>

              <div className="space-y-2">
                {aiFeatures.map((feature) => (
                  <Label
                    key={feature.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      feature.selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={feature.selected}
                      onCheckedChange={() => toggleFeature(feature.id)}
                    />
                    <span>{feature.name}</span>
                  </Label>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  placeholder={t("processAI.addCustomFeature", "Legg til annen AI-funksjon...")}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomFeature()}
                />
                <Button type="button" variant="outline" onClick={addCustomFeature}>
                  {t("common.add", "Legg til")}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Checklist */}
          {currentStep === 2 && hasAI && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">
                  {t("processAI.checklistTitle", "AI Act sjekkliste")}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("processAI.checklistDescription", "Bekreft at følgende krav er oppfylt")}
                </p>
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <Label
                    key={item.id}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      item.checked ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={item.checked}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="mt-0.5"
                    />
                    <span className="text-sm">{item.question}</span>
                  </Label>
                ))}
              </div>

              {checklist.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  {t("processAI.noChecklist", "Ingen spesifikke sjekkpunkter for denne prosesstypen")}
                </p>
              )}
            </div>
          )}

          {/* Step 4: Risk Classification */}
          {currentStep === 3 && hasAI && (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">
                  {t("processAI.riskCategory", "Risikoklassifisering")}
                </Label>
                {suggestions?.suggestedRiskCategory && (
                  <p className="text-sm text-primary mt-1">
                    {t("processAI.suggestedRisk", "Foreslått:")}{" "}
                    <Badge variant={getRiskBadgeVariant(suggestions.suggestedRiskCategory)}>
                      {suggestions.suggestedRiskCategory}
                    </Badge>
                  </p>
                )}
              </div>

              <RadioGroup
                value={riskCategory}
                onValueChange={setRiskCategory}
                className="grid grid-cols-2 gap-3"
              >
                {[
                  { value: 'minimal', label: 'Minimal risiko', description: 'Ingen spesifikke krav' },
                  { value: 'limited', label: 'Begrenset risiko', description: 'Transparenskrav' },
                  { value: 'high', label: 'Høy risiko', description: 'Strenge krav (Annex III)' },
                  { value: 'unacceptable', label: 'Uakseptabel risiko', description: 'Forbudt under AI Act' },
                ].map((option) => (
                  <Label
                    key={option.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      riskCategory === option.value ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem value={option.value} className="mt-1" />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </Label>
                ))}
              </RadioGroup>

              <div className="space-y-2">
                <Label>{t("processAI.riskJustification", "Begrunnelse for klassifisering")}</Label>
                <Textarea
                  value={riskJustification}
                  onChange={(e) => setRiskJustification(e.target.value)}
                  placeholder={t("processAI.riskJustificationPlaceholder", "Forklar hvorfor denne risikoklassifiseringen er valgt...")}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("processAI.affectedPersons", "Hvem påvirkes av AI-beslutninger?")}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['Ansatte', 'Kunder', 'Leverandører', 'Publikum', 'Kandidater'].map((person) => (
                    <Badge
                      key={person}
                      variant={affectedPersons.includes(person) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleAffectedPerson(person)}
                    >
                      {person}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Transparency & Oversight */}
          {currentStep === 4 && hasAI && (
            <div className="space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  {t("processAI.transparency", "Transparens")}
                </Label>
                
                <Select value={transparencyStatus} onValueChange={setTransparencyStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_required">Ikke påkrevd</SelectItem>
                    <SelectItem value="required">Påkrevd, ikke implementert</SelectItem>
                    <SelectItem value="implemented">Implementert</SelectItem>
                  </SelectContent>
                </Select>

                {transparencyStatus !== 'not_required' && (
                  <Textarea
                    value={transparencyDescription}
                    onChange={(e) => setTransparencyDescription(e.target.value)}
                    placeholder="Beskriv hvordan brukere informeres om AI-bruk..."
                    rows={2}
                  />
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="oversight"
                    checked={humanOversightRequired}
                    onCheckedChange={(checked) => setHumanOversightRequired(checked as boolean)}
                  />
                  <Label htmlFor="oversight" className="text-base font-medium cursor-pointer">
                    {t("processAI.humanOversight", "Krever menneskelig tilsyn")}
                  </Label>
                </div>

                {humanOversightRequired && (
                  <>
                    <Select value={humanOversightLevel} onValueChange={setHumanOversightLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg tilsynsnivå" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="review">Gjennomgang - Kan se AI-beslutninger</SelectItem>
                        <SelectItem value="approval">Godkjenning - Må godkjenne AI-beslutninger</SelectItem>
                        <SelectItem value="full_control">Full kontroll - Kan overstyre alt</SelectItem>
                      </SelectContent>
                    </Select>

                    <Textarea
                      value={humanOversightDescription}
                      onChange={(e) => setHumanOversightDescription(e.target.value)}
                      placeholder="Beskriv hvordan tilsyn gjennomføres..."
                      rows={2}
                    />
                  </>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="automated"
                    checked={automatedDecisions}
                    onCheckedChange={(checked) => setAutomatedDecisions(checked as boolean)}
                  />
                  <Label htmlFor="automated" className="cursor-pointer">
                    {t("processAI.automatedDecisions", "AI tar automatiserte beslutninger")}
                  </Label>
                </div>

                {automatedDecisions && (
                  <Textarea
                    value={decisionImpact}
                    onChange={(e) => setDecisionImpact(e.target.value)}
                    placeholder="Beskriv konsekvensen av automatiserte beslutninger..."
                    rows={2}
                  />
                )}
              </div>
            </div>
          )}

          {/* No AI selected - skip to end */}
          {currentStep > 0 && !hasAI && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">{t("processAI.noAIConfirmed", "Ingen AI-bruk registrert")}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t("processAI.noAIDescription", "Denne prosessen bruker ikke AI og krever ingen AI Act-dokumentasjon")}
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 0 ? () => onOpenChange(false) : prevStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {currentStep === 0 ? t("common.cancel", "Avbryt") : t("common.back", "Tilbake")}
          </Button>

          {currentStep < STEPS.length - 1 && hasAI ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              {t("common.next", "Neste")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t("common.saving", "Lagrer...") : t("common.save", "Lagre")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
