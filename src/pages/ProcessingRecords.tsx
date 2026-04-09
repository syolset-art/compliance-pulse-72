import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  AlertTriangle,
  Globe,
  FileWarning,
  Server,
  TrendingDown,
  Search,
  ChevronDown,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

// Mock data for processing records
const mockRecords = [
  {
    id: "1",
    title: "Crayon Customer Portal – HR og lisens-/kostnadsadministrasjon",
    description: "Administrere lisens- og skykostnader for ansatte, inkl. bruker- og tilgangsstyring samt håndtering av faktura- og avtaledokumenter knyttet til HR og lønn.",
    workArea: "HR og personell",
    riskLevel: "medium",
    reviewStatus: "not_reviewed",
    systems: ["Crayon Customer Portal"],
    systemCount: 1,
    dpiaRequired: true,
    dpiaStatus: "approved",
    lastUpdated: "08.01.2028",
    complianceAreas: [],
  },
  {
    id: "2",
    title: "Compliance-overvåking av kontakt- og metadata (Affinity)",
    description: "Overvåke og analysere kontakt-, møte- og kommunikasjonsdata for å dokumentere system- og leverandørrelasjoner, sikre sporbarhet og tilgangskontroll, samt støtte risikovurdering og styrking.",
    workArea: null,
    riskLevel: "medium",
    reviewStatus: "not_reviewed",
    systems: ["Affinity"],
    systemCount: 1,
    dpiaRequired: true,
    dpiaStatus: "approved",
    lastUpdated: "08.01.2028",
    complianceAreas: ["Compliance (Personvern og IT-sikkerhet)"],
  },
  {
    id: "3",
    title: "Test: CRM og prospektering i Affinity",
    description: "Behandle kontakt- og kommunikasjonsdata for å støtte CRM- og pipeline-styring, identifisere introduksjoner og forbedre prospektering og deal sourcing, med integrasjon mot e-post o...",
    workArea: null,
    riskLevel: "medium",
    reviewStatus: "approved",
    systems: [],
    systemCount: 0,
    dpiaRequired: true,
    dpiaStatus: "approved",
    lastUpdated: "08.01.2028",
    complianceAreas: ["Compliance (Personvern og IT-sikkerhet)"],
  },
];

const riskDistributionData = [
  { name: "Lav risiko", value: 17, color: "hsl(var(--success))" },
  { name: "Moderat risiko", value: 63, color: "hsl(var(--warning))" },
  { name: "Høy risiko", value: 19, color: "hsl(var(--destructive))" },
  { name: "Kritisk risiko", value: 1, color: "hsl(291 65% 45%)" },
];

