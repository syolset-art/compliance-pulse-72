import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  CalendarIcon, Mail, Phone, Users, PenLine, Sparkles, PlusCircle,
  Upload, FileText, Check, ChevronLeft, ArrowRight,
} from "lucide-react";
import type { SuggestedActivity } from "@/utils/vendorGuidanceData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { VendorActivity, ActivityType, Phase, OutcomeStatus, ActivityLevel } from "@/utils/vendorActivityData";
import { ACTIVITY_STATUS_CONFIG } from "@/utils/vendorActivityData";
import { EMAIL_TEMPLATES } from "@/utils/laraEmailSuggestions";
import {
  buildLaraSuggestions, inferFromTitle, TYPE_ICONS,
  type LaraActivitySuggestion, type Criticality, type Theme,
} from "@/utils/laraActivitySuggestions";

interface Props {
  onSubmit: (activity: VendorActivity) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefillFromGuidance?: SuggestedActivity;
  hideTrigger?: boolean;
}

type Step = "pick" | "confirm";

const TYPE_LABELS: Record<ActivityType, { nb: string; en: string }> = {
  email: { nb: "E-post", en: "Email" },
  phone: { nb: "Telefon", en: "Phone" },
  meeting: { nb: "Møte", en: "Meeting" },
  manual: { nb: "Annet", en: "Other" },
  document: { nb: "Dokument", en: "Document" },
  risk: { nb: "Risiko", en: "Risk" },
  incident: { nb: "Hendelse", en: "Incident" },
  assignment: { nb: "Tildeling", en: "Assignment" },
  review: { nb: "Gjennomgang", en: "Review" },
  delivery: { nb: "Leveranse", en: "Delivery" },
  maturity: { nb: "Modenhet", en: "Maturity" },
  setting: { nb: "Innstilling", en: "Setting" },
  upload: { nb: "Opplasting", en: "Upload" },
  view: { nb: "Visning", en: "View" },
};

const TYPE_PRIMARY: ActivityType[] = ["email", "phone", "meeting", "manual"];

const LEVELS: { value: ActivityLevel; nb: string; en: string; dot: string }[] = [
  { value: "operasjonelt", nb: "Operasjonelt", en: "Operational", dot: "bg-status-closed" },
  { value: "taktisk", nb: "Taktisk", en: "Tactical", dot: "bg-warning" },
  { value: "strategisk", nb: "Strategisk", en: "Strategic", dot: "bg-primary" },
];

const THEMES: { value: Theme; nb: string; en: string }[] = [
  { value: "dpa", nb: "DPA & personvern", en: "DPA & privacy" },
  { value: "infosec", nb: "Informasjonssikkerhet", en: "Information security" },
  { value: "sla", nb: "SLA & leveranse", en: "SLA & delivery" },
  { value: "okonomi", nb: "Økonomi", en: "Finance" },
  { value: "hendelse", nb: "Hendelse", en: "Incident" },
  { value: "revisjon", nb: "Revisjon & kontroll", en: "Audit & control" },
  { value: "generell", nb: "Generell", en: "General" },
];

const CRITICALITIES: { value: Criticality; nb: string; en: string; pill: string }[] = [
  { value: "lav", nb: "Lav", en: "Low", pill: "border-status-closed bg-status-closed/10 text-status-closed" },
  { value: "medium", nb: "Middels", en: "Medium", pill: "border-warning bg-warning/10 text-warning" },
  { value: "hoy", nb: "Høy", en: "High", pill: "border-warning bg-warning/10 text-warning" },
  { value: "kritisk", nb: "Kritisk", en: "Critical", pill: "border-destructive bg-destructive/10 text-destructive" },
];

