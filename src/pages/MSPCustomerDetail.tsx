import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
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
import { MSPCustomerOpportunityCard } from "@/components/msp/MSPCustomerOpportunityCard";
import { MSPMaturityServiceMatrix } from "@/components/msp/MSPMaturityServiceMatrix";
import { MSPCustomerTrustProfileCard } from "@/components/msp/MSPCustomerTrustProfileCard";
import { MSPCustomerMessagesTab } from "@/components/msp/MSPCustomerMessagesTab";
import { MSPCustomerRegulationsTab } from "@/components/msp/MSPCustomerRegulationsTab";
import { SendTrustHandoverEmailDialog } from "@/components/msp/SendTrustHandoverEmailDialog";
import { QuestionnaireDispatchCard } from "@/components/msp/QuestionnaireDispatchCard";
import { QuestionnaireGapList } from "@/components/msp/QuestionnaireGapList";
import { useQuestionnaireDeliveries, scoreDelivery } from "@/hooks/useQuestionnaireDeliveries";
import { getQuestionnaire } from "@/lib/questionnaireRegistry";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";


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

              {/* Partner-snapshot fjernet – overflødig informasjon */}


              {/* 2) Spørreskjema-tjenester — bestill kartlegging fra kunden */}
              <QuestionnaireDispatchCard
                customerId={customerId!}
                customerName={customer.name || "kunden"}
              />

              {/* 3) Lara-gap fra siste fullførte skjema */}
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

              {/* 4) Inntekts- og tjenestepotensial */}
              <MSPCustomerOpportunityCard
                customerName={customer.name || "kunden"}
                customerCoveragePct={Math.min(100, Math.round(customer.initial_assessment_score || 40))}
                onCreateOffer={() => toast.info("Åpner tilbudsverktøy …")}
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
