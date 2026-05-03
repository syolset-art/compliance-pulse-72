import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, FileCheck2, Mail, Upload, CalendarCheck, ShieldAlert, AlertOctagon, UserPlus, PackageCheck, TrendingUp, Settings2, Eye, PhoneCall, Users, PenLine, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActivityType, ActivityStatus, VendorActivity } from "@/utils/vendorActivityData";

interface ActionConfig {
  icon: React.ComponentType<{ className?: string }>;
  nb: string;
  en: string;
  laraNb: string;
  laraEn: string;
  draftNb: string;
  draftEn: string;
}

const ACTION_BY_TYPE: Record<ActivityType, ActionConfig> = {
  document: { icon: FileCheck2, nb: "Les og godkjenn dokument", en: "Read & approve document",
    laraNb: "La Lara oppsummere og foreslå godkjenning", laraEn: "Let Lara summarize and propose approval",
    draftNb: "Lara leser dokumentet, trekker ut nøkkelpunkter (DPA-paragrafer, underleverandører, datalagring) og foreslår en kort godkjenningsvurdering du kan signere.",
    draftEn: "Lara reads the document, extracts key points (DPA clauses, sub-processors, storage) and proposes a short approval note for you to sign." },
  upload: { icon: Upload, nb: "Last opp dokument", en: "Upload document",
    laraNb: "La Lara hente fra leverandørens trust portal", laraEn: "Let Lara fetch from vendor trust portal",
    draftNb: "Lara sjekker leverandørens trust-portal og foreslår dokumentet som mangler. Du bekrefter før opplasting.",
    draftEn: "Lara checks the vendor's trust portal and proposes the missing document. You confirm before upload." },
  email: { icon: Mail, nb: "Send e-post", en: "Send email",
    laraNb: "La Lara skrive utkast til e-post", laraEn: "Let Lara draft the email",
    draftNb: "Lara skriver et utkast til kontaktpersonen, klar til gjennomgang og sending.",
    draftEn: "Lara drafts an email to the contact, ready for your review and sending." },
  review: { icon: FileCheck2, nb: "Gjennomgå og godkjenn", en: "Review & approve",
    laraNb: "La Lara forberede gjennomgang", laraEn: "Let Lara prepare the review",
    draftNb: "Lara samler relevante dokumenter, kontrollstatus og åpne gap, og foreslår en konklusjon.",
    draftEn: "Lara gathers relevant documents, control status and open gaps, then proposes a conclusion." },
  meeting: { icon: CalendarCheck, nb: "Avtal og forbered møte", en: "Schedule & prepare meeting",
    laraNb: "La Lara foreslå agenda og tid", laraEn: "Let Lara propose agenda & time",
    draftNb: "Lara foreslår agenda basert på åpne punkter og setter opp møteinnkallelse i kalenderen.",
    draftEn: "Lara proposes an agenda from open items and drafts a calendar invite." },
  phone: { icon: PhoneCall, nb: "Ring kontaktperson", en: "Call contact",
    laraNb: "La Lara forberede samtalepunkter", laraEn: "Let Lara prepare talking points",
    draftNb: "Lara lager en kort liste med samtalepunkter og spørsmål du bør stille.",
    draftEn: "Lara prepares a short list of talking points and questions to ask." },
  risk: { icon: ShieldAlert, nb: "Vurder risiko", en: "Assess risk",
    laraNb: "La Lara foreslå risikovurdering", laraEn: "Let Lara propose a risk assessment",
    draftNb: "Lara analyserer kritikalitet, datatyper og åpne kontroller, og foreslår en risikoscore med begrunnelse.",
    draftEn: "Lara analyses criticality, data types and open controls, then proposes a risk score with rationale." },
  incident: { icon: AlertOctagon, nb: "Følg opp hendelse", en: "Follow up incident",
    laraNb: "La Lara samle hendelsesdata", laraEn: "Let Lara collect incident data",
    draftNb: "Lara samler tidslinje, berørte tjenester og foreslår neste tiltak.",
    draftEn: "Lara collects the timeline, affected services and proposes next actions." },
  assignment: { icon: UserPlus, nb: "Tildel ansvarlig", en: "Assign owner",
    laraNb: "La Lara foreslå ansvarlig", laraEn: "Let Lara suggest an owner",
    draftNb: "Lara foreslår mest passende person basert på rolle og tidligere oppfølging.",
    draftEn: "Lara suggests the most suitable person based on role and prior follow-up." },
  delivery: { icon: PackageCheck, nb: "Bekreft leveranse", en: "Confirm delivery",
    laraNb: "La Lara verifisere leveransen", laraEn: "Let Lara verify the delivery",
    draftNb: "Lara sjekker leveransen mot avtalen og merker avvik.",
    draftEn: "Lara checks the delivery against the contract and flags deviations." },
  maturity: { icon: TrendingUp, nb: "Oppdater modenhet", en: "Update maturity",
    laraNb: "La Lara foreslå nytt nivå", laraEn: "Let Lara suggest a new level",
    draftNb: "Lara foreslår oppdatert modenhetsnivå basert på siste evidens.",
    draftEn: "Lara proposes an updated maturity level from the latest evidence." },
  setting: { icon: Settings2, nb: "Oppdater oppsett", en: "Update settings",
    laraNb: "La Lara foreslå endringer", laraEn: "Let Lara propose changes",
    draftNb: "Lara foreslår oppdaterte verdier basert på beste praksis.",
    draftEn: "Lara proposes updated values based on best practice." },
  view: { icon: Eye, nb: "Gjennomgå", en: "Review",
    laraNb: "La Lara oppsummere", laraEn: "Let Lara summarize",
    draftNb: "Lara oppsummerer innholdet i et kort sammendrag.",
    draftEn: "Lara summarizes the content briefly." },
  manual: { icon: PenLine, nb: "Følg opp manuelt", en: "Manual follow-up",
    laraNb: "La Lara foreslå neste steg", laraEn: "Let Lara propose next step",
    draftNb: "Lara foreslår et konkret neste steg du kan utføre.",
    draftEn: "Lara proposes a concrete next step." },
};

interface Props {
  activity: VendorActivity;
  onLaraStart: (note: string) => void;
}

export function ActivityActionAffordance({ activity, onLaraStart }: Props) {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const conf = ACTION_BY_TYPE[activity.type];
  const Icon = conf.icon;

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => {
      setRunning(false);
      setDone(true);
      onLaraStart(isNb ? "Lara har påbegynt et utkast — venter på din gjennomgang." : "Lara started a draft — awaiting your review.");
    }, 900);
  };

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-foreground">
        <Icon className="h-3 w-3" />
        {isNb ? conf.nb : conf.en}
      </span>
      {!done ? (
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium transition-all",
            "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
          )}
        >
          <Sparkles className="h-3 w-3" />
          {isNb ? conf.laraNb : conf.laraEn}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/5 px-1.5 py-0.5 text-[11px] font-medium text-success">
          <Check className="h-3 w-3" />
          {isNb ? "Lara jobber med utkast" : "Lara drafting"}
        </span>
      )}

      {open && !done && (
        <div className="basis-full mt-1.5 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-xs">
          <p className="text-foreground/90 leading-relaxed">{isNb ? conf.draftNb : conf.draftEn}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" className="h-7 text-xs" onClick={handleRun} disabled={running}>
              {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
              {isNb ? "Sett Lara i gang" : "Start Lara"}
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setOpen(false)}>
              {isNb ? "Avbryt" : "Cancel"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function shouldShowAction(status: ActivityStatus) {
  return status === "open" || status === "in_progress";
}
