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
import { Eye, ListChecks, Plug, ShieldCheck, Sparkles } from "lucide-react";
import { TrustBoundaryStrip } from "@/components/integrations/TrustBoundaryStrip";

/**
 * BYOA-toppseksjon: illustrasjonsflate til venstre, verdibudskap og CTA til høyre.
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
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
          <div className="flex h-40 w-full shrink-0 items-center justify-center rounded-xl bg-accent/10 md:h-44 md:w-56">
            <Plug className="h-14 w-14 text-accent-foreground" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {t("byoa.hero.title")}
            </h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              {t("byoa.hero.intro")}
            </p>

            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
              {points.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-1.5 text-[13px] text-foreground">
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
