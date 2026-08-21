import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Loader2,
  Check,
  ChevronLeft,
  ChevronRight,
  Building2,
  ShieldAlert,
  FileCheck2,
} from "lucide-react";
import { LaraIcon } from "@/components/agents/LaraIcon";
import { LaraFieldSuggestion } from "@/components/asset-profile/usage/LaraFieldSuggestion";
import { cn } from "@/lib/utils";
import {
  DATA_CLASS_OPTIONS,
  SPECIAL_CATEGORIES,
  LEGAL_BASIS_OPTIONS,
  type DataClass,
} from "@/lib/processingActivity";

interface ActivitySuggestion {
  purpose: string;
  purpose_reason?: string;
  legal_basis: string;
  legal_basis_reason?: string;
  suggested_data_class: DataClass;
  data_class_reason?: string;
  description?: string;
}

interface ProcessingActivityWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Forhåndsvalgt system (valgfritt — ellers vises systemvelger) */
  systemId?: string;
  systemName?: string;
  workAreaId?: string;
  workAreaName?: string;
  /** Redigeringsmodus: eksisterende aktivitet (f.eks. utkast) som skal gjennomgås/bekreftes */
  existingProcess?: {
    id: string;
    system_id?: string | null;
    system_name?: string | null;
    name: string | null;
    description: string | null;
    purpose: string | null;
    data_class: string | null;
    special_categories: string[] | null;
    legal_basis: string | null;
    controller_name: string | null;
    ai_suggested_fields?: Record<string, unknown> | null;
  };
  onSaved?: () => void;
}

/** Felt som kan være AI-foreslått og krever menneskelig bekreftelse. */
type AiField = "purpose" | "legal_basis" | "data_class";

