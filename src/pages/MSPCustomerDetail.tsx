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

import { MSPAssessmentCard } from "@/components/msp/MSPAssessmentCard";
import { AcronisConnectDialog } from "@/components/msp/AcronisConnectDialog";
import { SecurityServiceGapCard } from "@/components/msp/SecurityServiceGapCard";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import type { LaraPlanTask } from "@/components/lara/types";
import { MSPCustomerSnapshotCard } from "@/components/msp/MSPCustomerSnapshotCard";
import { MSPCustomerOpportunityCard } from "@/components/msp/MSPCustomerOpportunityCard";
import { MSPMaturityServiceMatrix } from "@/components/msp/MSPMaturityServiceMatrix";
import { MSPCustomerTrustProfileCard } from "@/components/msp/MSPCustomerTrustProfileCard";
import { MSPCustomerMessagesTab } from "@/components/msp/MSPCustomerMessagesTab";
import { SendTrustHandoverEmailDialog } from "@/components/msp/SendTrustHandoverEmailDialog";
import { QuestionnaireDispatchCard } from "@/components/msp/QuestionnaireDispatchCard";
import { QuestionnaireGapList } from "@/components/msp/QuestionnaireGapList";
import { useQuestionnaireDeliveries, scoreDelivery } from "@/hooks/useQuestionnaireDeliveries";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EyeOff, Clock as ClockIcon, ArrowRight } from "lucide-react";

export default function MSPCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [acronisOpen, setAcronisOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("guidance");
  const [trustHandoverSent, setTrustHandoverSent] = useState(false);
  const [handoverEmailOpen, setHandoverEmailOpen] = useState(false);
  const [hiddenIssuesOpen, setHiddenIssuesOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);

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

  const { deliveries: questionnaireDeliveries } = useQuestionnaireDeliveries();




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
    !trustHandoverSent && {
      severity: "critical" as const,
      title: "Kunden har ikke overtatt sin Trust Profile",
      desc: "Send en e-post til kunden og be dem overta og signere Trust Profile selv.",
      cta: "Send e-post",
      onClick: () => setHandoverEmailOpen(true),
    },
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
  ].filter(Boolean) as Array<{ severity: "critical" | "high" | "medium"; title: string; desc: string; cta: string; onClick: () => void }>;

  const planTasks: LaraPlanTask[] = tasks.map((t, i) => ({
    id: `msp-task-${i}-${t.title}`,
    severity: t.severity,
    title: t.title,
    insight: t.desc,
    primaryCtaLabelNb: t.cta,
    primaryCtaLabelEn: t.cta,
  }));
  const criticalCount = planTasks.filter(t => t.severity === "critical").length;

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
                  Tjenester
                </TabsTrigger>
                <TabsTrigger value="messages" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Meldinger
                </TabsTrigger>
                <TabsTrigger value="trust-profile" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Trust Profile
                </TabsTrigger>
              </TabsList>
            </nav>

            {/* ── Veiledning fra Mynder ── */}
            <TabsContent value="guidance" className="mt-6 space-y-5">
              {planTasks.length > 0 ? (
                <LaraRecommendationBanner
                  totalCount={planTasks.length}
                  criticalCount={criticalCount}
                  tasks={planTasks}
                  hideDismiss
                  onPrimaryAction={(t) => {
                    const idx = planTasks.findIndex(p => p.id === t.id);
                    tasks[idx]?.onClick();
                  }}
                />
              ) : (
                <Card className="p-5 border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-semibold text-foreground">Ingen åpne oppgaver</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Kunden er i god rute — Lara overvåker situasjonen.</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* 1) Partner-snapshot — bruker reelle svar når kunden har fullført spørreskjema */}
              {(() => {
                const completed = questionnaireDeliveries
                  .filter((d) => d.customerId === customerId && d.status === "completed")
                  .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];

                const realScore = completed
                  ? scoreDelivery(completed, getQuestionnaire(completed.questionnaireId).totalQuestions)
                  : null;
                const base = customer.initial_assessment_score || 0;
                const overall = realScore ?? Math.min(100, Math.round(base));
                return (
                  <MSPCustomerSnapshotCard
                    customerName={customer.name || "kunden"}
                    overallMaturity={overall}
                    deltaPct={overall >= 60 ? 4 : -3}
                    criticalGaps={tasks.filter(t => t.severity === "critical").length}
                    hiddenIssues={3}
                    nextDeadlineDays={14}
                    nextDeadlineLabel="NIS2 Art.23"
                    sourceLabel={realScore != null ? `${getQuestionnaire(completed!.questionnaireId).title} (kunde-svar)` : undefined}
                  />
                );
              })()}

              {/* 2) Spørreskjema-tjenester — bestill kartlegging fra kunden */}
              <QuestionnaireDispatchCard
                customerId={customerId!}
                customerName={customer.name || "kunden"}
              />

              {/* 3) Lara-gap fra siste fullførte skjema */}
              <QuestionnaireGapList
                customerId={customerId!}
                onProposeService={(serviceId, source) =>
                  toast.info(`Foreslår "${serviceId}" basert på ${source}`, {
                    description: "Åpner tilbudsverktøy i neste iterasjon.",
                  })
                }
              />

              {/* 4) Inntekts- og tjenestepotensial */}
              <MSPCustomerOpportunityCard
                customerName={customer.name || "kunden"}
                customerCoveragePct={Math.min(100, Math.round(customer.initial_assessment_score || 40))}
                onCreateOffer={() => toast.info("Åpner tilbudsverktøy …")}
              />
            </TabsContent>

            {/* ── Vurdering ── */}
            <TabsContent value="assessment" className="mt-6 space-y-5">
              <MSPMaturityServiceMatrix />
            </TabsContent>

            {/* ── Tjenester ── */}
            {/* Removed */}

            {/* ── Trust Profile ── */}
            <TabsContent value="trust-profile" className="mt-6">
              <MSPCustomerTrustProfileCard
                customerName={customer.name || "Kunden"}
                contactName={customer.contact_name || "kontaktperson"}
                contactEmail={customer.contact_email}
              />
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <MSPCustomerMessagesTab />
            </TabsContent>

          </Tabs>
        </div>

        <AcronisConnectDialog
          open={acronisOpen}
          onOpenChange={setAcronisOpen}
          customerId={customerId!}
          customerName={customer.customer_name}
        />

        <SendTrustHandoverEmailDialog
          open={handoverEmailOpen}
          onOpenChange={setHandoverEmailOpen}
          recipientEmail={customer.contact_email}
          recipientName={customer.contact_name}
          customerName={customer.customer_name || customer.name}
          onSend={() => {
            setHandoverEmailOpen(false);
            setTrustHandoverSent(true);
            toast.success("E-post sendt", {
              description: `Invitasjon sendt til ${customer.contact_email || customer.name} om å overta Trust Profile.`,
            });
          }}
        />
      </main>
    </div>
  );
}
