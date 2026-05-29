import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Server, Wifi, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Shield, EyeOff, Clock as ClockIcon, ArrowRight } from "lucide-react";
import { CustomerStatusBanner } from "@/components/msp/CustomerStatusBanner";
import { StatusOverviewWidget } from "@/components/widgets/StatusOverviewWidget";
import { CriticalTasksWidget } from "@/components/widgets/CriticalTasksWidget";

import { MSPAssessmentCard } from "@/components/msp/MSPAssessmentCard";
import { AcronisConnectDialog } from "@/components/msp/AcronisConnectDialog";
import { SecurityServiceGapCard } from "@/components/msp/SecurityServiceGapCard";
import { LaraRecommendationBanner } from "@/components/lara/LaraRecommendationBanner";
import type { LaraPlanTask } from "@/components/lara/types";
import { MSPCustomerSnapshotCard } from "@/components/msp/MSPCustomerSnapshotCard";

import { MSPMaturityServiceMatrix } from "@/components/msp/MSPMaturityServiceMatrix";
import { MSPCustomerTrustProfileCard } from "@/components/msp/MSPCustomerTrustProfileCard";
import { MSPCustomerMessagesTab } from "@/components/msp/MSPCustomerMessagesTab";
import { MSPCustomerRegulationsTab } from "@/components/msp/MSPCustomerRegulationsTab";
import { SendTrustHandoverEmailDialog } from "@/components/msp/SendTrustHandoverEmailDialog";
import { QuestionnaireDispatchCard } from "@/components/msp/QuestionnaireDispatchCard";
import { QuestionnaireGapList } from "@/components/msp/QuestionnaireGapList";
import { BaselineReadinessCard } from "@/components/msp/BaselineReadinessCard";
import { BaselineQuestionsDrawer } from "@/components/msp/BaselineQuestionsDrawer";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { RegulationGapAnalysisCard } from "@/components/msp/RegulationGapAnalysisCard";
import { useQuestionnaireDeliveries, scoreDelivery } from "@/hooks/useQuestionnaireDeliveries";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ClipboardCheck, X as XIcon } from "lucide-react";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";


