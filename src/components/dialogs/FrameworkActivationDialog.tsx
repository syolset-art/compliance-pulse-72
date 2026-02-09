import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ListTodo,
  FileText,
  Server,
  MessageCircle,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";

interface FrameworkActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
  onNavigate?: (path: string) => void;
  onOpenChat?: (message: string) => void;
}

interface ConsequenceItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  navigateTo?: string;
  navigateLabel?: string;
}

export function FrameworkActivationDialog({
  open,
  onOpenChange,
  framework,
  onNavigate,
  onOpenChat,
}: FrameworkActivationDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!framework) return null;

  const category = getCategoryById(framework.category);
  const CategoryIcon = category?.icon;

  const getConsequences = (): ConsequenceItem[] => {
    const baseConsequences: ConsequenceItem[] = [
      {
        icon: <ListTodo className="h-5 w-5 text-primary" />,
        title: "Oppgaver genereres",
        description: `Relevante compliance-oppgaver for ${framework.name} vil vises i oppgavelisten din.`,
        navigateTo: "/tasks",
        navigateLabel: "Gå til Oppgaver",
      },
      {
        icon: <Server className="h-5 w-5 text-blue-500" />,
        title: "Systemer vurderes",
        description: "Dine systemer vil bli evaluert mot kravene i dette regelverket.",
        navigateTo: "/systems",
        navigateLabel: "Se Systemer",
      },
      {
        icon: <FileText className="h-5 w-5 text-green-500" />,
        title: "Rapporter oppdateres",
        description: "Compliance-rapporter vil nå inkludere status for dette regelverket.",
        navigateTo: "/reports",
        navigateLabel: "Se Rapporter",
      },
    ];

    // Add AI-specific consequences for AI frameworks
    if (framework.category === 'ai') {
      baseConsequences.push({
        icon: <Sparkles className="h-5 w-5 text-purple-500" />,
        title: "AI-systemer kartlegges",
        description: "Prosesser og systemer med AI-bruk vil bli vurdert mot AI Act-krav.",
        navigateTo: "/processing-records",
        navigateLabel: "Se Behandlinger",
      });
    }

    return baseConsequences;
  };

  const consequences = getConsequences();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleAskLara = () => {
    onOpenChange(false);
    const message = t("chatPanel.helpWithDomain", { domain: framework.name });
    if (onOpenChat) {
      onOpenChat(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2.5 rounded-xl ${category?.bgColor || 'bg-primary/10'}`}>
              {CategoryIcon && (
                <CategoryIcon className={`h-6 w-6 ${category?.color || 'text-primary'}`} />
              )}
            </div>
            <div>
              <Badge variant="secondary" className="mb-1 text-xs">
                {category?.name}
              </Badge>
              <DialogTitle className="text-xl">{framework.name} aktivert</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-base">
            Regelverket er nå en del av din compliance-portefølje. Her er hva som skjer videre.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success indicator */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              {framework.name} er nå aktivt og vil bli inkludert i alle relevante vurderinger.
            </p>
          </div>

          <Separator />

          {/* Consequences list */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Dette skjer automatisk:</h4>
            {consequences.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                {item.navigateTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0 text-xs h-8 px-2"
                    onClick={() => handleNavigate(item.navigateTo!)}
                  >
                    {item.navigateLabel}
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Separator />

          {/* Lara integration */}
          <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Trenger du hjelp?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lara kan hjelpe deg med å forstå kravene i {framework.name} og guide deg gjennom de første stegene.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={handleAskLara}
                >
                  <MessageCircle className="h-4 w-4" />
                  Spør Lara om {framework.name}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <Button onClick={() => handleNavigate("/tasks")} className="gap-2">
            Se oppgaver
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
