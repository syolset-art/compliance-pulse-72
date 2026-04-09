import { useState, useMemo } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { LICENSE_TIERS } from "@/lib/mspLicenseUtils";
import { FileDown, TrendingDown, Clock, CalendarCheck, Sparkles } from "lucide-react";
import jsPDF from "jspdf";

const formatKr = (v: number) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

export default function MSPCustomerROI() {
  const [systems, setSystems] = useState(10);
  const [hoursPerMonth, setHoursPerMonth] = useState(20);
  const [hourlyRate, setHourlyRate] = useState(850);
  const [standards, setStandards] = useState("1");
  const [companyName, setCompanyName] = useState("");

  const calc = useMemo(() => {
    const tier = systems <= 20 ? LICENSE_TIERS[0] : LICENSE_TIERS[1];
    const standardsCount = parseInt(standards);
    const manualCostYear = hoursPerMonth * hourlyRate * 12 * (1 + (standardsCount - 1) * 0.3);
    const mynderCostYear = tier.priceKr;
    const savingYear = Math.max(0, manualCostYear - mynderCostYear);
    const savingPercent = manualCostYear > 0 ? (savingYear / manualCostYear) * 100 : 0;
    const timeFreedHours = Math.round(hoursPerMonth * 0.8 * 12);
    const paybackMonths = manualCostYear > 0 ? Math.ceil(mynderCostYear / (manualCostYear / 12)) : 0;
    const saving3Year = savingYear * 3;
    return { tier, manualCostYear, mynderCostYear, savingYear, savingPercent, timeFreedHours, paybackMonths, saving3Year };
  }, [systems, hoursPerMonth, hourlyRate, standards]);

  const exportPdf = () => {
    const doc = new jsPDF();
    const name = companyName || "Deres bedrift";
    doc.setFontSize(20);
    doc.text(`Mynder – Besparelsesanalyse`, 20, 25);
    doc.setFontSize(14);
    doc.text(`Utarbeidet for: ${name}`, 20, 35);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Dato: ${new Date().toLocaleDateString("nb-NO")}`, 20, 43);

    doc.setTextColor(0);
    doc.setFontSize(12);
    let y = 58;
    const lines = [
      ["Antall systemer", `${systems}`],
      ["Timer brukt manuelt/mnd", `${hoursPerMonth} t`],
      ["Intern timepris", formatKr(hourlyRate)],
      ["Antall rammeverk", standards],
      ["", ""],
      ["Manuell kostnad per år", formatKr(calc.manualCostYear)],
      [`Mynder-lisens (${calc.tier.name})`, formatKr(calc.mynderCostYear)],
      ["Årlig besparelse", formatKr(calc.savingYear)],
      ["Besparelse 3 år", formatKr(calc.saving3Year)],
      ["Timer frigjort per år", `${calc.timeFreedHours} timer`],
      ["Tilbakebetalt etter", `${calc.paybackMonths} måneder`],
    ];
    lines.forEach(([label, value]) => {
      if (!label) { y += 4; return; }
      doc.text(label, 20, y);
      doc.text(value, 130, y);
      y += 8;
    });

    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Beregningen er basert på 80 % automatisering av manuelt compliance-arbeid.", 20, y + 12);
    doc.text("Generert av Mynder – mynder.io", 20, y + 18);

    doc.save(`Mynder-besparelsesanalyse-${name.replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-8 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Hva sparer din bedrift?</h1>
            <p className="text-muted-foreground mt-1">Se hvor mye tid og penger dere kan spare med Mynder</p>
          </div>

          {/* Inputs */}
          <Card className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Bedriftsnavn */}
              <div className="space-y-2">
                <Label>Bedriftsnavn (valgfritt)</Label>
                <Input
                  placeholder="Brukes i PDF-rapporten"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              {/* Antall standarder */}
              <div className="space-y-2">
                <Label>Antall rammeverk</Label>
                <Select value={standards} onValueChange={setStandards}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 – f.eks. GDPR</SelectItem>
                    <SelectItem value="2">2 – f.eks. GDPR + ISO 27001</SelectItem>
                    <SelectItem value="3">3 – f.eks. GDPR + ISO 27001 + NIS2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Antall systemer */}
              <div className="space-y-2">
                <Label>Antall systemer: {systems}</Label>
                <Slider
                  value={[systems]}
                  onValueChange={([v]) => setSystems(v)}
                  min={1} max={80} step={1}
                />
                <p className="text-xs text-muted-foreground">
                  Lisensnivå: {calc.tier.name} ({formatKr(calc.tier.priceKr)}/år)
                </p>
              </div>

              {/* Timer per måned */}
              <div className="space-y-2">
                <Label>Timer brukt på manuell compliance/mnd: {hoursPerMonth}</Label>
                <Slider
                  value={[hoursPerMonth]}
                  onValueChange={([v]) => setHoursPerMonth(v)}
                  min={1} max={100} step={1}
                />
              </div>

              {/* Timepris */}
              <div className="space-y-2">
                <Label>Intern timepris (kr)</Label>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value) || 0)}
                />
              </div>
            </div>
          </Card>

          {/* Results top row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 text-center space-y-1">
              <TrendingDown className="h-6 w-6 mx-auto text-green-600" />
              <p className="text-2xl font-bold text-green-600">{formatKr(calc.savingYear)}</p>
              <p className="text-sm text-muted-foreground">Årlig besparelse</p>
            </Card>
            <Card className="p-5 text-center space-y-1">
              <Clock className="h-6 w-6 mx-auto text-primary" />
              <p className="text-2xl font-bold text-foreground">{calc.timeFreedHours} t</p>
              <p className="text-sm text-muted-foreground">Timer frigjort per år</p>
            </Card>
            <Card className="p-5 text-center space-y-1">
              <CalendarCheck className="h-6 w-6 mx-auto text-primary" />
              <p className="text-2xl font-bold text-foreground">{calc.paybackMonths} mnd</p>
              <p className="text-sm text-muted-foreground">Tilbakebetalt etter</p>
            </Card>
            <Card className="p-5 text-center space-y-1">
              <Sparkles className="h-6 w-6 mx-auto text-green-600" />
              <p className="text-2xl font-bold text-green-600">{formatKr(calc.saving3Year)}</p>
              <p className="text-sm text-muted-foreground">Besparelse over 3 år</p>
            </Card>
          </div>

          {/* Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-destructive/30 bg-destructive/5">
              <h3 className="font-semibold text-foreground mb-3">Manuelt</h3>
              <p className="text-3xl font-bold text-destructive">{formatKr(calc.manualCostYear)}</p>
              <p className="text-sm text-muted-foreground mt-1">per år</p>
              <ul className="mt-4 text-sm text-muted-foreground space-y-1">
                <li>• {hoursPerMonth} timer/mnd på manuelt arbeid</li>
                <li>• Risiko for feil og manglende oversikt</li>
                <li>• Ingen automatisk varsling</li>
              </ul>
            </Card>
            <Card className="p-6 border-green-500/30 bg-green-500/5">
              <h3 className="font-semibold text-foreground mb-3">Med Mynder</h3>
              <p className="text-3xl font-bold text-green-600">{formatKr(calc.mynderCostYear)}</p>
              <p className="text-sm text-muted-foreground mt-1">per år ({calc.tier.name})</p>
              <ul className="mt-4 text-sm text-muted-foreground space-y-1">
                <li>• 80 % av manuelt arbeid automatisert</li>
                <li>• Sanntidsoversikt over compliance-status</li>
                <li>• AI-drevet dokumenthåndtering</li>
              </ul>
            </Card>
          </div>

          {/* Percentage badge */}
          {calc.savingPercent > 0 && (
            <div className="text-center">
              <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-4 py-2 rounded-full text-lg font-semibold">
                Du sparer {Math.round(calc.savingPercent)} % sammenlignet med manuell håndtering
              </span>
            </div>
          )}

          {/* PDF export */}
          <div className="flex justify-center">
            <Button onClick={exportPdf} size="lg" className="gap-2">
              <FileDown className="h-4 w-4" />
              Last ned besparelsesanalyse (PDF)
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
