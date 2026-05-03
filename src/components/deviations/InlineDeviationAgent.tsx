import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sparkles,
  Loader2,
  X,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ListChecks,
  PenLine,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDeviationAgent } from "@/hooks/useDeviationAgent";
import { deviationCategories, criticalityOptions } from "@/lib/deviationCategories";
import { format, addHours } from "date-fns";
import { nb } from "date-fns/locale";

interface InlineDeviationAgentProps {
  open: boolean;
  onClose: () => void;
  onOpenManualFallback?: () => void;
}

const QUICK_CATEGORIES = [
  "datainnbrudd",
  "tilgangskontroll",
  "personvern",
  "sikkerhet",
  "ai_avvik",
  "hms",
];

export function InlineDeviationAgent({
  open,
  onClose,
  onOpenManualFallback,
}: InlineDeviationAgentProps) {
  const agent = useDeviationAgent(onClose);
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleSend = (quickCategory?: string) => {
    if (!description.trim()) return;
    agent.analyse(description.trim(), quickCategory);
  };

  const cat = agent.proposal
    ? deviationCategories.find((c) => c.id === agent.proposal!.category)
    : undefined;
  const crit = agent.proposal
    ? criticalityOptions.find((c) => c.value === agent.proposal!.criticality)
    : undefined;

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Lara hjelper deg å registrere avviket</p>
              <p className="text-xs text-muted-foreground">
                Beskriv hva som har skjedd – jeg klassifiserer og sjekker varslingsfrister
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* PROMPT */}
        {(agent.state === "idle" || agent.state === "prompt") && (
          <div className="space-y-3">
            <Textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="F.eks. 'En ansatt sendte en e-post med kundeliste til feil mottaker i morges'"
              rows={3}
              className="resize-none bg-background"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CATEGORIES.map((id) => {
                const c = deviationCategories.find((d) => d.id === id);
                if (!c) return null;
                return (
                  <button
                    key={id}
                    onClick={() => handleSend(id)}
                    disabled={!description.trim()}
                    className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition disabled:opacity-40"
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenManualFallback}
                className="text-muted-foreground"
              >
                <PenLine className="h-3.5 w-3.5 mr-1" />
                Fyll inn manuelt
              </Button>
              <Button
                size="sm"
                onClick={() => handleSend()}
                disabled={!description.trim()}
                className="gap-1.5"
              >
                Send til Lara
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ANALYSING */}
        {agent.state === "analysing" && (
          <div className="py-6 flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">Lara analyserer...</p>
              <p className="text-xs">Klassifiserer avviket og sjekker GDPR, NIS2 og ISO 27001</p>
            </div>
          </div>
        )}

        {/* DRAFT */}
        {agent.state === "draft" && agent.proposal && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{agent.proposal.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{agent.proposal.description}</p>
                </div>
                {crit && (
                  <Badge className={cn("shrink-0 text-xs font-semibold", crit.bgColor, crit.color)}>
                    {crit.label}
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {cat && (
                  <Badge variant="secondary" className="gap-1">
                    {cat.label}
                  </Badge>
                )}
                {agent.proposal.frameworks.map((fw) => (
                  <Badge key={fw} variant="outline" className="text-[11px]">
                    {fw}
                  </Badge>
                ))}
              </div>

              {agent.proposal.suggestedResponsible?.name && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <span className="font-medium text-foreground">Foreslått ansvarlig:</span>
                  {agent.proposal.suggestedResponsible.name}
                  <span className="italic">– {agent.proposal.suggestedResponsible.reason}</span>
                </div>
              )}

              <p className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2.5">
                Lara: {agent.proposal.reasoning}
              </p>
            </div>

            {/* Normative deadlines */}
            {agent.proposal.normativeRules.filter((r) => r.triggered).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-warning" />
                  Normative frister
                </p>
                <div className="space-y-1.5">
                  {agent.proposal.normativeRules
                    .filter((r) => r.triggered)
                    .map((rule) => (
                      <div
                        key={rule.code}
                        className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs"
                      >
                        <Clock className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{rule.label}</p>
                          <p className="text-muted-foreground">{rule.action}</p>
                          {rule.deadlineHours && (
                            <p className="text-warning mt-0.5">
                              Frist: innen {rule.deadlineHours}t (
                              {format(addHours(new Date(), rule.deadlineHours), "dd.MM.yyyy HH:mm", {
                                locale: nb,
                              })}
                              )
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Suggested measures */}
            {agent.proposal.suggestedMeasures.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <ListChecks className="h-3.5 w-3.5 text-primary" />
                  Foreslåtte umiddelbare tiltak
                </p>
                <ul className="space-y-1">
                  {agent.proposal.suggestedMeasures.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted-foreground italic">
                  Tiltakene opprettes som aktiviteter når du bekrefter
                </p>
              </div>
            )}

            {/* Follow-up questions */}
            {agent.proposal.followUpQuestions && agent.proposal.followUpQuestions.length > 0 && (
              <div className="space-y-2">
                <Separator />
                <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-accent" />
                  Lara trenger litt mer info
                </p>
                {agent.proposal.followUpQuestions.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <p className="text-xs text-foreground">{q.question}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => agent.refineWithAnswer(q.id, opt)}
                          className="text-xs px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenManualFallback}
                className="text-muted-foreground"
              >
                <PenLine className="h-3.5 w-3.5 mr-1" />
                Juster manuelt
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={agent.reset}>
                  Avvis
                </Button>
                <Button
                  size="sm"
                  onClick={() => agent.confirm(undefined)}
                  disabled={agent.isCreating}
                  className="gap-1.5"
                >
                  {agent.isCreating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Bekreft og opprett
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
