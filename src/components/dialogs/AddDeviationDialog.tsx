import { useState, useMemo } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import {
  deviationCategories,
  criticalityOptions,
  availableFrameworks,
  type DeviationCategory,
} from "@/lib/deviationCategories";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Check,
  PenLine,
  CalendarIcon,
  Info,
  Building2,
  User,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface AddDeviationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DeviationSuggestion {
  title: string;
  description: string;
  suggestedCriticality: "critical" | "high" | "medium" | "low";
  suggestedFrameworks: string[];
  reason: string;
}

type Step = "category" | "suggestions" | "confirm";

export function AddDeviationDialog({ open, onOpenChange }: AddDeviationDialogProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("category");
  const [selectedCategory, setSelectedCategory] = useState<DeviationCategory | null>(null);
  const [suggestions, setSuggestions] = useState<DeviationSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<DeviationSuggestion | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);

  // Form state for confirmation step
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    criticality: "medium" as "critical" | "high" | "medium" | "low",
    responsible: "",
    frameworks: [] as string[],
    discoveredAt: new Date(),
    dueDate: null as Date | null,
    workAreaScope: "none" as "all" | "specific" | "none",
    linkedWorkAreaIds: [] as string[],
  });

  const people = [
    "Kari Nordmann",
    "Ola Hansen",
    "Maria Johansen",
    "Erik Solberg",
    "Ingrid Bakken",
    "Thomas Berg",
  ];

  // Fetch systems
  const { data: systems = [] } = useQuery({
    queryKey: ["systems-for-deviations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("systems").select("id, name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch work areas
  const { data: workAreas = [] } = useQuery({
    queryKey: ["work-areas-for-deviations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("work_areas").select("id, name, responsible_person");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch company profile for industry context
  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const { data, error } = await supabase.from("company_profile").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Build dynamic responsible person list based on selected work areas
  const responsiblePersonOptions = useMemo(() => {
    const persons = new Set<string>();
    if (formData.workAreaScope === "specific" && formData.linkedWorkAreaIds.length > 0) {
      workAreas
        .filter((wa) => formData.linkedWorkAreaIds.includes(wa.id))
        .forEach((wa) => {
          if (wa.responsible_person) persons.add(wa.responsible_person);
        });
    } else if (formData.workAreaScope === "all") {
      workAreas.forEach((wa) => {
        if (wa.responsible_person) persons.add(wa.responsible_person);
      });
    }
    // Always include the hardcoded people list
    people.forEach((p) => persons.add(p));
    return Array.from(persons);
  }, [formData.workAreaScope, formData.linkedWorkAreaIds, workAreas, people]);

  // Create deviation mutation
  const createDeviation = useMutation({
    mutationFn: async () => {
      const systemId = systems[0]?.id;
      if (!systemId) throw new Error("Ingen systemer funnet");

      const { error } = await supabase.from("system_incidents").insert({
        system_id: systemId,
        title: formData.title,
        description: formData.description,
        category: selectedCategory?.id || "annet",
        criticality: formData.criticality,
        responsible: formData.responsible || null,
        relevant_frameworks: formData.frameworks,
        status: "open",
        measures_count: 0,
        measures_completed: 0,
        systems_count: 1,
        processes_count: 0,
        due_date: formData.dueDate ? format(formData.dueDate, "yyyy-MM-dd") : null,
        discovered_at: format(formData.discoveredAt, "yyyy-MM-dd"),
        work_area_scope: formData.workAreaScope,
        linked_work_area_ids: formData.linkedWorkAreaIds,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deviations"] });
      toast.success("Avvik opprettet");
      handleClose();
    },
    onError: (error) => {
      console.error("Error creating deviation:", error);
      toast.error("Kunne ikke opprette avvik");
    },
  });

  const handleClose = () => {
    setStep("category");
    setSelectedCategory(null);
    setSuggestions([]);
    setSelectedSuggestion(null);
    setIsManualMode(false);
    setFormData({
      title: "",
      description: "",
      criticality: "medium",
      responsible: "",
      frameworks: [],
      discoveredAt: new Date(),
      dueDate: null,
      workAreaScope: "none",
      linkedWorkAreaIds: [],
    });
    onOpenChange(false);
  };

  const handleCategorySelect = async (category: DeviationCategory) => {
    setSelectedCategory(category);
    setIsLoadingSuggestions(true);
    setStep("suggestions");

    try {
      const response = await supabase.functions.invoke("suggest-deviations", {
        body: {
          category: category.id,
          industry: companyProfile?.industry || undefined,
          existingSystems: systems.map((s) => s.name),
        },
      });

      if (response.error) throw response.error;

      const data = response.data as { suggestions: DeviationSuggestion[] };
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Kunne ikke hente AI-forslag. Du kan beskrive avviket selv.");
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: DeviationSuggestion) => {
    setSelectedSuggestion(suggestion);
    setFormData({
      title: suggestion.title,
      description: suggestion.description,
      criticality: suggestion.suggestedCriticality,
      responsible: "",
      frameworks: suggestion.suggestedFrameworks,
      discoveredAt: new Date(),
      dueDate: null,
      workAreaScope: "none",
      linkedWorkAreaIds: [],
    });
    setStep("confirm");
  };

  const handleManualEntry = () => {
    setIsManualMode(true);
    setFormData({
      title: "",
      description: "",
      criticality: "medium",
      responsible: "",
      frameworks: selectedCategory?.defaultFrameworks || [],
      discoveredAt: new Date(),
      dueDate: null,
      workAreaScope: "none",
      linkedWorkAreaIds: [],
    });
    setStep("confirm");
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("suggestions");
      setSelectedSuggestion(null);
      setIsManualMode(false);
    } else if (step === "suggestions") {
      setStep("category");
      setSelectedCategory(null);
      setSuggestions([]);
    }
  };

  const toggleFramework = (fw: string) => {
    setFormData((prev) => ({
      ...prev,
      frameworks: prev.frameworks.includes(fw)
        ? prev.frameworks.filter((f) => f !== fw)
        : [...prev.frameworks, fw],
    }));
  };

  const getStepProgress = () => {
    switch (step) {
      case "category":
        return 33;
      case "suggestions":
        return 66;
      case "confirm":
        return 100;
    }
  };

  const getCriticalityStyle = (value: string) => {
    const option = criticalityOptions.find((o) => o.value === value);
    return option ? cn(option.bgColor, option.color) : "";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {/* Progress bar */}
        <div className="px-6 pt-6 pb-0">
          <Progress value={getStepProgress()} className="h-1.5 rounded-full" />
        </div>

        <div className="px-6 pb-6 pt-4">
        {/* Back button */}
        {step !== "category" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="gap-1 text-muted-foreground mb-3 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
        )}

        {/* Step 1: Category Selection */}
        {step === "category" && (
          <>
            <DialogHeader className="pt-4">
              <DialogTitle className="text-xl">Hva slags avvik vil du registrere?</DialogTitle>
              <DialogDescription>
                Velg kategori for å få relevante forslag
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 py-4">
              {deviationCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-border transition-all",
                      "hover:border-primary/50",
                      category.bgColor,
                      category.hoverBgColor
                    )}
                  >
                    <Icon className={cn("h-8 w-8", category.color)} />
                    <span className="font-medium text-sm text-foreground">{category.label}</span>
                    <span className="text-xs text-muted-foreground text-center line-clamp-2">
                      {category.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Step 2: AI Suggestions */}
        {step === "suggestions" && selectedCategory && (
          <>
            <DialogHeader className="pt-8">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <DialogTitle>Forslag for: {selectedCategory.label}</DialogTitle>
              </div>
              <DialogDescription>
                Velg et forslag eller beskriv avviket selv
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-3">
              {isLoadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Genererer forslag...</p>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => {
                  const critStyle = getCriticalityStyle(suggestion.suggestedCriticality);
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestionSelect(suggestion)}
                      className="w-full text-left p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-1">{suggestion.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <Badge className={cn("shrink-0 text-xs font-semibold", critStyle)}>
                          {criticalityOptions.find((o) => o.value === suggestion.suggestedCriticality)?.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {suggestion.suggestedFrameworks.map((fw) => (
                          <Badge key={fw} variant="outline" className="text-xs">
                            {fw}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {suggestion.reason}
                      </p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Ingen forslag tilgjengelig. Beskriv avviket selv.</p>
                </div>
              )}

              {/* Manual entry option */}
              <button
                onClick={handleManualEntry}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/30 transition-all text-muted-foreground hover:text-foreground"
              >
                <PenLine className="h-4 w-4" />
                <span>Ingen av disse? Beskriv selv</span>
              </button>
            </div>
          </>
        )}

        {/* Step 3: Confirm/Edit */}
        {step === "confirm" && (
          <>
            <DialogHeader className="pt-8">
              <DialogTitle className="flex items-center gap-2">
                {isManualMode ? (
                  "Beskriv avviket"
                ) : (
                  <>
                    <Check className="h-5 w-5 text-primary" />
                    Bekreft avvik
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {isManualMode
                  ? "Fyll inn detaljene for avviket"
                  : "Juster detaljene hvis nødvendig"}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  Tittel
                  {!isManualMode && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" /> AI
                    </Badge>
                  )}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Beskriv avviket kort"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  Beskrivelse
                  {!isManualMode && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Sparkles className="h-3 w-3" /> AI
                    </Badge>
                  )}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detaljert beskrivelse av avviket"
                  rows={3}
                />
              </div>

              {/* Category & Criticality */}
              <div className="flex items-center gap-4">
                {selectedCategory && (
                  <Badge className={cn("text-sm", selectedCategory.bgColor, selectedCategory.color)}>
                    {selectedCategory.label}
                  </Badge>
                )}
                <div className="flex gap-2">
                  {criticalityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          criticality: option.value as typeof formData.criticality,
                        }))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                        formData.criticality === option.value
                          ? cn(option.bgColor, option.color, "border-current")
                          : "border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frameworks */}
              <div className="space-y-2">
                <Label>Regelverk</Label>
                <div className="flex flex-wrap gap-2">
                  {availableFrameworks.map((fw) => (
                    <button
                      key={fw}
                      onClick={() => toggleFramework(fw)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                        formData.frameworks.includes(fw)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {fw}
                    </button>
                  ))}
                </div>
              </div>

              {/* Framework help info */}
              {selectedCategory && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Hvilke regelverk kan være påvirket?</p>
                    <p className="text-muted-foreground">
                      For <span className="font-medium">{selectedCategory.label.toLowerCase()}</span> er typisk {selectedCategory.defaultFrameworks.join(", ")} relevante. Du kan justere valget over.
                    </p>
                  </div>
                </div>
              )}

              {/* Dates row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Oppdaget dato</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.discoveredAt, "d. MMM yyyy", { locale: nb })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.discoveredAt}
                        onSelect={(date) => date && setFormData((prev) => ({ ...prev, discoveredAt: date }))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Frist for utbedring (valgfritt)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate
                          ? format(formData.dueDate, "d. MMM yyyy", { locale: nb })
                          : "Velg dato"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate ?? undefined}
                        onSelect={(date) => setFormData((prev) => ({ ...prev, dueDate: date ?? null }))}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Responsible */}
              <div className="space-y-2">
                <Label>Ansvarlig (valgfritt)</Label>
                <Select
                  value={formData.responsible}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, responsible: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Velg ansvarlig person" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Avbryt
              </Button>
              <Button
                onClick={() => createDeviation.mutate()}
                disabled={!formData.title.trim() || createDeviation.isPending}
              >
                {createDeviation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Oppretter...
                  </>
                ) : (
                  "Opprett avvik"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
