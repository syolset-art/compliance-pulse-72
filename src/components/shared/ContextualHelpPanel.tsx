import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Lightbulb, MessageCircle, BookOpen, Zap, type LucideIcon } from "lucide-react";
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

export interface ActionItem {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  variant?: "default" | "outline";
}

export interface LaraSuggestionItem {
  label: string;
  message: string;
}

export interface ColorLegendItem {
  /** Tailwind bg-class for the swatch, e.g. "bg-success" */
  swatch: string;
  label: string;
  description: string;
}

export interface ColorLegend {
  heading: string;
  description?: string;
  items: ColorLegendItem[];
}

export interface ContextualHelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: LucideIcon;
  title: string;

  // Forstå tab
  description: string;
  items?: HelpItem[];
  itemsHeading?: string;
  whyTitle?: string;
  whyDescription?: string;
  steps?: HelpStep[];
  stepsHeading?: string;

  // Gjør tab
  actions?: ActionItem[];

  // Spør Lara tab
  laraSuggestions?: LaraSuggestionItem[];
  /** Fallback single suggestion */
  laraSuggestion?: string;
}

export function ContextualHelpPanel({
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
  actions,
  laraSuggestions,
  laraSuggestion,
}: ContextualHelpPanelProps) {
  const { i18n } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();
  const isNb = !i18n.language?.startsWith("en");
  const [activeTab, setActiveTab] = useState("understand");

  const handleAskLara = (message?: string) => {
    onOpenChange(false);
    openChatWithMessage(
      message || laraSuggestion || (isNb ? "Hjelp meg med å komme i gang" : "Help me get started")
    );
  };

  const hasActions = actions && actions.length > 0;
  const suggestions = laraSuggestions || [
    { label: isNb ? "Kom i gang" : "Get started", message: laraSuggestion || (isNb ? "Hjelp meg med å komme i gang" : "Help me get started") },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <SheetTitle className="text-lg">{title}</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="understand" className="gap-1.5 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                Forstå
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-1.5 text-xs">
                <Zap className="h-3.5 w-3.5" />
                Gjør
              </TabsTrigger>
              <TabsTrigger value="lara" className="gap-1.5 text-xs">
                <MessageCircle className="h-3.5 w-3.5" />
                Spør Lara
              </TabsTrigger>
            </TabsList>
          </div>

          {/* === Forstå === */}
          <TabsContent value="understand" className="px-6 pb-6 mt-4 space-y-5">
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
          </TabsContent>

          {/* === Gjør === */}
          <TabsContent value="actions" className="px-6 pb-6 mt-4 space-y-3">
            {hasActions ? (
              actions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onOpenChange(false);
                    action.onClick();
                  }}
                  className="flex items-start gap-3 w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{action.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Ingen handlinger tilgjengelig for denne siden akkurat nå.
              </div>
            )}
          </TabsContent>

          {/* === Spør Lara === */}
          <TabsContent value="lara" className="px-6 pb-6 mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Velg et spørsmål under, eller skriv ditt eget til Lara.
            </p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAskLara(s.message)}
                  className="flex items-center gap-3 w-full rounded-lg border bg-card p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{s.label}</span>
                </button>
              ))}
            </div>
            <Button className="w-full gap-2" onClick={() => handleAskLara()}>
              <MessageCircle className="h-4 w-4" />
              {isNb ? "Åpne chat med Lara" : "Open chat with Lara"}
            </Button>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
