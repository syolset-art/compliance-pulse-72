import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, Mail, Phone, Users, PenLine, PlusCircle, Check, AlertTriangle } from "lucide-react";
import type { SuggestedActivity } from "@/utils/vendorGuidanceData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VendorActivity, ActivityType, ActivityLevel } from "@/utils/vendorActivityData";
import { deviationCategories } from "@/lib/deviationCategories";
import { getControlAreaLabel } from "@/lib/controlAreas";
import { suggestRequirementImpacts, sourceForActivityType } from "@/lib/deviationImpact";
import { DeviationScoreImpactNote } from "@/components/deviations/DeviationScoreImpactNote";
import { useRegisterVendorDeviation } from "@/hooks/useVendorDeviations";

interface Props {
  onSubmit: (activity: VendorActivity) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  prefillFromGuidance?: SuggestedActivity;
  hideTrigger?: boolean;
  /** Når satt kan aktiviteten også registreres som et avvik på denne enheten. */
  assetId?: string;
  vendorName?: string;
}


const TYPES: { value: ActivityType; Icon: typeof Mail; nb: string; en: string }[] = [
  { value: "email", Icon: Mail, nb: "E-post", en: "Email" },
  { value: "meeting", Icon: Users, nb: "Møte", en: "Meeting" },
  { value: "phone", Icon: Phone, nb: "Telefon", en: "Phone" },
  { value: "manual", Icon: PenLine, nb: "Annet", en: "Other" },
];

const LEVELS: { value: ActivityLevel; nb: string; en: string; dot: string }[] = [
  { value: "operasjonelt", nb: "Operasjonelt", en: "Operational", dot: "bg-status-closed" },
  { value: "taktisk", nb: "Taktisk", en: "Tactical", dot: "bg-warning" },
  { value: "strategisk", nb: "Strategisk", en: "Strategic", dot: "bg-primary" },
];

const DEV_SEVERITY = [
  { value: "critical", nb: "Kritisk", en: "Critical" },
  { value: "high", nb: "Høy", en: "High" },
  { value: "medium", nb: "Middels", en: "Medium" },
  { value: "low", nb: "Lav", en: "Low" },
];

const DEV_SOURCES = [
  { value: "manual", nb: "Registrert av oss", en: "Registered by us" },
  { value: "vendor_self", nb: "Meldt av leverandøren", en: "Reported by vendor" },
  { value: "agent", nb: "Oppdaget av agent", en: "Detected by agent" },
];

