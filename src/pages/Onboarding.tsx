import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Zap, Compass, Building2, Users, Briefcase, Shield, FileText, Cloud, Upload, CheckCircle2, Loader2, Rocket, PartyPopper, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type OnboardingStep = "intro" | "profile" | "frameworks" | "systems" | "policies" | "risk" | "complete";

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("intro");
  const [overallProgress, setOverallProgress] = useState(0);
  const [isLaraWorking, setIsLaraWorking] = useState(false);
  const [laraMessage, setLaraMessage] = useState("Klar til å hjelpe deg!");
  const [isAutopilot, setIsAutopilot] = useState(false);

  // Profile state
  const [companyName, setCompanyName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [employees, setEmployees] = useState("");
  const [industry, setIndustry] = useState("");
  const [maturity, setMaturity] = useState("");
  const [hasComplianceRole, setHasComplianceRole] = useState(false);

  // Frameworks state
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);

  // Systems state
  const [systemsFound, setSystemsFound] = useState(0);
  const [systemsProcessed, setSystemsProcessed] = useState(0);

  // Policies state
  const [generatedPolicies, setGeneratedPolicies] = useState<string[]>([]);

  const frameworks = [
    { id: "gdpr", name: "GDPR", icon: "🇪🇺", requirement: "Personvernpolicy + DPIA" },
    { id: "iso27001", name: "ISO 27001/27002", icon: "🛡️", requirement: "ISMS-dokumentasjon" },
    { id: "aiact", name: "AI Act", icon: "🤖", requirement: "AI-risikostyring" },
    { id: "nsm", name: "NSM Grunnprinsipper", icon: "🇳🇴", requirement: "Sikkerhetspolicyer" },
    { id: "nis2", name: "NIS 2", icon: "⚡", requirement: "Hendelseshåndtering" },
    { id: "cra", name: "CRA", icon: "🔐", requirement: "Produktsikkerhet" }
  ];

  const policies = [
    { id: "it-security", name: "IT-sikkerhetspolicy", icon: Shield },
    { id: "ai-policy", name: "AI-policy", icon: Sparkles },
    { id: "access-control", name: "Tilgangsstyringspolicy", icon: Users }
  ];

  const riskAreas = [
    { name: "Tilgangsstyring", icon: "🔒", score: 65, actions: ["Aktiver MFA-krav i policy", "Dokumenter tilgangsrettigheter"] },
    { name: "Leverandørkontroll", icon: "🤝", score: 72, actions: ["Send DPA-forespørsel til Mailchimp", "Oppdater leverandørregister"] },
    { name: "Hendelseshåndtering", icon: "⚡", score: 58, actions: ["Opprett hendelseshåndteringsplan", "Sett opp varslingssystem"] }
  ];

  const startAutopilot = async () => {
    setIsAutopilot(true);
    setIsLaraWorking(true);
    setLaraMessage("Analyserer virksomheten din...");
    setCurrentStep("profile");
    
    // Simulate AI processing
    setTimeout(() => {
      setOverallProgress(15);
      setLaraMessage("Fant informasjon fra Brønnøysund...");
      toast({
        title: "🤖 Lara jobber",
        description: "Henter virksomhetsinformasjon automatisk"
      });
    }, 1500);
  };

  const completeProfile = () => {
    setIsLaraWorking(true);
    setLaraMessage("Velger rammeverk basert på din bransje...");
    
    setTimeout(() => {
      setOverallProgress(30);
      setCurrentStep("frameworks");
      setIsLaraWorking(false);
      
      // Auto-select frameworks based on industry
      if (industry === "helse") {
        setSelectedFrameworks(["gdpr", "iso27001", "nsm"]);
      } else if (industry === "finans") {
        setSelectedFrameworks(["gdpr", "iso27001", "nis2"]);
      } else {
        setSelectedFrameworks(["gdpr", "iso27001"]);
      }
      
      toast({
        title: "✅ Profil opprettet",
        description: "Lara har tilpasset anbefalinger for din virksomhet"
      });
    }, 2000);
  };

  const completeFrameworks = () => {
    setIsLaraWorking(true);
    setLaraMessage("Søker etter systemer i bruk...");
    setOverallProgress(45);
    setCurrentStep("systems");
    
    setTimeout(() => {
      setSystemsFound(50);
      setIsLaraWorking(false);
      toast({
        title: "🔍 Systemer funnet",
        description: "Lara fant 50 systemer tilknyttet din virksomhet"
      });
    }, 2500);
  };

  const scanSystems = (method: string) => {
    setIsLaraWorking(true);
    setLaraMessage(`Skanner systemer via ${method}...`);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSystemsProcessed(Math.floor((progress / 100) * 50));
      
      if (progress >= 100) {
        clearInterval(interval);
        setIsLaraWorking(false);
        setOverallProgress(60);
        toast({
          title: "✅ Skanning fullført",
          description: "47/50 systemer har Trust Profiles"
        });
      }
    }, 300);
  };

  const completeSystems = () => {
    setCurrentStep("policies");
    setOverallProgress(70);
    
    // Auto-generate policies if in autopilot mode
    if (isAutopilot) {
      setIsLaraWorking(true);
      setLaraMessage("Genererer relevante policyer for din virksomhet...");
      
      // Generate all policies automatically with delays
      policies.forEach((policy, index) => {
        setTimeout(() => {
          setGeneratedPolicies(prev => [...prev, policy.id]);
          setOverallProgress(70 + ((index + 1) / policies.length) * 10);
          
          if (index === policies.length - 1) {
            setIsLaraWorking(false);
            toast({
              title: "✅ Policyer generert",
              description: "Alle relevante policyer er klare for gjennomgang"
            });
          }
        }, (index + 1) * 1500);
      });
    }
  };

  const generatePolicy = (policyId: string, policyName: string) => {
    setIsLaraWorking(true);
    setLaraMessage(`Genererer ${policyName}...`);
    
    setTimeout(() => {
      setGeneratedPolicies([...generatedPolicies, policyId]);
      setIsLaraWorking(false);
      setOverallProgress(overallProgress + 5);
      
      toast({
        title: "📄 Policy generert",
        description: `${policyName} er klar for gjennomgang`
      });
    }, 2000);
  };

  const completePolicies = () => {
    setCurrentStep("risk");
    setOverallProgress(85);
  };

  const completeRisk = () => {
    setIsLaraWorking(true);
    setLaraMessage("Ferdigstiller oppsettet...");
    
    setTimeout(() => {
      setOverallProgress(100);
      setCurrentStep("complete");
      setIsLaraWorking(false);
    }, 1500);
  };

  const goBack = () => {
    const stepOrder: OnboardingStep[] = ["intro", "profile", "frameworks", "systems", "policies", "risk", "complete"];
    const currentIndex = stepOrder.indexOf(currentStep);
    
    if (currentIndex > 0) {
      const previousStep = stepOrder[currentIndex - 1];
      setCurrentStep(previousStep);
      
      // Adjust progress based on step
      const progressMap: Record<OnboardingStep, number> = {
        intro: 0,
        profile: 0,
        frameworks: 30,
        systems: 45,
        policies: 60,
        risk: 85,
        complete: 100
      };
      setOverallProgress(progressMap[previousStep]);
    }
  };

  const goToDashboard = () => {
    toast({
      title: "🎉 Velkommen til Mynder!",
      description: "Du er nå 70% compliant"
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar - Always Visible */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Lara</span>
              {isLaraWorking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            </div>
            <div className="text-sm text-muted-foreground">{overallProgress}% ferdig</div>
          </div>
          <Progress value={overallProgress} className="h-2" />
          {isLaraWorking && (
            <p className="text-xs text-muted-foreground mt-2 animate-pulse">{laraMessage}</p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero / Intro */}
        {currentStep === "intro" && (
          <div className="space-y-8 animate-fade-in">
            <div className="text-center space-y-4 py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <Rocket className="w-4 h-4" />
                Virksomhetskonfigurasjon
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Bli 70% compliant på 30 minutter
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Med Lara som din AI-partner
              </p>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Fortell oss litt om virksomheten din – Lara konfigurerer alt automatisk.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary" onClick={startAutopilot}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>La Lara gjøre det for meg</CardTitle>
                      <CardDescription>Autopilot-modus</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Raskeste vei til compliance. Lara setter opp alt automatisk basert på din virksomhet.
                  </p>
                  <Badge className="mt-4" variant="secondary">⚡ Anbefalt for SMB</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary" onClick={() => setCurrentStep("profile")}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Compass className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <div>
                      <CardTitle>Tilpass manuelt</CardTitle>
                      <CardDescription>Full kontroll</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Velg selv hvilket innhold og rammeverk som passer best for din organisasjon.
                  </p>
                  <Badge className="mt-4" variant="outline">🧭 Best for Enterprise</Badge>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Profile */}
        {currentStep === "profile" && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Hvem er dere?</h2>
              <p className="text-muted-foreground">Lara tilpasser alt basert på din virksomhet</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Grunnprofil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Bedriftsnavn</Label>
                    <Input
                      id="companyName"
                      placeholder="Din bedrift AS"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                    <Input
                      id="orgNumber"
                      placeholder="123 456 789"
                      value={orgNumber}
                      onChange={(e) => setOrgNumber(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="employees">Antall ansatte</Label>
                    <Select value={employees} onValueChange={setEmployees}>
                      <SelectTrigger id="employees">
                        <SelectValue placeholder="Velg antall" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10</SelectItem>
                        <SelectItem value="11-50">11-50</SelectItem>
                        <SelectItem value="51-200">51-200</SelectItem>
                        <SelectItem value="201-1000">201-1000</SelectItem>
                        <SelectItem value="1000+">1000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Bransje</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger id="industry">
                        <SelectValue placeholder="Velg bransje" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="helse">Helse</SelectItem>
                        <SelectItem value="finans">Finans</SelectItem>
                        <SelectItem value="energi">Energi</SelectItem>
                        <SelectItem value="saas">SaaS</SelectItem>
                        <SelectItem value="offentlig">Offentlig</SelectItem>
                        <SelectItem value="annet">Annet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maturity">Beskriv modenhet</Label>
                  <Select value={maturity} onValueChange={setMaturity}>
                    <SelectTrigger id="maturity">
                      <SelectValue placeholder="Velg modennivå" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingen">Ingen struktur</SelectItem>
                      <SelectItem value="grunnleggende">Grunnleggende</SelectItem>
                      <SelectItem value="iso">ISO-sertifisert</SelectItem>
                      <SelectItem value="avansert">Avansert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="complianceRole"
                    checked={hasComplianceRole}
                    onCheckedChange={(checked) => setHasComplianceRole(checked as boolean)}
                  />
                  <Label htmlFor="complianceRole" className="cursor-pointer">
                    Har dere egen compliance-rolle? (DPO, CISO, IT-ansvarlig)
                  </Label>
                </div>

                <Button onClick={completeProfile} className="w-full" disabled={!companyName || !industry}>
                  Fortsett til rammeverk
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Frameworks */}
        {currentStep === "frameworks" && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Rammeverk & Kilder</h2>
              <p className="text-muted-foreground">Velg hvilke standarder som gjelder for dere</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {frameworks.map((framework) => (
                <Card
                  key={framework.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedFrameworks.includes(framework.id)
                      ? "border-2 border-primary bg-primary/5"
                      : "border hover:border-primary/50"
                  }`}
                  onClick={() => {
                    if (selectedFrameworks.includes(framework.id)) {
                      setSelectedFrameworks(selectedFrameworks.filter(id => id !== framework.id));
                    } else {
                      setSelectedFrameworks([...selectedFrameworks, framework.id]);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{framework.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{framework.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {framework.requirement}
                          </CardDescription>
                        </div>
                      </div>
                      {selectedFrameworks.includes(framework.id) && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Last opp eksisterende dokumenter
                </CardTitle>
                <CardDescription>
                  Har dere policyer eller DPA-avtaler? Lara analyserer dem automatisk.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Dra og slipp filer her, eller klikk for å velge</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, eller CSV</p>
                </div>
              </CardContent>
            </Card>

            <Button onClick={completeFrameworks} className="w-full" disabled={selectedFrameworks.length === 0}>
              Fortsett til systemer
            </Button>
          </div>
        )}

        {/* Systems */}
        {currentStep === "systems" && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Systemer & Leverandører</h2>
              <p className="text-muted-foreground">Lara finner systemene dine automatisk</p>
            </div>

            {systemsFound > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <div>
                        <p className="font-semibold">{systemsFound} systemer funnet</p>
                        <p className="text-sm text-muted-foreground">
                          {systemsProcessed}/{systemsFound} prosessert
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">🔍 12 mangler DPA</p>
                      <p className="text-muted-foreground">🛡️ 8 er ISO-sertifisert</p>
                    </div>
                  </div>
                  {systemsProcessed < systemsFound && (
                    <Progress value={(systemsProcessed / systemsFound) * 100} className="h-2" />
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => scanSystems("firmakort")}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Firmakort
                  </CardTitle>
                  <CardDescription>Hent automatisk via Visa/Mastercard</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">🪄 Autopilot</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => scanSystems("domene")}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cloud className="w-5 h-5" />
                    Domene
                  </CardTitle>
                  <CardDescription>Søk via DNS og SaaS-oppdager</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">🌐 Smart skanning</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-all cursor-pointer" onClick={() => scanSystems("import")}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Importer
                  </CardTitle>
                  <CardDescription>Last opp CSV/Excel liste</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">📄 Manuell</Badge>
                </CardContent>
              </Card>
            </div>

            <Button onClick={completeSystems} className="w-full" disabled={systemsProcessed === 0}>
              Fortsett til policyer
            </Button>
          </div>
        )}

        {/* Policies */}
        {currentStep === "policies" && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Policy-generator</h2>
              <p className="text-muted-foreground">Lara lager skreddersydde policyer for din virksomhet</p>
            </div>

            {isAutopilot && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">📋 Oppgave: Gjennomgang av policyer</h3>
                        <p className="text-sm text-muted-foreground">
                          Lara har generert {generatedPolicies.length}/{policies.length} relevante policyer basert på din virksomhet og valgte rammeverk.
                        </p>
                      </div>
                      <div className="bg-background/60 rounded-lg p-4 space-y-2">
                        <p className="text-sm font-medium">Din neste handling:</p>
                        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Les over de genererte policyene</li>
                          <li>Rediger innholdet hvis nødvendig</li>
                          <li>Godkjenn når du er fornøyd</li>
                        </ul>
                      </div>
                      {generatedPolicies.length === policies.length && (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Alle policyer generert
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {policies.map((policy) => {
                const Icon = policy.icon;
                const isGenerated = generatedPolicies.includes(policy.id);
                
                return (
                  <Card key={policy.id} className={isGenerated ? "bg-primary/5 border-primary/20" : ""}>
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                      </div>
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <CardDescription>
                        Tilpasset for {industry || "din bransje"} og {employees || "virksomhetsstørrelse"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isGenerated ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Policy generert og klar</span>
                          </div>
                          <Button variant="outline" size="sm" className="w-full">
                            Gjennomgå policy
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => generatePolicy(policy.id, policy.name)}
                          className="w-full"
                          disabled={isLaraWorking || isAutopilot}
                        >
                          {isAutopilot ? "Genereres..." : "Generer policy"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Button
              onClick={completePolicies}
              className="w-full"
              disabled={generatedPolicies.length === 0}
            >
              Fortsett til risikoanalyse
            </Button>
          </div>
        )}

        {/* Risk Analysis */}
        {currentStep === "risk" && (
          <div className="space-y-6 animate-fade-in">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tilbake
            </Button>
            
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-bold">Første Risiko- og Tiltaksanalyse</h2>
              <p className="text-muted-foreground">Lara har identifisert dine viktigste områder</p>
            </div>

            <div className="grid gap-4">
              {riskAreas.map((area, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{area.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{area.name}</CardTitle>
                          <CardDescription>Score: {area.score}%</CardDescription>
                        </div>
                      </div>
                      <Badge variant={area.score >= 70 ? "default" : "destructive"}>
                        {area.score >= 70 ? "God" : "Forbedring nødvendig"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Progress value={area.score} className="h-2" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Anbefalte tiltak:</p>
                      {area.actions.map((action, actionIndex) => (
                        <div key={actionIndex} className="flex items-start gap-2 text-sm">
                          <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{action}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={completeRisk} className="w-full">
              Fullfør oppsett
            </Button>
          </div>
        )}

        {/* Complete */}
        {currentStep === "complete" && (
          <div className="space-y-6 animate-fade-in text-center py-12">
            <div className="inline-block p-6 rounded-full bg-primary/10 mb-4 animate-scale-in">
              <PartyPopper className="w-16 h-16 text-primary" />
            </div>
            
            <h2 className="text-4xl font-bold">Du er 70% compliant!</h2>
            <p className="text-xl text-muted-foreground">På 30 minutter. Lara holder deg oppdatert automatisk.</p>

            <Card className="max-w-2xl mx-auto text-left">
              <CardHeader>
                <CardTitle>Sjekkliste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Grunnprofil opprettet</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{systemsFound} systemer funnet</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>{generatedPolicies.length} policyer publisert</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Tiltak aktivert</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                  <span>Første Trust Profile delt</span>
                </div>
              </CardContent>
            </Card>

            <Button onClick={goToDashboard} size="lg" className="text-lg px-8">
              Gå til Dashboard →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
