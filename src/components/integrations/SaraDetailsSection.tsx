import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Laptop, ArrowRight, Check } from "lucide-react";
import { SaraRequirementPackage } from "@/components/agents/SaraRequirementPackage";
import { supabase } from "@/integrations/supabase/client";
import {
  SARA_MONITORED_SYSTEMS,
  getSaraDeviationTypes,
} from "@/lib/saraDeviationScope";

/**
 * Utdypende informasjon om Sara. Ligger kun her, slik at
 * nedlastingsdialogen kan holdes kort overalt ellers.
 */
export function SaraDetailsSection() {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;

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
    <Card className="mt-6 p-1">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="connections" className="border-b px-4">
          <AccordionTrigger className="text-sm">
            {isNb ? "Hva Sara er koblet til" : "What Sara is connected to"}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 pb-2">
              {inScope.map((s) => (
                <li key={s.id} className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
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
              <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {isNb ? "Kommer senere" : "Coming later"}
                </span>
                {outOfScope.map((s) => (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="border-dashed text-xs font-normal text-muted-foreground/80"
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="deviationTypes" className="border-b px-4">
          <AccordionTrigger className="text-sm">
            {isNb ? "Avvik Sara dokumenterer" : "Deviations Sara documents"}
          </AccordionTrigger>
          <AccordionContent>
            {types.length === 0 ? (
              <p className="pb-2 text-[13px] text-muted-foreground">
                {isNb
                  ? "Ingen regelverk er aktivert ennå, så Sara har ingen pålagte avvikstyper å fange opp."
                  : "No regulations are activated yet, so Sara has no mandatory deviation types to capture."}
              </p>
            ) : (
              <ul className="divide-y divide-border pb-2">
                {types.map((tp) => (
                  <li key={tp.id} className="flex flex-wrap items-baseline gap-x-2 py-1.5 text-[13px]">
                    <span className="font-medium text-foreground">{isNb ? tp.title : tp.titleEn}</span>
                    <Badge variant="outline" className="text-[11px] font-normal">
                      {tp.frameworkLabel} {tp.requirementRef}
                    </Badge>
                    <span className="w-full text-muted-foreground sm:w-auto">
                      {isNb ? tp.obligation : tp.obligationEn}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>


        <AccordionItem value="boundary" className="border-b px-4">
          <AccordionTrigger className="text-sm">{t("saraDetails.boundary")}</AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-3 pb-2 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-[13px] font-medium text-foreground">
                    {t("saraDetails.staysTitle")}
                  </p>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t("saraDetails.staysItems")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-primary/[0.03] p-3">
                <div className="flex items-center gap-1.5">
                  <ArrowRight className="h-4 w-4 text-primary" aria-hidden="true" />
                  <p className="text-[13px] font-medium text-foreground">
                    {t("saraDetails.sentTitle")}
                  </p>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t("saraDetails.sentItems")}
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="package" className="border-b px-4">
          <AccordionTrigger className="text-sm">{t("saraDetails.package")}</AccordionTrigger>
          <AccordionContent>
            <div className="pb-2">
              <SaraRequirementPackage isNb={isNb} />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="never" className="border-b px-4">
          <AccordionTrigger className="text-sm">{t("saraDetails.neverTitle")}</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5 pb-2">
              {[t("saraDetails.never1"), t("saraDetails.never2"), t("saraDetails.never3")].map(
                (text, idx) => (
                  <li key={idx} className="text-[13px] text-muted-foreground">
                    • {text}
                  </li>
                ),
              )}
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="schedule" className="border-b-0 px-4">
          <AccordionTrigger className="text-sm">{t("saraDetails.manualRun")}</AccordionTrigger>
          <AccordionContent>
            <p className="pb-2 text-[13px] text-muted-foreground">{t("saraDetails.syncText")}</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
