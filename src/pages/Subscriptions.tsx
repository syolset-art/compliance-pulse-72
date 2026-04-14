import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, Check, CreditCard, FileText, ArrowRight,
  CheckCircle2, Building2, Loader2, Shield, Cpu, Truck,
  Globe, Bot, ClipboardList, FolderKanban,
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
  MODULES, FRAMEWORK_ADDONS, FREE_FRAMEWORKS,
  FREE_INCLUSIONS, formatKr, getModulePrice, getModuleAnnualSavingsKr,
  type ModuleId, type ModuleTier, type BillingInterval,
} from "@/lib/planConstants";

const MODULE_ICONS: Record<ModuleId, typeof Cpu> = {
  systems: Cpu,
  vendors: Truck,
};

export default function Subscriptions() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { billingInterval: currentInterval, addons } = useSubscription();

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(currentInterval);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState<"confirm" | "processing" | "success">("confirm");

  const [selectedModule, setSelectedModule] = useState<ModuleId | null>(null);
  const [selectedModuleTier, setSelectedModuleTier] = useState<ModuleTier>("basis");

  const systemsActive = localStorage.getItem("system_premium_activated") === "true";
  const systemsTier = (localStorage.getItem("system_premium_tier") || "basis") as ModuleTier;
  const vendorsActive = localStorage.getItem("vendor_premium_activated") === "true";
  const vendorsTier = (localStorage.getItem("vendor_premium_tier") || "basis") as ModuleTier;

  const activeFrameworkAddons = addons?.filter(
    (a) => a.status === "active" && !FREE_FRAMEWORKS.includes(a.domain_id as any)
  ) || [];

  const handleSelectModule = (moduleId: ModuleId, tier: ModuleTier) => {
    setSelectedModule(moduleId);
    setSelectedModuleTier(tier);
    setStep("confirm");
    setShowConfirm(true);
  };

  const handleConfirmPayment = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      if (selectedModule === "systems") {
        localStorage.setItem("system_premium_activated", "true");
        localStorage.setItem("system_premium_tier", selectedModuleTier);
      } else if (selectedModule === "vendors") {
        localStorage.setItem("vendor_premium_activated", "true");
        localStorage.setItem("vendor_premium_tier", selectedModuleTier);
      }
    }, 2000);
  };

  const frameworkAddonList = Object.values(FRAMEWORK_ADDONS).filter(
    (a, i, arr) => arr.findIndex((b) => b.name === a.name) === i
  );

  // Total cost calculation
  const getTotalMonthlyCost = () => {
    let total = 0;
    if (systemsActive) total += MODULES.systems.tiers[systemsTier][billingInterval === "yearly" ? "yearly" : "monthly"];
    if (vendorsActive) total += MODULES.vendors.tiers[vendorsTier][billingInterval === "yearly" ? "yearly" : "monthly"];
    return total;
  };

  const totalFrameworkCost = activeFrameworkAddons.length * 50000;
  const hasAnyCost = systemsActive || vendorsActive || activeFrameworkAddons.length > 0;

  return (
    <div className="flex min-h-screen max-h-screen bg-background overflow-hidden">
      {!isMobile && <div className="w-64 flex-shrink-0"><Sidebar /></div>}
      {isMobile && <Sidebar />}
      <main className="flex-1 overflow-y-auto pt-11">
        <div className="container max-w-4xl mx-auto p-6 space-y-10 pb-20">

          {/* Hero heading */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{isNb ? "Abonnement" : "Subscription"}</h1>
          </div>

          {/* ── STEG 1: TRUST CENTER ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-success/10 text-success text-xs font-bold">1</span>
              <h2 className="text-lg font-semibold text-foreground">Trust Center</h2>
              <Badge className="bg-success/10 text-success border-0 text-[10px]">Gratis</Badge>
            </div>

            <Card className="border-success/30 bg-success/[0.03]">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      <span className="font-semibold text-foreground">Aktiv — Shareable Trust Profile</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Din offentlige compliance-profil som du kan dele med kunder og partnere for due diligence.
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 pt-1">
                      {FREE_INCLUSIONS.map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                          <Check className="h-3 w-3 text-success shrink-0" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => navigate("/trust-center/profile")}
                  >
                    Gå til Trust Center
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ── STEG 2: REGELVERK ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
              <h2 className="text-lg font-semibold text-foreground">Utvid med regelverk</h2>
            </div>
            <p className="text-sm text-muted-foreground pl-10">
              Legg til spesialiserte regelverk for å utvide compliance-dekningen — helt uavhengig av moduler. GDPR og ISO 27001 er allerede inkludert.
            </p>

            {/* Free frameworks */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pl-10">
              {["GDPR", "ISO 27001"].map((name) => (
                <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-success/20 bg-success/[0.03]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  <span className="text-sm font-medium text-foreground">{name}</span>
                  <Badge className="ml-auto bg-success/10 text-success border-0 text-[9px]">Inkludert</Badge>
                </div>
              ))}
            </div>

            {/* Paid frameworks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-10">
              {frameworkAddonList.map((addon) => {
                const isActive = activeFrameworkAddons.some((a) => a.domain_id === addon.id);
                return (
                  <Card key={addon.id} className={isActive ? "border-primary/30" : ""}>
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-semibold text-sm text-foreground">{addon.name}</span>
                        </div>
                        {isActive ? (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Aktiv</Badge>
                        ) : (
                          <span className="text-sm font-bold text-foreground">{formatKr(addon.yearlyPriceKr)}/år</span>
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
                      {!isActive && (
                        <Button variant="outline" size="sm" className="w-full text-xs mt-1">
                          Legg til
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* ── STEG 3: MODULER ── */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
              <h2 className="text-lg font-semibold text-foreground">Automatiser med moduler</h2>
            </div>

            {/* Value proposition */}
            <div className="ml-10 rounded-lg border bg-primary/[0.03] border-primary/10 p-4 space-y-2">
              <p className="text-sm text-foreground font-medium">
                Moduler kobler inn AI som automatisk oppdaterer ditt Trust Center
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {[
                  { icon: Bot, text: "AI-drevet compliance-oppdatering" },
                  { icon: FolderKanban, text: "Automatiske arbeidsområder" },
                  { icon: ClipboardList, text: "Oppgaver og påminnelser" },
                  { icon: Globe, text: "Trust Center oppdateres live" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Billing toggle */}
            <div className="flex items-center gap-3 ml-10">
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
                <Badge variant="secondary" className="text-[10px] bg-success/10 text-success border-0">
                  Spar 2 mnd
                </Badge>
              )}
            </div>

            {/* Module cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-10">
              {(Object.keys(MODULES) as ModuleId[]).map((moduleId) => {
                const mod = MODULES[moduleId];
                const Icon = MODULE_ICONS[moduleId];
                const isActive = moduleId === "systems" ? systemsActive : vendorsActive;
                const activeTier = moduleId === "systems" ? systemsTier : vendorsTier;

                return (
                  <div key={moduleId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-foreground">{mod.displayName}</h3>
                      {isActive && (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          {activeTier === "premium" ? "Premium" : "Basis"} aktiv
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{mod.description}</p>

                    <div className="grid grid-cols-2 gap-3">
                      {(["basis", "premium"] as ModuleTier[]).map((tier) => {
                        const config = mod.tiers[tier];
                        const price = getModulePrice(moduleId, tier, billingInterval);
                        const isCurrent = isActive && activeTier === tier;
                        const isRecommended = tier === "premium";

                        return (
                          <Card
                            key={tier}
                            className={`relative ${
                              isCurrent
                                ? "border-primary ring-2 ring-primary/20"
                                : isRecommended
                                ? "border-primary/40"
                                : ""
                            }`}
                          >
                            {isRecommended && !isCurrent && (
                              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[9px] px-2">
                                Anbefalt
                              </Badge>
                            )}
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-foreground">
                                  {tier === "basis" ? "Basis" : "Premium"}
                                </span>
                                {isCurrent && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                              </div>

                              <div>
                                <div className="flex items-baseline gap-0.5">
                                  <span className="text-xl font-bold text-foreground">{formatKr(price)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {billingInterval === "yearly" ? "/år" : "/mnd"}
                                  </span>
                                </div>
                                {billingInterval === "yearly" && (
                                  <p className="text-[10px] text-success mt-0.5">
                                    Spar {formatKr(getModuleAnnualSavingsKr(moduleId, tier))}/år
                                  </p>
                                )}
                              </div>

                              <Separator />

                              <div className="space-y-1.5">
                                {config.features.map((feature) => (
                                  <div key={feature} className="flex items-start gap-1.5">
                                    <Check className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                                    <span className="text-[11px] text-foreground leading-tight">{feature}</span>
                                  </div>
                                ))}
                              </div>

                              {isCurrent ? (
                                <Button variant="outline" size="sm" className="w-full text-xs" disabled>
                                  Aktiv
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="w-full text-xs gap-1.5"
                                  variant={isRecommended ? "default" : "outline"}
                                  onClick={() => handleSelectModule(moduleId, tier)}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Velg {tier === "basis" ? "Basis" : "Premium"}
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Enterprise */}
            <Card className="border-dashed ml-10">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-foreground">Enterprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ubegrenset systemer og leverandører, dedikert kontaktperson, tilpassede integrasjoner og SLA.
                  </p>
                </div>
                <Button variant="outline" size="sm">Kontakt salg</Button>
              </CardContent>
            </Card>
          </section>

          {/* ── OPPSUMMERING ── */}
          {hasAnyCost && (
            <section className="space-y-3">
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Oppsummering</h3>
                <div className="space-y-1.5">
                  {systemsActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Systemmodul ({systemsTier === "premium" ? "Premium" : "Basis"})
                      </span>
                      <span className="text-foreground font-medium">
                        {formatKr(MODULES.systems.tiers[systemsTier][billingInterval === "yearly" ? "yearly" : "monthly"])}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                  )}
                  {vendorsActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Leverandørmodul ({vendorsTier === "premium" ? "Premium" : "Basis"})
                      </span>
                      <span className="text-foreground font-medium">
                        {formatKr(MODULES.vendors.tiers[vendorsTier][billingInterval === "yearly" ? "yearly" : "monthly"])}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                  )}
                  {activeFrameworkAddons.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {activeFrameworkAddons.length} regelverk-tillegg
                      </span>
                      <span className="text-foreground font-medium">{formatKr(totalFrameworkCost)}/år</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-foreground">Totalt moduler</span>
                  <span className="text-foreground">
                    {formatKr(getTotalMonthlyCost())}{billingInterval === "yearly" ? "/år" : "/mnd"}
                    {totalFrameworkCost > 0 ? ` + ${formatKr(totalFrameworkCost)}/år` : ""}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* ── BETALINGSMETODE ── */}
          <section className="space-y-3">
            <Card>
              <CardContent className="p-5 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Betalingsmetode</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="card" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Kort / Stripe Link</span>
                      <p className="text-xs text-muted-foreground">Umiddelbar betaling</p>
                    </div>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === "invoice" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="invoice" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-foreground">Faktura</span>
                      <p className="text-xs text-muted-foreground">30 dagers betalingsfrist</p>
                    </div>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>

          {/* Confirmation dialog */}
          <Dialog open={showConfirm} onOpenChange={(open) => { if (!open && step !== "processing") setShowConfirm(false); }}>
            <DialogContent className="sm:max-w-md">
              {step === "confirm" && selectedModule && (
                <>
                  <DialogHeader>
                    <DialogTitle>Bekreft aktivering</DialogTitle>
                    <DialogDescription>Gjennomgå bestillingen din.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Modul</span>
                      <span className="font-medium text-foreground">{MODULES[selectedModule].displayName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Nivå</span>
                      <span className="font-medium text-foreground">{selectedModuleTier === "premium" ? "Premium" : "Basis"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pris</span>
                      <span className="font-medium text-foreground">
                        {formatKr(getModulePrice(selectedModule, selectedModuleTier, billingInterval))}
                        {billingInterval === "yearly" ? "/år" : "/mnd"}
                      </span>
                    </div>
                    {billingInterval === "yearly" && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Besparelse</span>
                        <span className="font-medium text-success">
                          {formatKr(getModuleAnnualSavingsKr(selectedModule, selectedModuleTier))}/år
                        </span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Kapasitet</span>
                      <span className="font-medium text-foreground">
                        Inntil {MODULES[selectedModule].tiers[selectedModuleTier].maxItems} {selectedModule === "systems" ? "systemer" : "leverandører"}
                      </span>
                    </div>
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

              {step === "success" && selectedModule && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Aktivering vellykket!</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {paymentMethod === "card"
                        ? `${MODULES[selectedModule].displayName} (${selectedModuleTier === "premium" ? "Premium" : "Basis"}) er nå aktiv.`
                        : "Fakturaen er sendt. Modulen aktiveres når betalingen er mottatt."}
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
