import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sparkles,
  UserRound,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";
import {
  type DeliveryItem,
  type LaraStep,
  getStepText,
  getStepVia,
} from "./MSPMaturityServiceMatrix";
import { IntegrationBadge } from "./DeliveryWizard";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: DeliveryItem;
  onApprove: () => void;
}

export const DeliverySummaryDialog = ({
  open,
  onOpenChange,
  delivery,
  onApprove,
}: Props) => {
  const allActivities = delivery.controls.flatMap((c) =>
    c.activities.map((a) => ({ control: c, activity: a })),
  );
  const evidenceCount = allActivities.reduce(
    (s, x) => s + (x.activity.evidence?.length ?? 0),
    0,
  );
  const laraStepCount = allActivities.reduce(
    (s, x) => s + (x.activity.laraSteps?.length ?? 0),
    0,
  );
  const partnerStepCount = allActivities.reduce(
    (s, x) => s + (x.activity.partnerSteps?.length ?? 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <DialogTitle>Gjennomgang før leveranserapport</DialogTitle>
          </div>
          <DialogDescription>
            Bekreft at alt under er utført korrekt. Når du godkjenner, genererer
            Lara leveranserapporten og legger den klar for sending til kunde.
          </DialogDescription>
        </DialogHeader>

        {/* Sammendragstall */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          <Stat value={delivery.controls.length} label="Kontrollpunkter" />
          <Stat value={allActivities.length} label="Aktiviteter" />
          <Stat
            value={laraStepCount}
            label="Steg utført av Lara"
            tone="primary"
          />
          <Stat
            value={partnerStepCount}
            label="Steg utført manuelt"
            tone="muted"
          />
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-2">
            {delivery.controls.map((c) => (
              <div
                key={c.id}
                className="rounded-lg border border-border bg-card/50 p-4 space-y-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {c.id}
                  </Badge>
                  <span className="text-sm font-medium text-foreground">
                    {c.name}
                  </span>
                </div>

                <div className="space-y-3">
                  {c.activities.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-md border border-border/60 bg-background p-3 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <CheckCircle2
                            className={
                              a.done
                                ? "h-4 w-4 text-success shrink-0 mt-0.5"
                                : "h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
                            }
                          />
                          <div className="min-w-0">
                            <p className="text-[13px] font-medium text-foreground">
                              {a.label}
                            </p>
                            {a.owner && (
                              <p className="text-[11px] text-muted-foreground">
                                Eier: {a.owner}
                                {a.date && <> · {a.date}</>}
                              </p>
                            )}
                          </div>
                        </div>
                        {a.evidence && a.evidence.length > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                            <FileText className="h-3 w-3" />
                            {a.evidence.length} bevis
                          </Badge>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-2 pl-6">
                        <StepList
                          icon={Sparkles}
                          tone="primary"
                          title="Lara utførte"
                          steps={a.laraSteps}
                          emptyLabel="—"
                        />
                        <StepList
                          icon={UserRound}
                          tone="muted"
                          title="Partner utførte manuelt"
                          steps={a.partnerSteps}
                          emptyLabel="Ingen manuelle steg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={onApprove} className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Godkjenn – generer leveranserapport ({evidenceCount} vedlegg)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Stat = ({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone?: "primary" | "muted";
}) => (
  <div
    className={
      tone === "primary"
        ? "rounded-lg border border-primary/20 bg-primary/5 p-2.5"
        : "rounded-lg border border-border bg-card p-2.5"
    }
  >
    <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
    <p className="text-[10px] text-muted-foreground leading-tight">{label}</p>
  </div>
);

const StepList = ({
  icon: Icon,
  tone,
  title,
  steps,
  emptyLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "muted";
  title: string;
  steps?: string[];
  emptyLabel: string;
}) => {
  const isPrimary = tone === "primary";
  return (
    <div
      className={
        isPrimary
          ? "rounded-md border border-primary/15 bg-primary/[0.04] p-2.5"
          : "rounded-md border border-border bg-muted/30 p-2.5"
      }
    >
      <p
        className={
          isPrimary
            ? "text-[10px] font-medium text-primary uppercase tracking-wide flex items-center gap-1.5 mb-1.5"
            : "text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5 mb-1.5"
        }
      >
        <Icon className="h-3 w-3" />
        {title}
      </p>
      {steps && steps.length > 0 ? (
        <ul className="space-y-1">
          {steps.map((s, i) => (
            <li
              key={i}
              className="text-[12px] text-foreground leading-snug flex gap-1.5"
            >
              <span className="text-muted-foreground">·</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[12px] text-muted-foreground italic">{emptyLabel}</p>
      )}
    </div>
  );
};