export default function ProcessingRecords() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);

  const metrics = [
    { 
      label: t("processingRecords.metrics.total"), 
      value: 84, 
      subtitle: t("processingRecords.metrics.totalSub"),
      icon: FileText,
      color: "bg-primary/10 text-primary"
    },
    { 
      label: t("processingRecords.metrics.highRisk"), 
      value: 16, 
      subtitle: t("processingRecords.metrics.highRiskSub"),
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive"
    },
    { 
      label: t("processingRecords.metrics.thirdCountry"), 
      value: 58, 
      subtitle: t("processingRecords.metrics.thirdCountrySub"),
      icon: Globe,
      color: "bg-warning/10 text-warning"
    },
    { 
      label: t("processingRecords.metrics.missingDpia"), 
      value: 14, 
      subtitle: t("processingRecords.metrics.missingDpiaSub"),
      icon: FileWarning,
      color: "bg-destructive/10 text-destructive"
    },
    { 
      label: t("processingRecords.metrics.uniqueSystems"), 
      value: 51, 
      subtitle: t("processingRecords.metrics.uniqueSystemsSub"),
      icon: Server,
      color: "bg-muted text-muted-foreground"
    },
    { 
      label: t("processingRecords.metrics.growthRate"), 
      value: "37 (-21%)", 
      subtitle: t("processingRecords.metrics.growthRateSub"),
      icon: TrendingDown,
      color: "bg-success/10 text-success"
    },
  ];

  const toggleSelectRecord = (id: string) => {
    setSelectedRecords(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecords.length === mockRecords.length) {
      setSelectedRecords([]);
    } else {
      setSelectedRecords(mockRecords.map(r => r.id));
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "low": return "bg-success/10 text-success border-success/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "critical": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      default: return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("processingRecords.title")}</h1>
            <p className="text-muted-foreground">{t("processingRecords.subtitle")}</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            {t("processingRecords.downloadSummary")}
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-muted-foreground">{metric.label}</span>
                <div className={`p-1.5 rounded-md ${metric.color}`}>
                  <metric.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-foreground">{metric.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Risk Distribution Chart */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-4">{t("processingRecords.riskDistribution")}</h3>
          <div className="flex items-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              {riskDistributionData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Summary Card */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-2">{t("processingRecords.summary")}</h3>
          <p className="text-sm text-muted-foreground italic">{t("processingRecords.loadingSummary")}</p>
        </Card>

        {/* Responsible Persons */}
        <Card className="p-6">
          <h3 className="font-semibold text-foreground mb-1">{t("processingRecords.responsiblePersons")}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t("processingRecords.responsiblePersonsSub")}</p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t("processingRecords.controller")}</p>
                <p className="font-medium text-foreground">Truls Kristoffersen</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {t("processingRecords.invited")}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">{t("processingRecords.dpo")}</p>
                <p className="font-medium text-foreground">Samti Ahmed</p>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {t("processingRecords.invited")}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Filters and Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={selectedRecords.length === mockRecords.length && mockRecords.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">{t("processingRecords.selectAll")}</span>
          </div>
          <Button variant="outline" disabled={selectedRecords.length === 0}>
            {t("processingRecords.downloadSelected")}
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("processingRecords.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t("processingRecords.filterBasis")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("processingRecords.allBasis")}</SelectItem>
              <SelectItem value="consent">{t("processingRecords.consent")}</SelectItem>
              <SelectItem value="contract">{t("processingRecords.contract")}</SelectItem>
              <SelectItem value="legal">{t("processingRecords.legalObligation")}</SelectItem>
              <SelectItem value="legitimate">{t("processingRecords.legitimateInterest")}</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t("processingRecords.filterWorkArea")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("processingRecords.allWorkAreas")}</SelectItem>
              <SelectItem value="hr">{t("processingRecords.workAreaHR")}</SelectItem>
              <SelectItem value="it">{t("processingRecords.workAreaIT")}</SelectItem>
              <SelectItem value="sales">{t("processingRecords.workAreaSales")}</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t("processingRecords.filterRisk")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("processingRecords.allRisks")}</SelectItem>
              <SelectItem value="low">{t("processingRecords.riskLow")}</SelectItem>
              <SelectItem value="medium">{t("processingRecords.riskMedium")}</SelectItem>
              <SelectItem value="high">{t("processingRecords.riskHigh")}</SelectItem>
              <SelectItem value="critical">{t("processingRecords.riskCritical")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t("processingRecords.filterProcessor")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("processingRecords.allProcessors")}</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder={t("processingRecords.filterSensitivity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("processingRecords.allSensitivity")}</SelectItem>
              <SelectItem value="special">{t("processingRecords.specialCategory")}</SelectItem>
              <SelectItem value="normal">{t("processingRecords.normalCategory")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Processing Records Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockRecords.map((record) => (
            <Card key={record.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <Checkbox 
                  checked={selectedRecords.includes(record.id)}
                  onCheckedChange={() => toggleSelectRecord(record.id)}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground line-clamp-2 mb-1">{record.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">{record.description}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("processingRecords.riskLevelLabel")}</span>
                  <Badge variant="outline" className={getRiskBadgeColor(record.riskLevel)}>
                    {t(`processingRecords.risk${record.riskLevel.charAt(0).toUpperCase() + record.riskLevel.slice(1)}`)}
                  </Badge>
                </div>

                {record.workArea && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("processingRecords.workAreaLabel")}</span>
                    <Badge variant="secondary" className="text-xs">
                      {record.workArea}
                    </Badge>
                  </div>
                )}

                {record.complianceAreas.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {record.complianceAreas.map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary">
                        {area}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("processingRecords.reviewStatus")}</span>
                  <Badge 
                    variant="outline" 
                    className={record.reviewStatus === "approved" 
                      ? "bg-success/10 text-success border-success/20" 
                      : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {record.reviewStatus === "approved" 
                      ? t("processingRecords.reviewed") 
                      : t("processingRecords.notReviewed")
                    }
                  </Badge>
                </div>

                {record.systems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("processingRecords.linkedSystems")}</span>
                    <Badge variant="outline" className="text-xs">
                      {record.systems[0]} {record.systemCount > 1 && `+${record.systemCount - 1}`}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{t("processingRecords.dpiaRequired")}</span>
                    {record.dpiaRequired ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {record.dpiaStatus === "approved" && (
                    <Button variant="ghost" size="sm" className="text-xs h-7 gap-1">
                      {t("processingRecords.viewDpia")}
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <p className="text-xs text-muted-foreground pt-1">
                  {t("processingRecords.lastUpdated")}: {record.lastUpdated}
                </p>
              </div>
            </Card>
          ))}
        </div>
        </div>
      </main>
    </div>
  );
}
