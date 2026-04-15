import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Zap, Compass, Building2, Users, Briefcase, Shield, FileText, Cloud, Upload, CheckCircle2, Loader2, Rocket, PartyPopper, ArrowLeft, LayoutDashboard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DocumentAnalysisResults from "@/components/DocumentAnalysisResults";
import { useTranslation } from "react-i18next";

type OnboardingStep = "intro" | "profile" | "frameworks" | "systems" | "policies" | "risk" | "complete";

export default function Onboarding() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Frameworks state
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);

  // Systems state
  const [systemsFound, setSystemsFound] = useState(0);
  const [systemsProcessed, setSystemsProcessed] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [documentAnalyses, setDocumentAnalyses] = useState<Record<string, any>>({});

  // Policies state
  const [generatedPolicies, setGeneratedPolicies] = useState<string[]>([]);

  const frameworks = [
    { id: "gdpr", name: "GDPR", icon: "🇪🇺", requirement: "Personvernpolicy + DPIA", category: "general" },
    { id: "iso27001", name: "ISO 27001/27002", icon: "🛡️", requirement: "ISMS-dokumentasjon", category: "general" },
    { id: "aiact", name: "AI Act", icon: "🤖", requirement: "AI-risikostyring", category: "general" },
    { id: "nsm", name: "NSM Grunnprinsipper", icon: "🇳🇴", requirement: "Sikkerhetspolicyer", category: "general" },
    { id: "nis2", name: "NIS 2", icon: "⚡", requirement: "Hendelseshåndtering", category: "general" },
    { id: "cra", name: "CRA", icon: "🔐", requirement: "Produktsikkerhet", category: "general" },
    // Energy specific
    { id: "sikkerhetsloven", name: "Sikkerhetsloven", icon: "⚡", requirement: "Sikkerhetsstyring for kritisk infrastruktur", category: "energi" },
    { id: "fos", name: "FOS (Forskrift om systemansvaret)", icon: "🔌", requirement: "Kraftsystemsikkerhet", category: "energi" },
    { id: "nve-cybersec", name: "NVE Cybersikkerhet", icon: "🛡️", requirement: "Cybersikkerhet energi", category: "energi" },
    // Health specific
    { id: "pasientjournal", name: "Pasientjournalloven", icon: "🏥", requirement: "Journalføring og informasjonssikkerhet", category: "helse" },
    { id: "helsepersonell", name: "Helsepersonelloven", icon: "👨‍⚕️", requirement: "Taushetsplikt og sikkerhet", category: "helse" },
    { id: "norm", name: "Norm for informasjonssikkerhet", icon: "🔒", requirement: "Helsenorge sikkerhet", category: "helse" },
    // Finance specific
    { id: "finanstilsyn", name: "Finanstilsynet IKT-krav", icon: "🏦", requirement: "IKT-risikostyring", category: "finans" },
    { id: "psd2", name: "PSD2", icon: "💳", requirement: "Betalingstjenester sikkerhet", category: "finans" },
    { id: "kvitterings", name: "Hvitvaskingsloven", icon: "💼", requirement: "KYC og compliance", category: "finans" }
  ];

  const [customFrameworks, setCustomFrameworks] = useState<Array<{id: string, name: string, requirement: string}>>([]);
  const [newFrameworkName, setNewFrameworkName] = useState("");
  const [newFrameworkReq, setNewFrameworkReq] = useState("");
  const [showAddFramework, setShowAddFramework] = useState(false);

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
    
    // Simulate fetching data from Brønnøysund
    setTimeout(() => {
      setOverallProgress(15);
      setLaraMessage("Henter organisasjonsinformasjon fra Brønnøysundregisteret...");
      
      // Pre-fill with company data
      setCompanyName("Eviny");
      setOrgNumber("999 999 999");
      setIndustry("energi");
      setEmployees("1001-5000");
      
      toast({
        title: "🤖 Lara jobber",
        description: "Hentet virksomhetsinformasjon fra Brønnøysundregisteret"
      });
      
      setTimeout(() => {
        setIsLaraWorking(false);
        setLaraMessage("Informasjon hentet! Du kan justere detaljer om nødvendig.");
      }, 1000);
    }, 1500);
  };

  const startManual = async () => {
    setIsLaraWorking(true);
    setLaraMessage("Henter organisasjonsinformasjon fra Brønnøysundregisteret...");
    setCurrentStep("profile");
    
    // Simulate fetching data from Brønnøysund even in manual mode
    setTimeout(() => {
      setOverallProgress(5);
      
      // Pre-fill with company data
      setCompanyName("Eviny");
      setOrgNumber("999 999 999");
      setIndustry("energi");
      setEmployees("1001-5000");
      
      toast({
        title: "✅ Informasjon hentet",
        description: "Organisasjonsdata fra Brønnøysundregisteret. Du kan justere etter behov."
      });
      
      setIsLaraWorking(false);
      setLaraMessage("Klar til å hjelpe deg!");
    }, 1000);
  };

  const completeProfile = () => {
    setIsLaraWorking(true);
    setLaraMessage("Velger rammeverk basert på din bransje...");
    
    setTimeout(() => {
      setOverallProgress(30);
      setCurrentStep("frameworks");
      setIsLaraWorking(false);
      
      // Auto-select frameworks based on industry (including industry-specific ones)
      if (industry === "helse") {
        setSelectedFrameworks(["gdpr", "iso27001", "nsm", "pasientjournal", "helsepersonell", "norm"]);
      } else if (industry === "energi") {
        setSelectedFrameworks(["gdpr", "iso27001", "nis2", "nsm", "sikkerhetsloven", "fos", "nve-cybersec"]);
      } else if (industry === "finans") {
        setSelectedFrameworks(["gdpr", "iso27001", "nis2", "finanstilsyn", "psd2", "kvitterings"]);
      } else {
        setSelectedFrameworks(["gdpr", "iso27001"]);
      }
      
      toast({
        title: "✅ Profil opprettet",
        description: "Lara har tilpasset anbefalinger for din virksomhet"
      });
    }, 2000);
  };

  const addCustomFramework = () => {
    if (!newFrameworkName.trim() || !newFrameworkReq.trim()) {
      toast({
        title: "⚠️ Mangler informasjon",
        description: "Vennligst fyll ut både navn og krav",
        variant: "destructive"
      });
      return;
    }

    const customId = `custom-${Date.now()}`;
    const newFramework = {
      id: customId,
      name: newFrameworkName,
      requirement: newFrameworkReq
    };

    setCustomFrameworks(prev => [...prev, newFramework]);
    setSelectedFrameworks(prev => [...prev, customId]);
    
    toast({
      title: "✅ Kilde lagt til",
      description: `${newFrameworkName} er nå lagt til`
    });

    setNewFrameworkName("");
    setNewFrameworkReq("");
    setShowAddFramework(false);
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    
    console.log("Files received:", files.length);
    
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(file => {
      const validTypes = ['.pdf', '.docx', '.xlsx', '.csv', '.txt'];
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return validTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      toast({
        title: "❌ Ugyldig filtype",
        description: "Vennligst last opp PDF, DOCX, XLSX, CSV eller TXT filer",
        variant: "destructive"
      });
      return;
    }

    setUploadedDocuments(prev => [...prev, ...validFiles]);
    
    setIsLaraWorking(true);
    setLaraMessage("Analyserer dokumenter med AI...");
    
    // Process each file
    for (const file of validFiles) {
      try {
        console.log(`Processing file: ${file.name} (${file.type})`);
        
        // Read file as text (works for CSV, TXT)
        let text = '';
        try {
          text = await file.text();
          console.log(`Read ${text.length} characters from ${file.name}`);
        } catch (readError) {
          console.error(`Could not read ${file.name} as text:`, readError);
          toast({
            title: "⚠️ Feilhåndtering",
            description: `${file.name} må være en tekstfil (CSV, TXT). For PDF/DOCX kommer snart!`,
            variant: "destructive"
          });
          continue;
        }

        if (!text || text.trim().length === 0) {
          toast({
            title: "⚠️ Tom fil",
            description: `${file.name} inneholder ingen tekst`,
            variant: "destructive"
          });
          continue;
        }

        console.log(`Calling analyze-document function for ${file.name}`);
        
        const { data, error } = await supabase.functions.invoke('analyze-document', {
          body: { 
            documentText: text,
            fileName: file.name
          }
        });

        console.log("Function response:", { data, error });

        if (error) {
          console.error("Analysis error:", error);
          toast({
            title: "⚠️ Analysefeil",
            description: `Kunne ikke analysere ${file.name}: ${error.message || 'Ukjent feil'}`,
            variant: "destructive"
          });
          continue;
        }

        if (data?.analysis) {
          console.log("Analysis result:", data.analysis);
          
          // Store analysis results
          setDocumentAnalyses(prev => ({
            ...prev,
            [file.name]: data.analysis
          }));

          // Count found systems
          const foundSystems = data.analysis.suppliers?.length || 0;
          setSystemsFound(prev => prev + foundSystems);

          toast({
            title: "✨ AI-analyse fullført",
            description: `${file.name}: Fant ${foundSystems} leverandører, ${data.analysis.complianceGaps?.length || 0} gap`
          });
        } else {
          console.warn("No analysis data in response");
          toast({
            title: "⚠️ Ingen data",
            description: `Fikk ingen analyseresultat for ${file.name}`,
            variant: "destructive"
          });
        }
      } catch (err) {
        console.error("File processing error for", file.name, ":", err);
        toast({
          title: "❌ Feil",
          description: `Kunne ikke lese ${file.name}: ${err instanceof Error ? err.message : 'Ukjent feil'}`,
          variant: "destructive"
        });
      }
    }
    
    setIsLaraWorking(false);
    setLaraMessage("Analyse fullført!");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
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
      
      // Auto-redirect to dashboard after showing congratulations
      setTimeout(() => {
        goToDashboard();
      }, 4000);
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
      description: "Din Trust Profile er klar — se den nå."
    });
    navigate("/trust-center/profile");
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
            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">{overallProgress}% ferdig</div>
              <Button variant="outline" size="sm" onClick={goToDashboard}>
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Til Trust Profile
              </Button>
            </div>
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
                Bli 70% compliant på 3 minutter
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

              <Card className="hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary" onClick={startManual}>
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
                <CardDescription>
                  Informasjon hentet fra Brønnøysundregisteret. Du kan justere detaljene om nødvendig.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {companyName && (
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          Organisasjonsdata hentet fra Brønnøysundregisteret
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Verifiser og juster informasjonen under ved behov.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Company Name - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="companyName">Bedriftsnavn</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    disabled
                    className="bg-muted/50"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                    <Input
                      id="orgNumber"
                      placeholder="123 456 789"
                      value={orgNumber}
                      onChange={(e) => setOrgNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employees">Antall ansatte</Label>
                    <Select value={employees} onValueChange={setEmployees}>
                      <SelectTrigger id="employees">
                        <SelectValue placeholder="Velg antall" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 ansatt</SelectItem>
                        <SelectItem value="2-5">2-5 ansatte</SelectItem>
                        <SelectItem value="6-10">6-10 ansatte</SelectItem>
                        <SelectItem value="11-25">11-25 ansatte</SelectItem>
                        <SelectItem value="26-50">26-50 ansatte</SelectItem>
                        <SelectItem value="51-100">51-100 ansatte</SelectItem>
                        <SelectItem value="101-250">101-250 ansatte</SelectItem>
                        <SelectItem value="251-500">251-500 ansatte</SelectItem>
                        <SelectItem value="501-1000">501-1000 ansatte</SelectItem>
                        <SelectItem value="1001-5000">1001-5000 ansatte</SelectItem>
                        <SelectItem value="5000+">Over 5000 ansatte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                      <SelectItem value="saas">SaaS og teknologi</SelectItem>
                      <SelectItem value="offentlig">Offentlig sektor</SelectItem>
                      <SelectItem value="produksjon">Produksjon og industri</SelectItem>
                      <SelectItem value="handel">Handel og detaljhandel</SelectItem>
                      <SelectItem value="annet">Annet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="maturity">Hvor langt er dere kommet med sikkerhet og compliance?</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dette hjelper oss å gi deg riktig nivå av støtte og anbefalinger
                    </p>
                  </div>
                  <Select value={maturity} onValueChange={setMaturity}>
                    <SelectTrigger id="maturity">
                      <SelectValue placeholder="Velg det som passer best" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">🌱 Helt i starten</span>
                          <span className="text-xs text-muted-foreground">Vi har ikke begynt med dette ennå</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="grunnleggende">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">📝 På god vei</span>
                          <span className="text-xs text-muted-foreground">Vi har noen policyer og rutiner på plass</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="strukturert">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">🏗️ Godt strukturert</span>
                          <span className="text-xs text-muted-foreground">Vi har systematisk arbeid med sikkerhet og compliance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="sertifisert">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">🏆 Sertifisert nivå</span>
                          <span className="text-xs text-muted-foreground">Vi har ISO-sertifisering eller tilsvarende</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="avansert">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">🚀 Avansert og modenhet</span>
                          <span className="text-xs text-muted-foreground">Vi har dedikert compliance-team og avanserte prosesser</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={completeProfile} 
                  className="w-full" 
                  disabled={!orgNumber || !employees || !industry || !maturity}
                >
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
              <h2 className="text-3xl font-bold">Hvilke rammeverk vil dere følge?</h2>
              <p className="text-muted-foreground">Velg relevante standarder og rammeverk for compliance</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Compliance-rammeverk
                </CardTitle>
                <CardDescription>
                  Lara har foreslått rammeverk basert på din bransje ({industry}). Du kan justere utvalget eller legge til egne.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* General frameworks */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Generelle rammeverk</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {frameworks.filter(f => f.category === "general").map((framework) => (
                      <Card
                        key={framework.id}
                        className={`cursor-pointer transition-all ${
                          selectedFrameworks.includes(framework.id)
                            ? "border-primary shadow-md"
                            : "hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setSelectedFrameworks(
                            selectedFrameworks.includes(framework.id)
                              ? selectedFrameworks.filter((f) => f !== framework.id)
                              : [...selectedFrameworks, framework.id]
                          );
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{framework.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{framework.name}</h3>
                                {selectedFrameworks.includes(framework.id) && (
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {framework.requirement}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Industry-specific frameworks */}
                {industry && frameworks.some(f => f.category === industry) && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-primary uppercase tracking-wide flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {industry === "energi" ? "Energibransjen" : industry === "helse" ? "Helsesektoren" : industry === "finans" ? "Finanssektoren" : "Bransjespesifikke"}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {frameworks.filter(f => f.category === industry).map((framework) => (
                        <Card
                          key={framework.id}
                          className={`cursor-pointer transition-all ${
                            selectedFrameworks.includes(framework.id)
                              ? "border-primary shadow-md bg-primary/5"
                              : "hover:border-primary/50"
                          }`}
                          onClick={() => {
                            setSelectedFrameworks(
                              selectedFrameworks.includes(framework.id)
                                ? selectedFrameworks.filter((f) => f !== framework.id)
                                : [...selectedFrameworks, framework.id]
                            );
                          }}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{framework.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{framework.name}</h3>
                                  {selectedFrameworks.includes(framework.id) && (
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {framework.requirement}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom frameworks */}
                {customFrameworks.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Egne kilder</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {customFrameworks.map((framework) => (
                        <Card
                          key={framework.id}
                          className="border-primary shadow-md bg-primary/5"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">📋</div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold">{framework.name}</h3>
                                  <CheckCircle2 className="w-4 h-4 text-primary" />
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {framework.requirement}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add custom framework */}
                {showAddFramework && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="framework-name">Navn på regelverk/kilde</Label>
                        <Input
                          id="framework-name"
                          placeholder="F.eks. Intern sikkerhetspolicy"
                          value={newFrameworkName}
                          onChange={(e) => setNewFrameworkName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="framework-req">Krav/beskrivelse</Label>
                        <Input
                          id="framework-req"
                          placeholder="F.eks. Interne sikkerhetskrav for IT-systemer"
                          value={newFrameworkReq}
                          onChange={(e) => setNewFrameworkReq(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={addCustomFramework} size="sm">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Legg til
                        </Button>
                        <Button onClick={() => setShowAddFramework(false)} variant="outline" size="sm">
                          Avbryt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-center gap-4 mt-8">
                  {!showAddFramework && (
                    <Button
                      onClick={() => setShowAddFramework(true)}
                      variant="outline"
                      size="lg"
                    >
                      + Legg til egen kilde
                    </Button>
                  )}
                  <Button
                    onClick={completeFrameworks}
                    size="lg"
                    disabled={selectedFrameworks.length === 0}
                  >
                    Fortsett med {selectedFrameworks.length} rammeverk
                  </Button>
                </div>
              </CardContent>
            </Card>
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
              <p className="text-muted-foreground">Få oversikt over alle systemene dere bruker</p>
            </div>

            {/* Explanation Card */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-background/80 shadow-sm">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Hvorfor kartlegge systemene våre?</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Ved å automatisk identifisere alle systemene dere bruker, får dere full oversikt og kontroll. 
                        Dette sparer tid ved at Lara automatisk:
                      </p>
                    </div>
                    <div className="bg-background/60 rounded-lg p-4 space-y-2">
                      <ul className="text-sm space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span><strong>Henter avtaler:</strong> Finner databehandleravtaler (DPA) og sikkerhetsattester</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span><strong>Sparer tid:</strong> Slipper manuell kartlegging av systemer og leverandører</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span><strong>Reduserer kostnader:</strong> Oppdager ofte overflødig eller duplisert programvare</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">✓</span>
                          <span><strong>Øker sikkerheten:</strong> Identifiserer systemer som mangler dokumentasjon</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Last opp dokumenter
                </CardTitle>
                <CardDescription>
                  Last opp lisenser, avtaler eller systemoversikter – Lara finner automatisk hvilke systemer dere bruker
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-primary bg-primary/5 scale-[1.02]' 
                      : 'border-border hover:border-primary/50 hover:bg-accent/5'
                  }`}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Upload className={`w-12 h-12 mx-auto mb-3 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium mb-1">
                    {isDragging ? 'Slipp filene her' : 'Dra og slipp filer her'}
                  </p>
                  <p className="text-xs text-muted-foreground">eller klikk for å velge</p>
                  <p className="text-xs text-muted-foreground mt-2">PDF, DOCX, XLSX, CSV</p>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx,.csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                </div>

                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Opplastede dokumenter:</p>
                    <div className="space-y-2">
                      {uploadedDocuments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-primary" />
                            <div>
                              <p className="text-sm font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show analysis results for each document */}
                {Object.keys(documentAnalyses).length > 0 && (
                  <div className="space-y-4">
                    {Object.entries(documentAnalyses).map(([fileName, analysis]) => (
                      <DocumentAnalysisResults 
                        key={fileName}
                        fileName={fileName}
                        analysis={analysis}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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

            <div>
              <h3 className="font-semibold mb-4">Eller skann automatisk via:</h3>
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
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={completeSystems} 
                className="flex-1"
              >
                Hopp over nå
              </Button>
              <Button 
                onClick={completeSystems} 
                className="flex-1" 
                disabled={systemsProcessed === 0}
              >
                Fortsett til policyer
              </Button>
            </div>
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
          <div className="space-y-8 animate-fade-in text-center py-20">
            <div className="inline-block p-6 rounded-full bg-primary/10 mb-4 animate-scale-in">
              <PartyPopper className="w-16 h-16 text-primary" />
            </div>
            
            <h2 className="text-4xl font-bold">Gratulerer! 🎉</h2>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Du er nå 70% compliant — på bare 3 minutter. Lara holder deg oppdatert automatisk.
            </p>

            <p className="text-sm text-muted-foreground animate-pulse">
              Sender deg til din Trust Profile om et øyeblikk...
            </p>

            <Button onClick={goToDashboard} size="lg" className="text-lg px-8">
              Gå til Trust Profile →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
