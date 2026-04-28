import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, Mail, Phone, Users, PenLine, Sparkles, PlusCircle, X, Upload, FileText, Check } from "lucide-react";
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
import { LARA_EMAIL_SUGGESTIONS, EMAIL_TEMPLATES } from "@/utils/laraEmailSuggestions";

type Criticality = "lav" | "medium" | "hoy" | "kritisk";

interface Props {
  onSubmit: (activity: VendorActivity) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefillFromGuidance?: SuggestedActivity;
  hideTrigger?: boolean;
}

const ACTIVITY_TYPES: { value: ActivityType; nb: string; en: string; icon: typeof Mail }[] = [
  { value: "email", nb: "E-post", en: "Email", icon: Mail },
  { value: "phone", nb: "Telefon", en: "Phone", icon: Phone },
  { value: "meeting", nb: "Møte", en: "Meeting", icon: Users },
  { value: "manual", nb: "Annet", en: "Other", icon: PenLine },
];

const LEVELS: { value: ActivityLevel; nb: string; en: string; dot: string }[] = [
  { value: "operasjonelt", nb: "Operasjonelt", en: "Operational", dot: "bg-status-closed" },
  { value: "taktisk", nb: "Taktisk", en: "Tactical", dot: "bg-warning" },
  { value: "strategisk", nb: "Strategisk", en: "Strategic", dot: "bg-primary" },
];

const THEMES: { value: string; nb: string; en: string }[] = [
  { value: "dpa", nb: "DPA & personvern", en: "DPA & privacy" },
  { value: "infosec", nb: "Informasjonssikkerhet", en: "Information security" },
  { value: "sla", nb: "SLA & leveranse", en: "SLA & delivery" },
  { value: "okonomi", nb: "Økonomi", en: "Finance" },
  { value: "hendelse", nb: "Hendelse", en: "Incident" },
  { value: "revisjon", nb: "Revisjon & kontroll", en: "Audit & control" },
  { value: "generell", nb: "Generell", en: "General" },
];

const CRITICALITIES: { value: Criticality; nb: string; en: string; activeClass: string }[] = [
  { value: "lav", nb: "Lav", en: "Low", activeClass: "border-status-closed bg-status-closed/10 text-status-closed dark:text-status-closed" },
  { value: "medium", nb: "Middels", en: "Medium", activeClass: "border-warning bg-warning/10 text-warning dark:text-warning" },
  { value: "hoy", nb: "Høy", en: "High", activeClass: "border-warning bg-warning/10 text-warning dark:text-warning" },
  { value: "kritisk", nb: "Kritisk", en: "Critical", activeClass: "border-destructive bg-destructive/10 text-destructive" },
];

