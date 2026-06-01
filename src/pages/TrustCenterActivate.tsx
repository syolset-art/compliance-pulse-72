import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { ShieldCheck, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";

const BENEFITS_NB = [
  "Spar tid — lever én gang, svar til alle",
  "Bygg tillit — vis at du har kontroll, verifisert",
  "Møt regelverket — NIS2, GDPR og EU AI Act på ett sted",
];

const BENEFITS_EN = [
  "Save time — deliver once, reply to everyone",
  "Build trust — show you are in control, verified",
  "Meet regulations — NIS2, GDPR and EU AI Act in one place",
];

export default function TrustCenterActivate() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb";

  const benefits = isNb ? BENEFITS_NB : BENEFITS_EN;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16">
        <div className="max-w-lg mx-auto px-6 py-16 md:py-24 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-5">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-3">
            {isNb
              ? "Gjør virksomheten din synlig og verifisert"
              : "Make your organization visible and verified"}
          </h1>

          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            {isNb
              ? "Aktiver din Trust Profile én gang. Del status med kunder, leverandører og revisorer — uten å sende dokumenter på nytt."
              : "Activate your Trust Profile once. Share status with customers, vendors and auditors — without sending documents over and over."}
          </p>

          <ul className="space-y-2.5 mb-10 text-left inline-block">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <Button
            size="lg"
            className="gap-2 text-base px-7 h-11 rounded-xl"
            onClick={() => navigate("/trust-center/profile?activate=1")}
          >
            <Sparkles className="h-4 w-4" />
            {isNb ? "Aktiver Trust Profile" : "Activate Trust Profile"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            {isNb
              ? "Tar ca. 3–5 minutter. Du kan redigere profilen når som helst etterpå."
              : "Takes about 3–5 minutes. You can edit the profile anytime afterwards."}
          </p>
        </div>
      </main>
    </div>
  );
}
