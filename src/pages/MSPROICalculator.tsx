import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Clock, DollarSign, BarChart3 } from "lucide-react";
import jsPDF from "jspdf";
import { formatKr } from "@/lib/mspLicenseUtils";

export default function MSPROICalculator() {
  const [customers, setCustomers] = useState(5);
  const [hourlyRate, setHourlyRate] = useState(1200);
  const [hoursPerMonth, setHoursPerMonth] = useState(8);

  const MYNDER_LICENSE_KR_MONTH = 3500; // per customer per month
  const AUTOMATION_FACTOR = 0.8;

  const manualCostYear = customers * hoursPerMonth * hourlyRate * 12;
  const timeSavedHours = Math.round(customers * hoursPerMonth * AUTOMATION_FACTOR * 12);
  const costSavingYear = Math.round(manualCostYear * AUTOMATION_FACTOR);
  const mynderCostYear = customers * MYNDER_LICENSE_KR_MONTH * 12;
  const netSaving = costSavingYear - mynderCostYear;
  const revenuePerCustomer = MYNDER_LICENSE_KR_MONTH * 12;

  const fmtKr = (v: number) => new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Mynder ROI-rapport", 20, 25);
    doc.setFontSize(11);
    doc.text(`Generert: ${new Date().toLocaleDateString("nb-NO")}`, 20, 35);

    doc.setFontSize(13);
    doc.text("Forutsetninger", 20, 50);
    doc.setFontSize(10);
    doc.text(`Antall kunder: ${customers}`, 25, 60);
    doc.text(`Timepris: ${fmtKr(hourlyRate)}`, 25, 67);
    doc.text(`Timer per kunde per måned (manuelt): ${hoursPerMonth}`, 25, 74);

    doc.setFontSize(13);
    doc.text("Resultater", 20, 90);
    doc.setFontSize(10);
    doc.text(`Manuell kostnad per år: ${fmtKr(manualCostYear)}`, 25, 100);
    doc.text(`Tidsbesparelse: ${timeSavedHours} timer/år`, 25, 107);
    doc.text(`Kostnadsbesparelse: ${fmtKr(costSavingYear)}`, 25, 114);
    doc.text(`Mynder-kostnad per år: ${fmtKr(mynderCostYear)}`, 25, 121);
    doc.text(`Netto besparelse: ${fmtKr(netSaving)}`, 25, 128);

    doc.save("mynder-roi-rapport.pdf");
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container max-w-7xl mx-auto py-8 px-4 md:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">ROI-kalkulator</h1>
              <p className="text-muted-foreground mt-1">Beregn besparelsen ved å bruke Mynder for dine kunder</p>
            </div>
            <Button onClick={exportPdf} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Eksporter som PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Forutsetninger</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Antall kunder</Label>
                  <Input type="number" min={1} value={customers} onChange={e => setCustomers(Number(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label>Timepris (NOK)</Label>
                  <Input type="number" min={0} value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Timer per kunde per måned (manuelt)</Label>
                  <Input type="number" min={0} value={hoursPerMonth} onChange={e => setHoursPerMonth(Number(e.target.value) || 0)} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Mynder automatiserer ca. 80 % av manuelt compliance-arbeid.
                </p>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Tidsbesparelse per år</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{timeSavedHours} <span className="text-base font-normal text-muted-foreground">timer</span></p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Kostnadsbesparelse</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{fmtKr(costSavingYear)}</p>
                </Card>
                <Card className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Mynder-kostnad per år</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{fmtKr(mynderCostYear)}</p>
                </Card>
                <Card className="p-5 border-primary/30">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium text-muted-foreground">Netto besparelse</span>
                  </div>
                  <p className={`text-3xl font-bold ${netSaving >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {fmtKr(netSaving)}
                  </p>
                </Card>
              </div>

              {/* Comparison */}
              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-4">Sammenligning: manuelt vs. med Mynder</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Manuell kostnad per år</span>
                    <span className="font-medium text-foreground">{fmtKr(manualCostYear)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Med Mynder (lisens + resttid)</span>
                    <span className="font-medium text-foreground">{fmtKr(mynderCostYear + (manualCostYear - costSavingYear))}</span>
                  </div>
                  <div className="border-t pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Du sparer</span>
                    <span className={`font-bold text-lg ${netSaving >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                      {fmtKr(netSaving)} / år
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold text-foreground mb-2">Inntektspotensial per kunde</h3>
                <p className="text-muted-foreground text-sm">
                  Hver kunde med Mynder-lisens genererer <span className="font-semibold text-foreground">{fmtKr(revenuePerCustomer)}</span> i årlig inntekt.
                  Med {customers} kunder: <span className="font-semibold text-foreground">{fmtKr(revenuePerCustomer * customers)}</span> / år.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
