import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  ArrowLeft, Shield, Landmark, Server, Fingerprint, Users,
  Building2, Workflow, Monitor, AlertTriangle, BarChart3,
  CheckCircle2, Sparkles, ArrowRight, Layers,
} from "lucide-react";

const DOMAINS = [
  {
    key: "governance",
    icon: Landmark,
    color: "bg-indigo-500", iconColor: "text-indigo-600 dark:text-indigo-400", bgColor: "bg-indigo-500/5", borderColor: "border-l-indigo-500",
    title_no: "Governance", title_en: "Governance",
    desc_no: "Ledelse, policyer, samsvar og risikostyring", desc_en: "Leadership, policies, compliance and risk management",
    controls_no: [
      "Informasjonssikkerhetspolicy er vedtatt",
      "Roller og ansvar er definert",
      "Risikovurdering er gjennomført",
      "Styrende dokumenter er tilgjengelige",
    ],
    controls_en: [
      "Information security policy adopted",
      "Roles and responsibilities defined",
      "Risk assessment completed",
      "Governing documents accessible",
    ],
  },
  {
    key: "operations",
    icon: Server,
    color: "bg-blue-500", iconColor: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-500/5", borderColor: "border-l-blue-500",
    title_no: "Operations", title_en: "Operations",
    desc_no: "Sikkerhet i systemer og daglig drift", desc_en: "Security of systems and daily operations",
    controls_no: [
      "Systemoversikt er etablert",
      "Hendelseshåndtering er definert",
      "Endringshåndtering følges",
      "Sikkerhetskopiering er på plass",
    ],
    controls_en: [
      "System inventory established",
      "Incident management defined",
      "Change management followed",
      "Backup procedures in place",
    ],
  },
  {
    key: "identity",
    icon: Fingerprint,
    color: "bg-cyan-500", iconColor: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-500/5", borderColor: "border-l-cyan-500",
    title_no: "Identity & Access", title_en: "Identity & Access",
    desc_no: "Hvem har tilgang til hva — og hvorfor", desc_en: "Who can access what — and why",
    controls_no: [
      "Tilgangsstyring er dokumentert",
      "Minste-privilegium-prinsipp følges",
      "Brukertilganger gjennomgås regelmessig",
      "Multi-faktor autentisering er aktivert",
    ],
    controls_en: [
      "Access management documented",
      "Least-privilege principle followed",
      "User access reviewed regularly",
      "Multi-factor authentication enabled",
    ],
  },
  {
    key: "supplier",
    icon: Users,
    color: "bg-amber-500", iconColor: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-500/5", borderColor: "border-l-amber-500",
    title_no: "Supplier & Ecosystem", title_en: "Supplier & Ecosystem",
    desc_no: "Leverandørstyring og tredjeparts-risiko", desc_en: "Vendor management and third-party risk",
    controls_no: [
      "Leverandøroversikt er etablert",
      "Databehandleravtaler er på plass",
      "Leverandører er risikovurdert",
      "Oppfølgingsrutiner er definert",
    ],
    controls_en: [
      "Vendor inventory established",
      "Data processing agreements in place",
      "Vendors risk-assessed",
      "Follow-up routines defined",
    ],
  },
];

const PIPELINE_STEPS = [
  { icon: Building2, nodeColor: "bg-indigo-500", borderColor: "border-l-indigo-500", bgColor: "bg-indigo-500/5", iconColor: "text-indigo-600 dark:text-indigo-400", title_no: "Arbeidsområder", title_en: "Workspaces", desc_no: "Deler av organisasjonen som eier systemer og prosesser.", desc_en: "Parts of the organization that own systems and processes." },
  { icon: Workflow, nodeColor: "bg-blue-500", borderColor: "border-l-blue-500", bgColor: "bg-blue-500/5", iconColor: "text-blue-600 dark:text-blue-400", title_no: "Prosesser", title_en: "Processes", desc_no: "Hvordan systemer og leverandører brukes i praksis.", desc_en: "How systems and vendors are used in practice." },
  { icon: Monitor, nodeColor: "bg-cyan-500", borderColor: "border-l-cyan-500", bgColor: "bg-cyan-500/5", iconColor: "text-cyan-600 dark:text-cyan-400", title_no: "Systemer / Leverandører / Assets", title_en: "Systems / Vendors / Assets", desc_no: "Alle ressurser med Trust Profile for samsvar og risiko.", desc_en: "All resources with Trust Profile for compliance and risk." },
  { icon: AlertTriangle, nodeColor: "bg-amber-500", borderColor: "border-l-amber-500", bgColor: "bg-amber-500/5", iconColor: "text-amber-600 dark:text-amber-400", title_no: "Risikoscenarioer", title_en: "Risk scenarios", desc_no: "Risikovurdering gjøres på prosessnivå.", desc_en: "Risk assessments happen at the process level." },
  { icon: Shield, nodeColor: "bg-orange-500", borderColor: "border-l-orange-500", bgColor: "bg-orange-500/5", iconColor: "text-orange-600 dark:text-orange-400", title_no: "Kontroller", title_en: "Controls", desc_no: "Tiltak som reduserer identifiserte risikoer.", desc_en: "Measures that reduce identified risks." },
  { icon: BarChart3, nodeColor: "bg-emerald-500", borderColor: "border-l-emerald-500", bgColor: "bg-emerald-500/5", iconColor: "text-emerald-600 dark:text-emerald-400", title_no: "Modenhetsscore", title_en: "Maturity score", desc_no: "Viser hvor godt kontrollene er implementert.", desc_en: "Shows how well controls are implemented." },
];

