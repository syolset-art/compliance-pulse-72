import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  Clock,
  Handshake,
  Scale,
  ArrowRight,
  Sparkles,
  Building2,
  FileCheck,
  Users,
} from "lucide-react";

const BENEFITS = [
  {
    icon: Clock,
    titleNb: "Spar tid — lever én gang, svar til alle",
    titleEn: "Save time — deliver once, reply to everyone",
    descNb: "Slipp å sende de samme dokumentene på nytt hver gang en kunde, revisor eller leverandør spør.",
    descEn: "Stop sending the same documents over and over every time a customer, auditor or vendor asks.",
  },
  {
    icon: Handshake,
    titleNb: "Bygg tillit — vis at du har kontroll, verifisert",
    titleEn: "Build trust — show you are in control, verified",
    descNb: "En offentlig Trust Profile signaliserer at virksomheten tar sikkerhet og compliance på alvor.",
    descEn: "A public Trust Profile signals that your organization takes security and compliance seriously.",
  },
  {
    icon: Scale,
    titleNb: "Møt regelverket — NIS2, GDPR og EU AI Act på ett sted",
    titleEn: "Meet regulations — NIS2, GDPR and EU AI Act in one place",
    descNb: "Samle bevis, modenhetsvurderinger og policy-dokumentasjon i én strukturert profil.",
    descEn: "Collect evidence, maturity assessments and policy documentation in one structured profile.",
  },
  {
    icon: Users,
    titleNb: "Del status med kunder og partnere",
    titleEn: "Share status with customers and partners",
    descNb: "Gi kunder og MSP-partnere innsyn i din compliance-status uten å dele sensitive filer.",
    descEn: "Give customers and MSP partners insight into your compliance status without sharing sensitive files.",
  },
];

export default function TrustCenterActivate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16">
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-20">
          {/* Hero */}
          <div className="text-center space-y-4 mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-2">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              {isNb
                ? "Gjør virksomheten din synlig og verifisert"
                : "Make your organization visible and verified"}
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {isNb
                ? "Aktiver din Trust Profile én gang. Deretter kan du dele status med kunder, leverandører og revisorer — uten å sende dokumenter på nytt hver gang noen spør."
                : "Activate your Trust Profile once. Then share status with customers, vendors and auditors — without sending documents over and over again."}
            </p>
          </div>

          {/* Benefit cards */}
          <div className="space-y-4 mb-12">
            {BENEFITS.map((b) => (
              <div
                key={b.titleNb}
                className="flex gap-4 rounded-xl border border-border bg-card/60 p-5 transition-colors hover:bg-card"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">
                    {isNb ? b.titleNb : b.titleEn}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isNb ? b.descNb : b.descEn}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* What happens next */}
          <div className="rounded-xl border border-border bg-muted/40 p-6 space-y-4 mb-10">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {isNb ? "Hva skjer når du aktiverer?" : "What happens when you activate?"}
            </h2>
            <ol className="space-y-3">
              {[
                {
                  icon: Building2,
                  nb: "Lara henter offentlig informasjon om virksomheten din og klargjør en baseline.",
                  en: "Lara retrieves public information about your organization and prepares a baseline.",
                },
                {
                  icon: FileCheck,
                  nb: "Du bekrefter organisasjonsnummer, nettside og nøkkelpersoner.",
                  en: "You confirm organization number, website and key personnel.",
                },
                {
                  icon: ShieldCheck,
                  nb: "Profilen publiseres og kan deles via offentlig lenke — når du selv velger det.",
                  en: "The profile is published and can be shared via public link — when you choose to.",
                },
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{isNb ? step.nb : step.en}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4">
            <Button
              size="lg"
              className="gap-2 text-base px-8 h-12 rounded-xl"
              onClick={() => navigate("/trust-center/profile?activate=1")}
            >
              <Sparkles className="h-5 w-5" />
              {isNb ? "Aktiver Trust Profile" : "Activate Trust Profile"}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              {isNb
                ? "Tar ca. 3–5 minutter. Du kan redigere profilen når som helst etterpå."
                : "Takes about 3–5 minutes. You can edit the profile anytime afterwards."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
