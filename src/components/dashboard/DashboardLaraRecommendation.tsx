import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Diamond, ChevronLeft, ChevronRight, X, Sparkles, Mail, FileSearch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Severity = "critical" | "high" | "medium";

interface PlanTask {
  severity: Severity;
  vendor: string;
  category: string;
  insight: string;
  vendorPath: string;
}

export function DashboardLaraRecommendation() {
  const { i18n } = useTranslation();
  const isNb = i18n.language === "nb" || i18n.language === "no";
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [step, setStep] = useState(0);
  const [laraModalOpen, setLaraModalOpen] = useState(false);
  const [laraConfirmed, setLaraConfirmed] = useState(false);

  // Find vendors missing DPA documentation
  const { data: missingDpaCount = 0 } = useQuery({
    queryKey: ["lara-missing-dpa-count"],
    queryFn: async () => {
      const { data: vendors } = await supabase
        .from("assets")
        .select("id")
        .eq("asset_type", "vendor")
        .limit(1000);
      if (!vendors?.length) return 0;

      const { data: docs } = await supabase
        .from("vendor_documents")
        .select("asset_id, document_type")
        .in("asset_id", vendors.map((v) => v.id));

      const withDpa = new Set(
        (docs || [])
          .filter((d: any) => (d.document_type || "").toLowerCase().includes("dpa"))
          .map((d: any) => d.asset_id)
      );
      return vendors.filter((v) => !withDpa.has(v.id)).length;
    },
  });

  if (dismissed) return null;

  const count = missingDpaCount || 12;
  const criticalCount = 8;

  // Demo plan tasks (3 critical examples)
  const tasks: PlanTask[] = [
    {
      severity: "critical",
      vendor: "Visma Software AS",
      category: isNb ? "Lønn og HR · databehandler" : "Payroll & HR · processor",
      insight: isNb
        ? "Behandler personopplysninger om 47 ansatte. Ingen DPA registrert. Hovedkontakt: Ola Nordmann."
        : "Processes personal data for 47 employees. No DPA registered. Main contact: Ola Nordmann.",
      vendorPath: "/vendors",
    },
    {
      severity: "critical",
      vendor: "Microsoft Azure",
      category: isNb ? "Skyinfrastruktur · databehandler" : "Cloud infrastructure · processor",
      insight: isNb
        ? "Kritisk system uten oppdatert risikovurdering siste 12 måneder. DPA finnes, men ikke verifisert."
        : "Critical system without updated risk assessment in the last 12 months. DPA exists but not verified.",
      vendorPath: "/vendors",
    },
    {
      severity: "critical",
      vendor: "Slack Technologies",
      category: isNb ? "Kommunikasjon · databehandler" : "Communication · processor",
      insight: isNb
        ? "Overfører data til USA. Mangler dokumentasjon på SCCs. Brukes daglig av 32 ansatte."
        : "Transfers data to the US. Missing SCC documentation. Used daily by 32 employees.",
      vendorPath: "/vendors",
    },
  ];

  const total = tasks.length;
  const current = tasks[step];

  const severityChip = (sev: Severity) => {
    if (sev === "critical")
      return {
        dot: "bg-destructive",
        label: isNb ? "KRITISK" : "CRITICAL",
        text: "text-destructive",
      };
    if (sev === "high")
      return {
        dot: "bg-warning",
        label: isNb ? "HØY" : "HIGH",
        text: "text-warning",
      };
    return {
      dot: "bg-muted-foreground",
      label: isNb ? "MEDIUM" : "MEDIUM",
      text: "text-muted-foreground",
    };
  };

  // ---- Compact recommendation banner ----
  if (!showPlan) {
    const title = isNb ? "Lara har en anbefaling til deg" : "Lara has a recommendation for you";
    const message = isNb
      ? `Du har ${count} oppgaver som krever oppmerksomhet, hvorav ${criticalCount} er kritiske. Vil du starte en gjennomgang?`
      : `You have ${count} tasks that need attention, ${criticalCount} of them critical. Would you like to start a review?`;

    return (
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Diamond className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            className="rounded-full px-4"
            onClick={() => {
              setShowPlan(true);
              setStep(0);
            }}
          >
            {isNb ? "Vis plan" : "Show plan"}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isNb ? "Ikke nå" : "Not now"}
          </button>
        </div>
      </div>
    );
  }

  // ---- Expanded plan view ----
  const sev = severityChip(current.severity);

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
          <Diamond className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {isNb ? "Lara har lagt en plan" : "Lara has prepared a plan"}
          </p>
          <p className="text-sm text-primary mt-0.5">
            {isNb
              ? `${count} oppgaver totalt — starter med de ${total} mest kritiske · ca. ${total * 3} min`
              : `${count} tasks total — starting with the ${total} most critical · ~${total * 3} min`}
          </p>
        </div>
        <button
          onClick={() => setShowPlan(false)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          {isNb ? "Lukk" : "Close"}
        </button>
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-1.5">
        {tasks.map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 rounded-full transition-all",
              i === step ? "w-8 bg-primary" : "w-5 bg-muted"
            )}
          />
        ))}
      </div>

      {/* Task card */}
      <div className="rounded-xl bg-card border border-border p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
            <span className={cn("text-xs font-bold tracking-wider", sev.text)}>
              {sev.label}
            </span>
          </div>
          <h4 className="text-xl font-bold text-foreground">{current.vendor}</h4>
          <p className="text-sm text-muted-foreground">{current.category}</p>
        </div>

        <div className="rounded-lg bg-muted/40 p-4 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider">
            {isNb ? "LARA SER" : "LARA SEES"}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{current.insight}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button
            className="rounded-full px-5"
            onClick={() => {
              setLaraConfirmed(false);
              setLaraModalOpen(true);
            }}
          >
            {isNb ? "Be Lara håndtere det" : "Ask Lara to handle it"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full px-5"
            onClick={() => navigate(current.vendorPath)}
          >
            {isNb ? "Åpne leverandøren" : "Open vendor"}
          </Button>
        </div>
      </div>

      {/* Footer navigation */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={isNb ? "Forrige" : "Previous"}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {step + 1} {isNb ? "av" : "of"} {total}
          </span>
          <button
            onClick={() => setStep(Math.min(total - 1, step + 1))}
            disabled={step === total - 1}
            className="h-9 w-9 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={isNb ? "Neste" : "Next"}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => navigate("/tasks")}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {isNb ? "Vis alle oppgaver" : "Show all tasks"}
          <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold tabular-nums">
            {count}
          </span>
        </button>
      </div>

      {/* Lara handle-it modal */}
      <Dialog open={laraModalOpen} onOpenChange={setLaraModalOpen}>
        <DialogContent className="sm:max-w-md">
          {!laraConfirmed ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Diamond className="h-4 w-4" />
                  </div>
                  <div>
                    <DialogTitle>
                      {isNb ? "Lara tar over" : "Lara takes over"}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5">
                      {current.vendor}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {isNb
                    ? "Lara vil utføre følgende steg automatisk:"
                    : "Lara will perform the following steps automatically:"}
                </p>
                <div className="space-y-2.5">
                  {[
                    {
                      icon: FileSearch,
                      text: isNb
                        ? "Søke opp leverandørens DPA og personvernvilkår"
                        : "Look up the vendor's DPA and privacy terms",
                    },
                    {
                      icon: Mail,
                      text: isNb
                        ? "Sende forespørsel til hovedkontakt på vegne av deg"
                        : "Send a request to the main contact on your behalf",
                    },
                    {
                      icon: Sparkles,
                      text: isNb
                        ? "Analysere svar og oppdatere risikovurderingen"
                        : "Analyze the response and update the risk assessment",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <s.icon className="h-4 w-4" />
                      </div>
                      <p className="text-sm text-foreground leading-relaxed pt-1">
                        {s.text}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <p className="text-xs text-foreground">
                    {isNb
                      ? "Du får varsel når Lara er ferdig — vanligvis innen 24 timer."
                      : "You'll be notified when Lara is done — usually within 24 hours."}
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setLaraModalOpen(false)}
                >
                  {isNb ? "Avbryt" : "Cancel"}
                </Button>
                <Button
                  onClick={() => setLaraConfirmed(true)}
                  className="gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isNb ? "Start Lara" : "Start Lara"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>
                      {isNb ? "Lara er i gang" : "Lara is on it"}
                    </DialogTitle>
                    <DialogDescription className="mt-0.5">
                      {isNb
                        ? `Oppgaven for ${current.vendor} er flyttet til Lara.`
                        : `The task for ${current.vendor} has been handed to Lara.`}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <p className="text-sm text-muted-foreground">
                {isNb
                  ? "Du kan følge fremdriften under «Aktivitet» eller i Lara Inbox."
                  : "You can track progress under \"Activity\" or in the Lara Inbox."}
              </p>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setLaraModalOpen(false);
                    navigate("/lara-inbox");
                  }}
                >
                  {isNb ? "Åpne Lara Inbox" : "Open Lara Inbox"}
                </Button>
                <Button
                  onClick={() => {
                    setLaraModalOpen(false);
                    if (step < total - 1) setStep(step + 1);
                  }}
                >
                  {isNb ? "Neste oppgave" : "Next task"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
