import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Server, Wifi, RefreshCw, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Shield, EyeOff, Clock as ClockIcon, ArrowRight, HelpCircle, FileText, MessageSquare, BookOpen, Scale, Zap, Target, ClipboardList, Users, Lightbulb } from "lucide-react";
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
import { CustomerModulesTab } from "@/components/msp/CustomerModulesTab";
import { CustomerServicesAndProductsTab } from "@/components/msp/CustomerServicesAndProductsTab";

import { CustomerDeliveriesTab } from "@/components/msp/deliveries/CustomerDeliveriesTab";
import { useCustomerBaseline } from "@/hooks/useCustomerBaseline";
import { type MaturityAnswer, type MaturityAnswers } from "@/lib/trustMaturityQuestions";

import { useQuestionnaireDeliveries, scoreDelivery } from "@/hooks/useQuestionnaireDeliveries";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { frameworks as ALL_FRAMEWORKS } from "@/lib/frameworkDefinitions";

import { CustomerRecommendationsCard } from "@/components/msp/guidance/CustomerRecommendationsCard";
import { CustomerMaturityMirrorCard } from "@/components/msp/guidance/CustomerMaturityMirrorCard";
import { useCustomerOnboardingFindings } from "@/hooks/useCustomerOnboardingFindings";
import { ActivateRecommendationsDialog } from "@/components/msp/ActivateRecommendationsDialog";
import type { OfferSuggestion } from "@/lib/offerSuggestions";

import { MSPCreateOfferDialog } from "@/components/msp/MSPCreateOfferDialog";
import { useSavedOffers } from "@/lib/customerOffers";
import type { FrameworkRecommendation } from "@/lib/regulationRecommender";


