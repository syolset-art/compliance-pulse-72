import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Diamond, CheckCircle2, Mail, ClipboardList, RefreshCw, FileWarning, Inbox, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewTask {
  id: string;
  severity: "critical" | "high" | "medium";
  vendor: { id: string; name: string };
  meta: string;
  laraSees: string;
  requestType: string;
  categoryKey: string;
}

interface Props {
  task: ReviewTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => void;
  onRejectManual: () => void;
}

const PLAN_DETAILS: Record<string, { action: string; outcomes: string[]; Icon: React.ComponentType<{ className?: string }> }> = {
  missing_dpa: {
    action: "Sender forespørsel om signert databehandleravtale med standardvedlegg til leverandøren.",
    outcomes: ["E-post sendt til kontaktperson", "Forespørsel logget på leverandøren", "Påminnelse satt om 7 dager"],
    Icon: FileWarning,
  },
  expired_docs: {
    action: "Ber leverandør laste opp oppdaterte sertifikater eller fornyet avtale via Trust-portalen.",
    outcomes: ["E-post sendt med opplastingslenke", "Dokumentstatus settes til «venter»", "Profil oppdateres når svar mottas"],
    Icon: RefreshCw,
  },
  high_risk: {
    action: "Sender risikovurderings-spørreskjema og kjører Lara-analyse på svarene.",
    outcomes: ["Spørreskjema sendt til leverandør", "Lara analyserer svar når de kommer", "Risikoprofil og score oppdateres"],
    Icon: ShieldCheck,
  },
  inbox: {
    action: "Behandler innkomne dokumenter i Lara-innboksen og oppdaterer leverandørprofilen automatisk.",
    outcomes: ["Dokumenter klassifisert", "Relevante felter oppdatert på profilen", "Innboks-elementer arkivert"],
    Icon: Inbox,
  },
  overdue_review: {
    action: "Kjører periodisk gjennomgang og setter ny review-dato 12 måneder frem.",
    outcomes: ["Compliance-score reberegnet", "Avvik logget som oppgaver", "Ny review-dato satt"],
    Icon: ClipboardList,
  },
};

const FALLBACK = {
  action: "Lara håndterer oppfølgingen og oppdaterer leverandørprofilen.",
  outcomes: ["Handling utført automatisk", "Resultat logget på leverandøren"],
  Icon: AlertTriangle,
};

const severityMeta = {
  critical: { label: "KRITISK", dot: "bg-destructive", text: "text-destructive" },
  high: { label: "HØY", dot: "bg-warning", text: "text-warning" },
  medium: { label: "MIDDELS", dot: "bg-primary", text: "text-primary" },
};

export function LaraPlanReviewDialog({ task, open, onOpenChange, onApprove, onRejectManual }: Props) {
  if (!task) return null;
  const plan = PLAN_DETAILS[task.categoryKey] ?? FALLBACK;
  const sev = severityMeta[task.severity];
  const { Icon } = plan;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Diamond className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-bold tracking-wider text-muted-foreground">LARAS PLAN</span>
            <span className={cn("ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold tracking-wider", sev.text)}>
              <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
              {sev.label}
            </span>
          </div>
          <DialogTitle className="text-lg leading-tight">{task.vendor.name}</DialogTitle>
          {task.meta && <DialogDescription>{task.meta}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg bg-muted/60 border border-border/50 p-3">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1">LARA SER</p>
            <p className="text-sm text-foreground leading-relaxed">{task.laraSees}</p>
          </div>

          <div className="rounded-lg bg-primary/[0.06] border border-primary/15 p-3">
            <p className="text-[11px] font-bold tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Icon className="h-3 w-3" /> LARA FORESLÅR
            </p>
            <p className="text-sm text-foreground leading-relaxed mb-2.5">{plan.action}</p>
            <ul className="space-y-1">
              {plan.outcomes.map((o) => (
                <li key={o} className="flex items-start gap-2 text-[13px] text-foreground/80">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12px] text-muted-foreground flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            Du kan alltid hente forslaget tilbake fra Lara-innboksen.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onRejectManual}>
            Avvis – gjør manuelt
          </Button>
          <Button onClick={onApprove}>
            Godkjenn – la Lara håndtere
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
