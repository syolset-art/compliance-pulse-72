import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import type { WizardClient } from "@/components/integrations/ByoaConnectWizard";

const CLIENTS: { id: WizardClient; icon: typeof Bot }[] = [
  { id: "claude", icon: Sparkles },
  { id: "chatgpt", icon: MessageSquare },
  { id: "other", icon: Bot },
];

/** Velg klient: kort som åpner veiviseren forhåndsvalgt på riktig agent. */
export function ClientPickerCards({
  onSelect,
}: {
  onSelect: (client: WizardClient) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-foreground">{t("byoa.clients.title")}</h2>
      <p className="mt-0.5 max-w-prose text-[13px] text-muted-foreground">
        {t("byoa.clients.intro")}
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CLIENTS.map(({ id, icon: Icon }) => (
          <Card
            key={id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(id);
              }
            }}
            className="cursor-pointer p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {t(`byoa.wizard.clients.${id}.label`)}
                  </p>
                  <Badge variant="outline" className="text-[11px] text-muted-foreground">
                    {t("byoa.clients.manualBadge")}
                  </Badge>
                </div>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  {t(`byoa.clients.${id}.body`)}
                </p>
              </div>
              <ChevronRight
                className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-3 text-[12px] text-muted-foreground">{t("byoa.clients.comingSoon")}</p>
    </section>
  );
}
