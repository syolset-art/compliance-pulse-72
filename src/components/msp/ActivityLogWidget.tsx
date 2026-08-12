import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  UserPlus,
  ChevronRight,
} from "lucide-react";

type ActivityKind = "activation" | "offer" | "document" | "customer" | "lara";

type ActivityEntry = {
  id: string;
  kind: ActivityKind;
  customer: string;
  text: string;
  time: string;
  actor: string;
};

const ENTRIES: ActivityEntry[] = [
  {
    id: "1",
    kind: "activation",
    customer: "Bergen Energi AS",
    text: "Aktiverte NIS2 og Mynder Core (inntil 20 systemer)",
    time: "For 2 timer siden",
    actor: "Kari Nordmann",
  },
  {
    id: "2",
    kind: "offer",
    customer: "Nordvest Logistikk",
    text: "Tilbud sendt – 4 tjenester, 62 400 kr",
    time: "I går, 15:20",
    actor: "Jonas Berg",
  },
  {
    id: "3",
    kind: "lara",
    customer: "Fjordkraft Digital",
    text: "Lara fant 12 nye systemer via Microsoft-kobling",
    time: "I går, 09:05",
    actor: "Lara",
  },
  {
    id: "4",
    kind: "document",
    customer: "Sunnmøre Helse",
    text: "Databehandleravtale verifisert av uavhengig part",
    time: "For 2 dager siden",
    actor: "Kari Nordmann",
  },
  {
    id: "5",
    kind: "customer",
    customer: "Trøndelag Bygg AS",
    text: "Ny kunde lagt til – 3 anbefalte regelverk",
    time: "For 3 dager siden",
    actor: "Jonas Berg",
  },
];

const KIND_META: Record<
  ActivityKind,
  { icon: typeof Activity; className: string; label: string }
> = {
  activation: { icon: CheckCircle2, className: "bg-success-soft text-success", label: "Aktivering" },
  offer: { icon: FileText, className: "bg-primary/10 text-primary", label: "Tilbud" },
  document: { icon: ShieldCheck, className: "bg-primary/10 text-primary", label: "Dokumentasjon" },
  customer: { icon: UserPlus, className: "bg-muted text-muted-foreground", label: "Kunde" },
  lara: { icon: Sparkles, className: "bg-recommend/15 text-recommend", label: "Lara" },
};

export function ActivityLogWidget() {
  const navigate = useNavigate();

  return (
    <Card className="p-5 flex flex-col h-full max-h-[420px] overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="text-base font-semibold text-foreground">Aktivitetslogg</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Siste aktiviteter på tvers av kundene dine
          </p>
        </div>
        <Badge variant="secondary" className="text-[11px] shrink-0">
          {ENTRIES.length} siste
        </Badge>
      </div>

      <ol className="relative flex-1 min-h-0 overflow-auto space-y-3 before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-px before:bg-border">
        {ENTRIES.map((e) => {
          const meta = KIND_META[e.kind];
          const Icon = meta.icon;
          return (
            <li key={e.id} className="relative flex gap-3">
              <div
                className={`relative z-10 h-[26px] w-[26px] shrink-0 rounded-full flex items-center justify-center ring-4 ring-card ${meta.className}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-medium text-foreground truncate max-w-full">
                    {e.customer}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{e.time}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{e.text}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-0.5">{e.actor}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="pt-3 mt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between text-xs"
          onClick={() => navigate("/activity-log")}
        >
          Se all aktivitet
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
