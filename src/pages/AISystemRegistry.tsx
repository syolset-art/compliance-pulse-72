import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Bot,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Users,
  BarChart3,
  ArrowRight,
  Sparkles,
  Building2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { useAISystemRegistry, useAISystemDiscovery } from "@/hooks/useAISystemRegistry";
import { useAIMetricsSummary } from "@/hooks/useAIMetrics";
import { AISystemCard } from "@/components/ai-registry/AISystemCard";
import { AISystemDiscoveryBanner } from "@/components/ai-registry/AISystemDiscoveryBanner";
import { AddAISystemDialog } from "@/components/ai-registry/AddAISystemDialog";
import { LaraAgent } from "@/components/LaraAgent";

const RISK_COLORS: Record<string, string> = {
  unacceptable: "bg-destructive",
  high: "bg-warning",
  limited: "bg-warning",
  minimal: "bg-status-closed",
  not_assessed: "bg-muted",
};

const RISK_LABELS: Record<string, string> = {
  unacceptable: "Uakseptabel",
  high: "Høyrisiko",
  limited: "Begrenset",
  minimal: "Minimal",
  not_assessed: "Ikke vurdert",
};

export default function AISystemRegistry() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: systems, isLoading } = useAISystemRegistry();
  const { data: metrics } = useAIMetricsSummary();
  const { data: discoveredSystems } = useAISystemDiscovery();

  const filteredSystems = systems?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.provider?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRiskItems = metrics
    ? Object.values(metrics.systemsByRisk).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6 overflow-y-auto pt-11">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Bot className="h-6 w-6 text-primary" />
                  AI-systemregister
                </h1>
                <p className="text-muted-foreground mt-1">
                  Oversikt over alle AI-systemer i bruk iht. EU AI Act
                </p>
              </div>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Legg til AI-system
              </Button>
            </div>

            {/* Discovery Banner */}
            {discoveredSystems && discoveredSystems.length > 0 && (
              <AISystemDiscoveryBanner
                discoveredCount={discoveredSystems.length}
                systems={discoveredSystems}
              />
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">AI-systemer</p>
                      <p className="text-3xl font-bold">{metrics?.totalSystems || 0}</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Beslutninger/mnd</p>
                      <p className="text-3xl font-bold">
                        {metrics?.totalDecisionsPerMonth.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Berørte personer</p>
                      <p className="text-3xl font-bold">
                        {metrics?.totalAffectedPersons.toLocaleString() || 0}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Users className="h-6 w-6 text-accent" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Override-rate</p>
                      <p className="text-3xl font-bold">{metrics?.averageOverrideRate || 0}%</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risikofordeling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics &&
                    Object.entries(metrics.systemsByRisk).map(([risk, count]) => {
                      const percentage = totalRiskItems > 0 ? (count / totalRiskItems) * 100 : 0;
                      return (
                        <div key={risk} className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${RISK_COLORS[risk]}`} />
                          <span className="text-sm w-24">{RISK_LABELS[risk]}</span>
                          <Progress value={percentage} className="flex-1 h-2" />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* High Risk Systems Warning */}
            {metrics && metrics.systemsWithHighRisk.length > 0 && (
              <Card className="border-warning/20 bg-warning/10/50 dark:bg-orange-950/20 dark:border-warning/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-warning dark:text-warning">
                    <AlertTriangle className="h-5 w-5" />
                    Høyrisiko AI-systemer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.systemsWithHighRisk.map((system) => (
                      <div
                        key={system.id}
                        className="flex items-center justify-between p-3 bg-background rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              system.risk_category === "unacceptable"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {RISK_LABELS[system.risk_category]}
                          </Badge>
                          <div>
                            <p className="font-medium">{system.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {system.provider || "Ukjent leverandør"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>
                            <strong>{system.decisions_per_month}</strong> beslut./mnd
                          </span>
                          <span>
                            <strong>{system.override_rate_percent}%</strong> override
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/ai-registry/${system.id}`)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter AI-system eller leverandør..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* System List */}
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="h-40" />
                  </Card>
                ))}
              </div>
            ) : filteredSystems && filteredSystems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredSystems.map((system) => (
                  <AISystemCard
                    key={system.id}
                    system={system}
                    onClick={() => navigate(`/ai-registry/${system.id}`)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ingen AI-systemer registrert</h3>
                  <p className="text-muted-foreground mb-4">
                    Start med å registrere AI-systemene dine for EU AI Act-compliance.
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Legg til første AI-system
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <LaraAgent />

      <AddAISystemDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
