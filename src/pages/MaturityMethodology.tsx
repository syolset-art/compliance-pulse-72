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
            <h2 className="text-lg font-bold text-foreground">
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
                },
                {
                  icon: BarChart3,
                  title_no: "Skåren er et gjennomsnitt",
                  title_en: "The score is an average",
                  desc_no: "Din prosentskår er gjennomsnittet av alle kontroller som gjelder for deg.",
                  desc_en: "Your percentage score is the average of all controls that apply to you.",
                },
                {
                  icon: Eye,
                  title_no: "Kun det som er relevant teller",
                  title_en: "Only what's relevant counts",
                  desc_no: "Kontroller som ikke er relevante for din virksomhet utelates automatisk.",
                  desc_en: "Controls not relevant to your business are automatically excluded.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title_en} className="flex items-start gap-4 rounded-xl border border-border/50 bg-card p-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(item.desc_no, item.desc_en)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 0-4 Scale — visual and clear */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              {t("Modenhetsskalaen (0–4)", "The maturity scale (0–4)")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Hver kontroll vurderes på denne skalaen. Jo høyere nivå, desto bedre er kontrollen forankret i virksomheten.",
                "Each control is assessed on this scale. The higher the level, the better the control is embedded in your organization."
              )}
            </p>
            <div className="space-y-1.5">
              {[
                { level: 0, no: "Ikke startet", en: "Not started", color: "bg-muted-foreground/20", desc_no: "Ingen praksis eller dokumentasjon", desc_en: "No practice or documentation" },
                { level: 1, no: "Planlagt", en: "Planned", color: "bg-amber-400/30", desc_no: "Kravet er forstått og eier er utpekt", desc_en: "Requirement understood, owner assigned" },
                { level: 2, no: "Dokumentert", en: "Documented", color: "bg-amber-500/50", desc_no: "Policy eller prosedyre finnes", desc_en: "Policy or procedure exists" },
                { level: 3, no: "Implementert", en: "Implemented", color: "bg-primary/60", desc_no: "Gjennomføres i praksis, ikke bare på papir", desc_en: "Carried out in practice, not just on paper" },
                { level: 4, no: "Verifisert", en: "Verified", color: "bg-primary", desc_no: "Evidens finnes og er nylig oppdatert", desc_en: "Evidence exists and is recently updated" },
              ].map((item) => (
                <div key={item.level} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card p-3">
                  <div className={`h-8 w-8 rounded-lg ${item.color} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-xs font-bold text-foreground">{item.level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{t(item.no, item.en)}</p>
                    <p className="text-[11px] text-muted-foreground">{t(item.desc_no, item.desc_en)}</p>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-20 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${(item.level / 4) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
              <p className="text-sm text-foreground">
                <span className="font-semibold">{t("Eksempel:", "Example:")}</span>{" "}
                {t(
                  "En kontroll på nivå 3 gir 75 % (3/4). Nivå 4 gir 100 %.",
                  "A control at level 3 gives 75% (3/4). Level 4 gives 100%."
                )}
              </p>
            </div>
          </div>

          {/* Your current status */}
          <Card variant="flat" className="border-primary/15 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("Din nåværende modenhet", "Your current maturity")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t(
                        `Basert på ${stats.assessed} av ${stats.total} kontroller vurdert`,
                        `Based on ${stats.assessed} of ${stats.total} controls assessed`
                      )}
                    </p>
                  </div>
                </div>
                <Badge className="bg-primary/15 text-primary border-primary/20 text-lg font-bold px-3 py-1">
                  {progressPercent}%
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-primary hover:text-primary/80"
                onClick={() => navigate("/compliance-checklist")}
              >
                {t("Se alle kontroller →", "View all controls →")}
              </Button>
            </CardContent>
          </Card>

          {/* Deep-dive sections — accordion */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">
              {t("Vil du vite mer?", "Want to learn more?")}
            </h2>
            <p className="text-sm text-muted-foreground">
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
                    <span className="text-sm font-semibold text-left">Trust Score</span>
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
                    <span className="text-sm font-semibold text-left">
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
                          <p className="text-xs font-semibold text-foreground">{r.label}</p>
                          <p className="text-[10px] text-muted-foreground">{t("Vekt", "Weight")} {r.w}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>• {t("Fullstendig håndtert = 0 % påvirkning", "Fully mitigated = 0% impact")}</p>
                      <p>• {t("Pågående håndtering = 50 % påvirkning", "In progress = 50% impact")}</p>
                      <p>• {t("Ikke startet = 100 % påvirkning", "Not started = 100% impact")}</p>
                    </div>
                    <p className="text-xs text-muted-foreground italic">
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
                    <span className="text-sm font-semibold text-left">
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
                          <p className="text-xs font-bold text-foreground">{t(d.no, d.en)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{t(d.desc_no, d.desc_en)}</p>
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
                    <span className="text-sm font-semibold text-left">
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
                    <span className="text-sm font-semibold text-left">
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
                      <p className="text-xs font-mono text-foreground/80">
                        {t(
                          "skår = Σ(skår_per_kontroll × vekt) / Σ(vekt)",
                          "score = Σ(score_per_control × weight) / Σ(weight)"
                        )}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
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
            <p className="text-sm font-semibold text-foreground">
              {t("Viktig å vite", "Important to know")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
