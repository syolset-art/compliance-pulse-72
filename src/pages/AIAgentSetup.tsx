import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot, Shield, CheckCircle2, AlertTriangle, Info, Zap, Target, Lock, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const autonomyLevels = [
  {
    value: 0,
    labelKey: "assisting",
    titleKey: "assistingTitle",
    descKey: "assistingDesc",
    risk: "low",
    riskColor: "text-success",
    icon: Info,
    requirements: ["Manual approval of all measures", "Full documentation of decisions", "Continuous evaluation"],
    compliance: ["ISO/IEC 42001: Level 1", "EU AI Act: Minimal risk"],
  },
  {
    value: 25,
    labelKey: "limitedAutonomous",
    titleKey: "limitedTitle",
    descKey: "limitedDesc",
    risk: "lowMedium",
    riskColor: "text-success",
    icon: Zap,
    requirements: ["Automatic logging", "Approval of critical measures", "Monthly review"],
    compliance: ["ISO/IEC 42001: Level 2", "EU AI Act: Limited risk"],
  },
  {
    value: 50,
    labelKey: "semiAutonomous",
    titleKey: "semiTitle",
    descKey: "semiDesc",
    risk: "medium",
    riskColor: "text-warning",
    icon: Target,
    requirements: ["Automatic risk assessment", "Approval of high-risk measures", "Weekly reporting"],
    compliance: ["ISO/IEC 42001: Level 3", "ISO 27001 controls", "EU AI Act: Controlled risk"],
  },
  {
    value: 75,
    labelKey: "highAutonomous",
    titleKey: "highTitle",
    descKey: "highDesc",
    risk: "mediumHigh",
    riskColor: "text-warning",
    icon: Bot,
    requirements: ["Continuous monitoring", "Bias testing", "Vendor risk assessment", "Weekly audit"],
    compliance: ["ISO/IEC 42001: Level 4", "ISO 27001 + 37301", "EU AI Act: High risk - compliance required"],
  },
  {
    value: 100,
    labelKey: "maximalAutonomous",
    titleKey: "maximalTitle",
    descKey: "maximalDesc",
    risk: "high",
    riskColor: "text-destructive",
    icon: Lock,
    requirements: ["Real-time monitoring", "Automatic deviation reporting", "Daily compliance check", "Impact assessment", "Human oversight"],
    compliance: ["ISO/IEC 42001: Level 5", "ISO 42005 assessment", "EU AI Act: High risk - full compliance"],
  },
];

const mockProcesses = [
  { id: 1, name: "Ansattdatabehandling", area: "HR", critical: true, currentLevel: 25 },
  { id: 2, name: "Kunderegistrering", area: "Sales", critical: true, currentLevel: 25 },
  { id: 3, name: "Fakturabehandling", area: "Økonomi", critical: false, currentLevel: 50 },
  { id: 4, name: "Markedsføring", area: "Marketing", critical: false, currentLevel: 50 },
  { id: 5, name: "Leverandørvurdering", area: "Innkjøp", critical: true, currentLevel: 0 },
  { id: 6, name: "Systemlogging", area: "IT", critical: false, currentLevel: 75 },
];

const AIAgentSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [systemLevel, setSystemLevel] = useState([50]);
  const [serviceLevel, setServiceLevel] = useState([50]);
  const [adminLevel, setAdminLevel] = useState([25]);
  const [processLevels, setProcessLevels] = useState<Record<number, number>>(
    mockProcesses.reduce((acc, p) => ({ ...acc, [p.id]: p.currentLevel }), {})
  );

  const getCurrentLevel = (value: number) => {
    return autonomyLevels.reduce((prev, curr) => 
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
  };

  const handleSave = () => {
    toast({
      title: t("aiSetup.saved"),
      description: t("aiSetup.savedDesc"),
    });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto md:pt-11">
        <div className="container max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t("aiSetup.title")}</h1>
                <p className="text-muted-foreground">{t("aiSetup.subtitle")}</p>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <Card className="p-6 mb-8 border-primary/20 bg-primary/5">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">{t("aiSetup.banner.title")}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t("aiSetup.banner.description")}
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="system">{t("aiSetup.tabs.system")}</TabsTrigger>
              <TabsTrigger value="service">{t("aiSetup.tabs.service")}</TabsTrigger>
              <TabsTrigger value="process">{t("aiSetup.tabs.process")}</TabsTrigger>
              <TabsTrigger value="admin">{t("aiSetup.tabs.admin")}</TabsTrigger>
            </TabsList>

            {/* System Level */}
            <TabsContent value="system" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  {t("aiSetup.wholePlatform")}
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">{t("aiSetup.autonomyLevel")}</label>
                      <Badge className={getCurrentLevel(systemLevel[0]).riskColor}>
                        {t(`aiSetup.levels.${getCurrentLevel(systemLevel[0]).labelKey}`)}
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
                          <div className="text-xs font-medium">{t(`aiSetup.levels.${level.labelKey}`)}</div>
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
                  {t("aiSetup.specificModules")}
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">{t("aiSetup.autonomyLevelFor")} {t("aiSetup.services")}</label>
                      <Badge className={getCurrentLevel(serviceLevel[0]).riskColor}>
                        {t(`aiSetup.levels.${getCurrentLevel(serviceLevel[0]).labelKey}`)}
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
                          <div className="text-xs font-medium">{t(`aiSetup.levels.${level.labelKey}`)}</div>
                        </button>
                      ))}
                    </div>

                    <LevelDetails level={getCurrentLevel(serviceLevel[0])} />
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Process Level */}
            <TabsContent value="process" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 w-5 text-primary" />
                  {t("aiSetup.perProcess")}
                </h3>
                
                <div className="space-y-6">
                  {mockProcesses.map((process) => {
                    const maxAllowed = process.critical ? 25 : 100;
                    const currentValue = processLevels[process.id] || 0;
                    
                    return (
                      <Card key={process.id} className={`p-5 ${process.critical ? 'border-warning/50 bg-warning/5' : ''}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{process.name}</h4>
                              {process.critical && (
                                <Badge variant="outline" className="text-warning border-warning">
                                  <Lock className="w-3 h-3 mr-1" />
                                  {t("aiSetup.criticalProcess")}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{process.area}</p>
                          </div>
                          <Badge className={getCurrentLevel(currentValue).riskColor}>
                            {t(`aiSetup.levels.${getCurrentLevel(currentValue).labelKey}`)}
                          </Badge>
                        </div>

                        {process.critical && (
                          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/20">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                {t("aiSetup.criticalProcessWarning")}
                              </p>
                            </div>
                          </div>
                        )}

                        <Slider
                          value={[currentValue]}
                          onValueChange={(value) => setProcessLevels(prev => ({ ...prev, [process.id]: value[0] }))}
                          max={maxAllowed}
                          step={25}
                          className="mb-4"
                          disabled={process.critical && currentValue >= maxAllowed}
                        />

                        <div className="grid grid-cols-5 gap-2">
                          {autonomyLevels
                            .filter(level => level.value <= maxAllowed)
                            .map((level) => (
                              <button
                                key={level.value}
                                onClick={() => setProcessLevels(prev => ({ ...prev, [process.id]: level.value }))}
                                disabled={level.value > maxAllowed}
                                className={`p-3 rounded-lg border text-center transition-all ${
                                  currentValue === level.value
                                    ? "border-primary bg-primary/10 scale-105"
                                    : level.value > maxAllowed
                                    ? "border-border opacity-50 cursor-not-allowed"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                <level.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                                <div className="text-xs font-medium">{t(`aiSetup.levels.${level.labelKey}`)}</div>
                              </button>
                            ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            </TabsContent>

            {/* Admin Level */}
            <TabsContent value="admin" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  {t("aiSetup.policiesApprovals")}
                </h3>
                
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium">{t("aiSetup.autonomyLevelFor")} {t("aiSetup.administration")}</label>
                      <Badge className={getCurrentLevel(adminLevel[0]).riskColor}>
                        {t(`aiSetup.levels.${getCurrentLevel(adminLevel[0]).labelKey}`)}
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
                          <div className="text-xs font-medium">{t(`aiSetup.levels.${level.labelKey}`)}</div>
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
              {t("aiSetup.cancel")}
            </Button>
            <Button onClick={handleSave} size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t("aiSetup.save")}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

const LevelDetails = ({ level }: { level: typeof autonomyLevels[0] }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6 p-6 rounded-lg bg-muted/30 border border-border">
      <div>
        <h4 className="font-semibold text-foreground mb-2">{t(`aiSetup.levels.${level.titleKey}`)}</h4>
        <p className="text-sm text-muted-foreground">{t(`aiSetup.levels.${level.descKey}`)}</p>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-warning" />
          <span className="text-sm font-medium">{t("aiSetup.risk")}: <span className={level.riskColor}>{t(`aiSetup.${level.risk}`)}</span></span>
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold mb-3">{t("aiSetup.requirements")}:</h5>
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
        <h5 className="text-sm font-semibold mb-3">{t("aiSetup.compliance")}:</h5>
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
