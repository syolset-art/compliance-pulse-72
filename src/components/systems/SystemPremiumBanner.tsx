import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Shield, Cpu, ClipboardList, FolderKanban } from "lucide-react";

interface SystemPremiumBannerProps {
  systemCount: number;
  maxFreeSystems: number;
  isActivated: boolean;
  activatedTier?: string | null;
  onActivate: () => void;
}

const REGULATION_BADGES = ["GDPR Art. 30", "NIS2", "ISO 27001 A.8", "AI Act"];

export function SystemPremiumBanner({ systemCount, maxFreeSystems, isActivated, activatedTier, onActivate }: SystemPremiumBannerProps) {
  if (isActivated) return null;

  const isLimitReached = systemCount >= maxFreeSystems;

  return (
    <div className="space-y-3">
      {/* Main feature banner */}
      <Card className="p-6 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Systemstyring</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Få full kontroll på alle IT-systemer i organisasjonen. Spor eierskap, risikonivå, compliance-status
              og koble systemer til arbeidsområder og oppgaver – alt på ett sted.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {REGULATION_BADGES.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs font-normal text-muted-foreground">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          {/* Included features box */}
          <Card className="p-4 border-primary/20 bg-primary/5 min-w-[240px]">
            <p className="text-xs font-medium text-muted-foreground mb-2">Inkludert i alle planer</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Systemregister</span>
              </div>
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Arbeidsområder</span>
              </div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Oppgaver</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">Risikovurdering</span>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Activation bar */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-blue-50 dark:from-amber-950/20 dark:to-blue-950/20 border-amber-200/50 dark:border-amber-800/30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isLimitReached
                  ? "Du har brukt alle gratis-plassene"
                  : "Forhåndsvisning – Premium-modul"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLimitReached
                  ? `Du har lagt til ${systemCount} av ${maxFreeSystems} gratis systemer. Velg en plan for å fortsette.`
                  : `Prøv med opptil ${maxFreeSystems} systemer gratis. Velg deretter Basis eller Premium for full tilgang.`}
              </p>
            </div>
          </div>
          <Button
            onClick={onActivate}
            className="gap-2 bg-gradient-to-r from-blue-600 to-primary hover:from-blue-700 hover:to-primary/90 text-white shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Se planer
          </Button>
        </div>
      </Card>

      {/* Progress indicator */}
      {!isLimitReached && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-500"
              style={{ width: `${(systemCount / maxFreeSystems) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {systemCount} / {maxFreeSystems} gratis systemer brukt
          </span>
        </div>
      )}
    </div>
  );
}
