import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Lock,
  Shield,
  Sparkles,
  Check,
  CheckCircle2,
  ArrowRight,
  FileText,
  AlertTriangle,
  BarChart3,
  Building2,
  Eye,
  Play,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type DemoStep = "preview" | "terms" | "activating" | "activated";

const REGULATION_BADGES = ["GDPR Art. 28", "NIS2", "ISO 27001 A.15", "DORA Art. 28-30"];

const FEATURES = [
  { icon: FileText, title: "DPA-sporing", desc: "Automatisk innhenting og status på databehandleravtaler." },
  { icon: Shield, title: "Risikoanalyse", desc: "AI-drevet vurdering av leverandørrisiko via Lara." },
  { icon: BarChart3, title: "Compliance-scoring", desc: "Løpende score per leverandør med varsler ved avvik." },
  { icon: Building2, title: "Ubegrenset antall", desc: "Legg til så mange leverandører som du trenger." },
];

// Pris settes senere — vises som tom inntil videre
const PRICE_LABEL: string | null = null;

export default function VendorDemoActivation() {
  const navigate = useNavigate();
  const [step, setStep] = useState<DemoStep>("preview");
  const [termsOpen, setTermsOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrice, setAcceptedPrice] = useState(false);

  const startActivation = () => {
    setTermsOpen(true);
  };

  const confirmActivation = () => {
    setTermsOpen(false);
    setStep("activating");
    setTimeout(() => {
      setStep("activated");
      toast.success("Leverandørstyring aktivert!");
    }, 1800);
  };

  const reset = () => {
    setStep("preview");
    setAcceptedTerms(false);
    setAcceptedPrice(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-11">
        <div className="container max-w-6xl mx-auto p-4 md:p-6 space-y-6">
          {/* Demo header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide gap-1">
                  <Eye className="h-3 w-3" /> Demo
                </Badge>
                <h1 className="text-xl md:text-2xl font-bold text-primary">
                  Aktivering av Leverandørstyring
                </h1>
              </div>
              <p className="text-sm text-muted-foreground">
                Forhåndsvisning av kundeopplevelsen — fra ikke-aktivert modul til full tilgang.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Start på nytt
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <Stepper current={step} />

          {/* Stage content */}
          {step === "preview" && <PreviewStage onStart={startActivation} />}
          {step === "terms" && null /* handled by dialog */}
          {step === "activating" && <ActivatingStage />}
          {step === "activated" && <ActivatedStage onGoToVendors={() => navigate("/vendors")} />}

          {/* Terms & price dialog */}
          <Dialog open={termsOpen} onOpenChange={setTermsOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Bekreft aktivering
                </DialogTitle>
                <DialogDescription>
                  Bekreft betingelsene for å aktivere Leverandørstyring.
                </DialogDescription>
              </DialogHeader>

              {/* Inclusions */}
              <div className="space-y-2">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{f.title}</span>
                  </div>
                ))}
              </div>

              {/* Confirmations */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <Checkbox
                    checked={acceptedTerms}
                    onCheckedChange={(c) => setAcceptedTerms(c === true)}
                    className="mt-0.5"
                  />
                  <span className="text-[13px] text-foreground leading-snug">
                    Jeg godtar{" "}
                    <a href="#" className="text-primary underline hover:no-underline">
                      vilkårene for tjenesten
                    </a>{" "}
                    og{" "}
                    <a href="#" className="text-primary underline hover:no-underline">
                      databehandleravtalen
                    </a>
                    .
                  </span>
                </label>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setTermsOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={confirmActivation}
                  disabled={!acceptedTerms}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  Aktiver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}

/* ───────── Stepper ───────── */

function Stepper({ current }: { current: DemoStep }) {
  const order: DemoStep[] = ["preview", "terms", "activating", "activated"];
  const labels: Record<DemoStep, string> = {
    preview: "Ikke aktivert",
    terms: "Vilkår & pris",
    activating: "Aktiverer",
    activated: "Aktivert",
  };
  const currentIdx = order.indexOf(current);

  return (
    <div className="flex items-center gap-2">
      {order.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors",
                done && "bg-success/15 border-success/30 text-success",
                active && "bg-primary text-primary-foreground border-primary",
                !done && !active && "bg-muted border-border text-muted-foreground"
              )}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-xs",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {labels[s]}
            </span>
            {i < order.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
          </div>
        );
      })}
    </div>
  );
}

/* ───────── Preview (not activated) ───────── */

