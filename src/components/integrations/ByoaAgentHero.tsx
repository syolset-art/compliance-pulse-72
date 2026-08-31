import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, ListChecks, ShieldCheck, Sparkles } from "lucide-react";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";
import { CapabilityList } from "@/components/integrations/AgentCapabilitiesList";
import byoaHero from "@/assets/byoa-agent-hero.png";

/**
 * BYOA-toppseksjon: illustrasjon og verdibudskap til venstre, hva agenten kan gjøre til høyre.
 */
export function ByoaAgentHero({ onConnect }: { onConnect: () => void }) {
  const { t } = useTranslation();
  const [showBoundary, setShowBoundary] = useState(false);

  const points = [
    { icon: Eye, text: t("byoa.hero.point1") },
    { icon: ListChecks, text: t("byoa.hero.point2") },
    { icon: ShieldCheck, text: t("byoa.hero.point3") },
  ];

  return (
    <>
      <Card className="mt-6 overflow-hidden">
        <div className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-xl bg-accent/10">
              <img
                src={byoaHero}
                alt={t("byoa.hero.title")}
                className="h-40 w-full object-cover md:h-48"
                loading="lazy"
              />
            </div>

            <h2 className="mt-5 text-xl font-semibold tracking-tight text-foreground">
              {t("byoa.hero.title")}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {t("byoa.hero.intro")}
            </p>

            <ul className="mt-4 space-y-1.5">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2 text-[13px] text-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
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
          </div>

          <div className="min-w-0 md:border-l md:border-border md:pl-8">
            <CapabilityList />
          </div>
        </div>
      </Card>

      <Dialog open={showBoundary} onOpenChange={setShowBoundary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("byoa.hero.seeAccess")}</DialogTitle>
          </DialogHeader>
          <TrustBoundaryStrip activeCount={0} discoveredTotal={0} />
        </DialogContent>
      </Dialog>
    </>
  );
}
