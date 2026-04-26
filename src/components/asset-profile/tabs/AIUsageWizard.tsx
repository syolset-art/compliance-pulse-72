import { useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Bot, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Shield, 
  Eye, 
  Users,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Plus,
  X,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIUsageWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetCategory?: string;
  assetVendor?: string;
  assetName?: string;
  existingData?: any;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  riskLevel: 'minimal' | 'limited' | 'high' | 'unacceptable';
  [key: string]: string; // Index signature for Json compatibility
}

const SUGGESTED_FEATURES: Record<string, AIFeature[]> = {
  "Kommunikasjonssystemer": [
    { id: "noise-reduction", name: "Støyreduksjon", description: "AI-basert fjerning av bakgrunnsstøy", riskLevel: "minimal" },
    { id: "virtual-bg", name: "Virtuell bakgrunn", description: "AI-generert bakgrunnsutskiftning", riskLevel: "minimal" },
    { id: "transcription", name: "Automatisk transkripsjon", description: "Tale-til-tekst konvertering", riskLevel: "limited" },
    { id: "meeting-summary", name: "Møteoppsummering", description: "AI-genererte møtenotater", riskLevel: "limited" },
    { id: "translation", name: "Sanntidsoversettelse", description: "Automatisk språkoversettelse", riskLevel: "limited" },
  ],
  "HR-systemer": [
    { id: "cv-screening", name: "CV-screening", description: "Automatisk filtrering av jobbsøknader", riskLevel: "high" },
    { id: "performance-analysis", name: "Ytelsesanalyse", description: "AI-basert medarbeidervurdering", riskLevel: "high" },
    { id: "sentiment-analysis", name: "Sentimentanalyse", description: "Analyse av medarbeiderundersøkelser", riskLevel: "limited" },
    { id: "scheduling", name: "Smart planlegging", description: "Automatisk vaktplanlegging", riskLevel: "minimal" },
  ],
  "Økonomisystemer": [
    { id: "fraud-detection", name: "Svindeldeteksjon", description: "Automatisk identifisering av mistenkelige transaksjoner", riskLevel: "limited" },
    { id: "expense-categorization", name: "Utgiftskategorisering", description: "Automatisk klassifisering av utgifter", riskLevel: "minimal" },
    { id: "credit-scoring", name: "Kredittvurdering", description: "AI-basert kredittverdighet", riskLevel: "high" },
    { id: "forecasting", name: "Økonomisk prognose", description: "Prediktiv analyse av økonomi", riskLevel: "limited" },
  ],
  "default": [
    { id: "automation", name: "Prosessautomatisering", description: "Automatisering av repetitive oppgaver", riskLevel: "minimal" },
    { id: "recommendation", name: "Anbefalingssystem", description: "AI-baserte forslag og anbefalinger", riskLevel: "limited" },
    { id: "classification", name: "Automatisk klassifisering", description: "Kategorisering av data eller dokumenter", riskLevel: "minimal" },
    { id: "chatbot", name: "Chatbot / Virtuell assistent", description: "AI-drevet kundeservice eller intern support", riskLevel: "limited" },
  ]
};

const VENDOR_AI_INFO: Record<string, { features: string[], provider: string }> = {
  "Zoom": { 
    features: ["Støyreduksjon", "Virtuell bakgrunn", "AI Companion", "Automatisk transkripsjon"],
    provider: "Zoom AI"
  },
  "Microsoft Teams": {
    features: ["Støyreduksjon", "Bakgrunnsuskarphet", "Copilot", "Live transkripsjoner"],
    provider: "Microsoft AI / Azure OpenAI"
  },
  "Slack": {
    features: ["Slack AI", "Smart søk", "Oppsummeringer"],
    provider: "Slack AI"
  },
  "Salesforce": {
    features: ["Einstein AI", "Prediktiv analyse", "Automatiske anbefalinger"],
    provider: "Salesforce Einstein"
  },
};

