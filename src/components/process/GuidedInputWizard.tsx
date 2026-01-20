import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequiredInput } from "@/hooks/useProcessAIDraft";

interface GuidedInputWizardProps {
  requiredInputs: RequiredInput[];
  onComplete: (values: Record<string, any>) => void;
  onCancel: () => void;
}

const AFFECTED_PERSONS_OPTIONS = [
  { label: "Ansatte", value: "employees" },
  { label: "Kunder", value: "customers" },
  { label: "Jobbsøkere", value: "job_applicants" },
  { label: "Brukere", value: "users" },
  { label: "Pasienter", value: "patients" },
  { label: "Studenter", value: "students" },
];

interface StepConfig {
  field: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const STEP_CONFIGS: Record<string, StepConfig> = {
  affectedPersons: {
    field: "affectedPersons",
    title: "Hvem påvirkes?",
    subtitle: "Velg alle gruppene som berøres av AI-bruken",
    icon: <Users className="h-6 w-6" />,
  },
  transparencyDescription: {
    field: "transparencyDescription",
    title: "Hvordan informeres de?",
    subtitle: "Beskriv kort hvordan berørte får vite om AI-bruken",
    icon: <Eye className="h-6 w-6" />,
  },
  humanOversightDescription: {
    field: "humanOversightDescription",
    title: "Menneskelig kontroll",
    subtitle: "Hvordan sikres at mennesker kan gripe inn?",
    icon: <MessageSquare className="h-6 w-6" />,
  },
};

export const GuidedInputWizard = ({
  requiredInputs,
  onComplete,
  onCancel,
}: GuidedInputWizardProps) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({
    affectedPersons: [],
    transparencyDescription: "",
    humanOversightDescription: "",
  });
  const [customPerson, setCustomPerson] = useState("");

  const steps = requiredInputs.map(input => STEP_CONFIGS[input.field]).filter(Boolean);
  const currentStepConfig = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const togglePerson = (label: string) => {
    setValues(prev => ({
      ...prev,
      affectedPersons: prev.affectedPersons.includes(label)
        ? prev.affectedPersons.filter((p: string) => p !== label)
        : [...prev.affectedPersons, label],
    }));
  };

  const addCustomPerson = () => {
    if (customPerson.trim() && !values.affectedPersons.includes(customPerson.trim())) {
      setValues(prev => ({
        ...prev,
        affectedPersons: [...prev.affectedPersons, customPerson.trim()],
      }));
      setCustomPerson("");
    }
  };

  const removeCustomPerson = (person: string) => {
    setValues(prev => ({
      ...prev,
      affectedPersons: prev.affectedPersons.filter((p: string) => p !== person),
    }));
  };

  const canProceed = () => {
    const field = currentStepConfig?.field;
    if (field === "affectedPersons") {
      return values.affectedPersons.length > 0;
    }
    if (field === "transparencyDescription") {
      return values.transparencyDescription.trim().length > 5;
    }
    if (field === "humanOversightDescription") {
      return values.humanOversightDescription.trim().length > 5;
    }
    return true;
  };

  const handleNext = () => {
    if (isLastStep) {
      onComplete(values);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onCancel();
    }
  };

  if (!currentStepConfig) return null;

  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Lara</span>
          </div>
          <span className="text-sm text-muted-foreground">trenger litt mer info</span>
        </div>
        
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-2 rounded-full transition-colors",
                index === currentStep
                  ? "bg-primary"
                  : index < currentStep
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-xl mb-4">
          <div className="text-primary">
            {currentStepConfig.icon}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-1">
          {currentStepConfig.title}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentStepConfig.subtitle}
        </p>
      </div>

      {/* Input area based on field type */}
      <div className="space-y-4">
        {currentStepConfig.field === "affectedPersons" && (
          <>
            {/* Chip selector */}
            <div className="flex flex-wrap justify-center gap-2">
              {AFFECTED_PERSONS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => togglePerson(option.label)}
                  className={cn(
                    "px-4 py-2.5 text-sm rounded-full border-2 transition-all",
                    values.affectedPersons.includes(option.label)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border hover:border-primary/50"
                  )}
                >
                  {values.affectedPersons.includes(option.label) && (
                    <Check className="h-3.5 w-3.5 inline mr-1.5" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex gap-2 max-w-xs mx-auto">
              <Input
                placeholder="Legg til annen..."
                value={customPerson}
                onChange={(e) => setCustomPerson(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomPerson()}
                className="text-center"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={addCustomPerson}
                disabled={!customPerson.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Custom persons badges */}
            {values.affectedPersons.filter(
              (p: string) => !AFFECTED_PERSONS_OPTIONS.map(o => o.label).includes(p)
            ).length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {values.affectedPersons
                  .filter((p: string) => !AFFECTED_PERSONS_OPTIONS.map(o => o.label).includes(p))
                  .map((person: string) => (
                    <Badge key={person} variant="secondary" className="pr-1">
                      {person}
                      <button
                        onClick={() => removeCustomPerson(person)}
                        className="ml-1.5 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
              </div>
            )}
          </>
        )}

        {currentStepConfig.field === "transparencyDescription" && (
          <Textarea
            placeholder="F.eks. 'Brukere informeres via et banner i appen...'"
            value={values.transparencyDescription}
            onChange={(e) => setValues(prev => ({ ...prev, transparencyDescription: e.target.value }))}
            rows={3}
            className="resize-none text-center"
          />
        )}

        {currentStepConfig.field === "humanOversightDescription" && (
          <Textarea
            placeholder="F.eks. 'Alle AI-avgjørelser gjennomgås av en saksbehandler...'"
            value={values.humanOversightDescription}
            onChange={(e) => setValues(prev => ({ ...prev, humanOversightDescription: e.target.value }))}
            rows={3}
            className="resize-none text-center"
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-2 pt-2">
        <Button variant="ghost" onClick={handleBack} className="flex-1">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {currentStep === 0 ? "Avbryt" : "Tilbake"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed()}
          className="flex-1"
        >
          {isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-1" />
              Fullfør
            </>
          ) : (
            <>
              Neste
              <ChevronRight className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
