import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VendorActivity, ActivityType, Phase, OutcomeStatus } from "@/utils/vendorActivityData";

interface Props {
  onSubmit: (activity: VendorActivity) => void;
}

const ACTIVITY_TYPES: { value: ActivityType; nb: string; en: string }[] = [
  { value: "email", nb: "E-postdialog", en: "Email correspondence" },
  { value: "phone", nb: "Telefonsamtale", en: "Phone call" },
  { value: "meeting", nb: "Møte", en: "Meeting" },
  { value: "manual", nb: "Annet", en: "Other" },
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

export function RegisterActivityDialog({ onSubmit }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [open, setOpen] = useState(false);

  const [type, setType] = useState<ActivityType>("email");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<Phase>("ongoing");
  const [outcome, setOutcome] = useState("informed");
  const [date, setDate] = useState<Date>(new Date());

  const reset = () => {
    setType("email"); setTitle(""); setDescription("");
    setPhase("ongoing"); setOutcome("informed"); setDate(new Date());
  };

  const handleSubmit = () => {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNb ? "Registrer aktivitet" : "Register activity"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>{isNb ? "Type" : "Type"}</Label>
            <Select value={type} onValueChange={v => setType(v as ActivityType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{isNb ? t.nb : t.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{isNb ? "Tittel" : "Title"}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isNb ? "Kort beskrivelse…" : "Short description…"} />
          </div>
          <div className="space-y-1.5">
            <Label>{isNb ? "Beskrivelse" : "Description"}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={isNb ? "Detaljer om samtalen…" : "Details about the conversation…"} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{isNb ? "Fase" : "Phase"}</Label>
              <Select value={phase} onValueChange={v => setPhase(v as Phase)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHASES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{isNb ? p.nb : p.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{isNb ? "Utfall" : "Outcome"}</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTCOMES.map(o => (
                    <SelectItem key={o.value} value={o.value}>{isNb ? o.nb : o.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{isNb ? "Dato" : "Date"}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : (isNb ? "Velg dato" : "Pick a date")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={d => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleSubmit} disabled={!title.trim()} className="w-full">
            {isNb ? "Lagre aktivitet" : "Save activity"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
