import { Sidebar } from "@/components/Sidebar";
import { MSPInvoicesTab } from "@/components/msp/MSPInvoicesTab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, CreditCard, Package, Shield, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import {
  PLAN_TIERS, FRAMEWORK_ADDONS, FREE_FRAMEWORKS, FREE_INCLUSIONS,
  formatKr, formatOre, type PlanTier,
} from "@/lib/planConstants";

export default function MSPInvoices() {
  const { currentTier, billingInterval, addons, subscription } = useSubscription();
  const tier = PLAN_TIERS[currentTier];
  const price = billingInterval === "yearly" ? tier.yearly : tier.monthly;

  // Active framework addons
  const activeFrameworkAddons = addons?.filter(
    (a) => a.status === "active" && !FREE_FRAMEWORKS.includes(a.domain_id as any)
  ) || [];

  const totalAddonsCostKr = activeFrameworkAddons.reduce((sum, a) => {
    const addon = FRAMEWORK_ADDONS[a.domain_id];
    return sum + (addon?.yearlyPriceKr || 0);
  }, 0);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Fakturering</h1>
              <p className="text-muted-foreground mt-1">Oversikt over abonnement, tillegg og fakturaer</p>
            </div>
            <Link to="/msp-billing">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Fakturainnstillinger
              </Button>
            </Link>
          </div>

          {/* Current plan overview */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Plan card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Gjeldende plan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">{tier.displayName}</span>
                  {currentTier !== "free" && (
                    <Badge variant="secondary" className="text-[10px]">
                      {billingInterval === "yearly" ? "Årlig" : "Månedlig"}
                    </Badge>
                  )}
                </div>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {currentTier === "free" ? "Gratis" : `${formatKr(price)}${billingInterval === "yearly" ? "/år" : "/mnd"}`}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Inntil {tier.maxSystems} systemer · {tier.maxVendors} leverandører
                </p>
              </CardContent>
            </Card>

            {/* Framework addons card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Regelverk
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-foreground">GDPR</span>
                    <span className="text-xs text-muted-foreground ml-auto">Inkludert</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-foreground">ISO 27001</span>
                    <span className="text-xs text-muted-foreground ml-auto">Inkludert</span>
                  </div>
                  {activeFrameworkAddons.map((a) => {
                    const addon = FRAMEWORK_ADDONS[a.domain_id];
                    return (
                      <div key={a.id} className="flex items-center gap-1.5 text-sm">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        <span className="text-foreground">{addon?.name || a.domain_id}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {formatKr(addon?.yearlyPriceKr || 0)}/år
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Total cost card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Samlet kostnad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {currentTier === "free" && totalAddonsCostKr === 0
                    ? "Gratis"
                    : formatKr(
                        (billingInterval === "yearly" ? price : price * 12) + totalAddonsCostKr
                      ) + "/år"}
                </p>
                <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                  {currentTier !== "free" && (
                    <p>Plattform: {formatKr(billingInterval === "yearly" ? price : price * 12)}/år</p>
                  )}
                  {totalAddonsCostKr > 0 && (
                    <p>Regelverk-tillegg: {formatKr(totalAddonsCostKr)}/år</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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

          {/* Invoice history */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Fakturahistorikk</h2>
            <MSPInvoicesTab />
          </div>
        </div>
      </main>
    </div>
  );
}