export function RegisterActivityDialog({ onSubmit, open: controlledOpen, onOpenChange, prefillFromGuidance, hideTrigger }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); };

  const suggestions = useMemo(() => buildLaraSuggestions(prefillFromGuidance), [prefillFromGuidance]);

  const [step, setStep] = useState<Step>("pick");
  const [selectedSuggestion, setSelectedSuggestion] = useState<LaraActivitySuggestion | null>(null);
  const [isManual, setIsManual] = useState(false);

  const [type, setType] = useState<ActivityType>("email");
  const [level, setLevel] = useState<ActivityLevel | null>(null);
  const [theme, setTheme] = useState<Theme>("generell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("ongoing");
  const [outcome, setOutcome] = useState<OutcomeStatus>("open");
  const [criticality, setCriticality] = useState<Criticality | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [titleError, setTitleError] = useState(false);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [uploadedTemplateName, setUploadedTemplateName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("pick");
    setSelectedSuggestion(null);
    setIsManual(false);
    setType("email"); setTitle(""); setDescription("");
    setPhase("ongoing"); setLevel(null); setTheme("generell");
    setCriticality(null); setDate(new Date()); setTitleError(false);
    setOutcome("open");
    setAppliedTemplateId(null);
    setUploadedTemplateName(null);
  };

  // When dialog opens: if guidance is prefilled, jump straight to its suggestion
  useEffect(() => {
    if (!open) return;
    reset();
    if (prefillFromGuidance) {
      const s = suggestions.find((x) => x.source === "guidance");
      if (s) applySuggestion(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillFromGuidance?.id]);

  const applySuggestion = (s: LaraActivitySuggestion) => {
    setSelectedSuggestion(s);
    setIsManual(false);
    setType(s.type);
    setLevel(s.level);
    setTheme(s.theme);
    setCriticality(s.criticality);
    setPhase(s.phase);
    setTitle(isNb ? s.titleNb : s.titleEn);
    setDescription(isNb ? s.bodyNb : s.bodyEn);
    setOutcome("open");
    setTitleError(false);
    setStep("confirm");
  };

  const startManual = () => {
    setSelectedSuggestion(null);
    setIsManual(true);
    setType("email");
    setLevel(null);
    setTheme("generell");
    setCriticality(null);
    setTitle("");
    setDescription("");
    setStep("confirm");
  };

  const handleManualTitleChange = (next: string) => {
    setTitle(next);
    if (titleError) setTitleError(false);
    if (!isManual) return;
    const inferred = inferFromTitle(next);
    if (inferred.type) setType(inferred.type);
    if (inferred.theme) setTheme(inferred.theme);
    if (inferred.level && !level) setLevel(inferred.level);
    if (inferred.criticality && !criticality) setCriticality(inferred.criticality);
  };

  const applyTemplate = (id: string) => {
    const t = EMAIL_TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    setType("email");
    setTitle(isNb ? t.titleNb : t.titleEn);
    setDescription(isNb ? t.bodyNb : t.bodyEn);
    setAppliedTemplateId(id);
    setTitleError(false);
  };

  const handleUploadTemplate = (file: File) => {
    setUploadedTemplateName(file.name);
    setAppliedTemplateId("custom-upload");
  };

  const isValid = !!title.trim() && !!level && !!criticality;

  const handleSubmit = () => {
    if (!title.trim()) { setTitleError(true); return; }
    if (!level || !criticality) return;
    const activity: VendorActivity = {
      id: `manual-${Date.now()}`,
      type, phase,
      titleNb: title, titleEn: title,
      descriptionNb: description || undefined,
      descriptionEn: description || undefined,
      outcomeNb: outcome === "open" ? "Åpent" : outcome === "in_progress" ? "Under oppfølging" : outcome === "closed" ? "Lukket" : "Ikke relevant",
      outcomeEn: outcome === "open" ? "Open" : outcome === "in_progress" ? "In progress" : outcome === "closed" ? "Closed" : "Not relevant",
      outcomeStatus: outcome,
      date,
      actor: isNb ? "Deg" : "You",
      actorRole: selectedSuggestion ? (isNb ? "Bekreftet fra Lara-forslag" : "Confirmed from Lara suggestion") : (isNb ? "Manuell registrering" : "Manual entry"),
      isManual: true,
      linkedGapId: selectedSuggestion?.gapId,
      criticality,
      level,
      theme: THEMES.find((t) => t.value === theme)?.nb,
      createdAt: new Date(),
    };
    onSubmit(activity);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <PlusCircle className="h-3.5 w-3.5" />
            {isNb ? "Registrer aktivitet" : "Register activity"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {step === "pick" ? (
          <PickStep
            isNb={isNb}
            suggestions={suggestions}
            onPick={applySuggestion}
            onManual={startManual}
          />
        ) : (
          <ConfirmStep
            isNb={isNb}
            isManual={isManual}
            selectedSuggestion={selectedSuggestion}
            type={type} setType={setType}
            level={level} setLevel={setLevel}
            theme={theme} setTheme={setTheme}
            criticality={criticality} setCriticality={setCriticality}
            outcome={outcome} setOutcome={setOutcome}
            date={date} setDate={setDate}
            title={title} onTitleChange={handleManualTitleChange}
            description={description} setDescription={setDescription}
            titleError={titleError}
            appliedTemplateId={appliedTemplateId}
            applyTemplate={applyTemplate}
            uploadedTemplateName={uploadedTemplateName}
            fileInputRef={fileInputRef}
            handleUploadTemplate={handleUploadTemplate}
            onBack={() => setStep("pick")}
            onSubmit={handleSubmit}
            isValid={isValid}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* STEP 1 — Pick a Lara suggestion or go manual                        */
/* ─────────────────────────────────────────────────────────────────── */

function PickStep({
  isNb, suggestions, onPick, onManual,
}: {
  isNb: boolean;
  suggestions: LaraActivitySuggestion[];
  onPick: (s: LaraActivitySuggestion) => void;
  onManual: () => void;
}) {
  return (
    <>
      <div className="px-6 pt-6 pb-4 border-b">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium mb-3">
          <Sparkles className="h-3 w-3" />
          {isNb ? "Lara foreslår" : "Lara suggests"}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {isNb ? "Hva vil du registrere?" : "What would you like to log?"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isNb
            ? "Velg et forslag fra Lara — alt er ferdig utfylt. Du kan justere før du lagrer."
            : "Pick a suggestion from Lara — everything is pre-filled. You can adjust before saving."}
        </p>
      </div>

      <div className="px-6 py-5 space-y-3">
        {suggestions.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
            <Sparkles className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isNb ? "Lara har ingen forslag akkurat nå." : "Lara has no suggestions right now."}
            </p>
          </div>
        ) : (
          suggestions.map((s) => {
            const Icon = TYPE_ICONS[s.type] ?? PenLine;
            const crit = CRITICALITIES.find((c) => c.value === s.criticality)!;
            const lvl = LEVELS.find((l) => l.value === s.level)!;
            const th = THEMES.find((t) => t.value === s.theme)!;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s)}
                className="group w-full text-left rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/60 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground leading-snug">
                        {isNb ? s.titleNb : s.titleEn}
                      </h3>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                      <Sparkles className="inline h-3 w-3 mr-1 text-primary" />
                      {isNb ? s.reasonNb : s.reasonEn}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {isNb ? TYPE_LABELS[s.type].nb : TYPE_LABELS[s.type].en}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        <span className={cn("h-1.5 w-1.5 rounded-full", lvl.dot)} />
                        {isNb ? lvl.nb : lvl.en}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {isNb ? th.nb : th.en}
                      </span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", crit.pill)}>
                        {isNb ? crit.nb : crit.en}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}

        <button
          type="button"
          onClick={onManual}
          className="w-full mt-2 rounded-lg border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all flex items-center justify-center gap-2"
        >
          <PenLine className="h-3.5 w-3.5" />
          {isNb ? "Skriv egen aktivitet" : "Write your own activity"}
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* STEP 2 — Confirm / adjust via chip popovers                         */
/* ─────────────────────────────────────────────────────────────────── */

function ConfirmStep(props: {
  isNb: boolean;
  isManual: boolean;
  selectedSuggestion: LaraActivitySuggestion | null;
  type: ActivityType; setType: (t: ActivityType) => void;
  level: ActivityLevel | null; setLevel: (l: ActivityLevel) => void;
  theme: Theme; setTheme: (t: Theme) => void;
  criticality: Criticality | null; setCriticality: (c: Criticality) => void;
  outcome: OutcomeStatus; setOutcome: (o: OutcomeStatus) => void;
  date: Date; setDate: (d: Date) => void;
  title: string; onTitleChange: (s: string) => void;
  description: string; setDescription: (s: string) => void;
  titleError: boolean;
  appliedTemplateId: string | null;
  applyTemplate: (id: string) => void;
  uploadedTemplateName: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleUploadTemplate: (f: File) => void;
  onBack: () => void;
  onSubmit: () => void;
  isValid: boolean;
}) {
  const {
    isNb, isManual, selectedSuggestion, type, setType, level, setLevel,
    theme, setTheme, criticality, setCriticality, outcome, setOutcome,
    date, setDate, title, onTitleChange, description, setDescription,
    titleError, appliedTemplateId, applyTemplate, uploadedTemplateName,
    fileInputRef, handleUploadTemplate, onBack, onSubmit, isValid,
  } = props;

  const TypeIcon = TYPE_ICONS[type] ?? PenLine;
  const lvlDot = LEVELS.find((l) => l.value === level)?.dot ?? "bg-muted-foreground";
  const critPill = CRITICALITIES.find((c) => c.value === criticality);
  const statusConf = ACTIVITY_STATUS_CONFIG[outcome];

  return (
    <>
      <div className="px-6 pt-5 pb-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {isNb ? "Tilbake" : "Back"}
          </button>
          {selectedSuggestion && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-medium">
              <Sparkles className="h-3 w-3" />
              {isNb ? "Forhåndsutfylt av Lara" : "Pre-filled by Lara"}
            </div>
          )}
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          {isManual
            ? (isNb ? "Skriv aktivitet" : "Write activity")
            : (isNb ? "Bekreft og juster" : "Confirm and adjust")}
        </h2>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
        <div className="px-6 py-5 space-y-5">
          {/* Chip row */}
          <div className="flex flex-wrap gap-1.5">
            {/* Type */}
            <ChipPopover
              label={
                <>
                  <TypeIcon className="h-3 w-3" />
                  {isNb ? TYPE_LABELS[type].nb : TYPE_LABELS[type].en}
                </>
              }
            >
              <div className="grid grid-cols-2 gap-1.5 w-48">
                {TYPE_PRIMARY.map((t) => {
                  const Icon = TYPE_ICONS[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-all",
                        type === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                      {isNb ? TYPE_LABELS[t].nb : TYPE_LABELS[t].en}
                    </button>
                  );
                })}
              </div>
            </ChipPopover>

            {/* Level */}
            <ChipPopover
              required={!level}
              label={
                <>
                  <span className={cn("h-1.5 w-1.5 rounded-full", lvlDot)} />
                  {level
                    ? (isNb ? LEVELS.find((l) => l.value === level)!.nb : LEVELS.find((l) => l.value === level)!.en)
                    : (isNb ? "Velg nivå" : "Pick level")}
                </>
              }
            >
              <div className="space-y-1 w-44">
                {LEVELS.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setLevel(l.value)}
                    className={cn(
                      "flex items-center gap-2 w-full rounded-md border px-2.5 py-1.5 text-xs transition-all",
                      level === l.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", l.dot)} />
                    {isNb ? l.nb : l.en}
                  </button>
                ))}
              </div>
            </ChipPopover>

            {/* Theme */}
            <ChipPopover label={<>{isNb ? THEMES.find((t) => t.value === theme)!.nb : THEMES.find((t) => t.value === theme)!.en}</>}>
              <div className="space-y-1 w-56">
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTheme(t.value)}
                    className={cn(
                      "block w-full text-left rounded-md border px-2.5 py-1.5 text-xs transition-all",
                      theme === t.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    {isNb ? t.nb : t.en}
                  </button>
                ))}
              </div>
            </ChipPopover>

            {/* Criticality */}
            <ChipPopover
              required={!criticality}
              activeClass={critPill?.pill}
              label={<>{criticality
                ? (isNb ? critPill!.nb : critPill!.en)
                : (isNb ? "Velg kritikalitet" : "Pick criticality")}</>}
            >
              <div className="space-y-1 w-40">
                {CRITICALITIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCriticality(c.value)}
                    className={cn(
                      "block w-full rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all",
                      criticality === c.value ? c.pill : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                    )}
                  >
                    {isNb ? c.nb : c.en}
                  </button>
                ))}
              </div>
            </ChipPopover>

            {/* Status */}
            <ChipPopover
              activeClass={statusConf.pill}
              label={
                <>
                  <span className={cn("h-1.5 w-1.5 rounded-full", statusConf.dot)} />
                  {isNb ? statusConf.nb : statusConf.en}
                </>
              }
            >
              <div className="space-y-1 w-44">
                {(["open", "in_progress", "closed", "not_relevant"] as OutcomeStatus[]).map((s) => {
                  const conf = ACTIVITY_STATUS_CONFIG[s];
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOutcome(s)}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-md border px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-all",
                        outcome === s ? conf.pill : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", conf.dot)} />
                      {isNb ? conf.nb : conf.en}
                    </button>
                  );
                })}
              </div>
            </ChipPopover>

            {/* Date */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
                >
                  <CalendarIcon className="h-3 w-3" />
                  {format(date, "dd.MM.yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-activity-title" className="text-xs">
              {isNb ? "Tittel" : "Title"}<span className="text-destructive ml-0.5">*</span>
            </Label>
            <Input
              id="reg-activity-title"
              aria-required="true"
              aria-invalid={titleError}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={isNb ? "F.eks. «Klage på responstid»" : "E.g. 'Complaint on response time'"}
            />
            {titleError && (
              <p role="alert" className="text-xs text-destructive">
                {isNb ? "Tittel er påkrevd." : "Title is required."}
              </p>
            )}
            {isManual && title.trim() && (
              <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                {isNb ? "Lara fyller chips automatisk basert på tittelen — du kan overstyre." : "Lara fills the chips from your title — you can override."}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-activity-desc" className="text-xs">
              {type === "email"
                ? (isNb ? "E-post-utkast" : "Email draft")
                : (isNb ? "Beskrivelse" : "Description")}
            </Label>
            <Textarea
              id="reg-activity-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isNb ? "Hva ble diskutert eller avtalt?" : "What was discussed or agreed?"}
              rows={type === "email" ? 6 : 3}
            />
          </div>

          {/* Email-only: template + upload */}
          {type === "email" && (
            <div className="rounded-md border border-border bg-muted/20 p-3 space-y-2">
              <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground">
                    {isNb ? "Bytt e-postmal" : "Switch email template"}
                  </Label>
                  <Select
                    value={appliedTemplateId && appliedTemplateId !== "custom-upload" ? appliedTemplateId : ""}
                    onValueChange={applyTemplate}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={isNb ? "— Ingen mal —" : "— No template —"} />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_TEMPLATES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{isNb ? t.labelNb : t.labelEn}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3" />
                  {isNb ? "Last opp mal" : "Upload template"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUploadTemplate(f);
                    e.target.value = "";
                  }}
                />
              </div>
              {uploadedTemplateName && (
                <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {isNb ? "Mal: " : "Template: "}{uploadedTemplateName}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <Button type="submit" disabled={!isValid} className="w-full h-11 gap-2">
            <Check className="h-4 w-4" />
            {selectedSuggestion
              ? (isNb ? "Bekreft og registrer" : "Confirm and register")
              : (isNb ? "Lagre aktivitet" : "Save activity")}
          </Button>
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {isNb ? "Velg nivå og kritikalitet, og fyll inn tittel for å lagre." : "Pick level and criticality, and fill in a title to save."}
            </p>
          )}
        </div>
      </form>
    </>
  );
}

/* Reusable chip popover */
function ChipPopover({
  label, children, required, activeClass,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  required?: boolean;
  activeClass?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all",
            activeClass
              ? activeClass
              : required
                ? "border-dashed border-destructive/50 bg-destructive/5 text-destructive hover:border-destructive"
                : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
          )}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-2" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}
