import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Lightbulb, MessageCircle, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useGlobalChat } from "@/components/GlobalChatProvider";

export interface HelpItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface HelpStep {
  text: string;
}

export interface PageHelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;
  description: string;
  items?: HelpItem[];
  itemsHeading?: string;
  whyTitle?: string;
  whyDescription?: string;
  steps?: HelpStep[];
  stepsHeading?: string;
  /** Pre-filled message when user clicks "Spør Lara" */
  laraSuggestion?: string;
}

export function PageHelpDrawer({
  open,
  onOpenChange,
  icon: Icon,
  title,
  description,
  items,
  itemsHeading,
  whyTitle,
  whyDescription,
  steps,
  stepsHeading,
  laraSuggestion,
}: PageHelpDrawerProps) {
  const { i18n } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();
  const isNb = !i18n.language?.startsWith("en");

  const handleAskLara = () => {
    onOpenChange(false);
    openChatWithMessage(
      laraSuggestion || (isNb ? "Hjelp meg med å komme i gang" : "Help me get started")
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {items && items.length > 0 && (
            <div className="space-y-3">
              {itemsHeading && (
                <h3 className="text-sm font-semibold text-foreground">{itemsHeading}</h3>
              )}
              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border bg-card p-3">
                    <item.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {whyTitle && whyDescription && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{whyTitle}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{whyDescription}</p>
            </div>
          )}

          {steps && steps.length > 0 && (
            <div className="space-y-3">
              {stepsHeading && (
                <h3 className="text-sm font-semibold text-foreground">{stepsHeading}</h3>
              )}
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <p className="text-sm text-muted-foreground">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA: Ask Lara */}
          <Button className="w-full gap-2" onClick={handleAskLara}>
            <MessageCircle className="h-4 w-4" />
            {isNb ? "Spør Lara — hun hjelper deg videre" : "Ask Lara — she'll help you along"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