function PreviewStage({ onStart }: { onStart: () => void }) {
  return (
    <div className="space-y-4">
      {/* Locked module banner */}
      <Card className="p-6 border-primary/20 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Leverandørstyring (TPRM)</h2>
              <Badge variant="outline" className="text-[10px] gap-1 border-warning/30 text-warning">
                <Lock className="h-3 w-3" /> Ikke aktivert
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
              Få kontroll på tredjepartsrisiko med løpende vurderinger, sporbar evidens og tydelig DPA-oversikt.
              Automatiser innhenting og oppfølging — og ta beslutninger raskere.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {REGULATION_BADGES.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs font-normal text-muted-foreground">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          <Card className="p-4 border-primary/20 bg-primary/5 min-w-[220px] text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Pris</p>
            <p className="text-2xl font-bold text-primary">
              {PRICE_LABEL ?? <span className="text-muted-foreground/60">—</span>}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1">Kanselleres når som helst</p>
          </Card>
        </div>
      </Card>

      {/* Activation CTA */}
      <Card className="p-4 bg-gradient-to-r from-warning/10 to-accent/10 border-warning/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/15">
              <Lock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Modulen er ikke aktivert</p>
              <p className="text-xs text-muted-foreground">
                Aktiver for full tilgang til automatisert leverandørstyring, DPA-sporing og risikoanalyse.
              </p>
            </div>
          </div>
          <Button onClick={onStart} className="gap-2 shrink-0">
            <Play className="h-4 w-4" />
            Start aktivering
          </Button>
        </div>
      </Card>

      {/* Feature preview grid (locked) */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Hva du får tilgang til
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.title} className="p-4 relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{f.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Locked dashboard preview */}
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Forhåndsvisning av dashbord
        </p>
        <div className="relative rounded-lg border border-dashed border-border overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 pointer-events-none select-none opacity-50">
            {[
              { label: "Totalt leverandører", value: "—" },
              { label: "Snitt compliance", value: "—%" },
              { label: "Høy risiko", value: "—" },
              { label: "Krever oppfølging", value: "—" },
            ].map((m) => (
              <Card key={m.label} className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-muted-foreground/40">{m.value}</p>
              </Card>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border shadow-sm">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Aktiver for å se dataene dine</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Activating ───────── */

function ActivatingStage() {
  return (
    <Card className="p-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
        <Sparkles className="h-7 w-7 text-primary animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">Aktiverer Leverandørstyring …</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Setter opp DPA-sporing, risikoanalyse og Lara-integrasjoner for organisasjonen din.
      </p>
      <div className="mt-6 max-w-xs mx-auto space-y-2 text-left">
        {[
          "Klargjør modul",
          "Aktiverer Lara-agenter",
          "Indekserer eksisterende leverandører",
        ].map((s, i) => (
          <div key={s} className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
              style={{ animationDelay: `${i * 200}ms` }}
            />
            {s}
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────── Activated ───────── */

function ActivatedStage({ onGoToVendors }: { onGoToVendors: () => void }) {
  return (
    <div className="space-y-4">
      <Card className="p-6 border-success/30 bg-success/5">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-success/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Leverandørstyring er aktivert
            </h3>
            <p className="text-sm text-muted-foreground">
              Du har nå full tilgang.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {FEATURES.map((f) => (
                <Badge key={f.title} variant="outline" className="gap-1 text-xs border-success/30 text-success">
                  <Check className="h-3 w-3" /> {f.title}
                </Badge>
              ))}
            </div>
          </div>
          <Button onClick={onGoToVendors} className="gap-2 shrink-0">
            Gå til Leverandører
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <Card className="p-4 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Lara er klar til å hjelpe</p>
            <p className="text-[13px] text-muted-foreground">
              Lara har allerede begynt å analysere eksisterende leverandører og dokumentasjon.
              Anbefalinger vises på Oversikt-fanen.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { icon: AlertTriangle, title: "3 leverandører trenger DPA", color: "text-destructive", bg: "bg-destructive/10" },
          { icon: FileText, title: "5 dokumenter klare for analyse", color: "text-warning", bg: "bg-warning/10" },
          { icon: BarChart3, title: "Compliance-score: 72%", color: "text-success", bg: "bg-success/10" },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="p-3 flex items-center gap-2.5">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", c.bg)}>
                <Icon className={cn("h-4 w-4", c.color)} />
              </div>
              <p className="text-sm text-foreground">{c.title}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
