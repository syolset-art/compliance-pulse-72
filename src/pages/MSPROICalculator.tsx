import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, TrendingUp, Wallet, Rocket, Users, BarChart3, Info, ShieldCheck, Zap } from "lucide-react";
import { LICENSE_TIERS, type LicenseTier } from "@/lib/mspLicenseUtils";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import { addMynderFooter } from "@/lib/pdfBranding";

type CustomerSize = "S" | "M" | "L";
type SalesModel = "standard" | "bulk";

const SIZE_CONFIG: Record<CustomerSize, { label: string; onboardingRevenue: number; onboardingHours: number }> = {
  S: { label: "S (0–20 systemer)", onboardingRevenue: 9900, onboardingHours: 4 },
  M: { label: "M (21–50 systemer)", onboardingRevenue: 19900, onboardingHours: 8 },
  L: { label: "L (51+ systemer)", onboardingRevenue: 39900, onboardingHours: 18 },
};

const COMMISSION_STANDARD = 0.20;
const COMMISSION_BULK = 0.50;

export default function MSPROICalculator() {
  const [customers, setCustomers] = useState(5);
  const [customerSize, setCustomerSize] = useState<CustomerSize>("S");
  const [selectedTierId, setSelectedTierId] = useState(LICENSE_TIERS[0].id);
  const [salesModel, setSalesModel] = useState<SalesModel>("bulk");
  const [hourlyRate, setHourlyRate] = useState(1200);

  const tier = LICENSE_TIERS.find(t => t.id === selectedTierId) ?? LICENSE_TIERS[0];
  const isBulk = salesModel === "bulk";
  const commissionRate = isBulk ? COMMISSION_BULK : COMMISSION_STANDARD;

  // Per license calculations
  const tierPriceYear = tier.priceKr;
  const mspMarginPerLicense = tierPriceYear * commissionRate;
  const mspCostPerLicense = isBulk ? tierPriceYear * (1 - COMMISSION_BULK) : 0;

  // Onboarding
  const { onboardingRevenue, onboardingHours } = SIZE_CONFIG[customerSize];
  const onboardingCost = onboardingHours * hourlyRate;
  const onboardingProfit = onboardingRevenue - onboardingCost;

  // Per customer
  const marginPerCustomerYear1 = mspMarginPerLicense + onboardingProfit;
  const marginPerCustomerYear2 = mspMarginPerLicense;

  // Portfolio
  const totalLicenseIncome = mspMarginPerLicense * customers;
  const totalOnboarding = onboardingRevenue * customers;
  const totalBulkCost = mspCostPerLicense * customers;
  const totalTimeCost = onboardingCost * customers;
  const profitYear1 = totalLicenseIncome + totalOnboarding - totalBulkCost - totalTimeCost;
  const profitYear2 = totalLicenseIncome;

  const fmtKr = (v: number) =>
    new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const scenarioProfit = (n: number) => {
    const lic = mspMarginPerLicense * n;
    const onb = onboardingRevenue * n;
    const bulk = mspCostPerLicense * n;
    const time = onboardingCost * n;
    return lic + onb - bulk - time;
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mynder Partnerkalkyl", 20, 25);
    doc.setFontSize(11);
    doc.text(`Generert: ${new Date().toLocaleDateString("nb-NO")}`, 20, 35);

    doc.setFontSize(13);
    doc.text("Forutsetninger", 20, 50);
    doc.setFontSize(10);
    doc.text(`Antall kunder: ${customers}`, 25, 60);
    doc.text(`Kundestørrelse: ${SIZE_CONFIG[customerSize].label}`, 25, 67);
    doc.text(`Lisensnivå: ${tier.name} (${fmtKr(tierPriceYear)}/år)`, 25, 74);
    doc.text(`Salgsmodell: ${isBulk ? "Bulk (50% margin)" : "Standard (20% provisjon)"}`, 25, 81);
    doc.text(`Din timepris: ${fmtKr(hourlyRate)}`, 25, 88);

    doc.setFontSize(13);
    doc.text("Per kunde", 20, 104);
    doc.setFontSize(10);
    doc.text(`Kundens lisenpris: ${fmtKr(tierPriceYear)}/år`, 25, 114);
    doc.text(`Din andel (${Math.round(commissionRate * 100)}%): ${fmtKr(mspMarginPerLicense)}/år`, 25, 121);
    if (isBulk) doc.text(`Din forhåndskjøpskostnad: ${fmtKr(mspCostPerLicense)}`, 25, 128);
    const yOffset = isBulk ? 135 : 128;
    doc.text(`Oppstartsinntekt: ${fmtKr(onboardingRevenue)}`, 25, yOffset);
    doc.text(`Din oppstartskostnad (${onboardingHours} t): ${fmtKr(onboardingCost)}`, 25, yOffset + 7);
    doc.text(`Margin per kunde år 1: ${fmtKr(marginPerCustomerYear1)}`, 25, yOffset + 14);
    doc.text(`Margin per kunde år 2+: ${fmtKr(marginPerCustomerYear2)}`, 25, yOffset + 21);

    const y2 = yOffset + 37;
    doc.setFontSize(13);
    doc.text(`Portefølje (${customers} kunder)`, 20, y2);
    doc.setFontSize(10);
    doc.text(`Din lisensinntekt: ${fmtKr(totalLicenseIncome)}/år`, 25, y2 + 10);
    doc.text(`Oppstartsinntekt: ${fmtKr(totalOnboarding)}`, 25, y2 + 17);
    if (isBulk) doc.text(`Forhåndskjøp lisenser: ${fmtKr(totalBulkCost)}`, 25, y2 + 24);
    const y3 = isBulk ? y2 + 31 : y2 + 24;
    doc.text(`Egen tid-kostnad: ${fmtKr(totalTimeCost)}`, 25, y3);
    doc.text(`Netto fortjeneste år 1: ${fmtKr(profitYear1)}`, 25, y3 + 7);
    doc.text(`Netto fortjeneste år 2+: ${fmtKr(profitYear2)}`, 25, y3 + 14);

    addMynderFooter(doc);
    doc.save("mynder-partnerkalkyl.pdf");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Partnerkalkulator</h1>
              <p className="text-muted-foreground mt-1">Se hva du kan tjene ved å selge Mynder</p>
            </div>
            <Button onClick={exportPdf} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Eksporter PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Inputs */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Forutsetninger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Antall kunder: {customers}</Label>
                  <Slider min={1} max={50} step={1} value={[customers]} onValueChange={v => setCustomers(v[0])} />
                </div>

                <div className="space-y-2">
                  <Label>Lisensnivå</Label>
                  <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LICENSE_TIERS.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} – {new Intl.NumberFormat("nb-NO").format(t.priceKr)} kr/år (maks {t.maxSystems} sys.)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Salgsmodell</Label>
                  <Select value={salesModel} onValueChange={v => setSalesModel(v as SalesModel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (20 % provisjon)</SelectItem>
                      <SelectItem value="bulk">Bulk (50 % margin, forhåndskjøp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Gjennomsnittlig kundestørrelse</Label>
                  <Select value={customerSize} onValueChange={v => setCustomerSize(v as CustomerSize)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(SIZE_CONFIG) as [CustomerSize, typeof SIZE_CONFIG["S"]][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Din timepris (NOK)</Label>
                  <Input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} />
                </div>

                {/* Info box */}
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <Info className="h-4 w-4 text-primary" /> Salgsmodeller
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span><strong>Standard:</strong> Du får 20 % provisjon uten risiko</span>
                  </div>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <span><strong>Bulk:</strong> Kjøp lisenser med 50 % rabatt – høyere margin per kunde</span>
                  </div>
                  <Link to="/msp-licenses" className="text-primary text-xs hover:underline block mt-1">
                    Gå til Lisenser →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-4">
              {/* Top 3 metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Din lisensinntekt/år</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{fmtKr(totalLicenseIncome)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{Math.round(commissionRate * 100)} % av {fmtKr(tierPriceYear)} × {customers}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Rocket className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Oppstartsinntekt</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{fmtKr(totalOnboarding)}</p>
                </Card>
                <Card className="p-5 border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Fortjeneste år 1</span>
                  </div>
                  <p className={`text-2xl font-bold ${profitYear1 >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {fmtKr(profitYear1)}
                  </p>
                </Card>
              </div>

              {/* Per customer */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Per kunde
                </h3>
                <div className="space-y-3 text-sm">
                  <Row label="Kundens lisenpris" value={`${fmtKr(tierPriceYear)}/år`} />
                  <Row label={`Din andel (${Math.round(commissionRate * 100)} %)`} value={`${fmtKr(mspMarginPerLicense)}/år`} bold positive />
                  {isBulk && <Row label="Din forhåndskjøpskostnad" value={`−${fmtKr(mspCostPerLicense)}`} muted />}
                  <div className="border-t pt-3" />
                  <Row label="Oppstartsinntekt (engangs)" value={fmtKr(onboardingRevenue)} />
                  <Row label={`Din oppstartskostnad (${onboardingHours} t)`} value={`−${fmtKr(onboardingCost)}`} muted />
                  <div className="border-t pt-3" />
                  <Row label="Margin per kunde – år 1" value={fmtKr(marginPerCustomerYear1)} bold positive={marginPerCustomerYear1 >= 0} />
                  <Row label="Margin per kunde – år 2+" value={fmtKr(marginPerCustomerYear2)} bold positive />
                </div>
              </Card>

              {/* Portfolio */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Portefølje ({customers} kunder)
                </h3>
                <div className="space-y-3 text-sm">
                  <Row label="Din lisensinntekt/år" value={fmtKr(totalLicenseIncome)} />
                  <Row label="Oppstartsinntekt (engangs)" value={fmtKr(totalOnboarding)} />
                  {isBulk && <Row label="Forhåndskjøp lisenser" value={`−${fmtKr(totalBulkCost)}`} muted />}
                  <Row label="Egen tid-kostnad" value={`−${fmtKr(totalTimeCost)}`} muted />
                  <div className="border-t pt-3">
                    <Row label="Netto fortjeneste år 1" value={fmtKr(profitYear1)} bold positive={profitYear1 >= 0} />
                  </div>
                  <Row label="Netto fortjeneste år 2+" value={fmtKr(profitYear2)} bold positive />
                </div>
              </Card>

              {/* Growth */}
              <Card className="p-6 bg-primary/5 border-primary/20">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Vekstscenario
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  {[10, 25, 50].map(n => (
                    <div key={n} className="text-center">
                      <p className="text-muted-foreground mb-1">Med {n} kunder</p>
                      <p className="text-lg font-bold text-foreground">{fmtKr(scenarioProfit(n))}</p>
                      <p className="text-xs text-muted-foreground">fortjeneste år 1</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, bold, positive, muted }: { label: string; value: string; bold?: boolean; positive?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${muted ? "text-muted-foreground" : "text-foreground"} ${bold ? "font-semibold" : ""}`}>{label}</span>
      <span className={`${bold ? "font-bold text-lg" : "font-medium"} ${positive ? "text-green-600 dark:text-green-400" : muted ? "text-muted-foreground" : "text-foreground"}`}>
        {value}
      </span>
    </div>
  );
}