const RISK_DESCRIPTIONS = {
  minimal: {
    title: "Minimal risiko",
    description: "AI-systemer med lav eller ingen risiko. Ingen spesifikke regulatoriske krav.",
    examples: "Spam-filtre, spillogikk, inventarsystemer"
  },
  limited: {
    title: "Begrenset risiko",
    description: "AI-systemer som krever transparens. Brukere må informeres om at de interagerer med AI.",
    examples: "Chatbots, innholdsgenerering, sentimentanalyse"
  },
  high: {
    title: "Høy risiko",
    description: "AI-systemer som kan påvirke menneskers rettigheter. Krever conformity assessment, dokumentasjon og menneskelig tilsyn.",
    examples: "Rekruttering, kredittvurdering, biometrisk identifisering"
  },
  unacceptable: {
    title: "Forbudt",
    description: "AI-systemer som er forbudt under EU AI Act.",
    examples: "Sosial scoring, manipulasjon av sårbare grupper, vurdering av emosjonell tilstand på arbeidsplassen"
  }
};

export function AIUsageWizard({ 
  open, 
  onOpenChange, 
  assetId,
  assetCategory,
  assetVendor,
  assetName,
  existingData
}: AIUsageWizardProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 1: Has AI
  const [hasAI, setHasAI] = useState<boolean | null>(existingData?.has_ai ?? null);
  
  // Step 2: AI Features
  const [selectedFeatures, setSelectedFeatures] = useState<AIFeature[]>(
    (existingData?.ai_features as AIFeature[]) || []
  );
  const [customFeatureName, setCustomFeatureName] = useState("");
  const [customFeatureDesc, setCustomFeatureDesc] = useState("");
  
  // Step 3: Risk Classification
  const [overallRisk, setOverallRisk] = useState<string>(existingData?.risk_category || "");
  const [riskJustification, setRiskJustification] = useState(existingData?.risk_justification || "");
  
  // Step 4: Transparency & Oversight
  const [transparencyImplemented, setTransparencyImplemented] = useState(existingData?.transparency_implemented || false);
  const [transparencyDescription, setTransparencyDescription] = useState(existingData?.transparency_description || "");
  const [humanOversightLevel, setHumanOversightLevel] = useState(existingData?.human_oversight_level || "none");
  const [humanOversightDescription, setHumanOversightDescription] = useState(existingData?.human_oversight_description || "");
  const [loggingEnabled, setLoggingEnabled] = useState(existingData?.logging_enabled || false);
  const [dataUsedForTraining, setDataUsedForTraining] = useState(existingData?.data_used_for_training || false);
  
  // Step 5: Additional Info
  const [aiProvider, setAiProvider] = useState(existingData?.ai_provider || "");
  const [modelInfo, setModelInfo] = useState(existingData?.model_info || "");
  const [purposeDescription, setPurposeDescription] = useState(existingData?.purpose_description || "");
  const [nextAssessmentDate, setNextAssessmentDate] = useState(existingData?.next_assessment_date || "");

  const suggestedFeatures = SUGGESTED_FEATURES[assetCategory || ""] || SUGGESTED_FEATURES.default;
  const vendorInfo = assetVendor ? VENDOR_AI_INFO[assetVendor] : null;

  useEffect(() => {
    if (vendorInfo && !existingData) {
      setAiProvider(vendorInfo.provider);
    }
  }, [vendorInfo, existingData]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        asset_id: assetId,
        has_ai: hasAI,
        ai_features: JSON.parse(JSON.stringify(selectedFeatures)),
        risk_category: overallRisk || null,
        risk_justification: riskJustification || null,
        transparency_implemented: transparencyImplemented,
        transparency_description: transparencyDescription || null,
        human_oversight_level: humanOversightLevel,
        human_oversight_description: humanOversightDescription || null,
        logging_enabled: loggingEnabled,
        data_used_for_training: dataUsedForTraining,
        ai_provider: aiProvider || null,
        model_info: modelInfo || null,
        purpose_description: purposeDescription || null,
        next_assessment_date: nextAssessmentDate || null,
        last_assessment_date: new Date().toISOString().split('T')[0],
        compliance_status: overallRisk === 'unacceptable' ? 'non_compliant' : 
                          (overallRisk === 'high' && !transparencyImplemented) ? 'partial' : 
                          transparencyImplemented ? 'compliant' : 'partial'
      };

      if (existingData?.id) {
        const { error } = await supabase
          .from('asset_ai_usage')
          .update(payload)
          .eq('id', existingData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('asset_ai_usage')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['asset-ai-usage', assetId] });
      toast.success("AI-bruk registrert");
      onOpenChange(false);
      setStep(1);
    },
    onError: (error) => {
      toast.error("Kunne ikke lagre: " + error.message);
    }
  });

  const handleAddCustomFeature = () => {
    if (customFeatureName.trim()) {
      const newFeature: AIFeature = {
        id: `custom-${Date.now()}`,
        name: customFeatureName,
        description: customFeatureDesc || "Egendefinert AI-funksjon",
        riskLevel: "limited"
      };
      setSelectedFeatures([...selectedFeatures, newFeature]);
      setCustomFeatureName("");
      setCustomFeatureDesc("");
    }
  };

  const toggleFeature = (feature: AIFeature) => {
    const exists = selectedFeatures.find(f => f.id === feature.id);
    if (exists) {
      setSelectedFeatures(selectedFeatures.filter(f => f.id !== feature.id));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  const updateFeatureRisk = (featureId: string, riskLevel: AIFeature['riskLevel']) => {
    setSelectedFeatures(selectedFeatures.map(f => 
      f.id === featureId ? { ...f, riskLevel } : f
    ));
  };

  const calculateSuggestedRisk = (): string => {
    if (selectedFeatures.some(f => f.riskLevel === 'unacceptable')) return 'unacceptable';
    if (selectedFeatures.some(f => f.riskLevel === 'high')) return 'high';
    if (selectedFeatures.some(f => f.riskLevel === 'limited')) return 'limited';
    return 'minimal';
  };

  const handleNext = () => {
    if (step === 1 && hasAI === false) {
      // Save and close if no AI
      saveMutation.mutate();
      return;
    }
    if (step < 5) setStep(step + 1);
    else saveMutation.mutate();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const canProceed = () => {
    switch (step) {
      case 1: return hasAI !== null;
      case 2: return selectedFeatures.length > 0 || !hasAI;
      case 3: return !!overallRisk;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {existingData ? "Rediger AI-bruk" : "Registrer AI-bruk"}
            {assetName && <span className="text-muted-foreground font-normal">- {assetName}</span>}
          </DialogTitle>
          <DialogDescription>
            Steg {step} av 5
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>

        <ScrollArea className="max-h-[60vh] pr-4">
          {/* Step 1: Identify AI Usage */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <h3 className="text-lg font-semibold mb-2">Bruker dette systemet AI?</h3>
                <p className="text-muted-foreground text-sm">
                  Kunstig intelligens inkluderer maskinlæring, språkmodeller, bildegjenkjenning og andre automatiserte beslutningssystemer.
                </p>
              </div>

              {vendorInfo && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Basert på leverandør: {assetVendor}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assetVendor} bruker typisk følgende AI-funksjoner:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {vendorInfo.features.map((f, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setHasAI(true)}
                  className={cn(
                    "p-6 rounded-lg border-2 text-center transition-all",
                    hasAI === true 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <Bot className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-semibold">Ja, bruker AI</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Systemet har en eller flere AI-funksjoner
                  </p>
                </button>

                <button
                  onClick={() => setHasAI(false)}
                  className={cn(
                    "p-6 rounded-lg border-2 text-center transition-all",
                    hasAI === false 
                      ? "border-primary bg-primary/5" 
                      : "border-muted hover:border-primary/50"
                  )}
                >
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-semibold">Nei, ingen AI</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Systemet bruker ikke kunstig intelligens
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Register AI Features */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Hvilke AI-funksjoner brukes?</h3>
                <p className="text-muted-foreground text-sm">
                  Velg fra forslagene eller legg til egne. Hver funksjon vil bli risikovurdert separat.
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Foreslåtte funksjoner for {assetCategory || "dette systemet"}</Label>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedFeatures.map((feature) => {
                    const isSelected = selectedFeatures.some(f => f.id === feature.id);
                    return (
                      <button
                        key={feature.id}
                        onClick={() => toggleFeature(feature)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border text-left transition-all",
                          isSelected 
                            ? "border-primary bg-primary/5" 
                            : "border-muted hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} />
                          <div>
                            <p className="font-medium">{feature.name}</p>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {RISK_DESCRIPTIONS[feature.riskLevel].title}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedFeatures.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-3 block">Valgte funksjoner ({selectedFeatures.length})</Label>
                  <div className="space-y-2">
                    {selectedFeatures.map((feature) => (
                      <div key={feature.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="font-medium">{feature.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={feature.riskLevel}
                            onChange={(e) => updateFeatureRisk(feature.id, e.target.value as AIFeature['riskLevel'])}
                            className="text-sm border rounded px-2 py-1 bg-background"
                          >
                            <option value="minimal">Minimal</option>
                            <option value="limited">Begrenset</option>
                            <option value="high">Høy</option>
                            <option value="unacceptable">Forbudt</option>
                          </select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFeatures(selectedFeatures.filter(f => f.id !== feature.id))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <Label className="text-sm font-medium mb-3 block">Legg til egendefinert funksjon</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Funksjonsnavn"
                    value={customFeatureName}
                    onChange={(e) => setCustomFeatureName(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Beskrivelse (valgfritt)"
                    value={customFeatureDesc}
                    onChange={(e) => setCustomFeatureDesc(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddCustomFeature} disabled={!customFeatureName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Risk Classification */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Risikoklassifisering</h3>
                <p className="text-muted-foreground text-sm">
                  Basert på de valgte funksjonene, klassifiser den samlede risikoen for AI-bruken.
                </p>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Foreslått klassifisering</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Basert på de valgte funksjonene anbefaler vi: <strong>{RISK_DESCRIPTIONS[calculateSuggestedRisk() as keyof typeof RISK_DESCRIPTIONS].title}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <RadioGroup value={overallRisk} onValueChange={setOverallRisk}>
                {Object.entries(RISK_DESCRIPTIONS).map(([key, desc]) => (
                  <div
                    key={key}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-lg border transition-all cursor-pointer",
                      overallRisk === key ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                    )}
                    onClick={() => setOverallRisk(key)}
                  >
                    <RadioGroupItem value={key} id={key} className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor={key} className="font-semibold cursor-pointer">{desc.title}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{desc.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">Eksempler: {desc.examples}</p>
                    </div>
                    {key === 'unacceptable' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                    {key === 'high' && <AlertTriangle className="h-5 w-5 text-warning" />}
                  </div>
                ))}
              </RadioGroup>

              <div>
                <Label htmlFor="risk-justification">Begrunnelse for klassifisering (valgfritt)</Label>
                <Textarea
                  id="risk-justification"
                  placeholder="Forklar hvorfor denne risikoklassifiseringen er valgt..."
                  value={riskJustification}
                  onChange={(e) => setRiskJustification(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Step 4: Transparency & Oversight */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Transparens og tilsyn</h3>
                <p className="text-muted-foreground text-sm">
                  EU AI Act krever at brukere informeres om AI-bruk og at det finnes menneskelig tilsyn.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <div>
                      <Label className="font-medium">Transparenskrav oppfylt</Label>
                      <p className="text-sm text-muted-foreground">Er brukere informert om at de interagerer med AI?</p>
                    </div>
                  </div>
                  <Switch
                    checked={transparencyImplemented}
                    onCheckedChange={setTransparencyImplemented}
                  />
                </div>

                {transparencyImplemented && (
                  <div>
                    <Label htmlFor="transparency-desc">Hvordan informeres brukere?</Label>
                    <Textarea
                      id="transparency-desc"
                      placeholder="Beskriv hvordan brukere informeres om AI-bruk..."
                      value={transparencyDescription}
                      onChange={(e) => setTransparencyDescription(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Users className="h-4 w-4" />
                    Nivå av menneskelig tilsyn
                  </Label>
                  <RadioGroup value={humanOversightLevel} onValueChange={setHumanOversightLevel}>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "none", label: "Ingen", desc: "Ingen menneskelig involvering" },
                        { value: "review", label: "Gjennomgang", desc: "Mennesker kan gjennomgå AI-beslutninger" },
                        { value: "approval", label: "Godkjenning", desc: "AI-forslag krever menneskelig godkjenning" },
                        { value: "full_control", label: "Full kontroll", desc: "Mennesker kan overstyre alle AI-beslutninger" },
                      ].map((option) => (
                        <div
                          key={option.value}
                          className={cn(
                            "flex items-start gap-2 p-3 rounded-lg border cursor-pointer transition-all",
                            humanOversightLevel === option.value ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                          )}
                          onClick={() => setHumanOversightLevel(option.value)}
                        >
                          <RadioGroupItem value={option.value} id={`oversight-${option.value}`} className="mt-0.5" />
                          <div>
                            <Label htmlFor={`oversight-${option.value}`} className="font-medium cursor-pointer">{option.label}</Label>
                            <p className="text-xs text-muted-foreground">{option.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {humanOversightLevel !== "none" && (
                  <div>
                    <Label htmlFor="oversight-desc">Beskriv tilsynsprosessen</Label>
                    <Textarea
                      id="oversight-desc"
                      placeholder="Hvordan utøves menneskelig tilsyn..."
                      value={humanOversightDescription}
                      onChange={(e) => setHumanOversightDescription(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="font-medium">Logging aktivert</Label>
                    <p className="text-sm text-muted-foreground">Logges AI-beslutninger for etterprøvbarhet?</p>
                  </div>
                  <Switch
                    checked={loggingEnabled}
                    onCheckedChange={setLoggingEnabled}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <Label className="font-medium">Data brukt til trening</Label>
                    <p className="text-sm text-muted-foreground">Brukes organisasjonens data til å trene AI-modeller?</p>
                  </div>
                  <Switch
                    checked={dataUsedForTraining}
                    onCheckedChange={setDataUsedForTraining}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Additional Information */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tilleggsinformasjon</h3>
                <p className="text-muted-foreground text-sm">
                  Legg til ytterligere detaljer om AI-bruken for dokumentasjon.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ai-provider">AI-leverandør</Label>
                  <Input
                    id="ai-provider"
                    placeholder="f.eks. OpenAI, Google, Microsoft"
                    value={aiProvider}
                    onChange={(e) => setAiProvider(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="model-info">Modellinformasjon</Label>
                  <Input
                    id="model-info"
                    placeholder="f.eks. GPT-4, Gemini Pro"
                    value={modelInfo}
                    onChange={(e) => setModelInfo(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Formål med AI-bruk</Label>
                <Textarea
                  id="purpose"
                  placeholder="Beskriv det overordnede formålet med AI-bruken i dette systemet..."
                  value={purposeDescription}
                  onChange={(e) => setPurposeDescription(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="next-assessment">Neste vurderingsdato</Label>
                <Input
                  id="next-assessment"
                  type="date"
                  value={nextAssessmentDate}
                  onChange={(e) => setNextAssessmentDate(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Anbefalt: Årlig gjennomgang av AI-bruk og risikovurdering
                </p>
              </div>

              {/* Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold">Oppsummering</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">AI-funksjoner:</span>
                    <span className="ml-2 font-medium">{selectedFeatures.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risikonivå:</span>
                    <span className="ml-2 font-medium">
                      {overallRisk ? RISK_DESCRIPTIONS[overallRisk as keyof typeof RISK_DESCRIPTIONS].title : "Ikke satt"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Transparens:</span>
                    <span className="ml-2 font-medium">{transparencyImplemented ? "Ja" : "Nei"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tilsyn:</span>
                    <span className="ml-2 font-medium">
                      {humanOversightLevel === "none" ? "Ingen" : 
                       humanOversightLevel === "review" ? "Gjennomgang" :
                       humanOversightLevel === "approval" ? "Godkjenning" : "Full kontroll"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Tilbake
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed() || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Lagrer...
              </>
            ) : step === 5 || (step === 1 && hasAI === false) ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Fullfør
              </>
            ) : (
              <>
                Neste
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
