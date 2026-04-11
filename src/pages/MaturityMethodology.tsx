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
      <main className="flex-1 overflow-auto pt-11">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">


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
            <button
              onClick={() => navigate("/resources/controls")}
              className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-1"
            >
              {t("Les mer om Mynder Controls →", "Read more about Mynder Controls →")}
            </button>
          </div>

          {/* How the model works — clear mental model */}
          <div className="space-y-4">
             <h2 className="text-xl font-bold text-foreground">
              {t("Slik henger det sammen", "How the model works")}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t(
                "Sikkerhetsmodnhet bygges nedenfra og opp. Alt starter med å kartlegge hva du har — deretter vurderes risiko, og kontroller implementeres for å redusere den.",
                "Security maturity is built from the bottom up. Everything starts with mapping what you have — then risk is assessed, and controls are implemented to reduce it."
              )}
            </p>

            {/* Visual flow: 3 inputs → Risks → Controls → Maturity */}
            <div className="space-y-3">
              {/* Step 1: Three inputs side by side */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Steg 1 — Kartlegg", "Step 1 — Map your landscape")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: Monitor,
                    title_no: "Systemer",
                    title_en: "Systems",
                    desc_no: "Alle IT-systemer og verktøy som brukes i virksomheten.",
                    desc_en: "All IT systems and tools used in your organization.",
                    color: "text-cyan-600 dark:text-cyan-400",
                    bg: "bg-cyan-500/10",
                  },
                  {
                    icon: Share2,
                    title_no: "Leverandører",
                    title_en: "Vendors",
                    desc_no: "Tredjeparter som behandler data eller leverer tjenester.",
                    desc_en: "Third parties that process data or deliver services.",
                    color: "text-blue-600 dark:text-blue-400",
                    bg: "bg-blue-500/10",
                  },
                  {
                    icon: Workflow,
                    title_no: "Prosesser",
                    title_en: "Processes",
                    desc_no: "Hvordan systemer og leverandører brukes i praksis.",
                    desc_en: "How systems and vendors are used in practice.",
                    color: "text-indigo-600 dark:text-indigo-400",
                    bg: "bg-indigo-500/10",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title_en} className={`rounded-xl border border-border/50 ${item.bg} p-4 text-center space-y-2`}>
                      <div className={`h-10 w-10 rounded-xl ${item.bg} flex items-center justify-center mx-auto`}>
                        <Icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</p>
                      <p className="text-xs text-muted-foreground">{t(item.desc_no, item.desc_en)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Arrow down */}
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-0.5 h-4 bg-border rounded-full" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Step 2: Risks */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Steg 2 — Identifiser risiko", "Step 2 — Identify risks")}
              </p>
              <div className="rounded-xl border border-border/50 bg-amber-500/5 border-l-[3px] border-l-amber-500 p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("Risikovurdering", "Risk assessment")}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t(
                      "Basert på kartlagte systemer, leverandører og prosesser identifiseres risikoer. Hver risiko knyttes til prosessene den påvirker.",
                      "Based on mapped systems, vendors and processes, risks are identified. Each risk is linked to the processes it affects."
                    )}
                  </p>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-0.5 h-4 bg-border rounded-full" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Step 3: Controls */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Steg 3 — Implementer kontroller", "Step 3 — Implement controls")}
              </p>
              <div className="rounded-xl border border-border/50 bg-emerald-500/5 border-l-[3px] border-l-emerald-500 p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("Kontroller", "Controls")}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t(
                      "Kontroller er tiltak som reduserer risiko. Hver kontroll måles på en skala fra 0 (ikke startet) til 4 (verifisert med evidens).",
                      "Controls are measures that reduce risk. Each control is measured on a scale from 0 (not started) to 4 (verified with evidence)."
                    )}
                  </p>
                </div>
              </div>

              {/* Arrow down */}
              <div className="flex justify-center py-1">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-0.5 h-4 bg-border rounded-full" />
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              {/* Step 4: Maturity score */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Resultat — Din modenhetsscore", "Result — Your maturity score")}
              </p>
              <div className="rounded-xl border border-primary/20 bg-primary/5 border-l-[3px] border-l-primary p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t("Sikkerhetsmodenhet", "Security maturity")}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {t(
                      "Gjennomsnittet av alle kontroll-nivåer gir din modenhetsscore. Scoren vises fordelt på fire fokusområder: Governance, Operations, Identity & Access og Supplier & Ecosystem.",
                      "The average of all control levels gives your maturity score. The score is shown across four focus areas: Governance, Operations, Identity & Access and Supplier & Ecosystem."
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary box */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t("Kort sagt:", "In short:")}</span>{" "}
                {t(
                  "Systemer + Leverandører + Prosesser → Risiko → Kontroller → Sikkerhetsmodenhet.",
                  "Systems + Vendors + Processes → Risks → Controls → Security Maturity."
                )}
              </p>
            </div>
          </div>

          {/* ── Trust Profile section ── */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                {t("Hva er en Trust Profile?", "What is a Trust Profile?")}
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                {t(
                  "En Trust Profile er et levende samsvars- og risikokort for ethvert system, leverandør eller din egen organisasjon. Den kan være AI-generert fra offentlige kilder, eller fullstendig eid og vedlikeholdt av virksomheten selv.",
                  "A Trust Profile is a living compliance and risk card for any system, vendor or your own organization. It can be AI-generated from public sources, or fully owned and maintained by the company itself."
                )}
              </p>
            </div>

            {/* 4-stage quality flow */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Kvalitetsnivåer", "Quality stages")}
              </p>
              {/* Gradient quality bar */}
              <div className="relative h-2 rounded-full bg-muted/40 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-amber-400 via-orange-400 to-indigo-500 rounded-full" />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
                <span>{t("LAV KVALITET", "LOW QUALITY")}</span>
                <span>{t("HØY KVALITET", "HIGH QUALITY")}</span>
              </div>

              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2 lg:grid-cols-4"} gap-3`}>
                {[
                  {
                    step: 1, quality: "25%",
                    title_no: "Opprettet", title_en: "Created",
                    by_no: "Av: Lara AI", by_en: "By: Lara AI",
                    color: "bg-emerald-500", borderColor: "border-t-emerald-500", bgColor: "bg-emerald-500/5",
                    icon: Bot, iconColor: "text-emerald-600 dark:text-emerald-400",
                    bullets_no: ["Skanner offentlige kilder", "Finner grunndata og risikosignaler", "Klassifiserer automatisk"],
                    bullets_en: ["Scans public sources", "Finds basic data and risk signals", "Classifies automatically"],
                  },
                  {
                    step: 2, quality: "50%",
                    title_no: "Beriket", title_en: "Enriched",
                    by_no: "Av: Kunde", by_en: "By: Customer",
                    color: "bg-amber-500", borderColor: "border-t-amber-500", bgColor: "bg-amber-500/5",
                    icon: FileCheck, iconColor: "text-amber-600 dark:text-amber-400",
                    bullets_no: ["Legger til dokumenter og analyse", "Egne vurderinger og notater", "Kobler til prosesser og kontroller"],
                    bullets_en: ["Adds documents and analysis", "Own assessments and notes", "Links to processes and controls"],
                  },
                  {
                    step: 3, quality: "75%",
                    title_no: "Forespurt", title_en: "Requested",
                    by_no: "Av: Kunde → Leverandør", by_en: "By: Customer → Supplier",
                    color: "bg-orange-500", borderColor: "border-t-orange-500", bgColor: "bg-orange-500/5",
                    icon: Users, iconColor: "text-orange-600 dark:text-orange-400",
                    bullets_no: ["Manglende info forespørres", "Automatisk oppfølging", "Leverandør får varsel"],
                    bullets_en: ["Missing info requested", "Automated follow-up", "Supplier gets notified"],
                  },
                  {
                    step: 4, quality: "100%",
                    title_no: "Verifisert", title_en: "Verified",
                    by_no: "Av: Leverandør", by_en: "By: Supplier",
                    color: "bg-indigo-500", borderColor: "border-t-indigo-500", bgColor: "bg-indigo-500/5",
                    icon: ShieldCheck, iconColor: "text-indigo-600 dark:text-indigo-400",
                    bullets_no: ["Leverandør svarer og bekrefter", "Selverklæring signert", "Identitet bekreftet"],
                    bullets_en: ["Supplier responds and confirms", "Self-declaration signed", "Identity confirmed"],
                  },
                ].map((stage) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.step} className={`relative rounded-xl border border-border/50 ${stage.bgColor} border-t-[3px] ${stage.borderColor} p-4 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <div className={`h-8 w-8 rounded-lg ${stage.color} flex items-center justify-center`}>
                          <span className="text-xs font-bold text-white">{stage.step}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">{stage.quality}</Badge>
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className={`h-4 w-4 ${stage.iconColor}`} />
                          <p className="text-sm font-semibold text-foreground">{t(stage.title_no, stage.title_en)}</p>
                        </div>
                        <ul className="space-y-0.5">
                          {(lang === "en" ? stage.bullets_en : stage.bullets_no).map((b, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                              {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">{t(stage.by_no, stage.by_en)}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Self vs Vendor comparison */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                {t("Din profil vs. leverandørprofil", "Your profile vs. vendor profile")}
              </p>
              <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{t("Din Trust Profile (self)", "Your Trust Profile (self)")}</p>
                  </div>
                  <ul className="space-y-1">
                    {(lang === "en"
                      ? ["Shows YOUR compliance maturity and controls", "You own and manage all the data", "Shared with customers who request it"]
                      : ["Viser DIN samsvarsmodenhet og kontroller", "Du eier og forvalter all data", "Deles med kunder som ber om det"]
                    ).map((b, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm font-bold text-foreground">{t("Leverandørens Trust Profile", "Vendor Trust Profile")}</p>
                  </div>
                  <ul className="space-y-1">
                    {(lang === "en"
                      ? ["Shows vendor compliance FROM YOUR PERSPECTIVE", "Compliance score = vendor's own data", "Risk score = YOUR evaluation of that vendor"]
                      : ["Viser leverandørens samsvar FRA DITT PERSPEKTIV", "Samsvarsscore = leverandørens egne data", "Risikoscore = DIN vurdering av leverandøren"]
                    ).map((b, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground">{t("Viktig:", "Important:")}</span>{" "}
                  {t(
                    "Samme Trust Profile kan vise ulike risikoscorer avhengig av hvem som ser — fordi risiko alltid er relativ til observatørens kontekst.",
                    "The same Trust Profile can show different risk scores depending on who is looking — because risk is always relative to the observer's context."
                  )}
                </p>
              </div>
            </div>

            {/* Three highlight cards */}
            <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-3"} gap-3`}>
              {[
                {
                  icon: Share2, iconColor: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-500/10",
                  title_no: "Fellesskapseffekt", title_en: "Community effect",
                  desc_no: "Rapporter delt av andre forbedrer alles profiler — du bidrar og drar nytte av nettverket.",
                  desc_en: "Reports shared by others improve everyone's profiles — you contribute and benefit from the network.",
                },
                {
                  icon: Fingerprint, iconColor: "text-purple-600 dark:text-purple-400", bgColor: "bg-purple-500/10",
                  title_no: "Gjenbrukbar", title_en: "Reusable",
                  desc_no: "Én profil, verifisert én gang — betrodd på tvers av alle kunder og forespørsler.",
                  desc_en: "One profile, verified once — trusted across all customers and requests.",
                },
                {
                  icon: Bot, iconColor: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-500/10",
                  title_no: "AI + Menneske", title_en: "AI + Human",
                  desc_no: "AI skaper grunnlaget, mennesker verifiserer og beriker. Kvaliteten stiger over tid.",
                  desc_en: "AI creates the base, humans verify and enrich. Quality rises over time.",
                },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.title_en} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
                    <div className={`h-9 w-9 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-4 w-4 ${card.iconColor}`} />
                    </div>
                    <p className="text-sm font-semibold text-foreground">{t(card.title_no, card.title_en)}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{t(card.desc_no, card.desc_en)}</p>
                  </div>
                );
              })}
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

          {/* Security & compliance status */}
          <Card variant="flat" className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">
                  {t("Sikkerhets- og compliance-status", "Security & compliance status")}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* Security Maturity */}
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-4">
                  <div className="h-14 w-14 rounded-full border-4 border-emerald-500/30 flex items-center justify-center bg-emerald-500/10">
                    <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{progressPercent}%</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{t("Sikkerhetsmodenhet", "Security maturity")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {t("Basert på implementerte kontroller.", "Based on implemented controls.")}
                    </p>
                  </div>
                </div>

                {/* Coverage */}
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-4">
                  <div className="h-14 w-14 rounded-full border-4 border-blue-500/30 flex items-center justify-center bg-blue-500/10">
                    <span className="text-base font-bold text-blue-700 dark:text-blue-300">{Math.round((stats.total > 0 ? ((stats.completed + stats.inProgress) / stats.total) : 0) * 100)}%</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{t("Dekningsgrad", "Coverage")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {t("Systemer, leverandører og prosesser kartlagt.", "Systems, vendors and processes mapped.")}
                    </p>
                  </div>
                </div>

                {/* Risk Exposure */}
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-background/50 p-4">
                  <div className="h-14 w-14 rounded-full border-4 border-amber-500/30 flex items-center justify-center bg-amber-500/10">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">{t("Middels", "Medium")}</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-foreground">{t("Risikoeksponering", "Risk exposure")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
                      {t("Basert på identifiserte risikoer på tvers av prosesser.", "Based on identified risks across processes.")}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-primary hover:text-primary/80"
                onClick={() => navigate("/resources/controls")}
              >
                {t("Se statusdetaljer →", "View status details →")}
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
