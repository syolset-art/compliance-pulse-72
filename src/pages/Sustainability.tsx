import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Zap, 
  Compass, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  TrendingUp, 
  Users, 
  Building2,
  Target,
  BarChart3,
  FileCheck,
  Sparkles,
  Download,
  Share2
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type SetupMode = "autopilot" | "manual" | null;
type Step = "intro" | "profile" | "data" | "policies" | "goals" | "report" | "complete";

const Sustainability = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isLaraWorking, setIsLaraWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  
  // Form state
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [maturityLevel, setMaturityLevel] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  
  // Data collection state
  const [dataProgress, setDataProgress] = useState(0);
  const [dataCollected, setDataCollected] = useState({
    energy: false,
    documents: false,
    suppliers: false,
    public: false
  });

  // Policies state
  const [policiesGenerated, setPoliciesGenerated] = useState({
    environment: false,
    social: false,
    governance: false
  });

  const handleModeSelection = (mode: SetupMode) => {
    setSetupMode(mode);
    setCurrentStep("profile");
    if (mode === "autopilot") {
      toast({
        title: "Lara er klar! ⚡️",
        description: "Jeg vil guide deg gjennom hele prosessen",
      });
    }
  };

  const handleProfileSubmit = () => {
    if (!companySize || !industry || !maturityLevel) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst fyll ut alle feltene",
        variant: "destructive"
      });
      return;
    }

    setProgress(20);
    setEstimatedMinutes(25);
    setCurrentStep("data");

    if (setupMode === "autopilot") {
      toast({
        title: "Profil lagret! 🎯",
        description: "Nå henter jeg relevante data for deg...",
      });
      startDataCollection();
    }
  };

  const startDataCollection = async () => {
    setIsLaraWorking(true);
    setDataProgress(0);

    // Simulate data collection
    const dataSteps = [
      { key: "energy" as const, name: "Energiforbruk", delay: 2000 },
      { key: "documents" as const, name: "Miljøpolicy", delay: 3000 },
      { key: "suppliers" as const, name: "40 leverandører", delay: 4000 },
      { key: "public" as const, name: "Offentlige registre", delay: 2500 }
    ];

    for (let i = 0; i < dataSteps.length; i++) {
      const step = dataSteps[i];
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setDataCollected(prev => ({ ...prev, [step.key]: true }));
      setDataProgress((i + 1) * 25);
      toast({
        title: `✅ ${step.name} funnet`,
        description: "Data hentet og analysert"
      });
    }

    setProgress(45);
    setEstimatedMinutes(15);
    setIsLaraWorking(false);
    
    toast({
      title: "Datainnhenting fullført! 📊",
      description: "Nå genererer jeg policyer basert på dataene...",
    });

    setTimeout(() => {
      setCurrentStep("policies");
      if (setupMode === "autopilot") {
        startPolicyGeneration();
      }
    }, 1000);
  };

  const startPolicyGeneration = async () => {
    setIsLaraWorking(true);

    const policies = [
      { key: "environment" as const, name: "Miljøpolicy", delay: 3000 },
      { key: "social" as const, name: "Sosial policy", delay: 3500 },
      { key: "governance" as const, name: "Styringspolicy", delay: 2500 }
    ];

    for (const policy of policies) {
      await new Promise(resolve => setTimeout(resolve, policy.delay));
      setPoliciesGenerated(prev => ({ ...prev, [policy.key]: true }));
      toast({
        title: `✅ ${policy.name} generert`,
        description: "Klar for gjennomgang"
      });
    }

    setProgress(70);
    setEstimatedMinutes(8);
    setIsLaraWorking(false);
    
    toast({
      title: "Policyer ferdig! 📄",
      description: "Nå analyserer jeg og lager mål og nøkkeltall...",
    });

    setTimeout(() => {
      setCurrentStep("goals");
      if (setupMode === "autopilot") {
        analyzeImpact();
      }
    }, 1000);
  };

  const analyzeImpact = async () => {
    setIsLaraWorking(true);
    
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    setProgress(90);
    setEstimatedMinutes(3);
    setIsLaraWorking(false);

    toast({
      title: "Analyse fullført! 📈",
      description: "Nå genererer jeg rapporten din...",
    });

    setTimeout(() => {
      setCurrentStep("report");
      if (setupMode === "autopilot") {
        generateReport();
      }
    }, 1000);
  };

  const generateReport = async () => {
    setIsLaraWorking(true);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setProgress(100);
    setEstimatedMinutes(0);
    setIsLaraWorking(false);
    setCurrentStep("complete");

    toast({
      title: "🎉 Gratulerer!",
      description: "Bærekraftsrapporten din er klar!",
    });
  };

  const renderIntroStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <Leaf className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Kartlegg bærekraften din på 3 minutter 🌍
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Lara, din AI-partner, hjelper deg å hente data, lage policyer og sette mål – tilpasset din bransje og kompetansenivå.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => handleModeSelection("autopilot")}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Zap className="h-8 w-8 text-primary" />
              <Badge className="bg-primary">Anbefalt</Badge>
            </div>
            <CardTitle>La Lara gjøre jobben ⚡️</CardTitle>
            <CardDescription>
              Autopilot-modus. Lara gjør alt arbeidet for deg og ber deg bare om å godkjenne underveis.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Automatisk datainnhenting
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                AI-genererte policyer
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Ferdig på 3 minutter
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer transition-all hover:shadow-lg hover:border-primary"
          onClick={() => handleModeSelection("manual")}
        >
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Compass className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Tilpass selv 🧭</CardTitle>
            <CardDescription>
              Manuell konfigurasjon. Du har full kontroll over hver del av prosessen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Detaljert kontroll
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Tilpass alt selv
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Fleksibel tidsramme
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Grunnprofil for bærekraft</h2>
        <p className="text-muted-foreground">
          {setupMode === "autopilot" 
            ? "Lara tilpasser spørsmålene til din bransje og størrelse" 
            : "Fyll ut informasjon om din virksomhet"}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="size">Virksomhetsstørrelse</Label>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger>
                <SelectValue placeholder="Velg størrelse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smb">SMB (1-250 ansatte)</SelectItem>
                <SelectItem value="enterprise">Enterprise (250+ ansatte)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="industry">Bransje</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger>
                <SelectValue placeholder="Velg bransje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manufacturing">Produksjon</SelectItem>
                <SelectItem value="service">Tjeneste</SelectItem>
                <SelectItem value="finance">Finans</SelectItem>
                <SelectItem value="public">Offentlig</SelectItem>
                <SelectItem value="other">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maturity">Modenhetsnivå</Label>
            <Select value={maturityLevel} onValueChange={setMaturityLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Velg nivå" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen strategi</SelectItem>
                <SelectItem value="beginning">Begynnende</SelectItem>
                <SelectItem value="established">Etablert</SelectItem>
                <SelectItem value="reporting">Rapporterende</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Roller (valgfritt)</Label>
            <div className="space-y-2">
              {["HMS-ansvarlig", "Bærekraftsansvarlig", "Ledergruppe"].map((role) => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox 
                    checked={roles.includes(role)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setRoles([...roles, role]);
                      } else {
                        setRoles(roles.filter(r => r !== role));
                      }
                    }}
                  />
                  <span className="text-sm text-foreground">{role}</span>
                </div>
              ))}
            </div>
          </div>

          {setupMode === "autopilot" && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Jeg tilpasser spørsmålene til din bransje og størrelse
                </p>
              </div>
            </div>
          )}

          <Button onClick={handleProfileSubmit} className="w-full" size="lg">
            Fortsett
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderDataStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Automatisk datainnhenting</h2>
        <p className="text-muted-foreground">
          Lara henter og kombinerer data fra flere kilder
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${dataCollected.energy ? 'bg-green-500/10' : 'bg-muted'}`}>
              {dataCollected.energy ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Energiforbruk</p>
                <p className="text-sm text-muted-foreground">Regnskapssystem og strømregninger</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${dataCollected.documents ? 'bg-green-500/10' : 'bg-muted'}`}>
              {dataCollected.documents ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Miljøpolicy</p>
                <p className="text-sm text-muted-foreground">Eksisterende dokumenter</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${dataCollected.suppliers ? 'bg-green-500/10' : 'bg-muted'}`}>
              {dataCollected.suppliers ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">40 leverandører analysert</p>
                <p className="text-sm text-muted-foreground">Mynder Trust Profiles (Scope 3)</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${dataCollected.public ? 'bg-green-500/10' : 'bg-muted'}`}>
              {dataCollected.public ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Offentlige registre</p>
                <p className="text-sm text-muted-foreground">SSB, Brønnøysund, Miljøfyrtårn</p>
              </div>
            </div>
          </div>

          <Progress value={dataProgress} className="h-2" />

          {setupMode === "manual" && dataProgress === 0 && (
            <Button onClick={startDataCollection} className="w-full" size="lg">
              Start datainnhenting
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPoliciesStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Policyer og tiltak</h2>
        <p className="text-muted-foreground">
          Lara genererer tilpassede policyer basert på din profil
        </p>
      </div>

      <div className="grid gap-4">
        <Card className={policiesGenerated.environment ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Leaf className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Miljøpolicy</CardTitle>
              </div>
              {policiesGenerated.environment && (
                <Badge className="bg-green-500">Generert</Badge>
              )}
            </div>
            <CardDescription>Energi, avfall, transport</CardDescription>
          </CardHeader>
          <CardContent>
            {policiesGenerated.environment ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Policy generert basert på din bransje og størrelse. Inkluderer retningslinjer for energiforbruk, avfallshåndtering og transport.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Se policy
                  </Button>
                  <Button size="sm">Godkjenn og publiser</Button>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={policiesGenerated.social ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Sosial policy</CardTitle>
              </div>
              {policiesGenerated.social && (
                <Badge className="bg-green-500">Generert</Badge>
              )}
            </div>
            <CardDescription>Likestilling, HMS, arbeidsvilkår</CardDescription>
          </CardHeader>
          <CardContent>
            {policiesGenerated.social ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Policy for sosiale forhold inkludert likestilling, HMS-rutiner og arbeidsvilkår.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Se policy
                  </Button>
                  <Button size="sm">Godkjenn og publiser</Button>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={policiesGenerated.governance ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Styringspolicy</CardTitle>
              </div>
              {policiesGenerated.governance && (
                <Badge className="bg-green-500">Generert</Badge>
              )}
            </div>
            <CardDescription>Anti-korrupsjon, etisk innkjøp</CardDescription>
          </CardHeader>
          <CardContent>
            {policiesGenerated.governance ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Styring og etikk inkludert anti-korrupsjonstiltak og etiske innkjøpsrutiner.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Se policy
                  </Button>
                  <Button size="sm">Godkjenn og publiser</Button>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Mål, nøkkeltall og risikoanalyse</h2>
        <p className="text-muted-foreground">
          Lara analyserer og visualiserer dine bærekraftsindikatorer
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              CO₂-utslipp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scope 1</span>
                <span className="font-semibold">45 tonn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scope 2</span>
                <span className="font-semibold">120 tonn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Scope 3</span>
                <span className="font-semibold">280 tonn</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Nøkkeltall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Energibruk</span>
                <span className="font-semibold">450 MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Kjønnslikestilling</span>
                <span className="font-semibold">48/52%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Sykefravær</span>
                <span className="font-semibold">3.2%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risikokart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
              <span className="font-medium text-foreground">Transport og logistikk</span>
              <Badge variant="destructive">Høy risiko</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <span className="font-medium text-foreground">Leverandørkjede</span>
              <Badge className="bg-yellow-500">Medium risiko</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <span className="font-medium text-foreground">Energiforbruk</span>
              <Badge className="bg-green-500">Lav risiko</Badge>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Basert på energibruk og leverandørkjede er hovedrisikoen knyttet til transport.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {setupMode === "manual" && (
        <Button onClick={analyzeImpact} className="w-full" size="lg">
          Fortsett til rapport
        </Button>
      )}
    </div>
  );

  const renderReportStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Rapportgenerering</h2>
        <p className="text-muted-foreground">
          Lara setter sammen din komplette bærekraftsrapport
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-3">
            {isLaraWorking ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            <p className="font-medium text-foreground">Genererer CSRD/ESRS-rapport...</p>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {setupMode === "manual" && !isLaraWorking && (
        <Button onClick={generateReport} className="w-full" size="lg">
          Generer rapport
        </Button>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          🎉 Du er 70% klar for bærekraftsrapportering!
        </h1>
        <p className="text-lg text-muted-foreground">
          På 3 minutter med Lara
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Din bærekraftsrapport er klar</CardTitle>
          <CardDescription>Last ned eller del direkte</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button className="flex-1" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Last ned PDF
            </Button>
            <Button variant="outline" className="flex-1" size="lg">
              <Share2 className="h-5 w-5 mr-2" />
              Del rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neste steg</CardTitle>
          <CardDescription>Anbefalte handlinger for videre arbeid</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Sett klimamål for 2025</p>
                <p className="text-sm text-muted-foreground">Definer konkrete reduksjonsmål</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Aktiver leverandørspørsmål</p>
                <p className="text-sm text-muted-foreground">Kartlegg Scope 3 mer detaljert</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Planlegg årlig bærekraftsrevisjon</p>
                <p className="text-sm text-muted-foreground">Sett opp automatisk oppfølging</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="outline" onClick={() => navigate("/")} className="flex-1" size="lg">
          Gå til Dashboard
        </Button>
        <Button onClick={() => window.location.reload()} className="flex-1" size="lg">
          Start ny kartlegging
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-8">
          {/* Header with progress */}
          {currentStep !== "intro" && currentStep !== "complete" && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Leaf className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Lara</span>
                  {isLaraWorking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </div>
                <div className="text-sm text-muted-foreground">
                  {progress}% ferdig • ca. {estimatedMinutes} min igjen
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Step content */}
          {currentStep === "intro" && renderIntroStep()}
          {currentStep === "profile" && renderProfileStep()}
          {currentStep === "data" && renderDataStep()}
          {currentStep === "policies" && renderPoliciesStep()}
          {currentStep === "goals" && renderGoalsStep()}
          {currentStep === "report" && renderReportStep()}
          {currentStep === "complete" && renderCompleteStep()}
        </div>
      </main>
    </div>
  );
};

export default Sustainability;
