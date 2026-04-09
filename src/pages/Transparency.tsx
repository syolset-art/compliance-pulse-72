import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Zap, 
  Compass, 
  CheckCircle2, 
  Loader2, 
  TrendingUp, 
  Users, 
  Building2,
  AlertTriangle,
  Shield,
  Globe,
  Sparkles,
  Download,
  Share2,
  Search,
  MapPin
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

type SetupMode = "autopilot" | "manual" | null;
type Step = "intro" | "profile" | "suppliers" | "risk" | "actions" | "report" | "complete";

const Transparency = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [setupMode, setSetupMode] = useState<SetupMode>(null);
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isLaraWorking, setIsLaraWorking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  
  // Form state
  const [companySize, setCompanySize] = useState("");
  const [industry, setIndustry] = useState("");
  const [supplierCount, setSupplierCount] = useState("");
  const [internationalSuppliers, setInternationalSuppliers] = useState(false);
  
  // Supplier analysis state
  const [supplierProgress, setSupplierProgress] = useState(0);
  const [suppliersAnalyzed, setSuppliersAnalyzed] = useState({
    mapped: false,
    assessed: false,
    categorized: false,
    documented: false
  });

  // Risk assessment state
  const [risksIdentified, setRisksIdentified] = useState({
    humanRights: false,
    laborRights: false,
    environment: false,
    corruption: false
  });

  // Actions state
  const [actionsPlanned, setActionsPlanned] = useState({
    policies: false,
    dueDiligence: false,
    monitoring: false,
    reporting: false
  });

  const handleModeSelection = (mode: SetupMode) => {
    setSetupMode(mode);
    setCurrentStep("profile");
    if (mode === "autopilot") {
      toast({
        title: "Lara er klar! ⚡️",
        description: "Jeg vil guide deg gjennom Åpenhetsloven-rapporteringen",
      });
    }
  };

  const handleProfileSubmit = () => {
    if (!companySize || !industry || !supplierCount) {
      toast({
        title: "Manglende informasjon",
        description: "Vennligst fyll ut alle feltene",
        variant: "destructive"
      });
      return;
    }

    setProgress(15);
    setEstimatedMinutes(20);
    setCurrentStep("suppliers");

    if (setupMode === "autopilot") {
      toast({
        title: "Profil lagret! 🎯",
        description: "Nå kartlegger jeg leverandørkjeden din...",
      });
      startSupplierAnalysis();
    }
  };

  const startSupplierAnalysis = async () => {
    setIsLaraWorking(true);
    setSupplierProgress(0);

    const steps = [
      { key: "mapped" as const, name: "Leverandører kartlagt", delay: 3000 },
      { key: "assessed" as const, name: "Risikovurdering utført", delay: 3500 },
      { key: "categorized" as const, name: "Kategorisering ferdig", delay: 2500 },
      { key: "documented" as const, name: "Dokumentasjon hentet", delay: 2000 }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await new Promise(resolve => setTimeout(resolve, step.delay));
      setSuppliersAnalyzed(prev => ({ ...prev, [step.key]: true }));
      setSupplierProgress((i + 1) * 25);
      toast({
        title: `✅ ${step.name}`,
        description: "Analyse fullført"
      });
    }

    setProgress(40);
    setEstimatedMinutes(12);
    setIsLaraWorking(false);
    
    toast({
      title: "Leverandøranalyse fullført! 🔍",
      description: "Nå identifiserer jeg risikoområder...",
    });

    setTimeout(() => {
      setCurrentStep("risk");
      if (setupMode === "autopilot") {
        assessRisks();
      }
    }, 1000);
  };

  const assessRisks = async () => {
    setIsLaraWorking(true);

    const risks = [
      { key: "humanRights" as const, name: "Menneskerettigheter", delay: 2500 },
      { key: "laborRights" as const, name: "Arbeidsrettigheter", delay: 2000 },
      { key: "environment" as const, name: "Miljørisiko", delay: 2000 },
      { key: "corruption" as const, name: "Korrupsjon", delay: 1500 }
    ];

    for (const risk of risks) {
      await new Promise(resolve => setTimeout(resolve, risk.delay));
      setRisksIdentified(prev => ({ ...prev, [risk.key]: true }));
      toast({
        title: `✅ ${risk.name} vurdert`,
        description: "Risikoanalyse ferdig"
      });
    }

    setProgress(65);
    setEstimatedMinutes(7);
    setIsLaraWorking(false);
    
    toast({
      title: "Risikovurdering fullført! 🛡️",
      description: "Nå planlegger jeg tiltak og aktsomhetsvurderinger...",
    });

    setTimeout(() => {
      setCurrentStep("actions");
      if (setupMode === "autopilot") {
        planActions();
      }
    }, 1000);
  };

  const planActions = async () => {
    setIsLaraWorking(true);

    const actions = [
      { key: "policies" as const, name: "Policyer opprettet", delay: 2500 },
      { key: "dueDiligence" as const, name: "Aktsomhetsvurdering", delay: 3000 },
      { key: "monitoring" as const, name: "Overvåkingsplan", delay: 2000 },
      { key: "reporting" as const, name: "Rapporteringsrutiner", delay: 2000 }
    ];

    for (const action of actions) {
      await new Promise(resolve => setTimeout(resolve, action.delay));
      setActionsPlanned(prev => ({ ...prev, [action.key]: true }));
      toast({
        title: `✅ ${action.name}`,
        description: "Plan ferdig"
      });
    }

    setProgress(85);
    setEstimatedMinutes(3);
    setIsLaraWorking(false);

    toast({
      title: "Tiltaksplan ferdig! 📋",
      description: "Nå genererer jeg Åpenhetsloven-rapporten...",
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
      description: "Åpenhetsloven-rapporten din er klar!",
    });
  };

  const renderIntroStep = () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          Rapporter på Åpenhetsloven på 25 minutter 🛡️
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Lara hjelper deg med aktsomhetsvurderinger, leverandørkartlegging og menneskerettighetsanalyse – tilpasset din bransje og leverandørkjede.
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
              Autopilot-modus. Lara kartlegger leverandører, vurderer risiko og lager rapport automatisk.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Automatisk leverandørkartlegging
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                AI-drevet risikovurdering
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Ferdig på 25 minutter
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
              Manuell konfigurasjon. Du styrer hver del av aktsomhetsvurderingen selv.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Full kontroll over prosessen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Detaljert tilpasning
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Kartlegg virksomheten din</h2>
        <p className="text-muted-foreground">
          {setupMode === "autopilot" 
            ? "Lara tilpasser analysen til din bransje og leverandørkjede" 
            : "Gi oss informasjon om din virksomhet"}
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
                <SelectItem value="small">Liten (1-50 ansatte)</SelectItem>
                <SelectItem value="medium">Medium (51-250 ansatte)</SelectItem>
                <SelectItem value="large">Stor (250+ ansatte)</SelectItem>
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
                <SelectItem value="retail">Detaljhandel</SelectItem>
                <SelectItem value="manufacturing">Produksjon</SelectItem>
                <SelectItem value="textile">Tekstil og klær</SelectItem>
                <SelectItem value="food">Mat og drikke</SelectItem>
                <SelectItem value="tech">Teknologi</SelectItem>
                <SelectItem value="construction">Bygg og anlegg</SelectItem>
                <SelectItem value="other">Annet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suppliers">Antall leverandører</Label>
            <Select value={supplierCount} onValueChange={setSupplierCount}>
              <SelectTrigger>
                <SelectValue placeholder="Velg antall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="few">1-10 leverandører</SelectItem>
                <SelectItem value="medium">11-50 leverandører</SelectItem>
                <SelectItem value="many">51-200 leverandører</SelectItem>
                <SelectItem value="extensive">200+ leverandører</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="international"
              checked={internationalSuppliers}
              onChange={(e) => setInternationalSuppliers(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="international" className="text-sm text-foreground">
              Jeg har internasjonale leverandører
            </label>
          </div>

          {setupMode === "autopilot" && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Jeg fokuserer på høyrisikoland og bransjer med kjent utfordringer
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

  const renderSuppliersStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Leverandørkartlegging</h2>
        <p className="text-muted-foreground">
          Lara analyserer og kategoriserer din leverandørkjede
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${suppliersAnalyzed.mapped ? 'bg-blue-500/10' : 'bg-muted'}`}>
              {suppliersAnalyzed.mapped ? (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Leverandører kartlagt</p>
                <p className="text-sm text-muted-foreground">Identifisert 47 leverandører</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${suppliersAnalyzed.assessed ? 'bg-blue-500/10' : 'bg-muted'}`}>
              {suppliersAnalyzed.assessed ? (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Risikovurdering utført</p>
                <p className="text-sm text-muted-foreground">Mynder Trust Profiles og offentlige data</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${suppliersAnalyzed.categorized ? 'bg-blue-500/10' : 'bg-muted'}`}>
              {suppliersAnalyzed.categorized ? (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Kategorisering ferdig</p>
                <p className="text-sm text-muted-foreground">Høy, medium og lav risiko</p>
              </div>
            </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${suppliersAnalyzed.documented ? 'bg-blue-500/10' : 'bg-muted'}`}>
              {suppliersAnalyzed.documented ? (
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
              ) : (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
              <div className="flex-1">
                <p className="font-medium text-foreground">Dokumentasjon hentet</p>
                <p className="text-sm text-muted-foreground">Kontrakter og sertifiseringer</p>
              </div>
            </div>
          </div>

          <Progress value={supplierProgress} className="h-2" />

          {setupMode === "manual" && supplierProgress === 0 && (
            <Button onClick={startSupplierAnalysis} className="w-full" size="lg">
              Start leverandøranalyse
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderRiskStep = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Risikovurdering</h2>
        <p className="text-muted-foreground">
          Lara identifiserer risikoområder i din leverandørkjede
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className={risksIdentified.humanRights ? 'border-yellow-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">Menneskerettigheter</CardTitle>
              </div>
              {risksIdentified.humanRights && (
                <Badge className="bg-yellow-500">Vurdert</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {risksIdentified.humanRights ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Høyrisiko leverandører</span>
                  <span className="font-semibold text-yellow-600">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hovedland</span>
                  <span className="font-semibold">Bangladesh, Kina</span>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={risksIdentified.laborRights ? 'border-orange-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Arbeidsrettigheter</CardTitle>
              </div>
              {risksIdentified.laborRights && (
                <Badge className="bg-orange-500">Vurdert</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {risksIdentified.laborRights ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risikoområder</span>
                  <span className="font-semibold text-orange-600">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Arbeidstid/lønn</span>
                  <span className="font-semibold">Medium risiko</span>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={risksIdentified.environment ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Miljørisiko</CardTitle>
              </div>
              {risksIdentified.environment && (
                <Badge className="bg-green-500">Vurdert</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {risksIdentified.environment ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Høyrisiko</span>
                  <span className="font-semibold text-green-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Utslipp/kjemi</span>
                  <span className="font-semibold">Under oppfølging</span>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={risksIdentified.corruption ? 'border-red-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <CardTitle className="text-lg">Korrupsjon</CardTitle>
              </div>
              {risksIdentified.corruption && (
                <Badge className="bg-red-500">Vurdert</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {risksIdentified.corruption ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Høyrisiko land</span>
                  <span className="font-semibold text-red-600">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">TI-score</span>
                  <span className="font-semibold">&lt; 40</span>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Risikokart - Geografisk fordeling</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="font-medium text-foreground">Bangladesh</span>
              </div>
              <Badge variant="destructive">Høy risiko</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-500/10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-foreground">Kina</span>
              </div>
              <Badge className="bg-yellow-500">Medium risiko</Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-500" />
                <span className="font-medium text-foreground">Norge</span>
              </div>
              <Badge className="bg-green-500">Lav risiko</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {setupMode === "manual" && !risksIdentified.humanRights && (
        <Button onClick={assessRisks} className="w-full" size="lg">
          Utfør risikovurdering
        </Button>
      )}
    </div>
  );

  const renderActionsStep = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Tiltak og aktsomhetsvurdering</h2>
        <p className="text-muted-foreground">
          Lara lager handlingsplaner og policyer basert på risikovurderingen
        </p>
      </div>

      <div className="grid gap-4">
        <Card className={actionsPlanned.policies ? 'border-blue-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">Policyer og retningslinjer</CardTitle>
              </div>
              {actionsPlanned.policies && (
                <Badge className="bg-blue-500">Opprettet</Badge>
              )}
            </div>
            <CardDescription>Menneskerettighets- og leverandørpolicy</CardDescription>
          </CardHeader>
          <CardContent>
            {actionsPlanned.policies ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Policyer for menneskerettigheter, arbeidsvilkår og miljø er generert og klar for godkjenning.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Se policyer
                  </Button>
                  <Button size="sm">Godkjenn</Button>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={actionsPlanned.dueDiligence ? 'border-purple-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Search className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">Aktsomhetsvurdering</CardTitle>
              </div>
              {actionsPlanned.dueDiligence && (
                <Badge className="bg-purple-500">Planlagt</Badge>
              )}
            </div>
            <CardDescription>Due diligence-prosesser for høyrisiko</CardDescription>
          </CardHeader>
          <CardContent>
            {actionsPlanned.dueDiligence ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Plan for aktsomhetsvurdering av 8 høyrisiko leverandører. Inkluderer spørreskjema og stedsbesøk.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Se plan
                  </Button>
                  <Button size="sm">Start prosess</Button>
                </div>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={actionsPlanned.monitoring ? 'border-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">Overvåking og oppfølging</CardTitle>
              </div>
              {actionsPlanned.monitoring && (
                <Badge className="bg-green-500">Konfigurert</Badge>
              )}
            </div>
            <CardDescription>Kontinuerlig overvåking av leverandørkjede</CardDescription>
          </CardHeader>
          <CardContent>
            {actionsPlanned.monitoring ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Automatisk overvåking via Mynder Trust Profiles, nyhetskilder og offentlige registre.
                </p>
                <Button variant="outline" size="sm">
                  Se overvåkingsplan
                </Button>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <Card className={actionsPlanned.reporting ? 'border-orange-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-orange-500" />
                <CardTitle className="text-lg">Rapporteringsrutiner</CardTitle>
              </div>
              {actionsPlanned.reporting && (
                <Badge className="bg-orange-500">Satt opp</Badge>
              )}
            </div>
            <CardDescription>Årlig redegjørelse og intern rapportering</CardDescription>
          </CardHeader>
          <CardContent>
            {actionsPlanned.reporting ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Mal for årlig redegjørelse etter Åpenhetsloven § 5. Automatiske påminnelser og frister.
                </p>
                <Button variant="outline" size="sm">
                  Se rapporteringsplan
                </Button>
              </div>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
          </CardContent>
        </Card>
      </div>

      {setupMode === "manual" && !actionsPlanned.policies && (
        <Button onClick={planActions} className="w-full" size="lg">
          Planlegg tiltak
        </Button>
      )}
    </div>
  );

  const renderReportStep = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">Rapportgenerering</h2>
        <p className="text-muted-foreground">
          Lara setter sammen din komplette Åpenhetsloven-rapport
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
            <p className="font-medium text-foreground">Genererer redegjørelse etter § 5...</p>
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
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground">
          🎉 Åpenhetsloven-rapportering fullført!
        </h1>
        <p className="text-lg text-muted-foreground">
          På 25 minutter med Lara
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Din redegjørelse er klar</CardTitle>
          <CardDescription>Last ned eller publiser på nettstedet ditt</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button className="flex-1" size="lg">
              <Download className="h-5 w-5 mr-2" />
              Last ned PDF
            </Button>
            <Button variant="outline" className="flex-1" size="lg">
              <Share2 className="h-5 w-5 mr-2" />
              Publiser rapport
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oppsummering</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium text-foreground">Leverandører kartlagt</span>
              <span className="text-2xl font-bold text-primary">47</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium text-foreground">Høyrisiko leverandører</span>
              <span className="text-2xl font-bold text-yellow-600">8</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
              <span className="font-medium text-foreground">Tiltak planlagt</span>
              <span className="text-2xl font-bold text-green-600">12</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Neste steg</CardTitle>
          <CardDescription>Anbefalte handlinger</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Start aktsomhetsvurdering</p>
                <p className="text-sm text-muted-foreground">Send spørreskjema til høyrisiko leverandører</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Aktiver overvåking</p>
                <p className="text-sm text-muted-foreground">Kontinuerlig oppfølging av leverandørkjede</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Publiser redegjørelse</p>
                <p className="text-sm text-muted-foreground">Gjør rapporten tilgjengelig på nettstedet</p>
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
      
      <main className="flex-1 overflow-y-auto md:pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-8 pt-6 md:pt-8">
          {/* Header with progress */}
          {currentStep !== "intro" && currentStep !== "complete" && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
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
          {currentStep === "suppliers" && renderSuppliersStep()}
          {currentStep === "risk" && renderRiskStep()}
          {currentStep === "actions" && renderActionsStep()}
          {currentStep === "report" && renderReportStep()}
          {currentStep === "complete" && renderCompleteStep()}
        </div>
      </main>
    </div>
  );
};

export default Transparency;
