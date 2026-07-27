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
  Sparkles,
} from "lucide-react";
import { getCategoryById, type Framework } from "@/lib/frameworkDefinitions";
import { useGlobalChat } from "@/components/GlobalChatProvider";
import { useCredits } from "@/hooks/useCredits";

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
  const { balance } = useCredits();

  if (!framework) return null;

  const category = getCategoryById(framework.category);
  const CategoryIcon = category?.icon;
  const estimated = framework.estimatedCredits ?? 5;

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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${category?.bgColor || 'bg-primary/10'}`}>
              {CategoryIcon && (
                <CategoryIcon className={`h-5 w-5 ${category?.color || 'text-primary'}`} />
              )}
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-medium">
                {framework.name} aktivert
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {category?.name}
              </p>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {framework.name} er aktivert
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2 space-y-3 text-sm">
          <p className="text-muted-foreground">
            Skåren beregnes på nytt med de nye kravene og stiger etter hvert som du dokumenterer status.
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
            <span>Estimert oppstart</span>
            <span className="text-foreground">~{estimated} credits</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Lukk
          </Button>
          <Button size="sm" className="gap-2" onClick={handleAskLara}>
            <MessageCircle className="h-4 w-4" />
            Spør Lara
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

