import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { Laptop, ArrowRight } from "lucide-react";
import { SaraRequirementPackage } from "@/components/agents/SaraRequirementPackage";

/**
 * Utdypende informasjon om Sara. Ligger kun her, slik at
 * nedlastingsdialogen kan holdes kort overalt ellers.
 */
export function SaraDetailsSection() {
  const { t, i18n } = useTranslation();
  const isNb = i18n.language?.startsWith("nb") ?? true;

  return (
    <Card className="mt-6 p-1">
      <Accordion type="single" collapsible className="w-full">
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
