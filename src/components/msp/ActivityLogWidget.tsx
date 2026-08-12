import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

function getEntries(isNb: boolean): ActivityEntry[] {
  return [
    {
      id: "1",
      kind: "activation",
      customer: "Bergen Energi AS",
      text: isNb
        ? "Aktiverte NIS2 og Mynder Core (inntil 20 systemer)"
        : "Activated NIS2 and Mynder Core (up to 20 systems)",
      time: isNb ? "For 2 timer siden" : "2 hours ago",
      actor: "Kari Nordmann",
    },
    {
      id: "2",
      kind: "offer",
      customer: "Nordvest Logistikk",
      text: isNb ? "Tilbud sendt – 4 tjenester, 62 400 kr" : "Offer sent – 4 services, 62,400 kr",
      time: isNb ? "I går, 15:20" : "Yesterday, 15:20",
      actor: "Jonas Berg",
    },
    {
      id: "3",
      kind: "lara",
      customer: "Fjordkraft Digital",
      text: isNb
        ? "Lara fant 12 nye systemer via Microsoft-kobling"
        : "Lara found 12 new systems via Microsoft integration",
      time: isNb ? "I går, 09:05" : "Yesterday, 09:05",
      actor: "Lara",
    },
    {
      id: "4",
      kind: "document",
      customer: "Sunnmøre Helse",
      text: isNb
        ? "Databehandleravtale verifisert av uavhengig part"
        : "Data processing agreement verified by an independent party",
      time: isNb ? "For 2 dager siden" : "2 days ago",
      actor: "Kari Nordmann",
    },
    {
      id: "5",
      kind: "customer",
      customer: "Trøndelag Bygg AS",
      text: isNb ? "Ny kunde lagt til – 3 anbefalte regelverk" : "New customer added – 3 recommended frameworks",
      time: isNb ? "For 3 dager siden" : "3 days ago",
      actor: "Jonas Berg",
    },
  ];
}

function getKindMeta(isNb: boolean): Record<
  ActivityKind,
  { icon: typeof Activity; className: string; label: string }
> {
  return {
    activation: { icon: CheckCircle2, className: "bg-success-soft text-success", label: isNb ? "Aktivering" : "Activation" },
    offer: { icon: FileText, className: "bg-primary/10 text-primary", label: isNb ? "Tilbud" : "Offer" },
    document: { icon: ShieldCheck, className: "bg-primary/10 text-primary", label: isNb ? "Dokumentasjon" : "Documentation" },
    customer: { icon: UserPlus, className: "bg-muted text-muted-foreground", label: isNb ? "Kunde" : "Customer" },
    lara: { icon: Sparkles, className: "bg-recommend/15 text-recommend", label: "Lara" },
  };
}

export function ActivityLogWidget() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const ENTRIES = getEntries(isNb);
  const KIND_META = getKindMeta(isNb);

  return (
    <Card className="p-5 flex flex-col h-full max-h-[420px] overflow-hidden">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
            <h2 className="text-base font-semibold text-foreground">
              {isNb ? "Aktivitetslogg" : "Activity log"}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isNb ? "Siste aktiviteter på tvers av kundene dine" : "Latest activity across your customers"}
          </p>
        </div>
        <Badge variant="secondary" className="text-[11px] shrink-0">
          {ENTRIES.length} {isNb ? "siste" : "latest"}
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
          {isNb ? "Se all aktivitet" : "See all activity"}
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}
