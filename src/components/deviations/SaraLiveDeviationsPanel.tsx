import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SaraIcon } from "@/components/agents/SaraIcon";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from "lucide-react";
import {
  SARA_MONITORED_SYSTEMS,
  SARA_RECENT_DEVIATIONS,
  getSaraDeviationTypes,
} from "@/lib/saraDeviationScope";
import { SARA_AGENT_VERSION } from "@/lib/saraScope";

interface Props {
  isNb?: boolean;
}

const severityLabel: Record<string, { nb: string; en: string; cls: string }> = {
  critical: { nb: "Kritisk", en: "Critical", cls: "text-destructive border-destructive/30 bg-destructive/10" },
  high: { nb: "Høy", en: "High", cls: "text-warning border-warning/30 bg-warning/10" },
  medium: { nb: "Middels", en: "Medium", cls: "text-warning border-warning/30 bg-warning/10" },
  low: { nb: "Lav", en: "Low", cls: "text-muted-foreground border-border" },
};

export function SaraLiveDeviationsPanel({ isNb = true }: Props) {
  const navigate = useNavigate();

  const { data: activeFrameworkIds = [] } = useQuery({
    queryKey: ["sara-active-frameworks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("selected_frameworks")
        .select("framework_id, is_selected")
        .eq("is_selected", true);
      return (data || []).map((f: any) => f.framework_id as string);
    },
  });

  const types = getSaraDeviationTypes(activeFrameworkIds);
  const inScope = SARA_MONITORED_SYSTEMS.filter((s) => s.status === "connected");
  const outOfScope = SARA_MONITORED_SYSTEMS.filter((s) => s.status === "out_of_scope");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
        <SaraIcon className="h-5 w-5" />
        <span className="text-sm font-medium text-foreground">
          {isNb ? "Sara kjører lokalt hos dere" : "Sara runs locally in your infrastructure"}
        </span>
        <span className="text-xs text-muted-foreground">
          v{SARA_AGENT_VERSION} · {inScope.length} {isNb ? "systemer i scope" : "systems in scope"} ·{" "}
          {isNb ? "sist kjørt" : "last run"} {inScope[0]?.lastRun ?? "—"}
        </span>
      </div>

      {/* 1. Scope */}
      <div className="rounded-lg border border-border bg-muted/20 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-foreground">
            {isNb ? "Hva Sara er koblet til" : "What Sara is connected to"}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => navigate("/settings/integrations")}
          >
            {isNb ? "Endre scope" : "Change scope"}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <ul className="space-y-1.5">
          {inScope.map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
              <Check className="h-3 w-3 shrink-0 translate-y-0.5 text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">{s.name}</span>
              <span className="text-muted-foreground">{s.watches}</span>
              <span className="ml-auto text-muted-foreground/70">
                {isNb ? "Eier" : "Owner"}: {s.owner} · {s.lastRun}
              </span>
            </li>
          ))}
        </ul>
        {outOfScope.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {isNb ? "Kommer senere" : "Coming later"}
            </span>
            {outOfScope.map((s) => (
              <Badge key={s.id} variant="outline" className="border-dashed text-xs font-normal text-muted-foreground/80">
                {s.name}
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-2 text-[12px] text-muted-foreground">
          {isNb
            ? "Sara ser kun det som er listet her. Systemer utenfor scope kartlegges ikke."
            : "Sara only sees what is listed here. Systems out of scope are not assessed."}
        </p>
      </div>

      {/* 2. Deviation types */}
      <div className="rounded-lg border border-border p-3">
        <p className="mb-1 text-xs font-medium text-foreground">
          {isNb ? "Avvik Sara dokumenterer" : "Deviations Sara documents"}
        </p>
        <p className="mb-2 text-[12px] text-muted-foreground">
          {isNb
            ? "Kun avvik dere er pålagt å fange opp etter regelverk dere har aktivert. Sara rapporterer ikke avvik utenfor dette."
            : "Only deviations you are required to capture under the regulations you have activated. Sara reports nothing beyond this."}
        </p>
        {types.length === 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            {isNb
              ? "Ingen regelverk er aktivert ennå, så Sara har ingen pålagte avvikstyper å fange opp."
              : "No regulations are activated yet, so Sara has no mandatory deviation types to capture."}
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => navigate("/regulations")}
            >
              {isNb ? "Velg regelverk" : "Select regulations"}
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {types.map((tp) => (
              <li key={tp.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 py-1.5 text-xs">
                <span className="font-medium text-foreground">{isNb ? tp.title : tp.titleEn}</span>
                <Badge variant="outline" className="text-[11px] font-normal">
                  {tp.frameworkLabel} {tp.requirementRef}
                </Badge>
                <span className="w-full text-muted-foreground sm:w-auto">
                  {isNb ? tp.obligation : tp.obligationEn}
                  {tp.smsOnCritical && (
                    <span className="ml-1.5 text-primary">
                      · {isNb ? "SMS ved kritisk" : "SMS when critical"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 3. Flow */}
      <div className="rounded-lg border border-border bg-muted/30 p-3">
        <p className="mb-2 text-xs font-medium text-foreground">
          {isNb ? "Fra funn til eier" : "From finding to owner"}
        </p>
        <div className="flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:gap-3">
          {[
            {
              icon: Search,
              nb: "Sara oppdager avviket lokalt",
              en: "Sara detects the deviation locally",
            },
            {
              icon: ShieldCheck,
              nb: "Klassifiseres mot aktivert regelverk",
              en: "Classified against activated regulations",
            },
            {
              icon: UserCheck,
              nb: "Avvik opprettes og tildeles systemeier",
              en: "Deviation created and assigned to the system owner",
            },
            {
              icon: MessageSquare,
              nb: "Kritisk: SMS til eier der varsling er pålagt",
              en: "Critical: SMS to the owner where notification is required",
            },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="outline" className="bg-background text-[11px]">
                {i + 1}
              </Badge>
              <step.icon className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>{isNb ? step.nb : step.en}</span>
              {i < 3 && <ArrowRight className="hidden h-3 w-3 text-muted-foreground/50 md:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Privacy boundary */}
      <div className="rounded-lg border border-dashed border-border p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span className="text-[13px] font-medium text-foreground">
            {isNb ? "Personverngrense" : "Privacy boundary"}
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">
          {isNb
            ? "Sara sender kun metadata til Mynder: systemidentifikator, tidspunkt, kravreferanse, alvorlighet og hash. Aldri innhold."
            : "Sara only sends metadata to Mynder: system identifier, timestamp, requirement reference, severity and hash. Never content."}
        </p>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {(isNb
            ? ["Dokumentinnhold", "Personopplysninger", "Logger", "Nøkler og hemmeligheter"]
            : ["Document content", "Personal data", "Logs", "Keys and secrets"]
          ).map((n) => (
            <li
              key={n}
              className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[12px] text-muted-foreground"
            >
              <X className="h-3 w-3 text-destructive" aria-hidden="true" />
              {n}
            </li>
          ))}
        </ul>
      </div>

      {/* Recent findings */}
      <div className="rounded-lg border border-border p-3">
        <p className="mb-2 text-xs font-medium text-foreground">
          {isNb ? "Siste avvik fra Sara" : "Latest deviations from Sara"}
        </p>
        <ul className="divide-y divide-border">
          {SARA_RECENT_DEVIATIONS.map((f) => {
            const sev = severityLabel[f.severity];
            return (
              <li key={f.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 py-2 text-xs">
                <SaraIcon className="h-4 w-4 shrink-0" />
                <span className="font-medium text-foreground">{f.summary}</span>
                <Badge variant="outline" className={cn("text-[11px] font-normal", sev.cls)}>
                  {isNb ? sev.nb : sev.en}
                </Badge>
                <Badge variant="outline" className="text-[11px] font-normal">
                  {f.requirementRef}
                </Badge>
                <span className="w-full text-muted-foreground sm:ml-auto sm:w-auto">
                  {f.system} · {isNb ? "tildelt" : "assigned to"} {f.owner} · {f.at}
                  {f.notified && (
                    <span className="ml-1.5 text-primary">· {isNb ? "SMS sendt" : "SMS sent"}</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
