import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useComplianceRequirements } from "@/hooks/useComplianceRequirements";
import { getMaturityLevel } from "@/lib/certificationPhases";
import {
  ArrowLeft, Shield, Target, BarChart3, Eye,
  Layers, Scale, TrendingUp, AlertTriangle,
  Building2, Workflow, Monitor, FileCheck, ChevronDown,
  Bot, Users, UserCheck, Share2, ShieldCheck, Fingerprint,
} from "lucide-react";

const MaturityMethodology = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";

  const { stats } = useComplianceRequirements();
  const progressPercent = stats.progressPercent;
  const currentMaturity = getMaturityLevel(progressPercent);

  const t = (no: string, en: string) => lang === "en" ? en : no;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">

          {/* Back */}
          <Button variant="ghost" onClick={() => navigate("/resources")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t("Tilbake til Ressurssenter", "Back to Resource Centre")}
          </Button>

          {/* Hero */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {t("Slik beregner vi modenhet", "How we calculate maturity")}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t(
                "Mynder måler hvor godt virksomheten din har implementert kontroller for informasjonssikkerhet, personvern og AI-styring. Skåren er beslutningsstøtte — ikke en juridisk garanti.",
                "Mynder measures how well your organization has implemented controls for information security, privacy and AI governance. The score is decision support — not a legal guarantee."
              )}
            </p>
          </div>

          {/* The Big Idea — 3 simple cards */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Kort oppsummert", "In a nutshell")}
            </h2>
            <div className="grid gap-3">
              {[
                {
                  icon: Target,
                  title_no: "Vi måler kontroller",
                  title_en: "We measure controls",
                  desc_no: "Hvert krav eller kontroll i ditt scope vurderes på en skala fra 0 til 4.",
                  desc_en: "Each requirement or control in your scope is assessed on a scale from 0 to 4.",
                  iconColor: "text-indigo-600 dark:text-indigo-400",
                  bgColor: "bg-indigo-500/10",
                },
                {
                  icon: BarChart3,
                  title_no: "Skåren er et gjennomsnitt",
                  title_en: "The score is an average",
                  desc_no: "Din prosentskår er gjennomsnittet av alle kontroller som gjelder for deg.",
                  desc_en: "Your percentage score is the average of all controls that apply to you.",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
                  bgColor: "bg-emerald-500/10",
                },
                {
                  icon: Eye,
                  title_no: "Kun det som er relevant teller",
                  title_en: "Only what's relevant counts",
                  desc_no: "Kontroller som ikke er relevante for din virksomhet utelates automatisk.",
                  desc_en: "Controls not relevant to your business are automatically excluded.",
                  iconColor: "text-amber-600 dark:text-amber-400",
                  bgColor: "bg-amber-500/10",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title_en} className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4">
                    <div className={`h-10 w-10 rounded-xl ${item.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-5 w-5 ${item.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{t(item.desc_no, item.desc_en)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* How the model works — colored vertical pipeline */}
          <div className="space-y-4">
             <h2 className="text-xl font-bold text-foreground">
              {t("Slik henger det sammen", "How the model works")}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t(
                "Mynder bygger opp et bilde av virksomheten din steg for steg. Her ser du hvordan alt henger sammen — fra organisasjonen din helt ned til modenhetsscoren.",
                "Mynder builds a picture of your organization step by step. Here's how everything connects — from your organization all the way to the maturity score."
              )}
            </p>
            <div className="relative ml-1">
              {/* Gradient connecting line */}
              <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-indigo-500 via-cyan-500 to-emerald-500 rounded-full" />

              {[
                {
                  icon: Building2,
                  step: 1,
                  title_no: "Arbeidsområder",
                  title_en: "Workspaces",
                  desc_no: "Representerer deler av organisasjonen som eier systemer og leverandører — for eksempel HR, IT eller Økonomi.",
                  desc_en: "Represent parts of your organization that own systems and vendors — for example HR, IT or Finance.",
                  nodeColor: "bg-indigo-500",
                  borderColor: "border-l-indigo-500",
                  iconColor: "text-indigo-600 dark:text-indigo-400",
                  bgColor: "bg-indigo-500/5",
                },
                {
                  icon: Workflow,
                  step: 2,
                  title_no: "Prosesser",
                  title_en: "Processes",
                  desc_no: "Viser hvordan systemer og leverandører faktisk brukes i praksis, for eksempel «Rekruttering» eller «Fakturering».",
                  desc_en: "Show how systems and vendors are actually used in practice, for example 'Recruitment' or 'Invoicing'.",
                  nodeColor: "bg-blue-500",
                  borderColor: "border-l-blue-500",
                  iconColor: "text-blue-600 dark:text-blue-400",
                  bgColor: "bg-blue-500/5",
                },
                {
                  icon: Monitor,
                  step: 3,
                  title_no: "Systemer, leverandører og assets",
                  title_en: "Systems, vendors & assets",
                  desc_no: "Alle ressurser får automatisk en Trust Profile — et levende bilde av samsvar, risiko og dokumentasjon.",
                  desc_en: "All resources automatically get a Trust Profile — a living picture of compliance, risk and documentation.",
                  nodeColor: "bg-cyan-500",
                  borderColor: "border-l-cyan-500",
                  iconColor: "text-cyan-600 dark:text-cyan-400",
                  bgColor: "bg-cyan-500/5",
                },
                {
                  icon: AlertTriangle,
                  step: 4,
                  title_no: "Risiko og kontroller",
                  title_en: "Risk & controls",
                  desc_no: "Risikovurdering gjøres på prosessnivå. Kontroller og dokumentasjon knyttes til Trust Profiles.",
                  desc_en: "Risk assessments are done at the process level. Controls and documentation are linked to Trust Profiles.",
                  nodeColor: "bg-amber-500",
                  borderColor: "border-l-amber-500",
                  iconColor: "text-amber-600 dark:text-amber-400",
                  bgColor: "bg-amber-500/5",
                },
                {
                  icon: BarChart3,
                  step: 5,
                  title_no: "Modenhet og samsvarsscore",
                  title_en: "Maturity & compliance score",
                  desc_no: "Scoren beregnes ut fra hvor godt kontrollene er implementert — fra 0 (ikke startet) til 4 (verifisert).",
                  desc_en: "The score is calculated from how well controls are implemented — from 0 (not started) to 4 (verified).",
                  nodeColor: "bg-emerald-500",
                  borderColor: "border-l-emerald-500",
                  iconColor: "text-emerald-600 dark:text-emerald-400",
                  bgColor: "bg-emerald-500/5",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title_en} className="relative flex items-start gap-4 py-3">
                    {/* Node circle */}
                    <div className={`relative z-10 h-10 w-10 rounded-full ${item.nodeColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-sm font-bold text-white">{item.step}</span>
                    </div>
                    {/* Content card */}
                    <div className={`flex-1 rounded-xl border border-border/50 ${item.bgColor} border-l-[3px] ${item.borderColor} p-4`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className={`h-4 w-4 ${item.iconColor}`} />
                        <p className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t(item.desc_no, item.desc_en)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-base text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t("Kort sagt:", "In short:")}</span>{" "}
                {t(
                  "Organisasjon → prosesser → systemer → risiko → kontroller → samsvarsscore.",
                  "Organization → processes → systems → risk → controls → compliance score."
                )}
              </p>
            </div>
          </div>

          {/* 0-4 Scale — visual and clear */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Modenhetsskalaen (0–4)", "The maturity scale (0–4)")}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t(
                "Hver kontroll vurderes på denne skalaen. Jo høyere nivå, desto bedre er kontrollen forankret i virksomheten.",
                "Each control is assessed on this scale. The higher the level, the better the control is embedded in your organization."
              )}
            </p>
            <div className="space-y-1.5">
              {[
                { level: 0, no: "Ikke startet", en: "Not started", color: "bg-gray-200 dark:bg-gray-700", textColor: "text-gray-700 dark:text-gray-200", barColor: "bg-gray-300 dark:bg-gray-600", desc_no: "Ingen praksis eller dokumentasjon", desc_en: "No practice or documentation" },
                { level: 1, no: "Planlagt", en: "Planned", color: "bg-amber-300 dark:bg-amber-700", textColor: "text-amber-900 dark:text-amber-100", barColor: "bg-amber-400", desc_no: "Kravet er forstått og eier er utpekt", desc_en: "Requirement understood, owner assigned" },
                { level: 2, no: "Dokumentert", en: "Documented", color: "bg-amber-500", textColor: "text-white", barColor: "bg-amber-500", desc_no: "Policy eller prosedyre finnes", desc_en: "Policy or procedure exists" },
                { level: 3, no: "Implementert", en: "Implemented", color: "bg-blue-500", textColor: "text-white", barColor: "bg-blue-500", desc_no: "Gjennomføres i praksis, ikke bare på papir", desc_en: "Carried out in practice, not just on paper" },
                { level: 4, no: "Verifisert", en: "Verified", color: "bg-emerald-500", textColor: "text-white", barColor: "bg-emerald-500", desc_no: "Evidens finnes og er nylig oppdatert", desc_en: "Evidence exists and is recently updated" },
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3">
                  <div className={`h-9 w-9 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className={`text-sm font-bold ${item.textColor}`}>{item.level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t(item.no, item.en)}</p>
                    <p className="text-sm text-muted-foreground">{t(item.desc_no, item.desc_en)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-24 h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div className={`h-full rounded-full ${item.barColor} transition-all`} style={{ width: `${(item.level / 4) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <p className="text-base text-foreground">
                <span className="font-semibold">{t("Eksempel:", "Example:")}</span>{" "}
                {t(
                  "En kontroll på nivå 3 gir 75 % (3/4). Nivå 4 gir 100 %.",
                  "A control at level 3 gives 75% (3/4). Level 4 gives 100%."
                )}
              </p>
            </div>
          </div>

          {/* Your current status */}
          <Card variant="flat" className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/5 to-blue-500/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("Din nåværende modenhet", "Your current maturity")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t(
                        `Basert på ${stats.completed + stats.inProgress} av ${stats.total} kontroller vurdert`,
                        `Based on ${stats.completed + stats.inProgress} of ${stats.total} controls assessed`
                      )}
                    </p>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{progressPercent}%</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200"
                onClick={() => navigate("/compliance-checklist")}
              >
                {t("Se alle kontroller →", "View all controls →")}
              </Button>
            </CardContent>
          </Card>

          {/* Deep-dive sections — accordion */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Vil du vite mer?", "Want to learn more?")}
            </h2>
            <p className="text-base text-muted-foreground">
              {t(
                "Utforsk detaljene i modellen vår nedenfor.",
                "Explore the details of our model below."
              )}
            </p>

            <Accordion type="multiple" className="space-y-2">

              {/* Trust Score */}
              <AccordionItem value="trust-score" className="rounded-xl border border-border/50 bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-base font-semibold text-left">Trust Score</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(
                        "Trust Score er en sammensatt indeks som kombinerer tre komponenter:",
                        "Trust Score is a composite index combining three components:"
                      )}
                    </p>
                    <div className="space-y-2">
                      {[
                        { pct: "60%", no: "Compliance", en: "Compliance", desc_no: "Implementeringsmodenhet for kontroller i scope", desc_en: "Implementation maturity of in-scope controls" },
                        { pct: "30%", no: "Risikoeksponering", en: "Risk Exposure", desc_no: "Færre uhåndterte risikoer = høyere skår", desc_en: "Fewer unmitigated risks = higher score" },
                        { pct: "10%", no: "Dekningsgrad", en: "Coverage", desc_no: "Andel kontroller som er vurdert", desc_en: "Percentage of controls assessed" },
                      ].map((c) => (
                        <div key={c.en} className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="font-mono text-xs w-12 justify-center flex-shrink-0">{c.pct}</Badge>
                          <div>
                            <span className="font-semibold text-foreground">{t(c.no, c.en)}</span>
                            <span className="text-muted-foreground"> — {t(c.desc_no, c.desc_en)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
                      <p className="text-xs font-mono text-foreground/80">
                        Trust Score = Compliance × 0.6 + Risk × 0.3 + Coverage × 0.1
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Risk Exposure */}
              <AccordionItem value="risk" className="rounded-xl border border-border/50 bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span className="text-base font-semibold text-left">
                      {t("Beregning av risikoeksponering", "Risk Exposure calculation")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(
                        "Risikoeksponering beregnes fra dokumenterte risikoscenarioer. Hvert scenario vektes etter alvorlighetsgrad:",
                        "Risk exposure is calculated from documented risk scenarios. Each is weighted by severity:"
                      )}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: t("Kritisk", "Critical"), w: 4 },
                        { label: t("Høy", "High"), w: 3 },
                        { label: t("Medium", "Medium"), w: 2 },
                        { label: t("Lav", "Low"), w: 1 },
                      ].map((r) => (
                        <div key={r.label} className="text-center rounded-lg border border-border/40 bg-muted/20 p-2">
                          <p className="text-sm font-semibold text-foreground">{r.label}</p>
                          <p className="text-xs text-muted-foreground">{t("Vekt", "Weight")} {r.w}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• {t("Fullstendig håndtert = 0 % påvirkning", "Fully mitigated = 0% impact")}</p>
                      <p>• {t("Pågående håndtering = 50 % påvirkning", "In progress = 50% impact")}</p>
                      <p>• {t("Ikke startet = 100 % påvirkning", "Not started = 100% impact")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                      {t(
                        "Skåren inverteres: lav risiko gir høy skår. Uten dokumenterte risikoer brukes en nøytral skår på 50.",
                        "Score is inverted: low risk = high score. Without documented risks, a neutral score of 50 is used."
                      )}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Foundation */}
              <AccordionItem value="foundation" className="rounded-xl border border-border/50 bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-base font-semibold text-left">
                      {t("Foundation-status", "Foundation status")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(
                        "Foundation viser at virksomheten har et minimumsnivå for styring innen fire domener. Hvert domene har 4 kontroller.",
                        "Foundation shows your org has a minimum governance level across four domains. Each domain has 4 controls."
                      )}
                    </p>
                    <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
                      {[
                        { no: "Governance", en: "Governance", desc_no: "Sikkerhetspolicy, risikostyring, ledelsesforankring, samsvarsansvarlig", desc_en: "Security policy, risk management, management commitment, compliance officer" },
                        { no: "Operations", en: "Operations", desc_no: "Systemoversikt, backup, hendelseshåndtering, endringshåndtering", desc_en: "System inventory, backup, incident management, change management" },
                        { no: "Identity & Access", en: "Identity & Access", desc_no: "Tilgangskontroll, brukeradmin, autentisering, tilgangsgjennomgang", desc_en: "Access control, user provisioning, authentication, access review" },
                        { no: "Supplier & Ecosystem", en: "Supplier & Ecosystem", desc_no: "Leverandøroversikt, DPA, leverandørrisikovurdering, underleverandørkontroll", desc_en: "Vendor inventory, DPA, vendor risk assessment, subprocessor oversight" },
                      ].map((d) => (
                        <div key={d.en} className="rounded-lg border border-border/40 bg-muted/20 p-3">
                          <p className="text-sm font-bold text-foreground">{t(d.no, d.en)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{t(d.desc_no, d.desc_en)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="text-sm space-y-1 text-foreground/80">
                      <p>✓ {t('Kontroll er «OK» når nivå ≥ 2 (Dokumentert)', 'Control is "OK" when level ≥ 2 (Documented)')}</p>
                      <p>✓ {t("Domene oppfylt når ≥ 3 av 4 kontroller er OK", "Domain fulfilled when ≥ 3 of 4 controls are OK")}</p>
                      <p className="font-semibold">✓ {t("Foundation Established når alle 4 domener er oppfylt", "Foundation Established when all 4 domains are fulfilled")}</p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Reporting dimensions */}
              <AccordionItem value="dimensions" className="rounded-xl border border-border/50 bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    <span className="text-base font-semibold text-left">
                      {t("Rapporteringsdimensjoner", "Reporting dimensions")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(
                        "De samme datapunktene kan vises fra tre vinkler — det er ikke separate beregninger, bare ulike måter å gruppere på:",
                        "The same data points can be viewed from three angles — not separate calculations, just different groupings:"
                      )}
                    </p>
                    {[
                      { title_no: "Per rammeverk", title_en: "Per framework", desc_no: "GDPR, ISO 27001, AI Act — brukes når du tenker tilsyn eller revisor.", desc_en: "GDPR, ISO 27001, AI Act — used when you think audit or regulator." },
                      { title_no: "Per fokusområde", title_en: "Per focus area", desc_no: "Governance, Operations, Identity & Access, Supplier & Ecosystem.", desc_en: "Governance, Operations, Identity & Access, Supplier & Ecosystem." },
                      { title_no: "Per objekt", title_en: "Per object", desc_no: "Systemer, prosesser, leverandører — nyttig for å finne konkrete gap.", desc_en: "Systems, processes, vendors — useful for finding specific gaps." },
                    ].map((item) => (
                      <div key={item.title_en} className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        <div>
                          <span className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</span>
                          <span className="text-sm text-muted-foreground"> — {t(item.desc_no, item.desc_en)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Scope & Weighting */}
              <AccordionItem value="scope" className="rounded-xl border border-border/50 bg-card px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Scale className="h-4 w-4 text-purple-500 flex-shrink-0" />
                    <span className="text-base font-semibold text-left">
                      {t("Scope, vekting og relevans", "Scope, weighting and relevance")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(
                        "To filtre avgjør hva som teller: kontrollen må være relevant (gjelder for din virksomhet) og aktivert (del av ditt valgte scope). Kontroller utenfor scope utelates.",
                        "Two filters determine what counts: the control must be relevant (applies to your org) and activated (part of your selected scope). Controls outside scope are excluded."
                      )}
                    </p>
                    <div className="rounded-lg bg-muted/30 border border-border/30 px-3 py-2 space-y-1">
                       <p className="text-sm font-mono text-foreground/80">
                        {t(
                          "skår = Σ(skår_per_kontroll × vekt) / Σ(vekt)",
                          "score = Σ(score_per_control × weight) / Σ(weight)"
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t(
                          "Standardvekt = 1. Valgfri vekting 1–3 basert på kritikalitet.",
                          "Default weight = 1. Optional weighting 1–3 based on criticality."
                        )}
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </Accordion>
          </div>

          {/* Legal disclaimer — compact */}
          <div className="rounded-xl border border-border/50 bg-muted/20 p-5 space-y-2">
            <p className="text-base font-semibold text-foreground">
              {t("Viktig å vite", "Important to know")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Mynder måler implementeringsmodenhet i styringssystemet — ikke juridisk etterlevelse. Dette samsvarer med ISO 27001 (ISMS), ISO 27701 (PIMS) og ISO 42001 (AIMS): vi måler om praksis, styring og kontroll er på plass og kan dokumenteres.",
                "Mynder measures implementation maturity of your management system — not legal compliance. This aligns with ISO 27001 (ISMS), ISO 27701 (PIMS) and ISO 42001 (AIMS): we measure whether practice, governance and control are in place and can be documented."
              )}
            </p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default MaturityMethodology;
