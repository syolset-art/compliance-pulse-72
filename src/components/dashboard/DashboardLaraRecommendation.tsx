import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Diamond, ChevronLeft, ChevronRight, X, Sparkles, Mail, FileSearch, CheckCircle2, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
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
  const [phase, setPhase] = useState<"working" | "draft" | "sent">("working");
  const [draftBody, setDraftBody] = useState("");
  const [workingStep, setWorkingStep] = useState(0);

  // Animate Lara's "thinking" steps then reveal the draft
  useEffect(() => {
    if (!laraModalOpen || phase !== "working") return;
    setWorkingStep(0);
    const t1 = setTimeout(() => setWorkingStep(1), 900);
    const t2 = setTimeout(() => setWorkingStep(2), 1800);
    const t3 = setTimeout(() => setPhase("draft"), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [laraModalOpen, phase]);

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
      vendorPath: "/assets/987b8be1-3387-4491-9312-57e32eca9483",
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
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:contents">
          <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Diamond className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button
            size="sm"
            className="rounded-full px-4 flex-1 sm:flex-none"
            onClick={() => {
              setShowPlan(true);
              setStep(0);
            }}
          >
            {isNb ? "Vis plan" : "Show plan"}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-2"
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
          <p className="text-sm text-foreground/80 mt-0.5">
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
      <div className="rounded-xl bg-card border border-border p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", sev.dot)} />
            <span className={cn("text-xs font-bold tracking-wider", sev.text)}>
              {sev.label}
            </span>
          </div>
          <h4 className="text-lg sm:text-xl font-bold text-foreground break-words">{current.vendor}</h4>
          <p className="text-sm text-foreground/70">{current.category}</p>
        </div>

        <div className="rounded-lg bg-muted/60 p-3 sm:p-4 space-y-1.5 border border-border/50">
          <p className="text-xs font-bold text-foreground/60 tracking-wider">
            {isNb ? "LARA SER" : "LARA SEES"}
          </p>
          <p className="text-sm text-foreground leading-relaxed">{current.insight}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 pt-1">
          <Button
            className="rounded-full px-5 w-full sm:w-auto"
            onClick={() => {
              setPhase("working");
              setDraftBody(
                isNb
                  ? `Hei Ola,\n\nI forbindelse med vår løpende kartlegging av databehandlere etter GDPR art. 28, ber vi om at det inngås databehandleravtale mellom Mynder AS og ${current.vendor}.\n\nVedlagt finner du vår standard databehandleravtale (Mynder Standard DPA v2.3). Den dekker formål, sikkerhetstiltak, underleverandører og tredjelandsoverføringer.\n\nVi setter pris på om du kan signere og returnere innen 14 dager. Hvis dere allerede har en gjeldende DPA dere ønsker å bruke, send den gjerne tilbake så vurderer vi den.\n\nTa kontakt om noe er uklart.\n\nVennlig hilsen,\nSynnøve Olset\nMynder AS`
                  : `Hi,\n\nAs part of our ongoing data processor mapping under GDPR art. 28, we request a Data Processing Agreement between Mynder AS and ${current.vendor}.\n\nAttached is our standard DPA (Mynder Standard DPA v2.3), covering purpose, security measures, sub-processors and third-country transfers.\n\nWe'd appreciate it if you could sign and return within 14 days. If you have an existing DPA you'd prefer to use, please send it back for our review.\n\nLet us know if anything is unclear.\n\nKind regards,\nSynnøve Olset\nMynder AS`
              );
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
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
          {/* Header */}
          <div className="bg-primary/5 border-b border-primary/10 px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Diamond className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {phase === "sent"
                  ? isNb ? `E-post sendt til ${current.vendor}` : `Email sent to ${current.vendor}`
                  : isNb ? `Send DPA-forespørsel til ${current.vendor.split(" ")[0]}` : `Send DPA request to ${current.vendor.split(" ")[0]}`}
              </p>
              <p className="text-xs text-primary mt-0.5">
                {phase === "working"
                  ? isNb ? "Jeg klargjør utkastet…" : "Preparing your draft…"
                  : phase === "draft"
                  ? isNb ? "Jeg har laget et utkast — godkjenn så sender jeg det." : "I've drafted this — approve and I'll send it."
                  : isNb ? "Jeg følger opp og varsler deg ved svar." : "I'll follow up and notify you on reply."}
              </p>
            </div>
            <button
              onClick={() => setLaraModalOpen(false)}
              className="h-8 w-8 rounded-full border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label={isNb ? "Lukk" : "Close"}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {phase === "working" ? (
            <div className="px-5 py-10 flex flex-col items-center justify-center min-h-[280px] gap-5">
              <div className="relative">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <Diamond className="h-6 w-6 text-primary" />
                </div>
                <Loader2 className="h-14 w-14 absolute inset-0 text-primary animate-spin opacity-60" />
              </div>
              <div className="w-full max-w-xs space-y-2">
                {[
                  isNb ? "Henter leverandørprofil og kontakt…" : "Fetching vendor profile and contact…",
                  isNb ? "Velger riktig DPA-mal (Mynder Standard v2.3)…" : "Selecting the right DPA template (Mynder Standard v2.3)…",
                  isNb ? "Skriver utkast på vegne av deg…" : "Drafting the message on your behalf…",
                ].map((label, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-2 text-sm transition-opacity",
                      i <= workingStep ? "opacity-100" : "opacity-40"
                    )}
                  >
                    {i < workingStep ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : i === workingStep ? (
                      <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                    )}
                    <span className="text-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : phase === "draft" ? (
            <div className="px-5 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Meta strip */}
              <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border/60 text-sm">
                {[
                  { label: isNb ? "Mal" : "Template", value: "Mynder Standard DPA v2.3" },
                  { label: isNb ? "Fra" : "From", value: "synnove@mynder.no" },
                  { label: isNb ? "Til" : "To", value: "ola.nordmann@visma.no" },
                  {
                    label: isNb ? "Score-effekt" : "Score impact",
                    value: isNb ? "+3 ved retur" : "+3 on response",
                    accent: true,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between px-4 py-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {row.label}
                    </span>
                    <span className={cn("text-sm", row.accent ? "text-primary font-semibold" : "text-foreground")}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Email preview */}
              <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-border bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {isNb ? "Emne" : "Subject"}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5 leading-snug">
                    {isNb
                      ? "Forespørsel om databehandleravtale (DPA) — Mynder AS"
                      : "Request for Data Processing Agreement (DPA) — Mynder AS"}
                  </p>
                </div>
                <Textarea
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  rows={14}
                  className="text-sm leading-relaxed resize-none border-0 rounded-none focus-visible:ring-0 bg-card font-[450] px-4 py-3"
                />
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-success/15 text-success flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground">
                  {isNb ? "E-post sendt" : "Email sent"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isNb
                    ? "Lara venter på svar og oppdaterer leverandørprofilen automatisk."
                    : "Lara is awaiting a response and will update the vendor profile automatically."}
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          {phase === "draft" && (
            <div className="border-t border-border bg-muted/20 px-5 py-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {isNb ? "Ingenting sendes før du godkjenner" : "Nothing is sent until you approve"}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLaraModalOpen(false)}
                  className="rounded-full"
                >
                  {isNb ? "Avbryt" : "Cancel"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setPhase("sent")}
                  className="rounded-full gap-2"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isNb ? "Godkjenn og send" : "Approve and send"}
                </Button>
              </div>
            </div>
          )}

          {phase === "sent" && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setLaraModalOpen(false);
                  navigate("/lara-inbox");
                }}
                className="rounded-full"
              >
                {isNb ? "Åpne Lara Inbox" : "Open Lara Inbox"}
              </Button>
              <Button
                onClick={() => {
                  setLaraModalOpen(false);
                  if (step < total - 1) setStep(step + 1);
                }}
                className="rounded-full"
              >
                {isNb ? "Neste oppgave" : "Next task"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
