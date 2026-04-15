import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Sparkles, Shield, FileText, AlertTriangle, Clock } from "lucide-react";

interface VendorPremiumBannerProps {
  vendorCount: number;
  maxFreeVendors: number;
  isActivated: boolean;
  onActivate: () => void;
}

const REGULATION_BADGES = ["GDPR Art. 28", "NIS2", "ISO 27001 A.15", "DORA Art. 28-30"];

export function VendorPremiumBanner({ vendorCount, maxFreeVendors, isActivated, onActivate }: VendorPremiumBannerProps) {
  if (isActivated) return null;

  const isLimitReached = vendorCount >= maxFreeVendors;

  return (
    <div className="space-y-3">
      {/* Main feature banner */}
      <Card className="p-6 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Leverandørstyring (TPRM)</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Få kontroll på tredjepartsrisiko med løpende vurderinger, sporbar evidens og tydelig DPA-oversikt.
              Automatiser innhenting og oppfølging – og ta beslutninger raskere.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {REGULATION_BADGES.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs font-normal text-muted-foreground">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          {/* Time-to-Trust box */}
          <Card className="p-4 border-primary/20 bg-primary/5 min-w-[220px] text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Time-to-Trust</p>
            <p className="text-xl font-bold text-primary">5–15 dager → &lt; 2 timer</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              fra forespørsel til beslutningsgrunnlag*
            </p>
            <p className="text-[13px] text-muted-foreground italic">
              *Avhenger av kravpakke og datatilgang.
            </p>
          </Card>
        </div>
      </Card>

      {/* Activation bar */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-purple-50 dark:from-amber-950/20 dark:to-purple-950/20 border-amber-200/50 dark:border-amber-800/30">
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
                  ? `Du har lagt til ${vendorCount} av ${maxFreeVendors} gratis leverandører. Aktiver for å fortsette.`
                  : `Aktiver for full tilgang til automatisert leverandørstyring, DPA-sporing og risikoanalyse. Du kan prøve med opptil ${maxFreeVendors} leverandører gratis.`}
              </p>
            </div>
          </div>
          <Button
            onClick={onActivate}
            className="gap-2 bg-gradient-to-r from-purple-600 to-primary hover:from-purple-700 hover:to-primary/90 text-white shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            Aktiver for 990 kr/mnd
          </Button>
        </div>
      </Card>

      {/* Progress indicator */}
      {!isLimitReached && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all duration-500"
              style={{ width: `${(vendorCount / maxFreeVendors) * 100}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {vendorCount} / {maxFreeVendors} gratis leverandører brukt
          </span>
        </div>
      )}
    </div>
  );
}
