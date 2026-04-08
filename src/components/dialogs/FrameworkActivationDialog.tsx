import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  TrendingDown,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { useGlobalChat } from "@/components/GlobalChatProvider";

interface FrameworkActivationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  framework: Framework | null;
  onNavigate?: (path: string) => void;
  onOpenChat?: (message: string) => void;
}

export function FrameworkActivationDialog({
  open,
  onOpenChange,
  framework,
  onOpenChat,
}: FrameworkActivationDialogProps) {
  const { t } = useTranslation();
  const { openChatWithMessage } = useGlobalChat();

  if (!framework) return null;

  const category = getCategoryById(framework.category);
  const CategoryIcon = category?.icon;

  const handleAskLara = () => {
    onOpenChange(false);
    const message = `Hjelp meg å etablere en baseline for ${framework.name}. Hva er de viktigste kravene jeg må dokumentere?`;
    if (onOpenChat) {
      onOpenChat(message);
    } else {
      openChatWithMessage(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
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
          <DialogDescription className="sr-only">
            Informasjon om aktivering av {framework.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Success */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-400">
              {framework.name} er nå aktivt i din compliance-portefølje.
            </p>
          </div>

          {/* Score impact warning */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <TrendingDown className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-700 dark:text-orange-400">
              <p className="font-medium mb-1">Compliance-skåren din vil gå ned</p>
              <p className="text-xs text-orange-600 dark:text-orange-400/80">
                Når du legger til et nytt regelverk, beregnes skåren på nytt med de nye kravene inkludert. 
                Skåren vil stige igjen etter hvert som du dokumenterer status på kravene.
              </p>
            </div>
          </div>

          {/* Lara help */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <MessageCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Lara hjelper deg med å etablere en baseline for {framework.name} — bare spør, 
                så guider hun deg gjennom kravene steg for steg.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={handleAskLara}
              >
                <MessageCircle className="h-4 w-4" />
                Spør Lara
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
