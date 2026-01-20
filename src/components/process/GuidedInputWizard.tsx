import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Check,
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
    title: "Hvem påvirkes av AI-bruken?",
    subtitle: "Velg alle relevante grupper",
    icon: <Users className="h-5 w-5" />,
  },
  transparencyDescription: {
    field: "transparencyDescription",
    title: "Hvordan informeres de berørte?",
    subtitle: "Beskriv hvordan brukere får vite om AI-bruken",
    icon: <Eye className="h-5 w-5" />,
  },
  humanOversightDescription: {
    field: "humanOversightDescription",
    title: "Hvordan sikres menneskelig kontroll?",
    subtitle: "Beskriv hvordan mennesker kan overstyre AI-beslutninger",
    icon: <UserCheck className="h-5 w-5" />,
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
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      {/* Header with progress */}
      <div className="px-5 py-4 bg-muted/40 border-b">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            Steg {currentStep + 1} av {steps.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="p-6 space-y-6">
        {/* Question header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
            {currentStepConfig.icon}
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">
              {currentStepConfig.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {currentStepConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-4">
          {currentStepConfig.field === "affectedPersons" && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AFFECTED_PERSONS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => togglePerson(option.label)}
                    className={cn(
                      "px-4 py-3 text-sm rounded-xl border transition-all text-left",
                      values.affectedPersons.includes(option.label)
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-background hover:bg-muted border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {values.affectedPersons.includes(option.label) && (
                        <Check className="h-4 w-4 shrink-0" />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Legg til annen gruppe..."
                  value={customPerson}
                  onChange={(e) => setCustomPerson(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCustomPerson()}
                  className="h-11"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={addCustomPerson}
                  disabled={!customPerson.trim()}
                  className="h-11 w-11 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Custom persons badges */}
              {values.affectedPersons.filter(
                (p: string) => !AFFECTED_PERSONS_OPTIONS.map(o => o.label).includes(p)
              ).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {values.affectedPersons
                    .filter((p: string) => !AFFECTED_PERSONS_OPTIONS.map(o => o.label).includes(p))
                    .map((person: string) => (
                      <Badge key={person} variant="secondary" className="pr-1.5 py-1.5">
                        {person}
                        <button
                          onClick={() => removeCustomPerson(person)}
                          className="ml-2 hover:text-destructive"
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
              placeholder="F.eks. «Brukere informeres via et banner når de først logger inn, samt i personvernerklæringen»"
              value={values.transparencyDescription}
              onChange={(e) => setValues(prev => ({ ...prev, transparencyDescription: e.target.value }))}
              rows={4}
              className="resize-none text-base"
            />
          )}

          {currentStepConfig.field === "humanOversightDescription" && (
            <Textarea
              placeholder="F.eks. «Alle automatiske vedtak kan ankes og vil da bli gjennomgått manuelt av en saksbehandler»"
              value={values.humanOversightDescription}
              onChange={(e) => setValues(prev => ({ ...prev, humanOversightDescription: e.target.value }))}
              rows={4}
              className="resize-none text-base"
            />
          )}
        </div>
      </div>

      {/* Footer navigation */}
      <div className="px-6 py-4 bg-muted/20 border-t flex gap-3">
        <Button variant="ghost" onClick={handleBack} className="h-11">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? "Avbryt" : "Tilbake"}
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!canProceed()}
          className="flex-1 h-11"
        >
          {isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Fullfør dokumentasjon
            </>
          ) : (
            <>
              Neste
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};