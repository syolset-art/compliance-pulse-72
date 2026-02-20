import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Download, TrendingUp, Wallet, Rocket, Users, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";

type CustomerSize = "S" | "M" | "L";
type Product = "trust-engine" | "core" | "core-readiness";

const SIZE_CONFIG: Record<CustomerSize, { label: string; onboardingRevenue: number; onboardingHours: number }> = {
  S: { label: "S (0–20 systemer)", onboardingRevenue: 9900, onboardingHours: 4 },
  M: { label: "M (21–50 systemer)", onboardingRevenue: 19900, onboardingHours: 8 },
  L: { label: "L (51+ systemer)", onboardingRevenue: 39900, onboardingHours: 18 },
};

const PRODUCT_CONFIG: Record<Product, { label: string; arrBase: number }> = {
  "trust-engine": { label: "Trust Engine", arrBase: 5880 },
  "core": { label: "Core (20 systemer)", arrBase: 41880 },
  "core-readiness": { label: "Core + Readiness", arrBase: 41880 },
};

const READINESS_PER_STANDARD = 5490;

export default function MSPROICalculator() {
  const [customers, setCustomers] = useState(5);
  const [customerSize, setCustomerSize] = useState<CustomerSize>("S");
  const [product, setProduct] = useState<Product>("core");
  const [readinessStandards, setReadinessStandards] = useState(1);
  const [hourlyRate, setHourlyRate] = useState(1200);

  // Calculations
  const arrPerCustomer = product === "core-readiness"
    ? PRODUCT_CONFIG["core-readiness"].arrBase + READINESS_PER_STANDARD * readinessStandards
    : PRODUCT_CONFIG[product].arrBase;

  const { onboardingRevenue, onboardingHours } = SIZE_CONFIG[customerSize];
  const onboardingCost = onboardingHours * hourlyRate;

  const marginYear1 = arrPerCustomer + onboardingRevenue - onboardingCost;
  const marginYear2 = arrPerCustomer;

  const totalARR = arrPerCustomer * customers;
  const totalOnboarding = onboardingRevenue * customers;
  const totalCostYear1 = onboardingCost * customers;
  const profitYear1 = totalARR + totalOnboarding - totalCostYear1;
  const profitYear2 = totalARR;

  const fmtKr = (v: number) =>
    new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const scenarioProfit = (n: number) => {
    const arr = arrPerCustomer * n;
    const onb = onboardingRevenue * n;
    const cost = onboardingCost * n;
    return arr + onb - cost;
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
    doc.text(`Produkt: ${PRODUCT_CONFIG[product].label}${product === "core-readiness" ? ` (${readinessStandards} standarder)` : ""}`, 25, 74);
    doc.text(`Din timepris: ${fmtKr(hourlyRate)}`, 25, 81);

    doc.setFontSize(13);
    doc.text("Inntekt og fortjeneste", 20, 97);
    doc.setFontSize(10);
    doc.text(`Årlig lisensinntekt (ARR): ${fmtKr(totalARR)}`, 25, 107);
    doc.text(`Oppstartsinntekt (år 1): ${fmtKr(totalOnboarding)}`, 25, 114);
    doc.text(`Din kostnad for oppstart: ${fmtKr(totalCostYear1)}`, 25, 121);
    doc.text(`Netto fortjeneste år 1: ${fmtKr(profitYear1)}`, 25, 128);
    doc.text(`Netto fortjeneste år 2+: ${fmtKr(profitYear2)}`, 25, 135);

    doc.setFontSize(13);
    doc.text("Per kunde", 20, 151);
    doc.setFontSize(10);
    doc.text(`Lisensinntekt per kunde/år: ${fmtKr(arrPerCustomer)}`, 25, 161);
    doc.text(`Oppstartsinntekt per kunde: ${fmtKr(onboardingRevenue)}`, 25, 168);
    doc.text(`Din oppstartskostnad: ${fmtKr(onboardingCost)} (${onboardingHours} t)`, 25, 175);
    doc.text(`Margin per kunde år 1: ${fmtKr(marginYear1)}`, 25, 182);
    doc.text(`Margin per kunde år 2+: ${fmtKr(marginYear2)}`, 25, 189);

    doc.save("mynder-partnerkalkyl.pdf");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
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
                  <Label>Produkt per kunde</Label>
                  <Select value={product} onValueChange={v => setProduct(v as Product)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(PRODUCT_CONFIG) as [Product, typeof PRODUCT_CONFIG["core"]][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {product === "core-readiness" && (
                  <div className="space-y-2">
                    <Label>Antall Readiness-standarder</Label>
                    <Input type="number" min={1} max={10} value={readinessStandards} onChange={e => setReadinessStandards(Math.max(1, Number(e.target.value) || 1))} />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Din timepris (NOK)</Label>
                  <Input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} />
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
                    <span className="text-sm font-medium text-muted-foreground">Årlig inntekt (ARR)</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{fmtKr(totalARR)}</p>
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
                  <Users className="h-4 w-4 text-primary" /> Inntektsberegning per kunde
                </h3>
                <div className="space-y-3 text-sm">
                  <Row label="Lisensinntekt per år" value={fmtKr(arrPerCustomer)} />
                  <Row label="Oppstartsinntekt (engangs)" value={fmtKr(onboardingRevenue)} />
                  <Row label={`Din kostnad for oppstart (${onboardingHours} t)`} value={`−${fmtKr(onboardingCost)}`} muted />
                  <div className="border-t pt-3">
                    <Row label="Margin per kunde – år 1" value={fmtKr(marginYear1)} bold positive={marginYear1 >= 0} />
                  </div>
                  <Row label="Margin per kunde – år 2+" value={fmtKr(marginYear2)} bold positive />
                </div>
              </Card>

              {/* Portfolio */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Portefølje-oppsummering ({customers} kunder)
                </h3>
                <div className="space-y-3 text-sm">
                  <Row label="Total ARR" value={fmtKr(totalARR)} />
                  <Row label="Total oppstartsinntekt" value={fmtKr(totalOnboarding)} />
                  <Row label="Total egen kostnad (år 1)" value={`−${fmtKr(totalCostYear1)}`} muted />
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
