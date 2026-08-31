import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Check, ChevronDown, Copy, MessageSquare, Repeat, Search } from "lucide-react";

/** Kopierbar setning brukeren limer inn i agenten sin. */
function CopyPrompt({ text, className = "" }: { text: string; className?: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={`group flex w-full items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-left text-[13px] text-foreground transition-colors hover:bg-accent/10 ${className}`}
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
            toast.success(t("byoa.continuous.copied"));
          }}
        >
          <span className="min-w-0 flex-1 italic">«{text}»</span>
          {copied ? (
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden="true" />
          ) : (
            <Copy className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p className="max-w-xs text-[13px]">{t("byoa.continuous.copyTooltip")}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** Første steg etter tilkobling: be agenten lage en plan for kontinuerlig compliance. */
export function ContinuousComplianceCard() {
  const { t } = useTranslation();

  const steps = [
    { icon: MessageSquare, key: "step1" },
    { icon: Search, key: "step2" },
    { icon: Repeat, key: "step3" },
  ] as const;

  const extraPrompts = [
    t("byoa.continuous.prompt2"),
    t("byoa.continuous.prompt3"),
  ];

  const [open, setOpen] = useState(false);

  return (
    <section className="mt-6">
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-base font-semibold text-foreground">
              {t("byoa.continuous.title")}
            </h2>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="shrink-0 gap-1 text-[13px] font-medium text-primary hover:text-primary">
                {open ? t("byoa.continuous.showLess") : t("byoa.continuous.showMore")}
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
              {t("byoa.continuous.intro")}
            </p>

            <ol className="mt-5 grid gap-4 md:grid-cols-3">
              {steps.map(({ icon: Icon, key }, i) => (
                <li key={key} className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="text-[13px] font-semibold text-foreground">
                      {i + 1}. {t(`byoa.continuous.${key}.title`)}
                    </span>
                  </div>
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    {t(`byoa.continuous.${key}.body`)}
                  </p>
                  {key === "step1" && (
                    <div className="mt-3">
                      <CopyPrompt text={t("byoa.continuous.prompt1")} />
                    </div>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-5 border-t border-border pt-4">
              <p className="text-[13px] font-medium text-foreground">
                {t("byoa.continuous.morePrompts")}
              </p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {extraPrompts.map((p) => (
                  <CopyPrompt key={p} text={p} />
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </section>
  );
}
