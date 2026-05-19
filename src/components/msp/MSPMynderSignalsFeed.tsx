import { Sparkles, AlertTriangle, FileCheck, TrendingDown, Clock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type SignalKind = "risk" | "drop" | "document" | "deadline" | "control";

interface Signal {
  id: string;
  kind: SignalKind;
  title: string;
  detail: string;
  when: string;
}

interface Props {
  customerName: string;
  signals?: Signal[];
}

const ICONS: Record<SignalKind, { Icon: React.ComponentType<any>; cls: string }> = {
  risk: { Icon: AlertTriangle, cls: "text-destructive bg-destructive/10" },
  drop: { Icon: TrendingDown, cls: "text-warning bg-warning/10" },
  document: { Icon: FileCheck, cls: "text-primary bg-primary/10" },
  deadline: { Icon: Clock, cls: "text-warning bg-warning/10" },
  control: { Icon: Shield, cls: "text-muted-foreground bg-muted" },
};

const DEFAULT_SIGNALS = (name: string): Signal[] => [
  {
    id: "s1", kind: "drop",
    title: `Modenhet i Personvern falt 8% hos ${name}`,
    detail: "Lara oppdaget at databehandleravtaler med 2 nye leverandører mangler signering.",
    when: "I dag",
  },
  {
    id: "s2", kind: "risk",
    title: "Ny kritisk tredjepartsrisiko",
    detail: "Microsoft 365 — varslet hendelse hos underleverandør (sub-processor). Kunden er ikke informert.",
    when: "I går",
  },
  {
    id: "s3", kind: "document",
    title: "Nytt dokument klassifisert av Lara",
    detail: "ISMS-policy lastet opp av kunden — mappet automatisk mot ISO 27001 A.5.1.",
    when: "For 2 dager siden",
  },
  {
    id: "s4", kind: "deadline",
    title: "NIS2-frist nærmer seg",
    detail: "Hendelsesrutiner må være på plass innen 14 dager for å dekke Art.23.",
    when: "Om 14 dager",
  },
  {
    id: "s5", kind: "control",
    title: "Automatisk kontroll bestått",
    detail: "Acronis backup-status: alle 18 enheter rapporterer grønt siste 7 dager.",
    when: "For 3 dager siden",
  },
];

export function MSPMynderSignalsFeed({ customerName, signals }: Props) {
  const items = signals ?? DEFAULT_SIGNALS(customerName);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Signaler fra Mynder</h3>
        <span className="text-[12px] text-muted-foreground">
          · automatisk generert, ikke kundens egne aktiviteter
        </span>
      </div>

      <ul className="space-y-2.5">
        {items.map(s => {
          const { Icon, cls } = ICONS[s.kind];
          return (
            <li key={s.id} className="flex gap-3">
              <div className={cn("h-8 w-8 rounded-full flex items-center justify-center shrink-0", cls)}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{s.title}</p>
                  <span className="text-[11px] text-muted-foreground shrink-0">{s.when}</span>
                </div>
                <p className="text-[13px] text-muted-foreground mt-0.5">{s.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