export function RegisterActivityDialog({ onSubmit, open: controlledOpen, onOpenChange, hideTrigger, assetId, vendorName }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); };

  const [type, setType] = useState<ActivityType>("email");
  const [level, setLevel] = useState<ActivityLevel>("operasjonelt");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [titleError, setTitleError] = useState(false);

  // Avvik
  const [isDeviation, setIsDeviation] = useState(false);
  const [devCategory, setDevCategory] = useState("sikkerhet");
  const [devSeverity, setDevSeverity] = useState("medium");
  const [devSource, setDevSource] = useState("manual");
  const [devResponsible, setDevResponsible] = useState("");
  const [devDueDate, setDevDueDate] = useState<Date | null>(null);
  const [devSelected, setDevSelected] = useState<string[]>([]);

  const registerDeviation = useRegisterVendorDeviation(assetId);

  const suggestions = useMemo(
    () => suggestRequirementImpacts(devCategory, devSeverity),
    [devCategory, devSeverity],
  );

  useEffect(() => {
    setDevSelected(suggestions.map((s) => s.requirement_id));
  }, [suggestions]);

  useEffect(() => {
    if (isDeviation) setDevSource(sourceForActivityType(type));
  }, [type, isDeviation]);

  const impacts = suggestions.filter((s) => devSelected.includes(s.requirement_id));
  const impactAreas = Array.from(new Set(impacts.map((i) => i.control_area)));

  const reset = () => {
    setType("email");
    setLevel("operasjonelt");
    setTitle("");
    setDescription("");
    setDate(new Date());
    setTitleError(false);
    setIsDeviation(false);
    setDevCategory("sikkerhet");
    setDevSeverity("medium");
    setDevSource("manual");
    setDevResponsible("");
    setDevDueDate(null);
  };

  useEffect(() => { if (open) reset(); }, [open]);

  const canRegisterDeviation = !!assetId;
  const deviationValid = !isDeviation || devResponsible.trim().length > 1;
  const isValid = !!title.trim() && deviationValid;

  const handleSubmit = async () => {
    if (!title.trim()) { setTitleError(true); return; }
    if (!deviationValid) return;

    let deviationId: string | undefined;
    if (isDeviation && assetId) {
      try {
        const inserted: any = await registerDeviation.mutateAsync({
          assetId,
          title,
          description,
          category: devCategory,
          criticality: devSeverity,
          responsible: devResponsible,
          discoveredAt: date,
          dueDate: devDueDate,
          source: devSource,
          impacts,
        });
        deviationId = inserted?.id;
      } catch {
        return;
      }
    }

    const activity: VendorActivity = {
      id: `manual-${Date.now()}`,
      type,
      phase: "ongoing",
      titleNb: title,
      titleEn: title,
      descriptionNb: description || undefined,
      descriptionEn: description || undefined,
      outcomeNb: isDeviation ? "Avvik registrert" : "Åpent",
      outcomeEn: isDeviation ? "Deviation registered" : "Open",
      outcomeStatus: "open",
      date,
      actor: isNb ? "Deg" : "You",
      actorRole: isNb ? "Manuell registrering" : "Manual entry",
      isManual: true,
      criticality: "medium",
      level,
      createdAt: new Date(),
      deviationId,
      deviationCriticality: isDeviation ? devSeverity : undefined,
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
      <DialogContent className="sm:max-w-md p-0 gap-0 max-h-[90vh] overflow-y-auto">
        <div className="px-6 pt-5 pb-3 border-b">
          <h2 className="text-base font-semibold tracking-tight">
            {isNb ? "Registrer aktivitet" : "Register activity"}
          </h2>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="px-6 py-5 space-y-5">
            {/* Type — icon-only segmented */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Type" : "Type"}</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {TYPES.map((t) => {
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      aria-label={isNb ? t.nb : t.en}
                      title={isNb ? t.nb : t.en}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-md border py-2.5 text-[11px] transition-all",
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      <t.Icon className="h-4 w-4" />
                      <span>{isNb ? t.nb : t.en}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Level */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Nivå" : "Level"}</Label>
              <div className="grid grid-cols-3 gap-1.5">
                {LEVELS.map((l) => {
                  const active = level === l.value;
                  return (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => setLevel(l.value)}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md border px-2.5 py-2 text-xs transition-all",
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full", l.dot)} />
                      {isNb ? l.nb : l.en}
                    </button>
                  );
                })}
              </div>
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
                onChange={(e) => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
                placeholder={isNb ? "Kort beskrivelse" : "Short description"}
              />
              {titleError && (
                <p role="alert" className="text-xs text-destructive">
                  {isNb ? "Tittel er påkrevd." : "Title is required."}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-desc" className="text-xs">
                {isNb ? "Notat" : "Note"}
              </Label>
              <Textarea
                id="reg-activity-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isNb ? "Valgfritt" : "Optional"}
                rows={3}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs">{isNb ? "Dato" : "Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground hover:border-primary/40 transition-all"
                  >
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(date, "dd.MM.yyyy")}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Avvik */}
            {canRegisterDeviation && (
              <div className="space-y-3 pt-1 border-t">
                <div className="flex items-center justify-between pt-3">
                  <Label htmlFor="reg-activity-deviation" className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                    {isNb ? "Denne aktiviteten avdekket et avvik" : "This activity revealed a deviation"}
                  </Label>
                  <Switch id="reg-activity-deviation" checked={isDeviation} onCheckedChange={setIsDeviation} />
                </div>

                {isDeviation && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isNb ? "Kategori" : "Category"}</Label>
                        <Select value={devCategory} onValueChange={setDevCategory}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {deviationCategories.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isNb ? "Alvorlighetsgrad" : "Severity"}</Label>
                        <Select value={devSeverity} onValueChange={setDevSeverity}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DEV_SEVERITY.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{isNb ? s.nb : s.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">{isNb ? "Kilde" : "Source"}</Label>
                        <Select value={devSource} onValueChange={setDevSource}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {DEV_SOURCES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>{isNb ? s.nb : s.en}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          {isNb ? "Ansvarlig" : "Responsible"}<span className="text-destructive ml-0.5">*</span>
                        </Label>
                        <Input
                          className="h-8 text-xs"
                          value={devResponsible}
                          onChange={(e) => setDevResponsible(e.target.value)}
                          placeholder={isNb ? "Navn" : "Name"}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isNb ? "Frist" : "Due date"}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs hover:border-primary/40 transition-all",
                              !devDueDate && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            {devDueDate ? format(devDueDate, "dd.MM.yyyy") : (isNb ? "Velg dato" : "Pick a date")}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={devDueDate || undefined} onSelect={(d) => setDevDueDate(d || null)} className="p-3 pointer-events-auto" />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">{isNb ? "Berørte krav" : "Affected requirements"}</Label>
                      <div className="space-y-1.5">
                        {suggestions.map((s) => (
                          <label key={s.requirement_id} className="flex items-start gap-2 text-xs cursor-pointer">
                            <Checkbox
                              checked={devSelected.includes(s.requirement_id)}
                              onCheckedChange={(v) =>
                                setDevSelected((prev) =>
                                  v ? [...prev, s.requirement_id] : prev.filter((p) => p !== s.requirement_id),
                                )
                              }
                              className="mt-0.5"
                            />
                            <span className="flex-1">
                              <span className="text-foreground">{s.requirement_label}</span>
                              <span className="block text-[11px] text-muted-foreground">
                                {s.framework_id} › {getControlAreaLabel(s.control_area, "nb")}
                              </span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <DeviationScoreImpactNote
                      affectedRequirements={impacts.length}
                      controlAreas={impactAreas}
                      severity={devSeverity}
                      source={devSource}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t bg-muted/30 px-6 py-3 flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
            <Button type="submit" size="sm" disabled={!isValid || registerDeviation.isPending} className="gap-1.5">
              <Check className="h-3.5 w-3.5" />
              {isDeviation ? (isNb ? "Lagre aktivitet og avvik" : "Save activity and deviation") : (isNb ? "Lagre" : "Save")}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}
