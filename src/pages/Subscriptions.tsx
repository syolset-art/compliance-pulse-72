import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Check, Zap, Shield, Users, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "For små bedrifter som kommer i gang",
    price: "Gratis",
    priceDetail: "for alltid",
    features: [
      "Opptil 5 arbeidsområder",
      "Grunnleggende risikovurdering",
      "E-poststøtte",
      "1 bruker",
    ],
    current: false,
  },
  {
    id: "professional",
    name: "Professional",
    description: "For bedrifter med compliance-behov",
    price: "2 490 kr",
    priceDetail: "per måned",
    features: [
      "Ubegrensede arbeidsområder",
      "Avansert risikovurdering",
      "Prioritert støtte",
      "Opptil 10 brukere",
      "API-tilgang",
      "Skreddersydde rapporter",
    ],
    current: true,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For store organisasjoner",
    price: "Kontakt oss",
    priceDetail: "skreddersydd",
    features: [
      "Alt i Professional",
      "Ubegrenset brukere",
      "Dedikert kundekontakt",
      "SLA-garanti",
      "On-premise mulighet",
      "Tilpasset integrasjon",
    ],
    current: false,
  },
];

const usageData = {
  workAreas: { used: 12, total: null },
  users: { used: 4, total: 10 },
  apiCalls: { used: 8432, total: 50000 },
  storage: { used: 2.4, total: 10, unit: "GB" },
};

export default function Subscriptions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Abonnementer</h1>
            <p className="text-muted-foreground">Administrer din plan og se forbruk</p>
          </div>
        </div>

        {/* Current Plan Summary */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>Professional</CardTitle>
                    <Badge variant="secondary">Aktiv</Badge>
                  </div>
                  <CardDescription>Neste fakturering: 1. februar 2026</CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">2 490 kr</div>
                <div className="text-sm text-muted-foreground">per måned</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Betalingsmetoder
              </Button>
              <Button variant="outline">
                <Clock className="h-4 w-4 mr-2" />
                Fakturahistorikk
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Usage Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Forbruk denne perioden</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Arbeidsområder</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{usageData.workAreas.used}</div>
                <div className="text-xs text-muted-foreground">Ubegrenset</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Brukere</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {usageData.users.used} / {usageData.users.total}
                </div>
                <Progress 
                  value={(usageData.users.used / usageData.users.total) * 100} 
                  className="h-1 mt-2" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">API-kall</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {(usageData.apiCalls.used / 1000).toFixed(1)}k
                </div>
                <Progress 
                  value={(usageData.apiCalls.used / usageData.apiCalls.total) * 100} 
                  className="h-1 mt-2" 
                />
                <div className="text-xs text-muted-foreground mt-1">
                  av {(usageData.apiCalls.total / 1000)}k
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Lagring</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {usageData.storage.used} {usageData.storage.unit}
                </div>
                <Progress 
                  value={(usageData.storage.used / usageData.storage.total) * 100} 
                  className="h-1 mt-2" 
                />
                <div className="text-xs text-muted-foreground mt-1">
                  av {usageData.storage.total} {usageData.storage.unit}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Plans Comparison */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Tilgjengelige planer</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.current ? "border-primary ring-1 ring-primary" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">Mest populær</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-2">
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground ml-2">{plan.priceDetail}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-success" />
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.current ? "secondary" : "default"}
                    disabled={plan.current}
                  >
                    {plan.current ? "Nåværende plan" : "Oppgrader"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Trenger du hjelp?</strong> Kontakt oss for spørsmål om fakturering eller for å diskutere en skreddersydd løsning.
            </p>
            <Button variant="outline" size="sm">
              Kontakt salg
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
