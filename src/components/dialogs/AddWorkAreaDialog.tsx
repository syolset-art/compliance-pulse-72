import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Users, 
  Zap, 
  Network, 
  ShieldCheck, 
  Monitor, 
  TrendingUp, 
  UserCheck, 
  Sun,
  Sparkles,
  Check
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WorkArea {
  id: string;
  name: string;
  description: string | null;
  responsible_person: string | null;
}

interface WorkAreaTemplate {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface AddWorkAreaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkAreaAdded: () => void;
  workArea?: WorkArea | null;
}

const TOTAL_STEPS = 6;

// Predefined contact persons for the demo
const contactPersons = [
  "Synnøve Olset",
  "Erik Hansen",
  "Maria Johansen",
  "Lars Pettersen",
  "Anne Kristiansen"
];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap,
  Network,
  Users,
  ShieldCheck,
  Monitor,
  TrendingUp,
  UserCheck,
  Sun,
};

export function AddWorkAreaDialog({ open, onOpenChange, onWorkAreaAdded, workArea }: AddWorkAreaDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = suggestions, 1-6 = form steps
  const [isActive, setIsActive] = useState(true);
  const [templates, setTemplates] = useState<WorkAreaTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    responsible_person: ""
  });
  const [nameError, setNameError] = useState(false);

  // Fetch templates based on company industry
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      // Get company profile to know the industry
      const { data: profile } = await supabase
        .from("company_profile")
        .select("industry")
        .single();

      if (profile?.industry) {
        const { data: templateData } = await supabase
          .from("work_area_templates")
          .select("*")
          .eq("industry", profile.industry)
          .order("sort_order", { ascending: true });

        if (templateData) {
          setTemplates(templateData as WorkAreaTemplate[]);
        }
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (open && !workArea) {
      fetchTemplates();
      setCurrentStep(0);
      setShowManualForm(false);
      setSelectedTemplates(new Set());
    }
  }, [open, workArea]);

  useEffect(() => {
    if (workArea) {
      setFormData({
        name: workArea.name,
        description: workArea.description || "",
        responsible_person: workArea.responsible_person || ""
      });
      setCurrentStep(1);
      setShowManualForm(true);
    } else {
      setFormData({
        name: "",
        description: "",
        responsible_person: ""
      });
      setNameError(false);
    }
  }, [workArea, open]);

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const createFromTemplates = async () => {
    if (selectedTemplates.size === 0) return;
    
    setIsLoading(true);
    try {
      const selectedTemplateData = templates.filter(t => selectedTemplates.has(t.id));
      const workAreasToCreate = selectedTemplateData.map(template => ({
        name: template.name,
        description: template.description,
        responsible_person: null,
      }));

      const { error } = await supabase.from("work_areas").insert(workAreasToCreate);
      if (error) throw error;

      // Update onboarding progress
      const { data: progressData } = await supabase
        .from("onboarding_progress")
        .select("*")
        .single();

      if (progressData) {
        await supabase
          .from("onboarding_progress")
          .update({ work_areas_defined: true })
          .eq("id", progressData.id);
      }

      toast({
        title: t("common.success"),
        description: `${selectedTemplates.size} arbeidsområder opprettet`,
      });

      setSelectedTemplates(new Set());
      onWorkAreaAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating work areas:", error);
      toast({
        title: t("common.error"),
        description: "Kunne ikke opprette arbeidsområder",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setNameError(true);
        return false;
      }
      setNameError(false);
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1 && !workArea) {
      setShowManualForm(false);
      setCurrentStep(0);
    }
  };

  const startManualForm = () => {
    setShowManualForm(true);
    setCurrentStep(1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (workArea) {
        const { error } = await supabase
          .from("work_areas")
          .update(formData)
          .eq("id", workArea.id);

        if (error) throw error;

        toast({
          title: t("common.success"),
          description: `${formData.name} ${t("common.success").toLowerCase()}.`,
        });
      } else {
        const { error } = await supabase.from("work_areas").insert([formData]);
        if (error) throw error;

        const { data: progressData } = await supabase
          .from("onboarding_progress")
          .select("*")
          .single();

        if (progressData) {
          await supabase
            .from("onboarding_progress")
            .update({ work_areas_defined: true })
            .eq("id", progressData.id);
        }

        toast({
          title: t("common.success"),
          description: `${formData.name} ${t("common.success").toLowerCase()}.`,
        });
      }

      setFormData({
        name: "",
        description: "",
        responsible_person: ""
      });
      setCurrentStep(1);

      onWorkAreaAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving work area:", error);
      toast({
        title: t("common.error"),
        description: `Kunne ikke ${workArea ? "oppdatere" : "opprette"} arbeidsområde. Prøv igjen.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const progress = showManualForm ? (currentStep / TOTAL_STEPS) * 100 : 0;

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Navn";
      case 2: return "Beskrivelse";
      case 3: return "Ansvarlig";
      case 4: return "Innstillinger";
      case 5: return "Systemer";
      case 6: return "Bekreft";
      default: return "Forslag";
    }
  };

  const getIconComponent = (iconName: string | null) => {
    if (!iconName || !iconMap[iconName]) return Users;
    return iconMap[iconName];
  };

  // Suggestions view
  const renderSuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>Forslag basert på din bransje</span>
      </div>

      {isLoadingTemplates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : templates.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
            {templates.map((template) => {
              const IconComponent = getIconComponent(template.icon);
              const isSelected = selectedTemplates.has(template.id);
              
              return (
                <button
                  key={template.id}
                  onClick={() => toggleTemplateSelection(template.id)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 bg-card"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-foreground truncate">
                        {template.name}
                      </p>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {template.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-border">
            <button
              onClick={startManualForm}
              className="text-sm text-primary hover:underline"
            >
              Eller opprett manuelt →
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">Ingen forslag tilgjengelig</p>
          <Button onClick={startManualForm}>Opprett manuelt</Button>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                Navn på arbeidsområde <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (e.target.value.trim()) setNameError(false);
                }}
                placeholder="Skriv inn navn"
                className={nameError ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {nameError && (
                <p className="text-sm text-destructive">Navn er påkrevd</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsible_person" className="text-foreground">
                Kontaktperson
              </Label>
              <Select
                value={formData.responsible_person}
                onValueChange={(value) => setFormData({ ...formData, responsible_person: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Velg kontaktperson" />
                </SelectTrigger>
                <SelectContent>
                  {contactPersons.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium text-foreground">Aktivt arbeidsområde</p>
                <p className="text-sm text-muted-foreground">
                  Aktiver eller deaktiver dette arbeidsområdet.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-foreground">
                Beskrivelse
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beskriv arbeidsområdet og dets formål..."
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                En god beskrivelse hjelper andre å forstå hva dette arbeidsområdet innebærer.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground">Ansvarlig person</Label>
              <Select
                value={formData.responsible_person}
                onValueChange={(value) => setFormData({ ...formData, responsible_person: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Velg ansvarlig person" />
                </SelectTrigger>
                <SelectContent>
                  {contactPersons.map((person) => (
                    <SelectItem key={person} value={person}>
                      {person}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Denne personen vil ha hovedansvar for arbeidsområdet.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Aktivt arbeidsområde</p>
                <p className="text-sm text-muted-foreground">
                  Aktiver eller deaktiver dette arbeidsområdet.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Varsler</p>
                <p className="text-sm text-muted-foreground">
                  Motta varsler om endringer i dette arbeidsområdet.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Du kan legge til systemer etter at arbeidsområdet er opprettet.
            </p>
            <div className="p-6 rounded-lg border border-dashed border-border text-center">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Systemer kan kobles til arbeidsområdet fra systemoversikten.
              </p>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Navn:</span>
                <span className="font-medium text-foreground">{formData.name || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beskrivelse:</span>
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {formData.description || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kontaktperson:</span>
                <span className="font-medium text-foreground">{formData.responsible_person || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium text-foreground">{isActive ? "Aktiv" : "Inaktiv"}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              {workArea ? "Rediger arbeidsområde" : "Opprett nytt arbeidsområde"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Progress section - only show in form mode */}
        {showManualForm && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Steg {currentStep} av {TOTAL_STEPS}: {getStepTitle()}
              </span>
              <span className="text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-6 min-h-[200px]">
          {!showManualForm && !workArea ? renderSuggestions() : renderStepContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 bg-muted/30 border-t border-border">
          {!showManualForm && !workArea ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Avbryt
              </Button>
              <Button 
                onClick={createFromTemplates}
                disabled={isLoading || selectedTemplates.size === 0}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  `Opprett ${selectedTemplates.size > 0 ? `(${selectedTemplates.size})` : ""}`
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={currentStep === 1 && workArea !== null}
              >
                Tilbake
              </Button>
              <Button 
                onClick={handleNext}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Lagrer...
                  </>
                ) : currentStep === TOTAL_STEPS ? (
                  workArea ? "Oppdater" : "Opprett"
                ) : (
                  "Neste"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
