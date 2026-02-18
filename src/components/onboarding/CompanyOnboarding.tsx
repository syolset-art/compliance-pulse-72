import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  CheckCircle2,
  Shield,
  Brain,
  Leaf,
  AlertTriangle,
  Users,
  Globe,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { suggestRolesForCompany, useCaseOptions, teamSizeOptions } from "@/lib/rolesSuggestions";
import { createDefaultWorkAreas } from "@/hooks/useAutoCreateWorkAreas";
import { KeyPersonnelSection, validateKeyPersonnel, type KeyPersonnelData } from "./KeyPersonnelSection";

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

const useCaseIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "personvern": Shield,
  "sikkerhet": Shield,
  "ai-styring": Brain,
  "barekraft": Leaf,
  "risikostyring": AlertTriangle,
};

type Step = "company" | "industry" | "size" | "key-persons" | "use-cases" | "team-size" | "complete";

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
    use_cases: [] as string[],
    team_size: "",
    domain: "",
  });

  const [keyPersonnel, setKeyPersonnel] = useState<KeyPersonnelData>({
    compliance_officer: "",
    compliance_officer_email: "",
    dpo_name: "",
    dpo_email: "",
    ciso_name: "",
    ciso_email: "",
  });

  const cleanDomain = (input: string): string => {
    return input
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim()
      .toLowerCase();
  };

  const validateDomain = (domain: string): boolean => {
    if (!domain) return true;
    const pattern = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    return pattern.test(domain);
  };

  const handleDomainChange = (value: string) => {
    const cleaned = cleanDomain(value);
    setFormData(prev => ({ ...prev, domain: cleaned }));
  };

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
      setStep("key-persons");
    } else if (step === "key-persons") {
      const personnelError = validateKeyPersonnel(formData.industry, formData.employees, keyPersonnel);
      if (personnelError) {
        toast({ title: "Feil", description: personnelError, variant: "destructive" });
        return;
      }
      setStep("use-cases");
    } else if (step === "use-cases") {
      if (formData.use_cases.length === 0) {
        toast({ title: "Feil", description: "Vennligst velg minst ett bruksområde", variant: "destructive" });
        return;
      }
      setStep("team-size");
    } else if (step === "team-size") {
      if (!formData.team_size) {
        toast({ title: "Feil", description: "Vennligst velg teamstørrelse", variant: "destructive" });
        return;
      }
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step === "industry") setStep("company");
    else if (step === "size") setStep("industry");
    else if (step === "key-persons") setStep("size");
    else if (step === "use-cases") setStep("key-persons");
    else if (step === "team-size") setStep("use-cases");
  };

  const toggleUseCase = (useCaseId: string) => {
    setFormData(prev => ({
      ...prev,
      use_cases: prev.use_cases.includes(useCaseId)
        ? prev.use_cases.filter(id => id !== useCaseId)
        : [...prev.use_cases, useCaseId]
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const { error: profileError } = await supabase
        .from("company_profile" as any)
        .upsert([{
          ...formData,
          compliance_officer: keyPersonnel.compliance_officer || null,
          compliance_officer_email: keyPersonnel.compliance_officer_email || null,
          dpo_name: keyPersonnel.dpo_name || null,
          dpo_email: keyPersonnel.dpo_email || null,
          ciso_name: keyPersonnel.ciso_name || null,
          ciso_email: keyPersonnel.ciso_email || null,
        }], { onConflict: "id" });

      if (profileError) throw profileError;

      await createDefaultWorkAreas(formData.industry);

      // Create self-type Trust Profile asset for the company
      const { data: existingSelf } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "self")
        .limit(1)
        .maybeSingle();

      if (!existingSelf) {
        await supabase.from("assets").insert({
          name: formData.name,
          asset_type: "self",
          description: "Vår egen Trust Profil – selverklæring og compliance-dokumentasjon",
          lifecycle_status: "active",
          compliance_score: 0,
        });
      }

      const suggestedRoles = suggestRolesForCompany({
        industry: formData.industry,
        employees: formData.employees,
        use_cases: formData.use_cases,
        team_size: formData.team_size,
      });

      if (suggestedRoles.length > 0) {
        const rolesToInsert = suggestedRoles.map(role => ({
          name: role.name,
          description: role.description,
          responsibilities: role.responsibilities,
        }));
        await supabase.from("roles").insert(rolesToInsert);
      }

      setStep("complete");
      setTimeout(() => { onComplete(); }, 1500);
    } catch (error) {
      console.error("Error saving company profile:", error);
      toast({ title: "Feil", description: "Kunne ikke lagre selskapsprofil", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const getStepNumber = () => {
    switch (step) {
      case "company": return 1;
      case "industry": return 2;
      case "size": return 3;
      case "key-persons": return 4;
      case "use-cases": return 5;
      case "team-size": return 6;
      case "complete": return 6;
    }
  };

  const suggestedRolesPreview = suggestRolesForCompany({
    industry: formData.industry,
    employees: formData.employees,
    use_cases: formData.use_cases,
    team_size: formData.team_size,
  });

  const industryLabel = industries.find(i => i.id === formData.industry)?.name || formData.industry;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Steg {getStepNumber()} av 6</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(getStepNumber() / 6) * 100}%` }}
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
              <p className="text-muted-foreground">La oss starte med litt informasjon om selskapet ditt</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Selskapsnavn *</Label>
                <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="F.eks. Eviny AS" className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org_number">Organisasjonsnummer</Label>
                <Input id="org_number" value={formData.org_number} onChange={(e) => setFormData({ ...formData, org_number: e.target.value })} placeholder="F.eks. 983052968" className="h-12" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="domain">Nettverksdomene (valgfritt)</Label>
                </div>
                <Input id="domain" value={formData.domain} onChange={(e) => handleDomainChange(e.target.value)} placeholder="f.eks. hult-it.no" className="h-12" />
                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <p>Vi bruker dometet til å analysere e-postsikkerhet og nettsidens sikkerhetsstatus.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Industry */}
        {step === "industry" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Hvilken bransje er dere i?</h1>
              <p className="text-muted-foreground">Vi tilpasser arbeidsområder og maler basert på bransjen din</p>
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
                      isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{industry.name}</p>
                      <p className="text-sm text-muted-foreground">{industry.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Tilbake</Button>
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Size & Maturity */}
        {step === "size" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Litt mer om dere</h1>
              <p className="text-muted-foreground">Dette hjelper oss å tilpasse anbefalingene våre</p>
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
                        formData.employees === range ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                      )}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Modenhetsnivå for compliance</Label>
                <RadioGroup value={formData.maturity} onValueChange={(value) => setFormData({ ...formData, maturity: value })}>
                  {maturityLevels.map((level) => (
                    <label
                      key={level.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                        formData.maturity === level.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
              <Button variant="ghost" onClick={handleBack}>Tilbake</Button>
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Key Persons */}
        {step === "key-persons" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Hvem har nøkkelrollene?</h1>
              <p className="text-muted-foreground">
                {formData.industry && formData.employees
                  ? `Basert på at dere er i ${industryLabel.toLowerCase()}-sektoren med ${formData.employees} ansatte, er følgende roller relevante`
                  : "Vi bruker dette til å tildele ansvar og tilpasse plattformen"}
              </p>
            </div>

            <KeyPersonnelSection
              industry={formData.industry}
              employees={formData.employees}
              data={keyPersonnel}
              onChange={setKeyPersonnel}
            />

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Tilbake</Button>
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Use Cases */}
        {step === "use-cases" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Hva skal dere bruke Mynder til?</h1>
              <p className="text-muted-foreground">Velg områdene som er relevante for dere (kan velge flere)</p>
            </div>

            <div className="grid gap-3">
              {useCaseOptions.map((useCase) => {
                const Icon = useCaseIcons[useCase.id] || Shield;
                const isSelected = formData.use_cases.includes(useCase.id);
                return (
                  <button
                    key={useCase.id}
                    onClick={() => toggleUseCase(useCase.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                      isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{useCase.name}</p>
                      <p className="text-sm text-muted-foreground">{useCase.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Tilbake</Button>
              <Button onClick={handleNext} size="lg" className="gap-2">
                Neste <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Step: Team Size */}
        {step === "team-size" && (
          <Card className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Hvor mange skal bruke Mynder?</h1>
              <p className="text-muted-foreground">Vi tilpasser roller og tilganger basert på teamstørrelsen</p>
            </div>

            <div className="grid gap-3">
              {teamSizeOptions.map((option) => {
                const isSelected = formData.team_size === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => setFormData({ ...formData, team_size: option.id })}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border text-left transition-all",
                      isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", isSelected ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.name}</p>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-primary" />}
                  </button>
                );
              })}
            </div>

            {suggestedRolesPreview.length > 0 && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  Mynder vil foreslå disse rollene:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedRolesPreview.map((role) => (
                    <span key={role.name} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-md">{role.name}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="ghost" onClick={handleBack}>Tilbake</Button>
              <Button onClick={handleNext} size="lg" disabled={isLoading}>
                {isLoading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Lagrer...</>) : "Fullfør oppsett"}
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
            <p className="text-muted-foreground">Vi setter opp arbeidsområdene og rollene dine...</p>
            {suggestedRolesPreview.length > 0 && (
              <div className="mt-4 text-sm text-muted-foreground">{suggestedRolesPreview.length} roller opprettet basert på dine valg</div>
            )}
            <div className="mt-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
          </Card>
        )}
      </div>
    </div>
  );
}
