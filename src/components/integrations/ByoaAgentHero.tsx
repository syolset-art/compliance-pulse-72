import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, Link2, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";
import byoaHero from "@/assets/byoa-agent-hero.png";

/**
 * Toppseksjon for agenttilkobling: verdibudskap, statuspille og tre steg
 * som forklarer hvordan brukeren kobler til sin egen agent.
 */
export function ByoaAgentHero({
  onConnect,
  activeCount,
}: {
  onConnect: () => void;
  activeCount: number;
}) {
  const { t } = useTranslation();
  const [showBoundary, setShowBoundary] = useState(false);

  const steps = [
    { icon: KeyRound, key: "how1" },
    { icon: Link2, key: "how2" },
    { icon: ListChecks, key: "how3" },
  ] as const;

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div className="min-w-0">
            <Badge
              variant="outline"
              className={
                activeCount > 0
                  ? "border-success/30 bg-success/15 text-[11px] text-success"
                  : "border-border bg-muted text-[11px] text-muted-foreground"
              }
            >
              {activeCount > 0
                ? t("byoa.hero.statusActive", { count: activeCount })
                : t("byoa.hero.statusNone")}
            </Badge>

            <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
              {t("byoa.hero.title")}
            </h2>
            <p className="mt-2 max-w-prose text-[13px] leading-relaxed text-muted-foreground">
              {t("byoa.hero.intro")}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button className="h-10 gap-2" onClick={onConnect}>
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {t("byoa.hero.connect")}
              </Button>
              <Button
                variant="outline"
                className="h-10 gap-2"
                onClick={() => setShowBoundary(true)}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {t("byoa.hero.seeAccess")}
              </Button>
            </div>

            <ol className="mt-6 space-y-3 border-t border-border pt-5">
              {steps.map(({ icon: Icon, key }, i) => (
                <li key={key} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {i + 1}. {t(`byoa.hero.${key}.title`)}
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      {t(`byoa.hero.${key}.body`)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl bg-accent/10">
              <img
                src={byoaHero}
                alt={t("byoa.hero.title")}
                className="h-48 w-full object-cover md:h-full md:min-h-[280px]"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Card>

      <Dialog open={showBoundary} onOpenChange={setShowBoundary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("byoa.hero.seeAccess")}</DialogTitle>
          </DialogHeader>
          <TrustBoundaryStrip activeCount={activeCount} discoveredTotal={0} />
        </DialogContent>
      </Dialog>
    </>
  );
}
