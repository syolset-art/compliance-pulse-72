import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building2, 
  Zap, 
  HeartPulse, 
  Landmark, 
  Code, 
  Building,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyOnboardingProps {
  onComplete: () => void;
}

const industries = [
  { id: "energi", name: "Energi", icon: Zap, description: "Kraftproduksjon, nett og energitjenester" },
  { id: "helse", name: "Helse", icon: HeartPulse, description: "Sykehus, klinikker og helsetjenester" },
  { id: "finans", name: "Finans", icon: Landmark, description: "Bank, forsikring og finanstjenester" },
  { id: "saas", name: "Tech / SaaS", icon: Code, description: "Programvare og teknologiselskaper" },
  { id: "offentlig", name: "Offentlig sektor", icon: Building, description: "Kommune, stat og offentlige etater" },
];

const employeeRanges = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "500-1000",
  "1000+",
];

const maturityLevels = [
  { id: "beginner", name: "Nybegynner", description: "Vi har nettopp begynt å jobbe med compliance" },
  { id: "intermediate", name: "Underveis", description: "Vi har noen rutiner på plass" },
  { id: "advanced", name: "Avansert", description: "Vi har modne prosesser og systemer" },
];

type Step = "company" | "industry" | "size" | "complete";

export function CompanyOnboarding({ onComplete }: CompanyOnboardingProps) {
  const [step, setStep] = useState<Step>("company");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    org_number: "",
    industry: "",
    employees: "",
    maturity: "intermediate",
  });

  const handleNext = () => {
    if (step === "company") {
      if (!formData.name) {
        toast({ title: "Feil", description: "Vennligst fyll inn selskapsnavn", variant: "destructive" });
        return;
      }
      setStep("industry");
    } else if (step === "industry") {
      if (!formData.industry) {
        toast({ title: "Feil", description: "Vennligst velg en bransje", variant: "destructive" });
        return;
      }
      setStep("size");
    } else if (step === "size") {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === "industry") setStep("company");
    else if (step === "size") setStep("industry");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("company_profile" as any)
        .upsert([formData], { onConflict: "id" });

      if (error) throw error;

      setStep("complete");
      
      // Wait a moment then complete
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast({
        title: "Feil",
        description: "Kunne ikke lagre selskapsprofil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case "company": return 1;
      case "industry": return 2;
      case "size": return 3;
      case "complete": return 4;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Steg {getStepNumber()} av 3</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(getStepNumber() / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step: Company Info */}
        {step === "company" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Velkommen til Mynder</h1>
              <p className="text-muted-foreground">
                La oss starte med litt informasjon om selskapet ditt
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Selskapsnavn *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="F.eks. Eviny AS"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_number">Organisasjonsnummer</Label>
                <Input
                  id="org_number"
                  value={formData.org_number}
                  onChange={(e) => setFormData({ ...formData, org_number: e.target.value })}
                  placeholder="F.eks. 983052968"
                  className="h-12"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Industry */}
        {step === "industry" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Hvilken bransje er dere i?</h1>
              <p className="text-muted-foreground">
                Vi tilpasser arbeidsområder og maler basert på bransjen din
              </p>
            </div>

            <div className="grid gap-3">
              {industries.map((industry) => {
                const Icon = industry.icon;
                const isSelected = formData.industry === industry.id;
                return (
                  <button
                    key={industry.id}
                    onClick={() => setFormData({ ...formData, industry: industry.id })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{industry.name}</p>
                      <p className="text-sm text-muted-foreground">{industry.description}</p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>
                Tilbake
              </Button>
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Size & Maturity */}
        {step === "size" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Litt mer om dere</h1>
              <p className="text-muted-foreground">
                Dette hjelper oss å tilpasse anbefalingene våre
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Antall ansatte</Label>
                <div className="flex flex-wrap gap-2">
                  {employeeRanges.map((range) => (
                    <button
                      key={range}
                      onClick={() => setFormData({ ...formData, employees: range })}
                      className={cn(
                        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                        formData.employees === range
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Modenhetsnivå for compliance</Label>
                <RadioGroup 
                  value={formData.maturity} 
                  onValueChange={(value) => setFormData({ ...formData, maturity: value })}
                >
                  {maturityLevels.map((level) => (
                    <label
                      key={level.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                        formData.maturity === level.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <RadioGroupItem value={level.id} />
                      <div>
                        <p className="font-medium">{level.name}</p>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>
                Tilbake
              </Button>
              <Button onClick={handleNext} size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Lagrer...
                  </>
                ) : (
                  "Fullfør oppsett"
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Complete */}
        {step === "complete" && (
          <Card className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-4">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Alt klart!</h1>
            <p className="text-muted-foreground">
              Vi setter opp arbeidsområdene dine basert på bransjen din...
            </p>
            <div className="mt-6">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}