export function RegisterActivityDialog({ onSubmit, open: controlledOpen, onOpenChange, prefillFromGuidance, hideTrigger }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); };

  const [type, setType] = useState<ActivityType>("email");
  const [level, setLevel] = useState<ActivityLevel | null>(null);
  const [theme, setTheme] = useState<string>("generell");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("ongoing");
  const [outcome, setOutcome] = useState<OutcomeStatus>("open");
  const [criticality, setCriticality] = useState<Criticality | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [titleError, setTitleError] = useState(false);
  const [appliedSuggestionId, setAppliedSuggestionId] = useState<string | null>(null);
  const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
  const [uploadedTemplateName, setUploadedTemplateName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setType("email"); setTitle(""); setDescription("");
    setPhase("ongoing"); setLevel(null); setTheme("generell");
    setCriticality(null); setDate(new Date()); setTitleError(false);
    setOutcome("open");
    setAppliedSuggestionId(null);
    setAppliedTemplateId(null);
    setUploadedTemplateName(null);
  };

  useEffect(() => {
    if (open && prefillFromGuidance) {
      setType(prefillFromGuidance.suggestedType);
      setPhase(prefillFromGuidance.suggestedPhase);
      setLevel(prefillFromGuidance.level);
      setTheme(prefillFromGuidance.themeNb.toLowerCase().includes("dpa") ? "dpa"
        : prefillFromGuidance.themeNb.toLowerCase().includes("sla") ? "sla"
        : prefillFromGuidance.themeNb.toLowerCase().includes("revisjon") ? "revisjon"
        : prefillFromGuidance.themeNb.toLowerCase().includes("hendelse") ? "hendelse"
        : prefillFromGuidance.themeNb.toLowerCase().includes("informasjon") ? "infosec"
        : "generell");
      setCriticality(prefillFromGuidance.criticality as Criticality);
      setTitle(isNb ? prefillFromGuidance.titleNb : prefillFromGuidance.titleEn);
      setDescription(isNb ? prefillFromGuidance.descriptionNb : prefillFromGuidance.descriptionEn);
      setDate(new Date());
      setTitleError(false);
    } else if (open && !prefillFromGuidance) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillFromGuidance?.id]);

  const isValid = !!title.trim() && !!level && !!criticality;
  const isAssisted = !!appliedSuggestionId || !!appliedTemplateId;

  const applyLaraSuggestion = (id: string) => {
    const s = LARA_EMAIL_SUGGESTIONS.find(x => x.id === id);
    if (!s) return;
    setType("email");
    setTitle(isNb ? s.titleNb : s.titleEn);
    setDescription(isNb ? s.bodyNb : s.bodyEn);
    setTheme(s.theme);
    setCriticality(s.criticality);
    setLevel(s.level);
    setAppliedSuggestionId(id);
    setAppliedTemplateId(null);
    setTitleError(false);
  };

  const applyTemplate = (id: string) => {
    const t = EMAIL_TEMPLATES.find(x => x.id === id);
    if (!t) return;
    setType("email");
    setTitle(isNb ? t.titleNb : t.titleEn);
    setDescription(isNb ? t.bodyNb : t.bodyEn);
    setAppliedTemplateId(id);
    setAppliedSuggestionId(null);
    setTitleError(false);
  };

  const handleUploadTemplate = (file: File) => {
    setUploadedTemplateName(file.name);
    setAppliedTemplateId("custom-upload");
    setAppliedSuggestionId(null);
  };

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
      actorRole: isNb ? "Manuell registrering" : "Manual entry",
      isManual: true,
      linkedGapId: prefillFromGuidance?.gapId,
      criticality,
      level,
      theme: THEMES.find(t => t.value === theme)?.nb,
      createdAt: new Date(),
    };
    onSubmit(activity);
    reset();
    setOpen(false);
  };

  const RequiredMark = () => <span className="text-destructive ml-0.5">*</span>;
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">{children}</div>
  );

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
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
              <span className="flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">1</span>
              {isNb ? "Steg 1 av 2 — Fyll ut" : "Step 1 of 2 — Fill in"}
            </div>
          </div>
          <h2 className="text-xl font-semibold tracking-tight">{isNb ? "Ny aktivitet" : "New activity"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isNb ? "Loggfør noe du har gjort eller planlegger." : "Log something you've done or plan to do."}
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="px-6 py-5 space-y-6">
            {/* Context banner */}
            {prefillFromGuidance ? (
              <div className="rounded-md border-l-4 border-primary bg-primary/5 px-3 py-2.5 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-semibold">{isNb ? "Forhåndsutfylt av Mynder" : "Pre-filled by Mynder"}</span>
                  {" — "}{isNb ? prefillFromGuidance.reasonNb : prefillFromGuidance.reasonEn}
                </p>
              </div>
            ) : (
              <div className="rounded-md border-l-4 border-muted-foreground/30 bg-muted/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{isNb ? "Egen aktivitet" : "Own activity"}</span>
                  {" — "}{isNb
                    ? "ikke koblet til et gap Mynder har identifisert. Du kan koble den manuelt etterpå om det blir relevant."
                    : "not linked to a gap Mynder has identified. You can link it manually later if relevant."}
                </p>
              </div>
            )}

            {/* TYPE & CONTEXT */}
            <section>
              <SectionLabel>{isNb ? "Type og kontekst" : "Type and context"}</SectionLabel>

              {/* Activity type */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {ACTIVITY_TYPES.map(t => {
                  const Icon = t.icon;
                  const isSelected = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all text-center",
                        isSelected
                          ? "border-primary bg-primary/5 text-primary shadow-sm"
                          : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{isNb ? t.nb : t.en}</span>
                    </button>
                  );
                })}
              </div>

              {/* Level pills */}
              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {isNb ? "Nivå" : "Level"}<RequiredMark />
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(l => {
                    const isSelected = level === l.value;
                    return (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLevel(l.value)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition-all",
                          isSelected
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", l.dot)} />
                        {isNb ? l.nb : l.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme chips */}
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {isNb ? "Tema" : "Theme"}
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {THEMES.map(t => {
                    const isSelected = theme === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTheme(t.value)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                        )}
                      >
                        {isNb ? t.nb : t.en}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* EMAIL ASSIST — Lara suggestions + templates (only when type === email) */}
            {type === "email" && (
              <section>
                <SectionLabel>{isNb ? "E-post" : "Email"}</SectionLabel>

                {/* Lara suggestions */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <p className="text-xs font-semibold text-foreground">
                      {isNb ? "Lara foreslår 3 e-poster basert på leverandørens status" : "Lara suggests 3 emails based on the vendor's status"}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-2">
                    {LARA_EMAIL_SUGGESTIONS.map(s => {
                      const isApplied = appliedSuggestionId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => applyLaraSuggestion(s.id)}
                          className={cn(
                            "text-left rounded-md border bg-background p-2.5 transition-all hover:border-primary/60 hover:shadow-sm",
                            isApplied ? "border-primary ring-1 ring-primary/40" : "border-border"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1.5 mb-1">
                            <span className="text-xs font-semibold text-foreground leading-snug">
                              {isNb ? s.titleNb : s.titleEn}
                            </span>
                            {isApplied && <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                            {isNb ? s.reasonNb : s.reasonEn}
                          </p>
                          <span className={cn(
                            "inline-flex items-center gap-1 mt-2 text-[11px] font-medium",
                            isApplied ? "text-primary" : "text-primary/80"
                          )}>
                            {isApplied
                              ? (isNb ? "Valgt" : "Selected")
                              : (isNb ? "Bruk denne" : "Use this")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Templates */}
                <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {isNb ? "Velg mal" : "Choose template"}
                    </Label>
                    <Select
                      value={appliedTemplateId && appliedTemplateId !== "custom-upload" ? appliedTemplateId : ""}
                      onValueChange={applyTemplate}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={isNb ? "— Ingen mal —" : "— No template —"} />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_TEMPLATES.map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {isNb ? t.labelNb : t.labelEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground sm:invisible">.</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      {isNb ? "Last opp egen mal" : "Upload own template"}
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
                </div>
                {uploadedTemplateName && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {isNb ? "Mal: " : "Template: "}{uploadedTemplateName}
                  </div>
                )}
              </section>
            )}

            {/* CONTENT */}
            <section>
              <SectionLabel>{isNb ? "Innhold" : "Content"}</SectionLabel>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="reg-activity-title" className="text-xs">
                    {isNb ? "Tittel" : "Title"}<RequiredMark />
                  </Label>
                  <Input
                    id="reg-activity-title"
                    aria-required="true"
                    aria-invalid={titleError}
                    value={title}
                    onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
                    placeholder={isNb ? "F.eks. «Klage på responstid»" : "E.g. 'Complaint on response time'"}
                  />
                  {titleError && (
                    <p role="alert" className="text-xs text-destructive">
                      {isNb ? "Tittel er påkrevd." : "Title is required."}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reg-activity-desc" className="text-xs">
                    {isNb ? "Beskrivelse" : "Description"}
                  </Label>
                  <Textarea
                    id="reg-activity-desc"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={isNb ? "Hva ble diskutert eller avtalt?" : "What was discussed or agreed?"}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* STATUS & FOLLOW-UP */}
            <section>
              <SectionLabel>{isNb ? "Status og oppfølging" : "Status and follow-up"}</SectionLabel>

              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {isNb ? "Kritikalitet" : "Criticality"}<RequiredMark />
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CRITICALITIES.map(c => {
                    const isSelected = criticality === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCriticality(c.value)}
                        className={cn(
                          "rounded-full border px-4 py-1.5 text-xs font-medium transition-all",
                          isSelected
                            ? c.activeClass
                            : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                        )}
                      >
                        {isNb ? c.nb : c.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {isNb ? "Status" : "Status"}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {(["open", "in_progress", "closed", "not_relevant"] as OutcomeStatus[]).map(s => {
                    const conf = ACTIVITY_STATUS_CONFIG[s];
                    const isSelected = outcome === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setOutcome(s)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-all",
                          isSelected ? conf.pill : "border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", conf.dot)} />
                        {isNb ? conf.nb : conf.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label htmlFor="reg-activity-date" className="text-xs text-muted-foreground mb-1.5 block">
                  {isNb ? "Dato" : "Date"}
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="reg-activity-date"
                      variant="outline"
                      className={cn("w-full sm:w-44 h-10 justify-start text-left font-normal", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      {date ? format(date, "dd.MM.yyyy") : (isNb ? "Velg dato" : "Pick date")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-6 py-4 space-y-2">
            {isAssisted && (
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-primary">
                <Sparkles className="h-3 w-3" />
                {isNb ? "Forhåndsutfylt av Lara" : "Pre-filled by Lara"}
              </div>
            )}
            <Button type="submit" disabled={!isValid} className="w-full h-11 gap-2">
              {isAssisted && <Check className="h-4 w-4" />}
              {isAssisted
                ? (isNb ? "Bekreft og registrer →" : "Confirm and register →")
                : (isNb ? "Lagre aktivitet →" : "Save activity →")}
            </Button>
            {!isValid && (
              <p className="text-xs text-muted-foreground text-center">
                {isNb ? "Fyll ut type, nivå, kritikalitet og tittel for å lagre" : "Fill in type, level, criticality and title to save"}
              </p>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
