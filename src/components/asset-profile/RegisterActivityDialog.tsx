import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, Mail, Phone, Users, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import type { VendorActivity, ActivityType, Phase, OutcomeStatus } from "@/utils/vendorActivityData";

interface Props {
  onSubmit: (activity: VendorActivity) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const ACTIVITY_TYPES: { value: ActivityType; nb: string; en: string; icon: typeof Mail }[] = [
  { value: "email", nb: "E-post", en: "Email", icon: Mail },
  { value: "phone", nb: "Telefon", en: "Phone", icon: Phone },
  { value: "meeting", nb: "Møte", en: "Meeting", icon: Users },
  { value: "manual", nb: "Annet", en: "Other", icon: PenLine },
];

const PHASES: { value: Phase; nb: string; en: string }[] = [
  { value: "onboarding", nb: "Onboarding", en: "Onboarding" },
  { value: "ongoing", nb: "Løpende oppfølging", en: "Ongoing follow-up" },
  { value: "audit", nb: "Revisjon", en: "Audit" },
  { value: "incident", nb: "Hendelseshåndtering", en: "Incident management" },
];

const OUTCOMES: { value: string; nb: string; en: string; status: OutcomeStatus }[] = [
  { value: "approved", nb: "Godkjent", en: "Approved", status: "success" },
  { value: "deviation", nb: "Avvik funnet", en: "Deviation found", status: "warning" },
  { value: "waiting", nb: "Venter svar", en: "Awaiting response", status: "warning" },
  { value: "informed", nb: "Informert", en: "Informed", status: "info" },
  { value: "other", nb: "Annet", en: "Other", status: "info" },
];

export function RegisterActivityDialog({ onSubmit, open: controlledOpen, onOpenChange }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => { onOpenChange ? onOpenChange(v) : setInternalOpen(v); };

  const [type, setType] = useState<ActivityType>("email");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("ongoing");
  const [outcome, setOutcome] = useState("informed");
  const [date, setDate] = useState<Date>(new Date());
  const [contactPerson, setContactPerson] = useState("");
  const [participants, setParticipants] = useState("");
  const [attachmentNote, setAttachmentNote] = useState("");
  const [titleError, setTitleError] = useState(false);

  const reset = () => {
    setType("email"); setTitle(""); setDescription("");
    setPhase("ongoing"); setOutcome("informed"); setDate(new Date());
    setContactPerson(""); setParticipants(""); setAttachmentNote("");
    setTitleError(false);
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      setTitleError(true);
      return;
    }
    const out = OUTCOMES.find(o => o.value === outcome) ?? OUTCOMES[3];
    const activity: VendorActivity = {
      id: `manual-${Date.now()}`,
      type,
      phase,
      titleNb: title,
      titleEn: title,
      descriptionNb: description || undefined,
      descriptionEn: description || undefined,
      outcomeNb: out.nb,
      outcomeEn: out.en,
      outcomeStatus: out.status,
      date,
      actor: isNb ? "Deg" : "You",
      actorRole: isNb ? "Manuell registrering" : "Manual entry",
      contactPerson: contactPerson || undefined,
      participants: participants || undefined,
      attachmentNote: attachmentNote || undefined,
      isManual: true,
    };
    onSubmit(activity);
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <PlusCircle className="h-3.5 w-3.5" />
          {isNb ? "Registrer aktivitet" : "Register activity"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isNb ? "Registrer aktivitet" : "Register activity"}</DialogTitle>
          <DialogDescription>
            {isNb
              ? "Loggfør kommunikasjon og hendelser knyttet til denne leverandøren."
              : "Log communication and events related to this vendor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5 pt-2">
          {/* Type selector - radio group */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground" id="activity-type-label">
              {isNb ? "Type aktivitet" : "Activity type"}
            </Label>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="activity-type-label">
              {ACTIVITY_TYPES.map(t => {
                const Icon = t.icon;
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all text-center",
                      isSelected
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{isNb ? t.nb : t.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Title & Description */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-title">{isNb ? "Tittel" : "Title"} <span className="text-destructive">*</span></Label>
              <Input
                id="reg-activity-title"
                aria-required="true"
                aria-invalid={titleError}
                value={title}
                onChange={e => { setTitle(e.target.value); if (titleError) setTitleError(false); }}
                placeholder={isNb ? "F.eks. «Statusmøte Q1»" : "E.g. 'Status meeting Q1'"}
              />
              {titleError && (
                <p role="alert" className="text-xs text-destructive">
                  {isNb ? "Tittel er påkrevd." : "Title is required."}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-desc">{isNb ? "Beskrivelse" : "Description"}</Label>
              <Textarea
                id="reg-activity-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={isNb ? "Hva ble diskutert, avtalt eller besluttet?" : "What was discussed, agreed, or decided?"}
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* People */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {isNb ? "Deltakere" : "Participants"}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="reg-activity-contact" className="text-xs">{isNb ? "Kontaktperson hos leverandør" : "Vendor contact person"}</Label>
                <Input
                  id="reg-activity-contact"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder={isNb ? "Navn" : "Name"}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reg-activity-participants" className="text-xs">{isNb ? "Interne deltakere" : "Internal participants"}</Label>
                <Input
                  id="reg-activity-participants"
                  value={participants}
                  onChange={e => setParticipants(e.target.value)}
                  placeholder={isNb ? "Navn, kommaseparert" : "Names, comma-separated"}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Phase, Outcome, Date */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-phase" className="text-xs">{isNb ? "Fase" : "Phase"}</Label>
              <Select value={phase} onValueChange={v => setPhase(v as Phase)}>
                <SelectTrigger id="reg-activity-phase" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{isNb ? p.nb : p.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-outcome" className="text-xs">{isNb ? "Utfall" : "Outcome"}</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger id="reg-activity-outcome" className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map(o => (
                    <SelectItem key={o.value} value={o.value}>{isNb ? o.nb : o.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-activity-date" className="text-xs">{isNb ? "Dato" : "Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button id="reg-activity-date" variant="outline" className={cn("w-full h-9 justify-start text-left font-normal text-xs", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    {date ? format(date, "dd.MM.yyyy") : (isNb ? "Velg" : "Pick")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Attachment note */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-activity-attachment" className="text-xs">{isNb ? "Vedleggsnotat" : "Attachment note"}</Label>
            <Input
              id="reg-activity-attachment"
              value={attachmentNote}
              onChange={e => setAttachmentNote(e.target.value)}
              placeholder={isNb ? "Referanse til vedlegg, f.eks. filnavn eller lenke" : "Reference to attachment, e.g. filename or link"}
            />
          </div>

          <Button type="submit" className="w-full">
            {isNb ? "Lagre aktivitet" : "Save activity"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
