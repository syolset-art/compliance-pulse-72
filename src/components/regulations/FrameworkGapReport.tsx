import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  XCircle,
  Download,
  Plus,
  FileBarChart,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type {
  FrameworkQuestionnaireDefinition,
  QuestionnaireScore,
} from "@/lib/frameworkQuestionnaires";

interface Props {
  definition: FrameworkQuestionnaireDefinition;
  score: QuestionnaireScore;
  updatedAt: string;
  onStartQuestionnaire: () => void;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function scoreBar(score: number) {
  if (score >= 75) return "bg-success";
  if (score >= 50) return "bg-warning";
  return "bg-destructive";
}

const MATURITY_LABELS = ["Innledende", "Begynnende", "Etablert", "Styrt", "Optimalisert"];

export function FrameworkGapReport({ definition, score, updatedAt, onStartQuestionnaire }: Props) {
  if (score.answered === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center space-y-4">
        <FileBarChart className="h-10 w-10 mx-auto text-muted-foreground" />
        <div>
          <h3 className="text-lg font-semibold text-foreground">Ingen gap-data ennå</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Svar på spørreskjemaet for å generere en gap-rapport for {definition.title}.
          </p>
        </div>
        <Button onClick={onStartQuestionnaire} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Start spørreskjema
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Gap-rapport</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Basert på {score.answered} av {score.total} besvarte spørsmål
              {updatedAt && ` · Sist oppdatert ${new Date(updatedAt).toLocaleDateString("nb-NO")}`}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.info("PDF-eksport kommer snart", {
                description: "Gap-rapporten vil kunne lastes ned som PDF.",
              })
            }
          >
            <Download className="h-3.5 w-3.5" />
            Last ned PDF
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Gap-score</div>
            <div className={cn("text-3xl font-bold tabular-nums mt-1", scoreColor(score.score))}>
              {score.score}%
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Modenhet</div>
            <div className="text-3xl font-bold text-foreground mt-1">{score.maturityLevel}/4</div>
            <div className="text-[11px] text-muted-foreground">{MATURITY_LABELS[score.maturityLevel]}</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Identifiserte gap</div>
            <div className="text-3xl font-bold text-destructive mt-1 tabular-nums">{score.gaps.length}</div>
            <div className="text-[11px] text-muted-foreground">
              {score.no} nei · {score.partial} delvis
            </div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Oppfylt</div>
            <div className="text-3xl font-bold text-success mt-1 tabular-nums">{score.yes}</div>
            <div className="text-[11px] text-muted-foreground">
              {score.unsure} usikker · {score.na} ikke aktuelt
            </div>
          </div>
        </div>
      </div>

      {/* Per section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Per kontrollområde</h3>
        <div className="space-y-4">
          {score.sections.map((s) => (
            <div key={s.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{s.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.yes + s.partial + s.no + s.unsure + s.na}/{s.total} besvart
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-success border-success/30">
                    <CheckCircle2 className="h-3 w-3" /> {s.yes}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-warning border-warning/30">
                    <CircleAlert className="h-3 w-3" /> {s.partial}
                  </Badge>
                  <Badge variant="outline" className="gap-1 text-destructive border-destructive/30">
                    <XCircle className="h-3 w-3" /> {s.no}
                  </Badge>
                  <span className={cn("text-sm font-semibold tabular-nums w-12 text-right", scoreColor(s.score))}>
                    {s.score}%
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full transition-all", scoreBar(s.score))}
                  style={{ width: `${s.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap list */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            Identifiserte gap ({score.gaps.length})
          </h3>
        </div>

        {score.gaps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <CheckCircle2 className="h-8 w-8 text-success mx-auto mb-2" />
            Ingen gap identifisert i de besvarte spørsmålene.
          </div>
        ) : (
          <div className="space-y-3">
            {score.gaps.map((g, i) => (
              <div key={g.question.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-2 flex-1">
                    {g.answer === "no" ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : (
                      <CircleAlert className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">{g.sectionTitle}</span>
                        {g.question.reference && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            {g.question.reference}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-foreground leading-snug">{g.question.text}</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0",
                      g.answer === "no"
                        ? "text-destructive border-destructive/40"
                        : "text-warning border-warning/40",
                    )}
                  >
                    {g.answer === "no" ? "Ikke oppfylt" : "Delvis"}
                  </Badge>
                </div>
                {g.question.suggestedAction && (
                  <>
                    <Separator className="my-3" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2 flex-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          <span className="font-medium text-foreground">Anbefalt tiltak: </span>
                          {g.question.suggestedAction}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 shrink-0"
                        onClick={() =>
                          toast.success("Aktivitet foreslått", {
                            description: g.question.suggestedAction,
                          })
                        }
                      >
                        <Plus className="h-3 w-3" />
                        Opprett aktivitet
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