export default function MSPCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [acronisOpen, setAcronisOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "guidance";
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && t !== activeTab) setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const handleTabChange = (v: string) => {
    setActiveTab(v);
    const next = new URLSearchParams(searchParams);
    next.set("tab", v);
    setSearchParams(next, { replace: true });
  };
  const [trustHandoverSent, setTrustHandoverSent] = useState(false);
  const [handoverEmailOpen, setHandoverEmailOpen] = useState(false);
  const [hiddenIssuesOpen, setHiddenIssuesOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [verifyContext, setVerifyContext] = useState<{
    frameworkId: string;
    frameworkName: string;
    serviceId: string;
  } | null>(null);
  const startGapRef = useRef<() => void>(() => {});
  const [baselineDrawer, setBaselineDrawer] = useState<{ open: boolean; review: boolean }>({ open: false, review: false });
  const { answers: baselineAnswers, setAnswer: setBaselineAnswer, areaProgress, totalAnswered, totalQuestions } = useCustomerBaseline(customerId);

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

  // Aktiverte regelverk for kunden — kombiner DB-felt og localStorage (Regelverk-fanen)
  const activeFrameworkIds = useMemo(() => {
    const fromDb = (customer?.active_frameworks || []) as string[];
    const ids = new Set<string>();
    for (const n of fromDb) {
      const norm = String(n).toLowerCase().replace(/[\s/-]/g, "");
      const match = ALL_FRAMEWORKS.find((f) => {
        const fn = f.name.toLowerCase().replace(/[\s/-]/g, "");
        const fid = f.id.toLowerCase().replace(/[\s/-]/g, "");
        return fn.includes(norm) || norm.includes(fid) || fid === norm;
      });
      if (match) ids.add(match.id);
    }
    try {
      const raw = customerId ? localStorage.getItem("msp.customer.activatedFrameworks." + customerId) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const id = typeof item === "string" ? item : item?.id;
            if (id) ids.add(id);
          }
        }
      }
    } catch {}
    return Array.from(ids);
  }, [customer?.active_frameworks, customerId]);






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
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
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
                <TabsTrigger value="regulations" className="text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-1.5">
                  Regelverk
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

              {/* 1) Baseline-gate */}
              <BaselineReadinessCard
                areaProgress={areaProgress}
                totalAnswered={totalAnswered}
                totalQuestions={totalQuestions}
                activeFrameworkCount={activeFrameworkIds.length}
                onFillBaseline={() => setBaselineDrawer({ open: true, review: false })}
                onReviewBaseline={() => setBaselineDrawer({ open: true, review: true })}
                onGoToRegulations={() => handleTabChange("regulations")}
                onStartGapAnalysis={() => startGapRef.current()}
              />

              <BaselineQuestionsDrawer
                open={baselineDrawer.open}
                onOpenChange={(open) => setBaselineDrawer((s) => ({ ...s, open }))}
                customerName={customer.name || "kunden"}
                answers={baselineAnswers}
                onAnswer={setBaselineAnswer}
                reviewMode={baselineDrawer.review}
              />

              {/* 2) Gap-analyse pr regelverk — Lara */}
              {activeFrameworkIds.length > 0 && (
                <RegulationGapAnalysisCard
                  customerId={customerId!}
                  activeFrameworkIds={activeFrameworkIds}
                  registerStartHandler={(h) => { startGapRef.current = h; }}
                  onVerifyWithQuestionnaire={(frameworkId, frameworkName, serviceId) => {
                    setVerifyContext({ frameworkId, frameworkName, serviceId });
                    setTimeout(() => {
                      document.getElementById("questionnaire-dispatch-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                  }}
                />
              )}

              {/* 3) Spørreskjema — verifiser Laras funn */}
              <div id="questionnaire-dispatch-anchor" className="scroll-mt-24 space-y-3">
                {verifyContext && (
                  <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <ClipboardCheck className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-sm text-foreground flex-1">
                      Verifiserer gap-analyse for <span className="font-medium">{verifyContext.frameworkName}</span> — bruk et spørreskjema for å bekrefte Laras funn hos kunden.
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 shrink-0"
                      onClick={() => setVerifyContext(null)}
                      aria-label="Lukk verifiseringsmelding"
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <QuestionnaireDispatchCard
                  customerId={customerId!}
                  customerName={customer.name || "kunden"}
                />
              </div>

              {/* 4) Lara-gap fra siste fullførte skjema */}
              <div id="gap-list-anchor" className="scroll-mt-24 transition-all">
                <QuestionnaireGapList
                  customerId={customerId!}
                  onProposeService={(serviceId, source) =>
                    toast.info(`Foreslår "${serviceId}" basert på ${source}`, {
                      description: "Åpner tilbudsverktøy i neste iterasjon.",
                    })
                  }
                />
              </div>

            </TabsContent>

            {/* ── Vurdering ── */}
            <TabsContent value="assessment" className="mt-6 space-y-5">
              <MSPMaturityServiceMatrix
                customerName={customer.name || "Kunden"}
                customerEmail={customer.contact_email ?? undefined}
              />
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

            <TabsContent value="regulations" className="mt-6">
              <MSPCustomerRegulationsTab
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
                customer={{
                  industry: customer.industry,
                  employees: customer.employees,
                  country_code: customer.country_code,
                  active_frameworks: customer.active_frameworks,
                  compliance_score: customer.compliance_score,
                }}
              />
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

        {/* Skjulte saker – kun synlig for partner */}
        <Dialog open={hiddenIssuesOpen} onOpenChange={setHiddenIssuesOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <EyeOff className="h-4 w-4 text-warning" />
                Skjulte saker – kun synlig for partner
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                Disse observasjonene har Mynder gjort på vegne av deg, men kunden ser dem ikke i sin egen Trust Profile. Bruk dem som grunnlag for veiledning eller nye tilbud.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2.5 py-1">
              {[
                { title: "DKIM ikke konfigurert for hoveddomenet", desc: "Risiko for e-postforfalskning. Anbefal å aktivere DKIM + DMARC." },
                { title: "Ingen MFA på admin-konto i Microsoft 365", desc: "Oppdaget via discovery 11. mai. Bør lukkes umiddelbart." },
                { title: "Manglende databehandleravtale med 1 leverandør", desc: "Synes ikke i kundens vendor-liste – Mynder fant den via integrasjon." },
              ].map((i, idx) => (
                <li key={idx} className="rounded-lg border border-border p-3">
                  <p className="text-[13px] font-medium text-foreground">{i.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{i.desc}</p>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setHiddenIssuesOpen(false)}>Lukk</Button>
              <Button onClick={() => { setHiddenIssuesOpen(false); navigate(`/msp-dashboard/${customerId}/trust-profile`); }} className="gap-1.5">
                Åpne Trust Profile <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saker knyttet til neste frist */}
        <Dialog open={deadlineOpen} onOpenChange={setDeadlineOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <ClockIcon className="h-4 w-4 text-primary" />
                Neste frist – NIS2 Art. 23
              </DialogTitle>
              <DialogDescription className="text-[13px]">
                14 dager til frist. Disse sakene må være håndtert for at kunden skal være compliant.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2.5 py-1">
              {[
                { title: "Dokumentert hendelsesrapporteringsrutine til myndigheter", ref: "Art. 23(1)" },
                { title: "24-timers tidlig varsling-prosedyre", ref: "Art. 23(4)(a)" },
                { title: "72-timers full hendelsesrapport-mal", ref: "Art. 23(4)(b)" },
              ].map((g, idx) => (
                <li key={idx} className="rounded-lg border border-border p-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">{g.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{g.ref}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-destructive shrink-0">Åpen</span>
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeadlineOpen(false)}>Lukk</Button>
              <Button onClick={() => { setDeadlineOpen(false); navigate(`/msp-dashboard/${customerId}/nis2`); }} className="gap-1.5">
                Åpne NIS2-arbeidsområde <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