export function ProcessingActivityWizardDialog({
  open,
  onOpenChange,
  systemId: initialSystemId,
  systemName: initialSystemName,
  workAreaId,
  workAreaName,
  existingProcess,
  onSaved,
}: ProcessingActivityWizardDialogProps) {
  const { i18n } = useTranslation();
  const isNb = i18n.language !== "en";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [selectedSystemId, setSelectedSystemId] = useState(initialSystemId || "");
  const [suggestion, setSuggestion] = useState<ActivitySuggestion | null>(null);
  const [controllerName, setControllerName] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Skjemaverdier
  const [purpose, setPurpose] = useState("");
  const [dataClass, setDataClass] = useState<DataClass | "">("");
  const [specialCategories, setSpecialCategories] = useState<string[]>([]);
  const [legalBasis, setLegalBasis] = useState("");
  const [activityName, setActivityName] = useState("");
  const [description, setDescription] = useState("");

  // Hvilke felt som fortsatt er ubesvarede AI-forslag
  const [aiSuggested, setAiSuggested] = useState<Record<AiField, boolean>>({
    purpose: false,
    legal_basis: false,
    data_class: false,
  });

  // Systemvalg når dialogen åpnes uten forhåndsvalgt system
  const { data: systems = [] } = useQuery({
    queryKey: ["pa-wizard-systems", workAreaId],
    queryFn: async () => {
      if (workAreaId) {
        const { data, error } = await supabase
          .from("systems")
          .select("id, name")
          .eq("work_area_id", workAreaId)
          .order("name");
        if (error) throw error;
        if (data && data.length > 0) return data;
      }
      // Fallback: alle systemer (f.eks. når ingen er knyttet til arbeidsområdet ennå)
      const { data, error } = await supabase.from("systems").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: open && !initialSystemId && !existingProcess,
  });

  const selectedSystemName = useMemo(() => {
    if (initialSystemName) return initialSystemName;
    if (existingProcess?.system_name) return existingProcess.system_name;
    return systems.find((s) => s.id === selectedSystemId)?.name || "";
  }, [initialSystemName, existingProcess, systems, selectedSystemId]);

  const reset = () => {
    setStep(0);
    setControllerName(null);
    // Redigeringsmodus: forhåndsutfyll fra eksisterende aktivitet og bygg et
    // syntetisk forslagsobjekt slik at AI-merkede felt kan godkjennes felt for felt.
    if (existingProcess) {
      setSelectedSystemId(existingProcess.system_id || initialSystemId || "");
      setPurpose(existingProcess.purpose || "");
      setDataClass((existingProcess.data_class as DataClass | "") || "");
      setSpecialCategories(existingProcess.special_categories || []);
      setLegalBasis(existingProcess.legal_basis || "");
      setActivityName(existingProcess.name || "");
      setDescription(existingProcess.description || "");
      setControllerName(existingProcess.controller_name || null);
      const flags = (existingProcess.ai_suggested_fields || {}) as Record<string, unknown>;
      setAiSuggested({
        purpose: !!flags.purpose && !!existingProcess.purpose,
        legal_basis: !!flags.legal_basis && !!existingProcess.legal_basis,
        data_class: !!flags.data_class && !!existingProcess.data_class,
      });
      setSuggestion({
        purpose: existingProcess.purpose || "",
        legal_basis: existingProcess.legal_basis || "",
        suggested_data_class: (existingProcess.data_class as DataClass) || "ordinary",
        description: existingProcess.description || "",
      });
      return;
    }
    setSelectedSystemId(initialSystemId || "");
    setSuggestion(null);
    setPurpose("");
    setDataClass("");
    setSpecialCategories([]);
    setLegalBasis("");
    setActivityName("");
    setDescription("");
    setAiSuggested({ purpose: false, legal_basis: false, data_class: false });
  };

  useEffect(() => {
    if (open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSystemId, existingProcess?.id]);

  const fetchSuggestion = async (sysId: string) => {
    setIsLoadingSuggestion(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-processing-activity", {
        body: { system_id: sysId, language: isNb ? "nb" : "en" },
      });
      if (error) throw error;
      if (data?.suggestion) {
        const s = data.suggestion as ActivitySuggestion;
        setSuggestion(s);
        setPurpose(s.purpose || "");
        setLegalBasis(s.legal_basis || "");
        setDataClass(s.suggested_data_class || "ordinary");
        setDescription(s.description || "");
        setAiSuggested({ purpose: !!s.purpose, legal_basis: !!s.legal_basis, data_class: !!s.suggested_data_class });
      }
      if (data?.controller_name) setControllerName(data.controller_name);
    } catch (e) {
      console.error("Suggestion error:", e);
      toast({
        title: isNb ? "Kunne ikke hente AI-forslag" : "Could not fetch AI suggestion",
        description: isNb ? "Du kan fylle inn manuelt." : "You can fill in manually.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  // Fallback: hent juridisk navn fra company_profile dersom AI-svaret ikke ga det
  useEffect(() => {
    if (!open || controllerName) return;
    supabase
      .from("company_profile")
      .select("legal_name, name")
      .single()
      .then(({ data }) => {
        if (data) setControllerName(data.legal_name || data.name || null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const startWithSystem = (sysId: string) => {
    setSelectedSystemId(sysId);
    fetchSuggestion(sysId);
  };

  useEffect(() => {
    if (open && initialSystemId && !existingProcess) fetchSuggestion(initialSystemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSystemId, existingProcess]);

  const toggleCategory = (key: string) => {
    setSpecialCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const confirmField = (field: AiField) => {
    setAiSuggested((prev) => ({ ...prev, [field]: false }));
  };

  const editField = <K extends AiField>(field: K, setter: (v: never) => void) => (v: string) => {
    setter(v as never);
    setAiSuggested((prev) => ({ ...prev, [field]: false }));
  };

  const hasUnconfirmed = Object.values(aiSuggested).some(Boolean);

  const save = async (confirm: boolean) => {
    if (!selectedSystemId || !purpose.trim()) return;
    setIsSaving(true);
    try {
      const name =
        activityName.trim() ||
        (isNb
          ? `Bruk av ${selectedSystemName}`
          : `Use of ${selectedSystemName}`);

      const { data: userResp } = await supabase.auth.getUser();
      const who = userResp?.user?.email ?? userResp?.user?.id ?? null;

      const values = {
        name,
        description: description.trim() || null,
        purpose: purpose.trim(),
        data_class: dataClass || null,
        special_categories: dataClass === "sensitive" ? specialCategories : null,
        legal_basis: legalBasis || null,
        controller_name: controllerName,
        status: confirm ? "active" : "draft",
        ai_suggested_fields: confirm
          ? {}
          : Object.fromEntries(Object.entries(aiSuggested).filter(([, v]) => v)),
        confirmed_by: confirm ? who : null,
        confirmed_at: confirm ? new Date().toISOString() : null,
      };

      let error;
      if (existingProcess) {
        // Redigeringsmodus: oppdater eksisterende aktivitet (f.eks. bekreft et utkast)
        ({ error } = await supabase
          .from("system_processes")
          .update(values as never)
          .eq("id", existingProcess.id));
        if (!error && confirm) {
          // Løs koblede oppgaver i oppgavekøen
          await supabase
            .from("user_tasks")
            .update({ status: "fullført" } as never)
            .eq("process_id", existingProcess.id);
        }
      } else {
        ({ error } = await supabase.from("system_processes").insert({
          ...values,
          system_id: selectedSystemId,
        } as never));
      }
      if (error) throw error;

      // RoPA er knyttet til arbeidsområdet via systemet: sørg for at systemet
      // ligger i arbeidsområdet (kun hvis det ikke allerede har et eierområde).
      if (workAreaId && !existingProcess) {
        await supabase
          .from("systems")
          .update({ work_area_id: workAreaId } as never)
          .eq("id", selectedSystemId)
          .is("work_area_id", null);
        queryClient.invalidateQueries({ queryKey: ["systems"] });
      }

      queryClient.invalidateQueries({ queryKey: ["wa-processing-activities"] });
      queryClient.invalidateQueries({ queryKey: ["work-area-processes"] });
      queryClient.invalidateQueries({ queryKey: ["processes"] });
      queryClient.invalidateQueries({ queryKey: ["user-tasks"] });

      toast({
        title: confirm
          ? existingProcess
            ? isNb ? "Behandlingsaktivitet bekreftet" : "Processing activity confirmed"
            : isNb ? "Behandlingsaktivitet opprettet" : "Processing activity created"
          : isNb ? "Utkast lagret" : "Draft saved",
        description: confirm
          ? isNb
            ? `«${name}» er bekreftet og lagt til i behandlingsprotokollen.`
            : `"${name}" is confirmed and added to the records.`
          : isNb
            ? `«${name}» er lagret som utkast og venter bekreftelse.`
            : `"${name}" is saved as a draft pending confirmation.`,
      });
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      console.error("Save error:", e);
      toast({
        title: isNb ? "Feil" : "Error",
        description: isNb ? "Kunne ikke lagre behandlingsaktiviteten." : "Could not save the processing activity.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const stepTitles = isNb
    ? ["Formål", "Datatype", "Gjennomgang"]
    : ["Purpose", "Data class", "Review"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            {existingProcess
              ? isNb ? "Gå gjennom behandlingsaktivitet" : "Review processing activity"
              : isNb ? "Ny behandlingsaktivitet" : "New processing activity"}
            {selectedSystemName && (
              <span className="text-muted-foreground font-normal">– {selectedSystemName}</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Stegindikator */}
        <div className="flex items-center gap-2 mb-2">
          {stepTitles.map((title, i) => (
            <div key={title} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  i === step ? "text-foreground font-medium" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "border-2 border-primary text-primary"
                        : "border border-border",
                  )}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{title}</span>
              </div>
              {i < stepTitles.length - 1 && <div className="h-px w-4 bg-border" />}
            </div>
          ))}
        </div>

        {/* STEG 0: Formål */}
        {step === 0 && (
          <div className="space-y-4">
            {!initialSystemId && !existingProcess && (
              <div className="space-y-2">
                <Label>{isNb ? "System *" : "System *"}</Label>
                <Select value={selectedSystemId} onValueChange={startWithSystem}>
                  <SelectTrigger>
                    <SelectValue placeholder={isNb ? "Velg system..." : "Select system..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {systems.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {isNb
                      ? "Ingen systemer registrert her ennå. Legg til et system først."
                      : "No systems registered here yet. Add a system first."}
                  </p>
                )}
              </div>
            )}

            {isLoadingSuggestion && (
              <div className="text-center py-6">
                <Loader2 className="h-7 w-7 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isNb
                    ? "Lara foreslår formål basert på systemet og bransjen..."
                    : "Lara is suggesting a purpose based on the system and industry..."}
                </p>
              </div>
            )}

            {!isLoadingSuggestion && selectedSystemId && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="pa-purpose">
                    {isNb ? "Hva er formålet med å bruke systemet? *" : "What is the purpose of using the system? *"}
                  </Label>
                  <Textarea
                    id="pa-purpose"
                    value={purpose}
                    onChange={(e) => editField("purpose", setPurpose)(e.target.value)}
                    rows={3}
                    placeholder={isNb ? "F.eks. Lagring av dokumenter..." : "E.g. Storage of documents..."}
                  />
                  {aiSuggested.purpose && suggestion && (
                    <LaraFieldSuggestion
                      isNb={isNb}
                      suggestedLabel={suggestion.purpose}
                      reason={suggestion.purpose_reason}
                      onApprove={() => confirmField("purpose")}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStep(1)}
                disabled={!selectedSystemId || !purpose.trim() || isLoadingSuggestion}
              >
                {isNb ? "Neste" : "Next"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEG 1: Datatype */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{isNb ? "Hvilken datatype behandles i systemet? *" : "What type of data is processed in the system? *"}</Label>
              {aiSuggested.data_class && suggestion && (
                <div className="flex items-start gap-1.5 rounded-md border border-primary/15 bg-primary/5 p-2 text-[13px] leading-tight">
                  <LaraIcon size={16} />
                  <span className="text-muted-foreground">
                    {isNb ? "Forslag: " : "Suggestion: "}
                    <span className="font-medium text-foreground">
                      {DATA_CLASS_OPTIONS.find((o) => o.value === suggestion.suggested_data_class)?.[isNb ? "labelNb" : "labelEn"]}
                    </span>
                    {suggestion.data_class_reason ? ` — ${suggestion.data_class_reason}` : ""}
                  </span>
                </div>
              )}
              <div className="space-y-2 pt-1">
                {DATA_CLASS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setDataClass(opt.value);
                      setAiSuggested((p) => ({ ...p, data_class: false }));
                      if (opt.value !== "sensitive") setSpecialCategories([]);
                    }}
                    className={cn(
                      "w-full text-left rounded-lg border p-3 transition-colors",
                      dataClass === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                          dataClass === opt.value ? "border-primary" : "border-muted-foreground/40",
                        )}
                      >
                        {dataClass === opt.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                      </div>
                      <span className="font-medium text-sm">{isNb ? opt.labelNb : opt.labelEn}</span>
                      {opt.value === "sensitive" && (
                        <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {isNb ? opt.descNb : opt.descEn}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {dataClass === "sensitive" && (
              <div className="space-y-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <Label className="text-sm">
                  {isNb
                    ? "Hvilke særlige kategorier behandles? (GDPR art. 9/10)"
                    : "Which special categories are processed? (GDPR Art. 9/10)"}
                </Label>
                <div className="grid gap-1.5">
                  {SPECIAL_CATEGORIES.map((cat) => (
                    <label key={cat.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={specialCategories.includes(cat.key)}
                        onCheckedChange={() => toggleCategory(cat.key)}
                      />
                      <span>{isNb ? cat.labelNb : cat.labelEn}</span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        art. {cat.article}
                      </Badge>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!dataClass || (dataClass === "sensitive" && specialCategories.length === 0)}
              >
                {isNb ? "Generer utkast" : "Generate draft"}
                <Sparkles className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEG 2: Gjennomgang av utkast */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3 flex items-start gap-2">
              <LaraIcon size={18} />
              <p className="text-[13px] text-muted-foreground leading-snug">
                {isNb
                  ? "Lara har fylt ut et utkast basert på systemet, arbeidsområdet og bransjen. Felt merket som forslag må bekreftes av et menneske før de lagres endelig."
                  : "Lara has filled in a draft based on the system, work area and industry. Fields marked as suggestions must be confirmed by a human before they are final."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pa-name">{isNb ? "Navn på behandlingsaktivitet" : "Processing activity name"}</Label>
              <Input
                id="pa-name"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder={
                  isNb ? `Bruk av ${selectedSystemName}` : `Use of ${selectedSystemName}`
                }
              />
            </div>

            {/* Behandlingsansvarlig — ALLTID juridisk person, låst felt */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label>{isNb ? "Behandlingsansvarlig" : "Data controller"}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      {isNb
                        ? "Behandlingsansvarlig er alltid virksomheten som juridisk person – aldri en enkelt ansatt."
                        : "The data controller is always the company as a legal entity – never an individual employee."}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input value={controllerName || ""} readOnly disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pa-purpose-review">{isNb ? "Formål *" : "Purpose *"}</Label>
              <Textarea
                id="pa-purpose-review"
                value={purpose}
                onChange={(e) => editField("purpose", setPurpose)(e.target.value)}
                rows={2}
              />
              {aiSuggested.purpose && suggestion && (
                <LaraFieldSuggestion
                  isNb={isNb}
                  suggestedLabel={suggestion.purpose}
                  reason={suggestion.purpose_reason}
                  onApprove={() => confirmField("purpose")}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>{isNb ? "Behandlingsgrunnlag" : "Legal basis"}</Label>
              <Select value={legalBasis} onValueChange={editField("legal_basis", setLegalBasis)}>
                <SelectTrigger>
                  <SelectValue placeholder={isNb ? "Velg behandlingsgrunnlag..." : "Select legal basis..."} />
                </SelectTrigger>
                <SelectContent>
                  {LEGAL_BASIS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={isNb ? opt.labelNb : opt.labelEn}>
                      {isNb ? opt.labelNb : opt.labelEn}
                    </SelectItem>
                  ))}
                  {suggestion?.legal_basis &&
                    !LEGAL_BASIS_OPTIONS.some(
                      (o) => o.labelNb === suggestion.legal_basis || o.labelEn === suggestion.legal_basis,
                    ) && (
                      <SelectItem value={suggestion.legal_basis}>{suggestion.legal_basis}</SelectItem>
                    )}
                </SelectContent>
              </Select>
              {aiSuggested.legal_basis && suggestion && (
                <LaraFieldSuggestion
                  isNb={isNb}
                  suggestedLabel={suggestion.legal_basis}
                  reason={
                    (suggestion.legal_basis_reason ? `${suggestion.legal_basis_reason} ` : "") +
                    (isNb ? "Krever alltid menneskelig bekreftelse." : "Always requires human confirmation.")
                  }
                  onApprove={() => confirmField("legal_basis")}
                />
              )}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{isNb ? "Datatype" : "Data class"}</span>
                <span className="font-medium">
                  {DATA_CLASS_OPTIONS.find((o) => o.value === dataClass)?.[isNb ? "labelNb" : "labelEn"]}
                </span>
              </div>
              {dataClass === "sensitive" && specialCategories.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {specialCategories.map((key) => {
                    const cat = SPECIAL_CATEGORIES.find((c) => c.key === key);
                    return (
                      <Badge key={key} variant="secondary" className="text-xs">
                        {cat ? (isNb ? cat.labelNb : cat.labelEn) : key}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pa-desc">{isNb ? "Beskrivelse" : "Description"}</Label>
              <Textarea
                id="pa-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {isNb ? "Tilbake" : "Back"}
              </Button>
              <div className="flex-1" />
              <Button variant="outline" onClick={() => save(false)} disabled={isSaving}>
                {isNb ? "Lagre utkast" : "Save draft"}
              </Button>
              <Button onClick={() => save(true)} disabled={isSaving || hasUnconfirmed}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {existingProcess
                  ? isNb ? "Bekreft og aktiver" : "Confirm and activate"
                  : isNb ? "Bekreft og opprett" : "Confirm and create"}
              </Button>
            </div>
            {hasUnconfirmed && (
              <p className="text-xs text-muted-foreground text-right">
                {isNb
                  ? "Godkjenn eller endre Laras forslag over for å bekrefte – eller lagre som utkast."
                  : "Approve or edit Lara's suggestions above to confirm – or save as draft."}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
