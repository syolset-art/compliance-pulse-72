import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Eye,
  MessageSquare,
  ChevronRight,
  Plus,
  X,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import type { RequiredInput } from "@/hooks/useProcessAIDraft";

interface ProactiveInputSectionProps {
  requiresUserInput: RequiredInput[];
  onOpenDialog: () => void;
  onValuesCollected?: (values: Record<string, any>) => void;
}

const AFFECTED_PERSONS_SUGGESTIONS = [
  { label: "Ansatte", value: "employees" },
  { label: "Kunder", value: "customers" },
  { label: "Jobbsøkere", value: "job_applicants" },
  { label: "Brukere", value: "users" },
  { label: "Pasienter", value: "patients" },
  { label: "Studenter", value: "students" },
];

export const ProactiveInputSection = ({
  requiresUserInput,
  onOpenDialog,
}: ProactiveInputSectionProps) => {
  const { t } = useTranslation();
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);
  const [customPerson, setCustomPerson] = useState("");
  const [transparencyText, setTransparencyText] = useState("");
  const [oversightText, setOversightText] = useState("");

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "affectedPersons":
        return <Users className="h-4 w-4" />;
      case "transparencyDescription":
        return <Eye className="h-4 w-4" />;
      case "humanOversightDescription":
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getFieldGuidance = (field: string): { title: string; description: string; placeholder?: string } => {
    switch (field) {
      case "affectedPersons":
        return {
          title: t("processAI.proactive.affectedPersonsTitle", "Hvem påvirkes av AI-bruken?"),
          description: t("processAI.proactive.affectedPersonsDesc", "Velg alle gruppene som berøres når AI-systemet tar avgjørelser eller gir anbefalinger."),
        };
      case "transparencyDescription":
        return {
          title: t("processAI.proactive.transparencyTitle", "Hvordan informeres berørte personer?"),
          description: t("processAI.proactive.transparencyDesc", "Beskriv kort hvordan dere gir beskjed om at AI brukes i denne prosessen."),
          placeholder: t("processAI.proactive.transparencyPlaceholder", "F.eks. 'Brukere får en melding ved innlogging som forklarer at AI brukes til...'"),
        };
      case "humanOversightDescription":
        return {
          title: t("processAI.proactive.oversightTitle", "Hvordan sikres menneskelig kontroll?"),
          description: t("processAI.proactive.oversightDesc", "Beskriv hvordan mennesker kan overstyre eller kontrollere AI-avgjørelser."),
          placeholder: t("processAI.proactive.oversightPlaceholder", "F.eks. 'Alle AI-anbefalinger gjennomgås av en saksbehandler før vedtak fattes.'"),
        };
      default:
        return {
          title: field,
          description: "",
        };
    }
  };

  const togglePerson = (value: string) => {
    setSelectedPersons(prev => 
      prev.includes(value) 
        ? prev.filter(p => p !== value)
        : [...prev, value]
    );
  };

  const addCustomPerson = () => {
    if (customPerson.trim() && !selectedPersons.includes(customPerson.trim())) {
      setSelectedPersons(prev => [...prev, customPerson.trim()]);
      setCustomPerson("");
    }
  };

  const removeCustomPerson = (person: string) => {
    setSelectedPersons(prev => prev.filter(p => p !== person));
  };

  const isFieldComplete = (field: string) => {
    switch (field) {
      case "affectedPersons":
        return selectedPersons.length > 0;
      case "transparencyDescription":
        return transparencyText.trim().length > 10;
      case "humanOversightDescription":
        return oversightText.trim().length > 10;
      default:
        return false;
    }
  };

  const getCompletedCount = () => {
    return requiresUserInput.filter(input => isFieldComplete(input.field)).length;
  };

  const allFieldsComplete = getCompletedCount() === requiresUserInput.length;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-800 rounded-full">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {t("processAI.proactive.nextSteps", "Neste steg: Legg til manglende informasjon")}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              {getCompletedCount()}/{requiresUserInput.length} {t("processAI.proactive.fieldsComplete", "felt fullført")}
            </p>
          </div>
        </div>
        {allFieldsComplete && (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t("processAI.proactive.ready", "Klar!")}
          </Badge>
        )}
      </div>

      {/* Expandable input fields */}
      <div className="space-y-2">
        {requiresUserInput.map((input) => {
          const isExpanded = expandedField === input.field;
          const isComplete = isFieldComplete(input.field);
          const guidance = getFieldGuidance(input.field);

          return (
            <div
              key={input.field}
              className={`border rounded-lg transition-all duration-200 ${
                isExpanded 
                  ? "border-primary bg-primary/5 shadow-sm" 
                  : isComplete
                  ? "border-green-200 bg-green-50/50 dark:bg-green-900/10"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <button
                onClick={() => setExpandedField(isExpanded ? null : input.field)}
                className="w-full p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-full ${
                    isComplete 
                      ? "bg-green-100 text-green-600" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {isComplete ? <CheckCircle2 className="h-4 w-4" /> : getFieldIcon(input.field)}
                  </div>
                  <div>
                    <span className={`text-sm font-medium ${isComplete ? "text-green-700 dark:text-green-400" : ""}`}>
                      {guidance.title}
                    </span>
                    {isComplete && input.field === "affectedPersons" && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedPersons.slice(0, 3).join(", ")}
                        {selectedPersons.length > 3 && ` +${selectedPersons.length - 3}`}
                      </p>
                    )}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                  <p className="text-sm text-muted-foreground pt-3">
                    {guidance.description}
                  </p>

                  {input.field === "affectedPersons" && (
                    <div className="space-y-3">
                      {/* Quick select chips */}
                      <div className="flex flex-wrap gap-2">
                        {AFFECTED_PERSONS_SUGGESTIONS.map((person) => (
                          <button
                            key={person.value}
                            onClick={() => togglePerson(person.label)}
                            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                              selectedPersons.includes(person.label)
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-border"
                            }`}
                          >
                            {selectedPersons.includes(person.label) && (
                              <CheckCircle2 className="h-3 w-3 inline mr-1" />
                            )}
                            {person.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom person input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder={t("processAI.proactive.addCustomGroup", "Legg til annen gruppe...")}
                          value={customPerson}
                          onChange={(e) => setCustomPerson(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addCustomPerson()}
                          className="flex-1"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={addCustomPerson}
                          disabled={!customPerson.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Selected custom persons */}
                      {selectedPersons.filter(p => !AFFECTED_PERSONS_SUGGESTIONS.map(s => s.label).includes(p)).length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedPersons
                            .filter(p => !AFFECTED_PERSONS_SUGGESTIONS.map(s => s.label).includes(p))
                            .map((person) => (
                              <Badge key={person} variant="secondary" className="pr-1">
                                {person}
                                <button 
                                  onClick={() => removeCustomPerson(person)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {input.field === "transparencyDescription" && (
                    <Textarea
                      placeholder={guidance.placeholder}
                      value={transparencyText}
                      onChange={(e) => setTransparencyText(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  )}

                  {input.field === "humanOversightDescription" && (
                    <Textarea
                      placeholder={guidance.placeholder}
                      value={oversightText}
                      onChange={(e) => setOversightText(e.target.value)}
                      rows={3}
                      className="resize-none"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <Button 
        onClick={onOpenDialog}
        className="w-full"
        variant={allFieldsComplete ? "default" : "outline"}
      >
        {allFieldsComplete ? (
          <>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t("processAI.proactive.completeNow", "Fullfør dokumentasjonen")}
          </>
        ) : (
          <>
            {t("processAI.proactive.openFullForm", "Åpne fullstendig skjema")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
};
