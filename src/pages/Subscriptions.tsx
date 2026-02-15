import { useState } from "react";
import { Sparkles, MessageCircle, Users, FileSignature, Check, Info, ArrowRight, CreditCard, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const usageMeters = [
  {
    title: "AI dokument-autofyll tilgjengelig",
    icon: Sparkles,
    used: 1,
    total: 3,
    unit: "skanninger",
    period: "i år",
    resetDate: "01.01.2027",
    color: "bg-primary",
  },
  {
    title: "AI-chat tilgjengelig",
    icon: MessageCircle,
    used: 0,
    total: 10,
    unit: "meldinger",
    period: "i år",
    resetDate: "01.01.2027",
    color: "bg-primary",
  },
  {
    title: "Leverandører",
    icon: Users,
    used: 1,
    total: 25,
    unit: "leverandører",
    period: "",
    resetDate: "",
    color: "bg-green-500",
  },
  {
    title: "Dokumentsignering tilgjengelig",
    icon: FileSignature,
    used: 0,
    total: 5,
    unit: "signeringer",
    period: "i år",
    resetDate: "01.01.2027",
    color: "bg-primary",
  },
];

const features = [
  "Ubegrensede AI-skanninger av dokumenter",
  "Del dokumenter offentlig med kunder",
  "Offentlig Compliance-side",
  "Dokumentsignering",
  "Prioritert kundestøtte",
];

const comingSoon = [
  "Avanserte analyser og ESG-innsikt",
  "Rapporter om konkurranseanalyse",
  "Varsler om konkurrentoppdateringer",
];

export default function Subscriptions() {
  const [paymentMethod, setPaymentMethod] = useState("card");
  const { isLoading } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Fakturering og planer</h1>
          <p className="text-muted-foreground">Administrer ditt abonnement og fakturering</p>
        </div>

        {/* Usage Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {usageMeters.map((meter) => {
            const remaining = meter.total - meter.used;
            const pct = (remaining / meter.total) * 100;
            const Icon = meter.icon;
            return (
              <Card key={meter.title} variant="flat" className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground leading-tight">{meter.title}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  {remaining} av {meter.total} {meter.unit} gjenstår {meter.period}
                </p>
                <Progress value={pct} className="h-1.5 mb-2 [&>div]:transition-all" style={{ "--progress-color": undefined } as React.CSSProperties} />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>{meter.used} brukt</span>
                  {meter.resetDate && <span>Tilbakestilles {meter.resetDate}</span>}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recommended Plan */}
        <Card className="overflow-hidden">
          <CardContent className="p-6 space-y-6">
            {/* Badge + title */}
            <div>
              <Badge className="mb-3 bg-primary/10 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                ANBEFALT
              </Badge>
              <h2 className="text-xl font-semibold text-foreground">Premium-plan</h2>
              <p className="text-sm text-muted-foreground">Perfekt for leverandører i alle størrelser</p>
            </div>

            {/* Price */}
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">2 490 kr</span>
                <span className="text-muted-foreground">per måned</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Faktureres årlig – 29 880 kr/år</p>
            </div>

            {/* Info row */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground">
                Premium gjelder for alle i organisasjonen. Ingen ekstra kostnad per bruker.
              </p>
            </div>

            <Separator />

            {/* Features */}
            <TooltipProvider>
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-green-600" />
                    </div>
                    <span className="text-sm text-foreground flex-1">{feature}</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Mer informasjon om {feature.toLowerCase()}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </TooltipProvider>

            <Separator />

            {/* Coming Soon */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Kommer snart</p>
              <ul className="space-y-3">
                {comingSoon.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5 text-muted-foreground/50" />
                    </div>
                    <span className="text-sm text-muted-foreground flex-1">{item}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground shrink-0">
                      Kommer snart
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="text-base font-semibold text-foreground">Velg hvordan du vil betale</h3>

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
                    Betal med bedriftskort eller Link-lommebok. Stripe lagrer kortene sikkert og støtter 3-D Secure.
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
                    Motta en Stripe-faktura med bankdetaljer (SEPA/ACH). Betaling forfaller innen 30 dager.
                  </p>
                </div>
                <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              </label>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* CTA */}
        <Button
          className="w-full h-12 text-base"
          onClick={() => toast.info("Oppgradering er ikke tilgjengelig i demo-modus.")}
        >
          Oppgrader nå
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