const FRAMEWORKS = [
  { name: "ISO 27001", color: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20" },
  { name: "GDPR", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20" },
  { name: "EU AI Act", color: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20" },
];

const FUTURE_ITEMS = [
  { no: "Flere kontrollfamilier (backup, endepunkt, overvåking)", en: "Additional control families (backup, endpoint, monitoring)" },
  { no: "Bransjespesifikke kontrollsett (NIS2, DORA)", en: "Industry-specific control sets (NIS2, DORA)" },
  { no: "AI-styringskontroller", en: "AI governance controls" },
  { no: "Partner / MSP sikkerhetsintegrasjoner", en: "Partner / MSP security service integrations" },
  { no: "Tilpassede kontroller for organisasjoner", en: "Custom controls for organizations" },
];

const MynderControls = () => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const lang = i18n.language?.startsWith("en") ? "en" : "no";
  const t = (no: string, en: string) => (lang === "en" ? en : no);

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

          {/* A. Hero */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              {t("Mynder Controls", "Mynder Controls")}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t(
                "Kontroller er de tiltakene organisasjoner bruker for å styre sikkerhet, personvern og risiko. Mynder måler hvor godt kontrollene er implementert i praksis — ikke bare om dokumentasjon finnes.",
                "Controls are the practices organizations implement to manage security, privacy and risk. Mynder measures how well controls are implemented in practice — not just whether documentation exists."
              )}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Kontroller brukes til å beregne modenhetsscoren og samsvarsstatusen din.",
                "Controls are used to calculate your maturity score and compliance status."
              )}
            </p>
          </div>

          {/* B. Core Control Model — 4 domains */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Kontrollmodellen", "The Control Model")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("Fire hoveddomener dekker hele bredden av styring og kontroll:", "Four core domains cover the full breadth of governance and control:")}
            </p>
            <div className={`grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-3`}>
              {DOMAINS.map((d) => {
                const Icon = d.icon;
                return (
                  <div key={d.key} className={`rounded-xl border border-border/50 ${d.bgColor} border-l-[3px] ${d.borderColor} p-4`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`h-8 w-8 rounded-lg ${d.color} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">{t(d.title_no, d.title_en)}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{t(d.desc_no, d.desc_en)}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* C. Foundation Controls (V1) */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Foundation Controls (V1)", "Foundation Controls (V1)")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Mynder inkluderer et sett med grunnleggende kontroller for å etablere et minimum sikkerhetsnivå. Foundation-status oppnås når de fleste kontrollene er implementert.",
                "Mynder includes a set of foundational controls to establish a minimum security baseline. Foundation status is achieved when most controls are implemented."
              )}
            </p>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">4 {t("domener", "domains")}</Badge>
              <Badge variant="outline" className="text-xs">4 {t("kontroller per domene", "controls per domain")}</Badge>
              <Badge variant="outline" className="text-xs font-semibold">= 16 {t("grunnkontroller", "foundation controls")}</Badge>
            </div>

            {/* Controls per domain */}
            <div className="space-y-3">
              {DOMAINS.map((d) => {
                const Icon = d.icon;
                const controls = lang === "en" ? d.controls_en : d.controls_no;
                return (
                  <Card key={d.key} variant="flat" className={`${d.bgColor} border-l-[3px] ${d.borderColor}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${d.iconColor}`} />
                        <p className="text-sm font-semibold text-foreground">{t(d.title_no, d.title_en)}</p>
                      </div>
                      <ul className="grid gap-1">
                        {controls.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t("Foundation Status", "Foundation Status")}</span>{" "}
                {t(
                  "oppnås når minst 3 av 4 kontroller i hvert domene er implementert (modenhetsnivå ≥ 2).",
                  "is achieved when at least 3 of 4 controls in each domain are implemented (maturity level ≥ 2)."
                )}
              </p>
            </div>
          </div>

          {/* D. How controls connect to real work */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Slik henger kontrollene sammen med arbeidet", "How controls connect to real work")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(
                "Kontrollene eksisterer ikke i et vakuum. De er koblet til den daglige driften gjennom en tydelig struktur:",
                "Controls don't exist in a vacuum. They connect to daily operations through a clear structure:"
              )}
            </p>
            <div className="relative ml-1">
              <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-indigo-500 via-cyan-500 to-emerald-500 rounded-full" />
              {PIPELINE_STEPS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="relative flex items-start gap-4 py-2.5">
                    <div className={`relative z-10 h-10 w-10 rounded-full ${item.nodeColor} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <span className="text-sm font-bold text-white">{idx + 1}</span>
                    </div>
                    <div className={`flex-1 rounded-xl border border-border/50 ${item.bgColor} border-l-[3px] ${item.borderColor} p-3`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Icon className={`h-4 w-4 ${item.iconColor}`} />
                        <p className="text-sm font-semibold text-foreground">{t(item.title_no, item.title_en)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t(item.desc_no, item.desc_en)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* E. Framework Mapping */}
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                {t("Rammeverk-kartlegging", "Framework Mapping")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                {t(
                  "Du jobber med én operasjonell kontrollmodell — og dekker samtidig krav fra flere regelverk. Mynder mapper kontrollene automatisk slik at du slipper dobbeltarbeid.",
                  "Work with one operational control model — while covering requirements from multiple regulations. Mynder maps controls automatically so you avoid duplicate effort."
                )}
              </p>
            </div>

            <Card variant="flat" className="overflow-hidden border-border/60">
              <CardContent className="p-0">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                  {/* Left: Mynder Controls */}
                  <div className="flex flex-col items-center justify-center gap-3 p-6 bg-primary/[0.03]">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
                      <Layers className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Mynder Controls</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t("Én kontrollmodell", "One control model")}
                      </p>
                    </div>
                  </div>

                  {/* Center: Arrow connector */}
                  <div className="flex flex-col items-center gap-1 px-2">
                    <div className="h-px w-8 bg-border" />
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40" />
                    <div className="h-px w-8 bg-border" />
                  </div>

                  {/* Right: Frameworks */}
                  <div className="flex flex-col gap-2 p-6">
                    {FRAMEWORKS.map((fw) => (
                      <div key={fw.name} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 ${fw.color}`}>
                        <Shield className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-sm font-medium">{fw.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground leading-relaxed px-1">
              {t(
                "Organisasjonen jobber med én kontrollmodell i stedet for separate sjekklister per rammeverk — noe som reduserer duplisering og gir bedre oversikt.",
                "The organization works with one control model instead of separate checklists per framework — reducing duplication and providing better oversight."
              )}
            </p>
          </div>

          {/* F. What comes next */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {t("Hva kommer videre", "What comes next")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("Kontrollmodellen utvides jevnlig med nye områder:", "The control model is regularly expanded with new areas:")}
            </p>
            <div className="flex flex-wrap gap-2">
              {FUTURE_ITEMS.map((item, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t(item.no, item.en)}
                </Badge>
              ))}
            </div>
          </div>

          {/* G. Key principle */}
          <Card variant="flat" className="border-primary/20 bg-gradient-to-r from-primary/5 to-indigo-500/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {t("Nøkkelprinsippet", "Key principle")}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {t(
                      "Mynder hjelper organisasjoner med å styre sikkerhet, risiko og samsvar gjennom én operasjonell kontrollmodell — i stedet for flere regulatoriske sjekklister.",
                      "Mynder helps organizations manage security, risk and compliance through one operational control model — instead of multiple regulatory checklists."
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Link to methodology */}
          <Button variant="outline" onClick={() => navigate("/resources/maturity")} className="gap-2 w-full">
            {t("Se modenhetsmetodikk →", "View maturity methodology →")}
          </Button>

        </div>
      </main>
    </div>
  );
};

export default MynderControls;