export default function MSPCustomerDetail() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [acronisOpen, setAcronisOpen] = useState(false);
  const [offerItems, setOfferItems] = useState<OfferSuggestion[] | null>(null);
  const [activateItems, setActivateItems] = useState<OfferSuggestion[] | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const normalizeTab = (v: string) => (v === "modules" ? "assessment" : v);
  const initialTab = normalizeTab(searchParams.get("tab") || "guidance");
  const [activeTab, setActiveTab] = useState(initialTab);
  useEffect(() => {
    const t = normalizeTab(searchParams.get("tab") || "guidance");
    if (t && t !== activeTab) setActiveTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  const handleTabChange = (raw: string) => {
    const v = normalizeTab(raw);
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
  const [baselineDrawer, setBaselineDrawer] = useState<{ open: boolean; review: boolean; mode?: "partner" | "meeting" }>({ open: false, review: false, mode: "partner" });
  const [isLaraSuggesting, setIsLaraSuggesting] = useState(false);
  const [mandateDialogOpen, setMandateDialogOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  usePageHelpListener(setHelpOpen);
  const mandate = useMandate(customerId || "");
  const { answers: baselineAnswers, setAnswer: setBaselineAnswer, setAllAnswers: setAllBaselineAnswers, laraRationales: baselineRationales, setLaraRationales: setBaselineRationales, areaProgress, totalAnswered, totalQuestions, hasAnyAnswer } = useCustomerBaseline(customerId);
  const { privacyPolicyUrl } = useCustomerOnboardingFindings(customerId);
  const [offerDialog, setOfferDialog] = useState<{ open: boolean; templateId?: string; title?: string }>({ open: false });
  const { getLockInfo } = useSavedOffers();


  const queryClient = useQueryClient();
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
    {
      severity: "medium" as const,
      category: "Rolle · Driftspartner",
      title: "Driftspartner: jobb med compliance på vegne av kunden",
      desc: "Som driftspartner kan du utføre compliance-arbeid på vegne av kunden. Når du aktiverer et produkt eller en tjeneste hos kunden, får du mulighet til å utføre arbeidet direkte i kundens egen virksomhetsprofil.",
      cta: "Se produkter og tjenester",
      onClick: () => handleTabChange("assessment"),
    },
    !trustHandoverSent && {
      severity: "critical" as const,
      category: "Kundeinvitasjon",
      title: "Kunden har ikke overtatt sin Trust Profile",
      desc: "Send en e-post til kunden og be dem overta og signere Trust Profile selv.",
      cta: "Send e-post",
      onClick: () => setHandoverEmailOpen(true),
      readMoreLabel: "Les mer",
      onReadMore: () => setTakeoverInfoOpen(true),
      canAutoRun: true,
      autoRunLabel: "La Lara sende invitasjon",
      autoRunMessage: "Lara sender en personlig invitasjon til kontaktpersonen og følger opp etter 3 dager om det ikke kommer svar.",
    },
    !customer.has_acronis_integration && {
      severity: "high",
      category: "Integrasjon · Backup",
      title: "Koble til Acronis",
      desc: "Importer enheter og backup-status for kunden.",
      cta: "Koble til manuelt",
      onClick: () => setAcronisOpen(true),
      canAutoRun: true,
      autoRunLabel: "La Lara koble til",
      autoRunMessage: "Lara henter Acronis-tenanten via partner-API-et, mapper enhetene til kundens systemregister og importerer backup-status.",
    },
    totalAnswered < totalQuestions && {
      severity: "critical",
      category: "Modenhet · Baseline",
      title: "Baseline-kartlegging",
      desc: `Kartlegg modenhet sammen med kunden — grunnlaget for Trust Profile og gap-analyse. ${totalAnswered}/${totalQuestions} besvart.`,
      cta: "Start kartlegging",
      onClick: () => setBaselineDrawer({ open: true, review: false, mode: "meeting" }),
      infoGap: "Vurderingen krever at en hos partner svarer på spørsmålene basert på kundens drift. Lara kan ikke gjette dette.",
    },

    !customer.active_frameworks?.includes("NIS2") && {
      severity: "medium",
      category: "Regelverk · NIS2",
      title: "Start NIS2-vurdering",
      desc: "Kunden er ikke kartlagt mot NIS2-rammeverket ennå.",
      cta: "Start manuelt",
      onClick: () => navigate(`/msp-dashboard/${customerId}/nis2`),
      canAutoRun: true,
      autoRunLabel: "La Lara gjøre NIS2-vurdering",
      autoRunMessage: "Lara genererer et førsteutkast til NIS2-gap basert på baseline, Acronis-data og kundens systemregister. Partner får utkastet til gjennomgang.",
      infoGap: !customer.has_acronis_integration || !customer.initial_assessment_score
        ? "Lara har lite å gå på for denne kunden ennå — uten Acronis-data og innledende vurdering blir NIS2-utkastet svært generisk."
        : undefined,
      prerequisiteHint: !customer.has_acronis_integration
        ? "Koble til Acronis først, eller be partner fylle inn baseline-spørsmålene."
        : !customer.initial_assessment_score
        ? "Fullfør innledende vurdering først, så blir NIS2-analysen mye mer treffsikker."
        : undefined,
    },
    !customer.onboarding_completed && {
      severity: "medium",
      category: "Onboarding",
      title: "Fullfør onboarding",
      desc: "Inviter kunden og overlevér Trust Profile.",
      cta: "Inviter kunde",
      onClick: () => {},
    },
  ].filter(Boolean) as Array<{
    severity: "critical" | "high" | "medium";
    category: string;
    title: string;
    desc: string;
    cta: string;
    onClick: () => void;
    readMoreLabel?: string;
    onReadMore?: () => void;
    canAutoRun?: boolean;
    autoRunLabel?: string;
    autoRunMessage?: string;
    infoGap?: string;
    prerequisiteHint?: string;
  }>;

  const planTasks: LaraPlanTask[] = tasks.map((t, i) => ({
    id: `msp-task-${i}-${t.title}`,
    severity: t.severity,
    title: t.title,
    category: t.category,
    insight: t.desc,
    primaryCtaLabelNb: t.cta,
    primaryCtaLabelEn: t.cta,
    readMoreCtaLabelNb: t.readMoreLabel,
    readMoreCtaLabelEn: t.readMoreLabel,
    canAutoRun: t.canAutoRun,
    autoRunLabelNb: t.autoRunLabel,
    autoRunLabelEn: t.autoRunLabel,
    autoRunExplainerNb: t.autoRunMessage,
    autoRunExplainerEn: t.autoRunMessage,
    infoGapNb: t.infoGap,
    infoGapEn: t.infoGap,
    prerequisiteHintNb: t.prerequisiteHint,
    prerequisiteHintEn: t.prerequisiteHint,
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
          <CustomerStatusBanner
            customer={customer}
            onUpdate={() => queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] })}
          />

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
                  Tjenester og produkter

                </TabsTrigger>
                <TabsTrigger value="messages" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Meldinger
                </TabsTrigger>
                <TabsTrigger value="documentation" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Dokumentasjon
                </TabsTrigger>
                <TabsTrigger value="regulations" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Regelverk
                </TabsTrigger>
                <TabsTrigger value="deliveries" className="text-sm font-medium text-foreground/75 data-[state=active]:text-foreground data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg whitespace-nowrap px-3 py-2">
                  Leveranser
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
                  onLaraAutoRun={(t) => {
                    const idx = planTasks.findIndex(p => p.id === t.id);
                    const task = tasks[idx];
                    if (!task?.canAutoRun) return;
                    toast.success(`Lara har startet: ${task.title}`, {
                      description: task.autoRunMessage ?? "Lara jobber i bakgrunnen og varsler deg når noe krever bekreftelse.",
                      icon: <Sparkles className="h-4 w-4" />,
                      duration: 6000,
                    });
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



              <div id="msp-recommendations">
              <CustomerRecommendationsCard
                customer={customer}
                onOffer={(items) => setOfferItems(items)}
                onActivate={(items) => setActivateItems(items)}
              />
              </div>

              <CustomerMaturityMirrorCard
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
                customerOrgNumber={(customer as any).org_number ?? null}
                areaProgress={areaProgress}
                totalAnswered={totalAnswered}
                totalQuestions={totalQuestions}
                hasBaselineAnswers={hasAnyAnswer}
                privacyPolicyUrl={privacyPolicyUrl}
                onOpenProducts={() => handleTabChange("assessment")}
                onSeeServices={() =>
                  document.getElementById("msp-recommendations")?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                onActivateFrameworks={() => handleTabChange("regulations")}
              />








              {/* TODO: Seksjon "Nye tjenester fra Mynder" plasseres her i senere iterasjon. */}


            </TabsContent>


            {/* ── Tjenester og produkter ── */}
            <TabsContent value="assessment" className="mt-6 space-y-5">
              <CustomerServicesAndProductsTab
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
                customerEmail={customer.contact_email ?? undefined}
                activeFrameworkIds={activeFrameworkIds}
                recommended={((customer?.recommended_frameworks as any) || []) as FrameworkRecommendation[]}
                confirmed={((customer?.confirmed_frameworks as any) || []) as FrameworkRecommendation[]}
                onOpenDeliveries={() => handleTabChange("deliveries")}
                onUpdate={() => queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] })}
              />

            </TabsContent>




            <TabsContent value="messages" className="mt-6">
              <MSPCustomerMessagesTab />
            </TabsContent>

            <TabsContent value="documentation" className="mt-6">
              <CustomerDocumentationTab
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
                activeFrameworkIds={activeFrameworkIds}
                customerUrl={customer.url}
                onGoToRegulations={() => handleTabChange("regulations")}
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


            <TabsContent value="deliveries" className="mt-6">
              <CustomerDeliveriesTab
                customerId={customerId!}
                customerName={customer.name || customer.customer_name || "Kunden"}
                activeFrameworkIds={activeFrameworkIds}
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

        <BaselineQuestionsDrawer
          open={baselineDrawer.open}
          onOpenChange={(open) => setBaselineDrawer((prev) => ({ ...prev, open, review: false }))}
          customerName={customer.name || customer.customer_name || "Kunden"}
          customerId={customer.id}

          answers={baselineAnswers}
          onAnswer={setBaselineAnswer}
          reviewMode={baselineDrawer.review}
          laraRationales={baselineRationales}
          mode={baselineDrawer.mode ?? "partner"}
        />

        {offerItems && offerItems.length > 0 && (
          <MSPCreateOfferDialog
            open={!!offerItems}
            onOpenChange={(o) => !o && setOfferItems(null)}
            customerId={customerId!}
            customerName={customer.name || customer.customer_name || undefined}
            customerContactName={customer.contact_name || undefined}
            serviceTitle={`Anbefalte produkter og tjenester for ${customer.name || customer.customer_name || "kunden"}`}
            offeredServiceNames={offerItems.map((s) => s.label)}
            activeFrameworks={(customer.active_frameworks || []).map((f: any) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""))).filter(Boolean)}
            defaultTasks={offerItems.map((s) => ({ label: s.label, hours: s.hours, owner: "Partner" as const }))}
          />
        )}

        {activateItems && activateItems.length > 0 && (
          <ActivateRecommendationsDialog
            open={!!activateItems}
            onOpenChange={(o) => !o && setActivateItems(null)}
            customerId={customerId!}
            customerName={customer.name || customer.customer_name || "Kunden"}
            items={activateItems}
            activeFrameworks={(customer.active_frameworks || []).map((f: any) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""))).filter(Boolean)}
            activeModules={customer.active_modules || []}
            onActivated={() => {
              setActivateItems(null);
              queryClient.invalidateQueries({ queryKey: ["msp-customer", customerId] });
            }}
            onMoveToOffer={() => {
              setOfferItems(activateItems);
              setActivateItems(null);
            }}
          />
        )}

        <MSPCreateOfferDialog
          open={offerDialog.open}
          onOpenChange={(o) => setOfferDialog((prev) => ({ ...prev, open: o }))}
          customerId={customerId!}
          customerName={customer.name || customer.customer_name || undefined}
          customerContactName={customer.contact_name || undefined}
          serviceTitle={offerDialog.title}
          offeredTemplateIds={offerDialog.templateId ? [offerDialog.templateId] : []}
          activeFrameworks={(customer.active_frameworks || []).map((f: any) => (typeof f === "string" ? f : (f?.label ?? f?.frameworkId ?? ""))).filter(Boolean)}
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
              <Button onClick={() => setHiddenIssuesOpen(false)}>Lukk</Button>
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

        {/* Contextual help panel — innhold tilpasset aktiv fane */}
        {(() => {
          const customerName = customer?.name || customer?.customer_name || "kunden";
          const helpByTab: Record<string, React.ComponentProps<typeof ContextualHelpPanel>> = {
            guidance: {
              open: helpOpen,
              onOpenChange: setHelpOpen,
              icon: Lightbulb,
              title: "Veiledning fra Lara",
              description: `Lara analyserer ${customerName} sin compliance-status og foreslår neste steg. Du som rådgiver kan akseptere, justere eller avvise hvert forslag før det effektueres hos kunden.`,
              itemsHeading: "Slik fungerer det",
              items: [
                { icon: Target, title: "Vurder", description: "Lara ser på modenhet, dokumentasjon og rammeverk for å forstå hvor kunden står." },
                { icon: Sparkles, title: "Foreslå", description: "Lara identifiserer manglene som gir størst risiko eller verdi å lukke først." },
                { icon: ClipboardList, title: "Veilede", description: "Du får konkrete tiltak med begrunnelse og estimat — klart til å presentere kunden." },
                { icon: Zap, title: "Effektuere", description: "Aksepter forslaget for å starte arbeidet, eller send det videre til kunden for godkjenning." },
              ],
              whyTitle: "Hvorfor er dette viktig?",
              whyDescription: "AI-drevet veiledning hjelper deg å levere proaktiv rådgivning i stedet for reaktiv brannslukking — og dokumenterer hvert valg for revisjon.",
              laraSuggestions: [
                { label: "Hva bør jeg prioritere for denne kunden?", message: `Hva bør jeg prioritere for ${customerName} nå?` },
                { label: "Forklar siste anbefaling", message: `Kan du forklare den siste anbefalingen du ga for ${customerName}?` },
              ],
            },
            assessment: {
              open: helpOpen,
              onOpenChange: setHelpOpen,
              icon: Target,
              title: "Modenhet og tjenester",
              description: `Modenhetsmatrisen viser hvor ${customerName} står per kjerneområde (0–4). Lara avleder «Anbefalte tjenester» fra mangler i matrisen og bransjekrav.`,
              itemsHeading: "Slik fungerer det",
              items: [
                { icon: Target, title: "Modenhet 0–4", description: "Hver rad er et kontrollområde. Score genereres fra baseline-svar og opplastet dokumentasjon." },
                { icon: Sparkles, title: "Anbefalte tjenester", description: "Lara foreslår tjenester (NIS2-klargjøring, AI Governance, Pen-test osv.) der gap er størst." },
                { icon: FileText, title: "Baseline-svar", description: "Svar fra dokumentasjon og spørreskjema oppdaterer modenheten automatisk." },
              ],
              whyDescription: "Tydelig modenhetsbilde gjør det enkelt å selge inn relevante tjenester og dokumentere fremgang over tid.",
              laraSuggestions: [
                { label: "Hvilke tjenester gir mest verdi nå?", message: `Hvilke tjenester bør jeg foreslå for ${customerName}?` },
                { label: "Forklar et lavt modenhetsområde", message: `Hvorfor er modenheten lav på et av områdene til ${customerName}?` },
              ],
            },
            messages: {
              open: helpOpen,
              onOpenChange: setHelpOpen,
              icon: MessageSquare,
              title: "Meldinger og kundedialog",
              description: `Her holder du dialog med ${customerName} — forespørsler, godkjenninger og frister samles på ett sted. Lara kan utarbeide utkast til svar.`,
              itemsHeading: "Slik fungerer det",
              items: [
                { icon: MessageSquare, title: "Toveis dialog", description: "Meldinger fra kunden og dine svar lagres samlet med tidsstempel." },
                { icon: ClockIcon, title: "Frister", description: "Meldinger med deadline merkes tydelig så ingenting glipper." },
                { icon: Sparkles, title: "Lara-utkast", description: "Be Lara om å lage et profesjonelt svarutkast du kan justere før sending." },
              ],
              whyDescription: "Sentralisert dialog gir sporbarhet og hindrer at viktige forespørsler havner i e-postinnboksen.",
              laraSuggestions: [
                { label: "Skriv svar til siste melding", message: `Skriv et utkast til svar på den siste meldingen fra ${customerName}` },
                { label: "Oppsummer åpne meldinger", message: `Oppsummer åpne meldinger og frister for ${customerName}` },
              ],
            },
            documentation: {
              open: helpOpen,
              onOpenChange: setHelpOpen,
              icon: FileText,
              title: "Dokumentasjon",
              description: `Last opp ${customerName} sin dokumentasjon — DPA-er, policyer, hendelsesplaner og andre filer. Lara leser dokumentene og bruker dem som grunnlag for baseline-svar, gap-analyse og forslag til tiltak.`,
              itemsHeading: "Slik fungerer det",
              items: [
                { icon: FileText, title: "Forventede dokumenter", description: "Listen viser dokumenttyper som forventes for kundens rammeverk og bransje." },
                { icon: Sparkles, title: "Lara-lesing", description: "Når lese-tilgang er på, henter Lara svar og sitater direkte fra opplastet dokumentasjon." },
                { icon: RefreshCw, title: "Automatisk oppdatering", description: "Når et dokument endres, oppdateres baseline-svarene automatisk." },
              ],
              whyDescription: "Komplett dokumentasjon gir bedre AI-svar, høyere modenhet og raskere revisjon.",
              stepsHeading: "Kom i gang",
              steps: [
                { text: "Skru på «Lese-tilgang» øverst" },
                { text: "Last opp eller be kunden laste opp manglende dokumenter" },
                { text: "Se hvordan modenheten oppdateres i fanen Vurdering" },
              ],
              laraSuggestions: [
                { label: "Hvilke dokumenter mangler?", message: `Hvilke dokumenter mangler for ${customerName}?` },
                { label: "Oppsummer DPA-en", message: `Oppsummer DPA-en til ${customerName} og pek på risikoområder` },
              ],
            },
            regulations: {
              open: helpOpen,
              onOpenChange: setHelpOpen,
              icon: Scale,
              title: "Regelverk",
              description: `Aktiver regelverk og rammeverk som er relevante for ${customerName}. Lara foreslår obligatoriske rammeverk basert på bransje, størrelse og jurisdiksjon.`,
              itemsHeading: "Slik fungerer det",
              items: [
                { icon: ShieldCheck, title: "Obligatorisk", description: "Lovpålagte regelverk (f.eks. GDPR, NIS2) kan ikke deaktiveres." },
                { icon: BookOpen, title: "Anbefalt", description: "Bransjestandarder Lara foreslår — du bestemmer om de skal aktiveres." },
                { icon: ClipboardList, title: "Valgfri", description: "Ekstra rammeverk kunden ønsker å vise modenhet på." },
              ],
              whyDescription: "Riktig sett med rammeverk styrer hvilke krav som måles, hvilken dokumentasjon som forventes og hva som havner i Trust Profile.",
              laraSuggestions: [
                { label: "Hvilke rammeverk er obligatoriske?", message: `Hvilke rammeverk er obligatoriske for ${customerName}?` },
                { label: "Foreslå relevante rammeverk", message: `Foreslå anbefalte rammeverk for ${customerName} basert på bransje og størrelse` },
              ],
            },
          };
          const cfg = helpByTab[activeTab] || helpByTab.guidance;
          return <ContextualHelpPanel {...cfg} />;
        })()}
      </main>
    </div>
  );
}
