import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Server, Wifi, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Shield } from "lucide-react";
import { CustomerStatusBanner } from "@/components/msp/CustomerStatusBanner";
import { StatusOverviewWidget } from "@/components/widgets/StatusOverviewWidget";
import { CriticalTasksWidget } from "@/components/widgets/CriticalTasksWidget";
import { DomainComplianceWidget } from "@/components/widgets/DomainComplianceWidget";
import { MSPAssessmentCard } from "@/components/msp/MSPAssessmentCard";
import { AcronisConnectDialog } from "@/components/msp/AcronisConnectDialog";
import { SecurityServiceGapCard } from "@/components/msp/SecurityServiceGapCard";

export default function MSPCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [acronisOpen, setAcronisOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("guidance");

  const { data: customer, isLoading } = useQuery({
    queryKey: ["msp-customer", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .eq("id", customerId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!customerId,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Laster kundedata...</p>
        </main>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Kunde ikke funnet</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate("/msp-dashboard")}>
              Tilbake til partneroversikt
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Works to be done — fra assessment / acronis / dokumenter
  const tasks = [
    !customer.has_acronis_integration && {
      severity: "high",
      title: "Koble til Acronis",
      desc: "Importer enheter og backup-status for kunden.",
      cta: "Koble til",
      onClick: () => setAcronisOpen(true),
    },
    (!customer.initial_assessment_score || customer.initial_assessment_score < 50) && {
      severity: "critical",
      title: "Fullfør innledende vurdering",
      desc: "Lara trenger svar på sikkerhetsspørsmål for å beregne modenhet.",
      cta: "Start vurdering",
      onClick: () => setActiveTab("assessment"),
    },
    !customer.active_frameworks?.includes("NIS2") && {
      severity: "medium",
      title: "Start NIS2-vurdering",
      desc: "Kunden er ikke kartlagt mot NIS2-rammeverket ennå.",
      cta: "Start NIS2",
      onClick: () => navigate(`/msp-dashboard/${customerId}/nis2`),
    },
    !customer.onboarding_completed && {
      severity: "medium",
      title: "Fullfør onboarding",
      desc: "Inviter kunden og overlevér Trust Profile.",
      cta: "Inviter kunde",
      onClick: () => {},
    },
  ].filter(Boolean) as Array<{ severity: string; title: string; desc: string; cta: string; onClick: () => void }>;

  const sevColor: Record<string, string> = {
    critical: "bg-destructive/10 text-destructive border-destructive/30",
    high: "bg-warning/10 text-warning border-warning/30",
    medium: "bg-primary/10 text-primary border-primary/30",
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <Button variant="ghost" onClick={() => navigate("/msp-dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake til partneroversikt
          </Button>

          {/* Customer status banner — same template as vendor */}
          <CustomerStatusBanner customer={customer} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
            <nav aria-label="Kunde-faner" className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 min-w-0" role="tablist">
                <TabsTrigger value="guidance" className="relative text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Veiledning fra Mynder
                  {tasks.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="assessment" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Vurdering og gap
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Tjenester og integrasjoner
                </TabsTrigger>
                <TabsTrigger value="trust-profile" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Trust Profile
                </TabsTrigger>
                <TabsTrigger value="nis2" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  NIS2
                </TabsTrigger>
              </TabsList>
            </nav>

            {/* ── Veiledning: Works to be done ── */}
            <TabsContent value="guidance" className="mt-6 space-y-5">
              <Card className="p-5 border-primary/20 bg-primary/5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-foreground">Lara har en anbefaling til deg</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {tasks.length === 0
                        ? "Ingen åpne oppgaver — kunden er i god rute."
                        : `Du har ${tasks.length} oppgave${tasks.length === 1 ? "" : "r"} som krever oppmerksomhet${
                            tasks.filter(t => t.severity === "critical").length > 0
                              ? `, hvorav ${tasks.filter(t => t.severity === "critical").length} er kritisk`
                              : ""
                          }.`}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <h3 className="text-sm font-semibold text-foreground">Works to be done</h3>
                </div>

                {tasks.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Ingen åpne oppgaver for denne kunden.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                      >
                        <span className={`mt-0.5 inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${sevColor[task.severity]}`}>
                          {task.severity === "critical" ? "Kritisk" : task.severity === "high" ? "Høy" : "Medium"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{task.desc}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={task.onClick} className="shrink-0">
                          {task.cta}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <DomainComplianceWidget />
            </TabsContent>

            {/* ── Vurdering ── */}
            <TabsContent value="assessment" className="mt-6 space-y-5">
              <MSPAssessmentCard
                customerId={customerId!}
                assessmentScore={customer.initial_assessment_score}
              />
              <SecurityServiceGapCard assessmentResponses={customer.assessment_responses || null} />
            </TabsContent>

            {/* ── Tjenester ── */}
            <TabsContent value="services" className="mt-6 space-y-5">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Server className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Acronis-status</h3>
                </div>
                {customer.has_acronis_integration ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4 text-success" />
                      <span className="text-sm text-foreground">Tilkoblet</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {customer.acronis_device_count || 0}
                      <span className="text-sm font-normal text-muted-foreground ml-1">enheter beskyttet</span>
                    </p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setAcronisOpen(true)}>
                      <RefreshCw className="h-3 w-3" />
                      Synkroniser på nytt
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Wifi className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">Acronis ikke tilkoblet</p>
                    <p className="text-xs text-muted-foreground mt-1">Koble til for å importere enheter og backup-status</p>
                    <Button size="sm" className="mt-3 gap-2" onClick={() => setAcronisOpen(true)}>
                      <Server className="h-4 w-4" />
                      Koble til Acronis
                    </Button>
                  </div>
                )}
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <StatusOverviewWidget />
                <CriticalTasksWidget />
              </div>
            </TabsContent>

            {/* ── Trust Profile ── */}
            <TabsContent value="trust-profile" className="mt-6">
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Trust Profile</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Se kundens compliance-status, dokumenter og sertifikater samlet i Trust Profile.
                </p>
                <Button size="sm" className="gap-2" onClick={() => navigate(`/msp-dashboard/${customerId}/trust-profile`)}>
                  <ShieldCheck className="h-4 w-4" />
                  Se full Trust Profile
                </Button>
              </Card>
            </TabsContent>

            {/* ── NIS2 ── */}
            <TabsContent value="nis2" className="mt-6">
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">NIS2-vurdering</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Start eller se status på NIS2-kartlegging for kundens enheter og systemer.
                </p>
                <Button size="sm" className="gap-2" onClick={() => navigate(`/msp-dashboard/${customerId}/nis2`)}>
                  <Shield className="h-4 w-4" />
                  {customer.active_frameworks?.includes("NIS2") ? "Se NIS2-vurdering" : "Start NIS2-vurdering"}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <AcronisConnectDialog
          open={acronisOpen}
          onOpenChange={setAcronisOpen}
          customerId={customerId!}
          customerName={customer.customer_name}
        />
      </main>
    </div>
  );
}
