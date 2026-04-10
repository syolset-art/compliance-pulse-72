import { useState } from "react";
import {
  Sparkles, Check, ArrowRight, CreditCard, FileText,
  CheckCircle2, Building2, Loader2, Shield, Package, Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSubscription } from "@/hooks/useSubscription";
import { Sidebar } from "@/components/Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  PLAN_TIERS, ORDERED_TIERS, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  FREE_INCLUSIONS, formatKr, getAnnualSavingsKr,
  type PlanTier, type BillingInterval,
} from "@/lib/planConstants";

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const { currentTier, billingInterval: currentInterval, addons } = useSubscription();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(currentInterval);
  const [selectedTier, setSelectedTier] = useState<PlanTier>(
    currentTier === "free" ? "basis" : currentTier
  );
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const tiers: PlanTier[] = ["free", "basis", "premium", "enterprise"];

  const activeFrameworkAddons = addons?.filter(
    (a) => a.status === "active" && !FREE_FRAMEWORKS.includes(a.domain_id as any)
  ) || [];

  const handleUpgrade = (tier: PlanTier) => {
    setSelectedTier(tier);
    setStep("confirm");
    setShowConfirm(true);
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      localStorage.setItem("system_premium_activated", "true");
      localStorage.setItem("system_premium_tier", selectedTier);
      localStorage.setItem("vendor_premium_activated", "true");
    }, 2000);
  };

  const tierDescriptions: Record<PlanTier, string> = {
    free: "Kom i gang med grunnleggende compliance",
    basis: "For voksende organisasjoner",
    premium: "For organisasjoner med mange systemer",
    enterprise: "Skreddersydd for store virksomheter",
  };

  const tierFeatures: Record<PlanTier, string[]> = {
    free: [
      "Inntil 5 systemer",
      "Inntil 5 leverandører",
      "Trust Center",
      "GDPR regelverk",
      "ISO 27001 regelverk",
    ],
    basis: [
      "Inntil 20 systemer",
      "Inntil 20 leverandører",
      "Arbeidsområder",
      "Oppgaver",
      "Risikovurdering",
      "Compliance-oversikt",
    ],
    premium: [
      "Inntil 70 systemer",
      "Inntil 70 leverandører",
      "Arbeidsområder",
      "Oppgaver",
      "Risikovurdering",
      "Compliance-oversikt",
      "Prioritert support",
    ],
    enterprise: [
      "Ubegrenset systemer",
      "Ubegrenset leverandører",
      "Alt i Premium",
      "Dedikert kontaktperson",
      "Tilpassede integrasjoner",
      "SLA-garantier",
    ],
  };

  const getPrice = (tier: PlanTier) => {
    const plan = PLAN_TIERS[tier];
    return billingInterval === "yearly" ? plan.yearly : plan.monthly;
  };

  const frameworkAddonList = Object.values(FRAMEWORK_ADDONS).filter(
    (a, i, arr) => arr.findIndex((b) => b.name === a.name) === i // deduplicate aliases
  );

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto md:pt-11">
        <div className="container max-w-5xl mx-auto p-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Fakturering og planer</h1>
            <p className="text-muted-foreground">Velg planen som passer din organisasjon</p>
          </div>

          {/* Current plan indicator */}
          {currentTier !== "free" && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-primary/5 border-primary/20">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Aktiv plan: {PLAN_TIERS[currentTier].displayName}
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {currentInterval === "yearly" ? "Årlig" : "Månedlig"}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatKr(getPrice(currentTier))}{currentInterval === "yearly" ? "/år" : "/mnd"}
                </p>
              </div>
            </div>
          )}

          {/* Free inclusions */}
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">INKLUDERT GRATIS I ALLE PLANER</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {FREE_INCLUSIONS.map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 py-2">
            <span className={`text-sm ${billingInterval === "monthly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Månedlig
            </span>
            <Switch
              checked={billingInterval === "yearly"}
              onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
            />
            <span className={`text-sm ${billingInterval === "yearly" ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
              Årlig
            </span>
            {billingInterval === "yearly" && (
              <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Spar 2 mnd
              </Badge>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tierId) => {
              const tier = PLAN_TIERS[tierId];
              const price = getPrice(tierId);
              const isCurrent = currentTier === tierId;
              const isRecommended = tierId === "premium";
              const isEnterprise = tierId === "enterprise";
              const features = tierFeatures[tierId];

              return (
                <Card
                  key={tierId}
                  className={`relative transition-all ${
                    isCurrent
                      ? "border-primary ring-2 ring-primary/20"
                      : isRecommended
                      ? "border-primary/50"
                      : "border-border"
                  }`}
                >
                  {isRecommended && (
                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px]">
                      Anbefalt
                    </Badge>
                  )}
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{tier.displayName}</h3>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[10px]">Aktiv</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{tierDescriptions[tierId]}</p>
                    </div>

                    <div>
                      {isEnterprise ? (
                        <span className="text-2xl font-bold text-foreground">Kontakt oss</span>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-foreground">
                              {price === 0 ? "Gratis" : formatKr(price)}
                            </span>
                            {price > 0 && (
                              <span className="text-sm text-muted-foreground">
                                {billingInterval === "yearly" ? "/år" : "/mnd"}
                              </span>
                            )}
                          </div>
                          {billingInterval === "yearly" && price > 0 && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                              Spar {formatKr(getAnnualSavingsKr(tierId))} per år
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      {features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs text-foreground">{feature}</span>
                        </div>
                      ))}
                    </div>

                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Aktiv plan
                      </Button>
                    ) : isEnterprise ? (
                      <Button variant="outline" className="w-full">
                        Kontakt salg
                      </Button>
                    ) : tierId === "free" ? (
                      <Button variant="ghost" className="w-full text-muted-foreground" disabled>
                        Gratis
                      </Button>
                    ) : (
                      <Button
                        className="w-full gap-2"
                        variant={isRecommended ? "default" : "outline"}
                        onClick={() => handleUpgrade(tierId)}
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Velg {tier.displayName}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Framework addons section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Regelverk-tillegg
              </h2>
              <p className="text-sm text-muted-foreground">
                Utvid din compliance-dekning med spesialiserte regelverk. GDPR og ISO 27001 er inkludert gratis.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Free frameworks */}
              {["GDPR", "ISO 27001"].map((name) => (
                <Card key={name} className="border-green-200 dark:border-green-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-foreground">{name}</span>
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px]">
                        Inkludert
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inkludert gratis i alle planer
                    </p>
                  </CardContent>
                </Card>
              ))}

              {/* Paid framework addons */}
              {frameworkAddonList.map((addon) => {
                const isActive = activeFrameworkAddons.some(
                  (a) => a.domain_id === addon.id
                );
                return (
                  <Card key={addon.id} className={isActive ? "border-primary/30" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{addon.name}</span>
                        {isActive ? (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            Aktiv
                          </Badge>
                        ) : (
                          <span className="text-sm font-bold text-foreground">
                            {formatKr(addon.yearlyPriceKr)}/år
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        {addon.includes.map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-primary shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Payment method */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground">Betalingsmetode</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="card" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">Kort / Stripe Link</span>
                      <Badge className="bg-primary/10 text-primary border-0 text-[10px] px-1.5 py-0">UMIDDELBAR</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Betal med bedriftskort eller Link-lommebok. Stripe lagrer kortene sikkert.
                    </p>
                  </div>
                  <CreditCard className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </label>

                <label
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                    paymentMethod === "invoice" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="invoice" className="mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">Faktura / Bankoverføring</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">B2B</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Motta en faktura med bankdetaljer. Betaling forfaller innen 30 dager.
                    </p>
                  </div>
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                </label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Confirmation dialog */}
          <Dialog open={showConfirm} onOpenChange={(open) => { if (!open && step !== "processing") setShowConfirm(false); }}>
            <DialogContent className="sm:max-w-md">
              {step === "confirm" && (
                <>
                  <DialogHeader>
                    <DialogTitle>Bekreft oppgradering</DialogTitle>
                    <DialogDescription>Gjennomgå bestillingen din før du fortsetter.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium text-foreground">{PLAN_TIERS[selectedTier].displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pris</span>
                      <span className="font-medium text-foreground">
                        {formatKr(getPrice(selectedTier))}{billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fakturering</span>
                      <span className="font-medium text-foreground">
                        {billingInterval === "yearly" ? "Årlig" : "Månedlig"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Besparelse</span>
                        <span className="font-medium text-green-600">
                          {formatKr(getAnnualSavingsKr(selectedTier))} per år
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Systemer</span>
                      <span className="font-medium text-foreground">
                        Inntil {PLAN_TIERS[selectedTier].maxSystems}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leverandører</span>
                      <span className="font-medium text-foreground">
                        Inntil {PLAN_TIERS[selectedTier].maxVendors}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Betalingsmetode</span>
                      <span className="font-medium text-foreground flex items-center gap-1.5">
                        {paymentMethod === "card"
                          ? <><CreditCard className="h-3.5 w-3.5" /> Kort / Stripe Link</>
                          : <><FileText className="h-3.5 w-3.5" /> Faktura</>}
                      </span>
                    </div>
                    {paymentMethod === "invoice" && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                        <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          Faktura sendes til e-postadressen knyttet til kontoen din. Betaling forfaller innen 30 dager.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Avbryt</Button>
                    <Button className="flex-1" onClick={handleConfirmPayment}>
                      {paymentMethod === "card" ? "Betal nå" : "Send faktura"}
                    </Button>
                  </div>
                </>
              )}

              {step === "processing" && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Behandler betaling…</p>
                </div>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Oppgradering vellykket!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {paymentMethod === "card"
                        ? `${PLAN_TIERS[selectedTier].displayName}-planen er nå aktiv.`
                        : "Fakturaen er sendt. Planen aktiveres når betalingen er mottatt."}
                    </p>
                  </div>
                  <Button className="mt-2" onClick={() => setShowConfirm(false)}>Lukk</Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}
