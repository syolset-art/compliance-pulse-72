import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Server, Wifi, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Shield, EyeOff, Clock as ClockIcon, ArrowRight, HelpCircle, FileText, MessageSquare, BookOpen, Scale, Zap, Target, Users, ClipboardList, Lightbulb } from "lucide-react";
import { ContextualHelpPanel } from "@/components/shared/ContextualHelpPanel";
import { usePageHelpListener } from "@/hooks/usePageHelpListener";
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
import { PartnerActionMenu } from "@/components/msp/PartnerActionMenu";
import { MandateConfirmDialog, useMandate } from "@/components/msp/PartnerMandateCard";
import { MSPCustomerMessagesTab } from "@/components/msp/MSPCustomerMessagesTab";
import { MSPCustomerRegulationsTab } from "@/components/msp/MSPCustomerRegulationsTab";
import { SendTrustHandoverEmailDialog } from "@/components/msp/SendTrustHandoverEmailDialog";
import { QuestionnaireDispatchCard } from "@/components/msp/QuestionnaireDispatchCard";
import { TakeoverTrustProfileCard } from "@/components/msp/TakeoverTrustProfileCard";
import { TrustProfileTakeoverInfoDialog } from "@/components/msp/TrustProfileTakeoverInfoDialog";
import { BaselineReadinessCard } from "@/components/msp/BaselineReadinessCard";
import { BaselineQuestionsDrawer } from "@/components/msp/BaselineQuestionsDrawer";
import { CustomerDocumentationTab } from "@/components/msp/CustomerDocumentationTab";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { MATURITY_AREAS, type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";

import { useQuestionnaireDeliveries, scoreDelivery } from "@/hooks/useQuestionnaireDeliveries";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
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
  const [takeoverInfoOpen, setTakeoverInfoOpen] = useState(false);
  const [handoverEmailOpen, setHandoverEmailOpen] = useState(false);
  const [hiddenIssuesOpen, setHiddenIssuesOpen] = useState(false);
  const [deadlineOpen, setDeadlineOpen] = useState(false);
  const [baselineDrawer, setBaselineDrawer] = useState<{ open: boolean; review: boolean }>({ open: false, review: false });
  const [isLaraSuggesting, setIsLaraSuggesting] = useState(false);
  const [mandateDialogOpen, setMandateDialogOpen] = useState(false);
  const mandate = useMandate(customerId || "");
  const { answers: baselineAnswers, setAnswer: setBaselineAnswer, setAllAnswers: setAllBaselineAnswers, laraRationales: baselineRationales, setLaraRationales: setBaselineRationales, areaProgress, totalAnswered, totalQuestions } = useCustomerBaseline(customerId);


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
    // GDPR er alltid inkludert gratis som baseline når kunden er invitert
    ids.add("gdpr");
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
    mandate !== "confirmed" && {
      severity: "critical" as const,
      title: mandate === "requested"
        ? "Venter på fullmakt fra kunden"
        : "Bekreft mandat for å jobbe i kundens profil",
      desc: mandate === "requested"
        ? "Fullmakt er sendt til kunden. Du kan også bekrefte direkte at dere har avtale."
        : "For å jobbe i kundens Trust Profile må du ha fullmakt — enten via signert leveranseavtale, eller ved å be kunden bekrefte direkte.",
      cta: mandate === "requested" ? "Bekreft avtale i stedet" : "Bekreft mandat",
      onClick: () => setMandateDialogOpen(true),
    },
    !trustHandoverSent && {
      severity: "critical" as const,
      title: "Kunden har ikke overtatt sin Trust Profile",
      desc: "Send en e-post til kunden og be dem overta og signere Trust Profile selv.",
      cta: "Send e-post",
      onClick: () => setHandoverEmailOpen(true),
      readMoreLabel: "Les mer",
      onReadMore: () => setTakeoverInfoOpen(true),
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
  ].filter(Boolean) as Array<{ severity: "critical" | "high" | "medium"; title: string; desc: string; cta: string; onClick: () => void; readMoreLabel?: string; onReadMore?: () => void }>;

  const planTasks: LaraPlanTask[] = tasks.map((t, i) => ({
    id: `msp-task-${i}-${t.title}`,
    severity: t.severity,
    title: t.title,
    insight: t.desc,
    primaryCtaLabelNb: t.cta,
    primaryCtaLabelEn: t.cta,
    readMoreCtaLabelNb: t.readMoreLabel,
    readMoreCtaLabelEn: t.readMoreLabel,
  }));
  const criticalCount = planTasks.filter(t => t.severity === "critical").length;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Button variant="ghost" onClick={() => navigate("/msp-dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Tilbake til partneroversikt
            </Button>
            <PartnerActionMenu
              customerId={customerId!}
              customerName={customer.name || customer.customer_name || "Kunden"}
              onSwitchTab={handleTabChange}
              recommendedKinds={
                tasks.length > 0
                  ? (tasks[0]?.title?.toLowerCase().includes("vurdering")
                      ? ["assessment", "evidence"]
                      : ["evidence", "lara"])
                  : ["evidence"]
              }
            />
          </div>

          {/* Customer status banner — same template as vendor */}
          <CustomerStatusBanner customer={customer} />

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full min-w-0">
            <nav aria-label="Kunde-faner" className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="flex bg-muted/30 border border-border rounded-xl p-1 h-auto gap-0.5 min-w-0" role="tablist">
                <TabsTrigger value="guidance" className="relative text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Veiledning fra Mynder
                  {tasks.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="assessment" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Tjenester
                </TabsTrigger>
                <TabsTrigger value="messages" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Meldinger
                </TabsTrigger>
                <TabsTrigger value="trust-profile" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Trust Profile
                </TabsTrigger>
                <TabsTrigger value="documentation" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Dokumentasjon
                </TabsTrigger>
                <TabsTrigger value="regulations" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
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
                  onReadMore={(t) => {
                    const idx = planTasks.findIndex(p => p.id === t.id);
                    tasks[idx]?.onReadMore?.();
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
                onFillBaseline={() => setBaselineDrawer({ open: true, review: false })}
                onReviewBaseline={() => setBaselineDrawer({ open: true, review: true })}
                onGoToRegulations={() => handleTabChange("regulations")}
                isLaraSuggesting={isLaraSuggesting}
                onLaraSuggest={async () => {
                  if (!customer) return;
                  setIsLaraSuggesting(true);
                  try {
                    const { data, error } = await supabase.functions.invoke("suggest-baseline-answers", {
                      body: {
                        customerName: customer.name || "Kunden",
                        customerDomain: (customer as { domain?: string }).domain,
                        industry: (customer as { industry?: string }).industry,
                        areas: MATURITY_AREAS.map((a) => ({
                          id: a.id,
                          title: a.title,
                          questions: a.questions.map((q) => ({ id: q.id, text: q.text, article: q.article })),
                        })),
                      },
                    });
                    if (error) throw error;
                    const suggestions = (data as { suggestions?: { question_id: string; answer: MaturityAnswer; rationale?: string }[] })?.suggestions ?? [];
                    if (suggestions.length === 0) {
                      toast.error("Lara kunne ikke foreslå svar akkurat nå");
                      return;
                    }
                    const next: MaturityAnswers = {};
                    const rationales: Record<string, string> = {};
                    for (const s of suggestions) {
                      next[s.question_id] = s.answer;
                      if (s.rationale) rationales[s.question_id] = s.rationale;
                    }
                    setAllBaselineAnswers(next);
                    setBaselineRationales(rationales);
                    toast.success(`Lara foreslo ${suggestions.length} svar`, {
                      description: "Gå gjennom og bekreft hvert svar.",
                    });
                    setBaselineDrawer({ open: true, review: true });
                  } catch (e) {
                    console.error("Lara baseline suggestion failed", e);
                    toast.error("Klarte ikke hente forslag fra Lara");
                  } finally {
                    setIsLaraSuggesting(false);
                  }
                }}
              />


              <BaselineQuestionsDrawer
                open={baselineDrawer.open}
                onOpenChange={(open) => setBaselineDrawer((s) => ({ ...s, open }))}
                customerName={customer.name || "kunden"}
                answers={baselineAnswers}
                onAnswer={setBaselineAnswer}
                reviewMode={baselineDrawer.review}
                laraRationales={baselineRationales}
              />

              {/* 2) Spørreskjema til kunden */}
              <QuestionnaireDispatchCard
                customerId={customerId!}
                customerName={customer.name || "kunden"}
              />

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
                customerId={customerId!}
                customerName={customer.name || "Kunden"}
                contactName={customer.contact_name || "kontaktperson"}
                contactEmail={customer.contact_email}
                activeFrameworkIds={activeFrameworkIds}
              />
            </TabsContent>


            <TabsContent value="messages" className="mt-6">
              <MSPCustomerMessagesTab />
            </TabsContent>

            <TabsContent value="documentation" className="mt-6">
              <CustomerDocumentationTab
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
              />
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

        <MandateConfirmDialog
          open={mandateDialogOpen}
          onOpenChange={setMandateDialogOpen}
          customerId={customerId!}
          customerName={customer.name || customer.customer_name || "kunden"}
          contactName={customer.contact_name}
          contactEmail={customer.contact_email}
        />

        <TrustProfileTakeoverInfoDialog
          open={takeoverInfoOpen}
          onOpenChange={setTakeoverInfoOpen}
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
                    <p className="text-[12px] text-muted-foreground mt-0.5">{g.ref}</p>
                  </div>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-destructive shrink-0">Åpen</span>
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
