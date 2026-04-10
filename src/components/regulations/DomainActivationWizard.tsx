import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Check, 
  CreditCard, 
  Sparkles, 
  LucideIcon,
  ListTodo,
  FileText,
  Server,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { frameworks } from "@/lib/frameworkDefinitions";
import { useTranslation } from "react-i18next";

interface DomainActivationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domainId: string;
  domainName: string;
  domainIcon: LucideIcon;
  domainColor: string;
  domainBgColor: string;
  monthlyPrice: number; // in øre (legacy, now used as yearly for framework addons)
  yearlyPriceKr?: number; // yearly price in kr
  onActivate: () => void;
  isActivating?: boolean;
  nextBillingDate?: string;
  onOpenChat?: (message: string) => void;
}

type WizardStep = "pricing" | "confirmation" | "success";

export function DomainActivationWizard({
  open,
  onOpenChange,
  domainId,
  domainName,
  domainIcon: Icon,
  domainColor,
  domainBgColor,
  monthlyPrice,
  yearlyPriceKr,
  onActivate,
  isActivating = false,
  nextBillingDate = "1. februar 2026",
  onOpenChat,
}: DomainActivationWizardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<WizardStep>("pricing");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Get frameworks for this domain
  const domainFrameworks = frameworks.filter(f => f.category === domainId);

  const formatPrice = (priceInOre: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceInOre / 100);
  };

  const handleActivate = () => {
    onActivate();
    setCurrentStep("success");
  };

  const handleClose = () => {
    setCurrentStep("pricing");
    setAcceptedTerms(false);
    onOpenChange(false);
  };

  const handleNavigate = (path: string) => {
    handleClose();
    navigate(path);
  };

  const handleAskLara = () => {
    handleClose();
    const message = t("chatPanel.helpWithDomain", { domain: domainName });
    if (onOpenChat) {
      onOpenChat(message);
    }
  };

  const automaticActions = [
    {
      icon: <ListTodo className="h-5 w-5 text-primary" />,
      title: "Oppgaver genereres",
      description: `Relevante compliance-oppgaver for ${domainName} vil automatisk opprettes i oppgavelisten din.`,
    },
    {
      icon: <Server className="h-5 w-5 text-blue-500" />,
      title: "Systemer vurderes",
      description: "Dine registrerte systemer vil bli evaluert mot kravene i dette kontrollområdet.",
    },
    {
      icon: <FileText className="h-5 w-5 text-green-500" />,
      title: "Rapporter oppdateres",
      description: "Compliance-rapporter vil nå inkludere status for dette domenet.",
    },
    {
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
      title: "AI-assistert veiledning",
      description: "Lara vil gi deg skreddersydde anbefalinger basert på dette regelverket.",
    },
  ];

  const renderPricingStep = () => (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("p-2.5 rounded-xl", domainBgColor)}>
            <Icon className={cn("h-6 w-6", domainColor)} />
          </div>
          <div>
            <DialogTitle className="text-xl flex items-center gap-2">
              Aktiver {domainName}
            </DialogTitle>
            <DialogDescription>
              Utvid din compliance-dekning
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="py-4 space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">1</span>
          <span className="font-medium text-foreground">Pris og vilkår</span>
          <div className="flex-1 h-px bg-border" />
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs font-medium">2</span>
          <span>Bekreft</span>
        </div>

        {/* What's included */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">
            Dette kontrollområdet inkluderer:
          </p>
          <div className="space-y-2">
            {domainFrameworks.map((framework) => (
              <div
                key={framework.id}
                className="flex items-start gap-2 text-sm"
              >
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-foreground">{framework.name}</span>
                  <span className="text-muted-foreground"> - {framework.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing box */}
        <div className="p-5 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">Årlig tillegg til ditt abonnement</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-3xl font-bold text-foreground">
              {yearlyPriceKr ? `${new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(yearlyPriceKr)}` : `+ ${formatPrice(monthlyPrice)}`}
            </span>
            <span className="text-muted-foreground">/år</span>
          </div>
          {yearlyPriceKr && yearlyPriceKr > 0 && (
            <p className="text-xs text-muted-foreground mb-2">
              Inkluderer gap-analyse, tiltaksliste, modenhetsvurdering og rapportdeling
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>Faktureres fra {nextBillingDate}</span>
          </div>
        </div>

        {/* Terms acceptance */}
        <div className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
          <Checkbox 
            id="terms" 
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
            Jeg godtar tillegget på <span className="font-semibold text-foreground">{yearlyPriceKr ? `${new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(yearlyPriceKr)}/år` : `${formatPrice(monthlyPrice)}/mnd`}</span> som legges til mitt eksisterende abonnement. Jeg forstår at jeg kan avbestille når som helst.
          </label>
        </div>

        {/* Cancellation info */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <ShieldCheck className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
          <p>
            Du kan når som helst deaktivere dette kontrollområdet fra innstillingene. Endringen trer i kraft ved neste faktureringsperiode, og du beholder tilgang ut perioden.
          </p>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={handleClose}
          className="flex-1 sm:flex-none"
        >
          Avbryt
        </Button>
        <Button
          onClick={() => setCurrentStep("confirmation")}
          disabled={!acceptedTerms}
          className="flex-1 sm:flex-none gap-2"
        >
          Fortsett
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirmationStep = () => (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className={cn("p-2.5 rounded-xl", domainBgColor)}>
            <Icon className={cn("h-6 w-6", domainColor)} />
          </div>
          <div>
            <DialogTitle className="text-xl">Bekreft aktivering</DialogTitle>
            <DialogDescription>
              Se hva som skjer når du aktiverer {domainName}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="py-4 space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-green-500 text-white text-xs">
            <Check className="h-3 w-3" />
          </span>
          <span className="text-muted-foreground">Pris og vilkår</span>
          <div className="flex-1 h-px bg-border" />
          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium">2</span>
          <span className="font-medium text-foreground">Bekreft</span>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{domainName}</span>
            </div>
            <span className="text-sm font-bold text-foreground">
              {yearlyPriceKr ? `+ ${new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(yearlyPriceKr)}/år` : `+ ${formatPrice(monthlyPrice)}/mnd`}
            </span>
          </div>
        </div>

        <Separator />

        {/* What happens automatically */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Dette skjer automatisk når du aktiverer:
          </h4>
          {automaticActions.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
            >
              <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={() => setCurrentStep("pricing")}
          className="flex-1 sm:flex-none gap-2"
          disabled={isActivating}
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake
        </Button>
        <Button
          onClick={handleActivate}
          disabled={isActivating}
          className="flex-1 sm:flex-none gap-2"
        >
          {isActivating ? (
            <>Aktiverer...</>
          ) : (
            <>
              Aktiver {domainName}
              <Check className="h-4 w-4" />
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderSuccessStep = () => (
    <>
      <DialogHeader className="text-center pb-0">
        <div className="mx-auto mb-4">
          <div className="relative">
            <div className={cn("p-4 rounded-2xl", domainBgColor)}>
              <Icon className={cn("h-8 w-8", domainColor)} />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
        <DialogTitle className="text-xl">{domainName} er aktivert!</DialogTitle>
        <DialogDescription className="text-base">
          Kontrollområdet er nå en del av din compliance-portefølje.
        </DialogDescription>
      </DialogHeader>

      <div className="py-6 space-y-4">
        {/* Success indicator */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700 dark:text-green-400">
            {domainName} er nå aktivt og vil bli inkludert i alle relevante vurderinger.
          </p>
        </div>

        <Separator />

        {/* Quick actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Hva vil du gjøre nå?</h4>
          
          <button
            onClick={() => handleNavigate("/tasks")}
            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
          >
            <ListTodo className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Se nye oppgaver</p>
              <p className="text-xs text-muted-foreground">Compliance-oppgaver har blitt generert</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            onClick={() => handleNavigate("/systems")}
            className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
          >
            <Server className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Gå til systemer</p>
              <p className="text-xs text-muted-foreground">Se vurderinger av dine systemer</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
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
                Lara kan hjelpe deg med å forstå kravene og guide deg gjennom de første stegene.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 gap-2"
                onClick={handleAskLara}
              >
                <MessageCircle className="h-4 w-4" />
                Spør Lara
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button onClick={handleClose} className="w-full sm:w-auto">
          Lukk
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        {currentStep === "pricing" && renderPricingStep()}
        {currentStep === "confirmation" && renderConfirmationStep()}
        {currentStep === "success" && renderSuccessStep()}
      </DialogContent>
    </Dialog>
  );
}
