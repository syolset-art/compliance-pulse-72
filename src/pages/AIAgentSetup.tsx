import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Shield, CheckCircle2, AlertTriangle, Info, Zap, Target, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const autonomyLevels = [
  {
    value: 0,
    label: "Assisterende",
    title: "Kun anbefalinger",
    description: "AI gir forslag, du bestemmer alt",
    risk: "Lav",
    riskColor: "text-success",
    icon: Info,
    requirements: ["Manuell godkjenning av alle tiltak", "Full dokumentasjon av beslutninger", "Kontinuerlig vurdering"],
    compliance: ["ISO/IEC 42001: Level 1", "EU AI Act: Minimal risk"],
  },
  {
    value: 25,
    label: "Begrenset autonom",
    title: "Enkel automatisering",
    description: "AI utfører enkle oppgaver automatisk, du godkjenner viktige valg",
    risk: "Lav-medium",
    riskColor: "text-success",
    icon: Zap,
    requirements: ["Automatisk logging", "Godkjenning av kritiske tiltak", "Månedlig gjennomgang"],
    compliance: ["ISO/IEC 42001: Level 2", "EU AI Act: Limited risk"],
  },
  {
    value: 50,
    label: "Semi-autonom",
    title: "Balansert samarbeid",
    description: "AI håndterer rutineoppgaver, du fokuserer på strategiske beslutninger",
    risk: "Medium",
    riskColor: "text-warning",
    icon: Target,
    requirements: ["Automatisk risikovurdering", "Godkjenning av høyrisiko-tiltak", "Ukentlig rapportering"],
    compliance: ["ISO/IEC 42001: Level 3", "ISO 27001 kontroller", "EU AI Act: Controlled risk"],
  },
  {
    value: 75,
    label: "Høy autonom",
    title: "Avansert automatisering",
    description: "AI driver det meste, du godkjenner kun kritiske beslutninger",
    risk: "Medium-høy",
    riskColor: "text-warning",
    icon: Bot,
    requirements: ["Kontinuerlig overvåking", "Bias-testing", "Leverandørrisiko-vurdering", "Ukentlig audit"],
    compliance: ["ISO/IEC 42001: Level 4", "ISO 27001 + 37301", "EU AI Act: High risk - compliance required"],
  },
  {
    value: 100,
    label: "Maksimal autonom",
    title: "Full automatisering",
    description: "AI opererer selvstendig innenfor definerte rammer",
    risk: "Høy",
    riskColor: "text-destructive",
    icon: Lock,
    requirements: ["Real-time overvåking", "Automatisk avviksrapportering", "Daglig compliance-sjekk", "Impact assessment", "Human oversight"],
    compliance: ["ISO/IEC 42001: Level 5", "ISO 42005 assessment", "EU AI Act: High risk - full compliance"],
  },
];

const AIAgentSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [systemLevel, setSystemLevel] = useState([50]);
  const [serviceLevel, setServiceLevel] = useState([50]);
  const [adminLevel, setAdminLevel] = useState([25]);

  const getCurrentLevel = (value: number) => {
    return autonomyLevels.reduce((prev, curr) => 
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
  };

  const handleSave = () => {
    toast({
      title: "AI-konfigurasjon lagret",
      description: "Dine autonomiinnstillinger er oppdatert og dokumentert i henhold til ISO/IEC 42001.",
    });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">AI-agent konfigurasjon</h1>
                <p className="text-muted-foreground">Definer hvordan AI skal støtte din etterlevelse</p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Trygg og compliant AI-bruk</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Mynder følger ISO/IEC 42001:2023 (AI Management System) og ISO 42005 (Impact Assessment) 
                  for å sikre ansvarlig bruk av AI. Alle autonominivåer dokumenteres automatisk.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">ISO/IEC 42001:2023</Badge>
                  <Badge variant="outline" className="text-xs">ISO 42005</Badge>
                  <Badge variant="outline" className="text-xs">EU AI Act</Badge>
                  <Badge variant="outline" className="text-xs">ISO 27001</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Autonomy Configuration */}
          <Tabs defaultValue="system" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="system">Systemnivå</TabsTrigger>
              <TabsTrigger value="service">Tjenestenivå</TabsTrigger>
              <TabsTrigger value="admin">Administrasjon</TabsTrigger>
            </TabsList>

            {/* System Level */}
            <TabsContent value="system" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  Hele plattformen
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">Autonominivå</label>
                      <Badge className={getCurrentLevel(systemLevel[0]).riskColor}>
                        {getCurrentLevel(systemLevel[0]).label}
                      </Badge>
                    </div>
                    
                    <Slider
                      value={systemLevel}
                      onValueChange={setSystemLevel}
                      max={100}
                      step={25}
                      className="mb-6"
                    />

                    <div className="grid grid-cols-5 gap-2 mb-8">
                      {autonomyLevels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setSystemLevel([level.value])}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            systemLevel[0] === level.value
                              ? "border-primary bg-primary/10 scale-105"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <level.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                          <div className="text-xs font-medium">{level.label}</div>
                        </button>
                      ))}
                    </div>

                    <LevelDetails level={getCurrentLevel(systemLevel[0])} />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Service Level */}
            <TabsContent value="service" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Spesifikke moduler
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">Autonominivå for tjenester</label>
                      <Badge className={getCurrentLevel(serviceLevel[0]).riskColor}>
                        {getCurrentLevel(serviceLevel[0]).label}
                      </Badge>
                    </div>
                    
                    <Slider
                      value={serviceLevel}
                      onValueChange={setServiceLevel}
                      max={100}
                      step={25}
                      className="mb-6"
                    />

                    <div className="grid grid-cols-5 gap-2 mb-8">
                      {autonomyLevels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setServiceLevel([level.value])}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            serviceLevel[0] === level.value
                              ? "border-primary bg-primary/10 scale-105"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <level.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                          <div className="text-xs font-medium">{level.label}</div>
                        </button>
                      ))}
                    </div>

                    <LevelDetails level={getCurrentLevel(serviceLevel[0])} />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Admin Level */}
            <TabsContent value="admin" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Policyer og godkjenninger
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">Autonominivå for administrasjon</label>
                      <Badge className={getCurrentLevel(adminLevel[0]).riskColor}>
                        {getCurrentLevel(adminLevel[0]).label}
                      </Badge>
                    </div>
                    
                    <Slider
                      value={adminLevel}
                      onValueChange={setAdminLevel}
                      max={100}
                      step={25}
                      className="mb-6"
                    />

                    <div className="grid grid-cols-5 gap-2 mb-8">
                      {autonomyLevels.map((level) => (
                        <button
                          key={level.value}
                          onClick={() => setAdminLevel([level.value])}
                          className={`p-3 rounded-lg border text-center transition-all ${
                            adminLevel[0] === level.value
                              ? "border-primary bg-primary/10 scale-105"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <level.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                          <div className="text-xs font-medium">{level.label}</div>
                        </button>
                      ))}
                    </div>

                    <LevelDetails level={getCurrentLevel(adminLevel[0])} />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-8">
            <Button variant="outline" onClick={() => navigate("/")}>
              Avbryt
            </Button>
            <Button onClick={handleSave} size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Lagre konfigurasjon
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const LevelDetails = ({ level }: { level: typeof autonomyLevels[0] }) => {
  return (
    <div className="space-y-6 p-6 rounded-lg bg-muted/30 border border-border">
      <div>
        <h4 className="font-semibold text-foreground mb-2">{level.title}</h4>
        <p className="text-sm text-muted-foreground">{level.description}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">Risikonivå: <span className={level.riskColor}>{level.risk}</span></span>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold mb-3">Krav og kontroller:</h5>
        <ul className="space-y-2">
          {level.requirements.map((req, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{req}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h5 className="text-sm font-semibold mb-3">Compliance:</h5>
        <div className="flex flex-wrap gap-2">
          {level.compliance.map((comp, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {comp}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIAgentSetup;
