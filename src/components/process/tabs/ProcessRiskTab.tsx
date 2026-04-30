import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Sparkles } from "lucide-react";
import { EditRiskScenarioDialog } from "@/components/dialogs/EditRiskScenarioDialog";
import { RiskReductionSuccessDialog } from "@/components/dialogs/RiskReductionSuccessDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProcessRiskTabProps {
  processId: string;
}

interface RiskScenario {
  id: string;
  process_id: string;
  title: string;
  description: string | null;
  frameworks: string[];
  likelihood: string;
  consequence: string;
  risk_level: string;
  mitigation: string | null;
  mitigation_owner: string | null;
  mitigation_status: string;
  previous_risk_level: string | null;
  risk_reduced_at: string | null;
  created_at: string;
  updated_at: string;
  // optional agentic metadata (frontend-only fallbacks)
  lara_state?: "recommended" | "uncertain" | "updated" | null;
  lara_note?: string | null;
  user_state?: "pending" | "confirmed" | "adjusted" | "irrelevant" | null;
}

const MOCK_SCENARIOS: RiskScenario[] = [
  {
    id: "mock-1",
    process_id: "",
    title: "Personopplysninger om kandidater eksponeres via Meta Ads",
    description: "Custom Audiences kan dele kandidatdata med tredjeparter uten gyldig grunnlag.",
    frameworks: ["GDPR", "ISO27001"],
    likelihood: "high",
    consequence: "high",
    risk_level: "high",
    mitigation: null,
    mitigation_owner: null,
    mitigation_status: "not_started",
    previous_risk_level: null,
    risk_reduced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lara_state: "recommended",
    lara_note: "Lara anbefaler å starte her",
    user_state: "pending",
  },
  {
    id: "mock-2",
    process_id: "",
    title: "Algoritmisk diskriminering i kandidatutvelgelse",
    description: "Annonsealgoritmer kan ekskludere beskyttede grupper fra stillingsannonser.",
    frameworks: ["GDPR", "AI Act"],
    likelihood: "medium",
    consequence: "high",
    risk_level: "high",
    mitigation: null,
    mitigation_owner: null,
    mitigation_status: "not_started",
    previous_risk_level: null,
    risk_reduced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lara_state: "uncertain",
    lara_note: "Lara er usikker — datatype mangler",
    user_state: "pending",
  },
  {
    id: "mock-3",
    process_id: "",
    title: "Plattformnedetid stopper kampanjekjøring",
    description: "Tekniske feil hos Meta eller Google kan stoppe kritisk rekruttering.",
    frameworks: ["ISO27001"],
    likelihood: "medium",
    consequence: "medium",
    risk_level: "medium",
    mitigation: null,
    mitigation_owner: null,
    mitigation_status: "not_started",
    previous_risk_level: null,
    risk_reduced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lara_state: "updated",
    lara_note: "Lara oppdaterte risiko 2t siden",
    user_state: "pending",
  },
  {
    id: "mock-4",
    process_id: "",
    title: "Tilgangsstyring til annonsekontoer er svak",
    description: "Delte kontoer uten MFA gir risiko for misbruk og uautorisert publisering.",
    frameworks: ["ISO27001"],
    likelihood: "medium",
    consequence: "medium",
    risk_level: "medium",
    mitigation: null,
    mitigation_owner: null,
    mitigation_status: "not_started",
    previous_risk_level: null,
    risk_reduced_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lara_state: null,
    lara_note: null,
    user_state: "pending",
  },
];

type FilterKey = "pending" | "active" | "done";

const RISK_BADGE: Record<string, { label: string; ring: string; text: string; bg: string }> = {
  critical: { label: "Kritisk", ring: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/5" },
  high: { label: "Høy", ring: "border-destructive/40", text: "text-destructive", bg: "bg-destructive/5" },
  medium: { label: "Moderat", ring: "border-warning/40", text: "text-warning", bg: "bg-warning/5" },
  low: { label: "Lav", ring: "border-success/40", text: "text-success", bg: "bg-success/5" },
  acceptable: { label: "Akseptabel", ring: "border-success/40", text: "text-success", bg: "bg-success/5" },
};

export const ProcessRiskTab = ({ processId }: ProcessRiskTabProps) => {
  const [filter, setFilter] = useState<FilterKey>("pending");
  const [editingScenario, setEditingScenario] = useState<RiskScenario | null>(null);
  const [localStates, setLocalStates] = useState<Record<string, RiskScenario["user_state"]>>({});
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    previousLevel: string;
    newLevel: string;
    mitigation: string | null;
    frameworks: string[];
  }>({
    open: false,
    previousLevel: "",
    newLevel: "",
    mitigation: null,
    frameworks: [],
  });

  const queryClient = useQueryClient();

  const { data: scenarios = [], isLoading } = useQuery({
    queryKey: ["process-risk-scenarios", processId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_risk_scenarios")
        .select("*")
        .eq("process_id", processId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching risk scenarios:", error);
        return [];
      }
      return data as RiskScenario[];
    },
  });

  const displayScenarios: RiskScenario[] = scenarios.length > 0
    ? scenarios.map((s, i) => ({
        ...s,
        lara_state: s.lara_state ?? (i === 0 ? "recommended" : null),
        lara_note: s.lara_note ?? (i === 0 ? "Lara anbefaler å starte her" : null),
        user_state: localStates[s.id] ?? s.user_state ?? "pending",
      }))
    : MOCK_SCENARIOS.map((s) => ({
        ...s,
        process_id: processId,
        user_state: localStates[s.id] ?? s.user_state ?? "pending",
      }));

  const updateMutation = useMutation({
    mutationFn: async (scenario: Partial<RiskScenario> & { id: string }) => {
      if (scenario.id.startsWith("mock-")) {
        const { id, ...data } = scenario;
        const { error } = await supabase.from("process_risk_scenarios").insert({
          process_id: processId,
          title: data.title || "Nytt scenario",
          description: data.description,
          frameworks: data.frameworks,
          likelihood: data.likelihood,
          consequence: data.consequence,
          risk_level: data.risk_level,
          mitigation: data.mitigation,
          mitigation_owner: data.mitigation_owner,
          mitigation_status: data.mitigation_status,
          previous_risk_level: data.previous_risk_level,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("process_risk_scenarios")
          .update(scenario)
          .eq("id", scenario.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-risk-scenarios", processId] });
      toast.success("Risikoscenario oppdatert");
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("process_risk_scenarios").insert({
        process_id: processId,
        title: "Nytt risikoscenario",
        likelihood: "medium",
        consequence: "medium",
        risk_level: "medium",
        frameworks: [],
        mitigation_status: "not_started",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["process-risk-scenarios", processId] });
      toast.success("Risikoscenario opprettet");
    },
  });

  const handleRiskReduced = (previousLevel: string, newLevel: string, scenario: RiskScenario) => {
    setSuccessDialog({
      open: true,
      previousLevel,
      newLevel,
      mitigation: scenario.mitigation,
      frameworks: scenario.frameworks,
    });
  };

  const counts = useMemo(() => {
    const c = { pending: 0, active: 0, done: 0 };
    for (const s of displayScenarios) {
      const state = s.user_state ?? "pending";
      if (state === "pending") c.pending++;
      else if (state === "confirmed" || state === "adjusted") c.active++;
      else if (state === "irrelevant") c.done++;
    }
    return c;
  }, [displayScenarios]);

  const filtered = displayScenarios.filter((s) => {
    const state = s.user_state ?? "pending";
    if (filter === "pending") return state === "pending";
    if (filter === "active") return state === "confirmed" || state === "adjusted";
    return state === "irrelevant";
  });

  const setUserState = (id: string, state: RiskScenario["user_state"]) => {
    setLocalStates((prev) => ({ ...prev, [id]: state }));
    if (state === "confirmed") toast.success("Bekreftet");
    else if (state === "irrelevant") toast.message("Markert som ikke relevant");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header — agentic status line */}
      <div className="space-y-1">
        <h3 className="text-2xl font-semibold tracking-tight">Risikoscenarier</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex h-2 w-2 rounded-full bg-success" />
          <span>Lara overvåker · {counts.pending} forslag venter på deg</span>
          <span>·</span>
          <button className="text-primary hover:underline">Se aktivitet</button>
        </div>
      </div>

      {/* Filter tabs — clean, underline style */}
      <div className="flex items-center gap-6 border-b">
        {([
          { key: "pending" as FilterKey, label: "Venter på meg", count: counts.pending, accent: true },
          { key: "active" as FilterKey, label: "Aktivt", count: counts.active },
          { key: "done" as FilterKey, label: "Ferdig", count: counts.done },
        ]).map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cn(
                "relative -mb-px flex items-center gap-2 pb-3 pt-1 text-sm font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span>{t.label}</span>
              <span
                className={cn(
                  "inline-flex h-5 min-w-[20px] items-center justify-center rounded px-1.5 text-xs font-semibold",
                  active && t.accent
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {t.count}
              </span>
              {active && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* Scenario list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Ingen scenarier i denne visningen.
          </div>
        )}

        {filtered.map((scenario) => {
          const badge = RISK_BADGE[scenario.risk_level] ?? RISK_BADGE.medium;
          const reqCount = scenario.frameworks?.length || 0;
          return (
            <div
              key={scenario.id}
              className="group rounded-xl border bg-card p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* meta line */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>Dekker {reqCount} krav</span>
                    {scenario.lara_note && (
                      <>
                        <span>·</span>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1",
                            scenario.lara_state === "uncertain" ? "text-warning" : "text-primary"
                          )}
                        >
                          <Sparkles className="h-3 w-3" />
                          {scenario.lara_note}
                        </span>
                      </>
                    )}
                  </div>

                  {/* title */}
                  <h4 className="mt-1 text-base font-semibold text-foreground">
                    {scenario.title}
                  </h4>

                  {/* description */}
                  {scenario.description && (
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {scenario.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => setUserState(scenario.id, "confirmed")}
                      className="h-8"
                    >
                      Bekreft
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingScenario(scenario)}
                      className="h-8"
                    >
                      Juster
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setUserState(scenario.id, "irrelevant")}
                      className="h-8 text-muted-foreground hover:text-foreground"
                    >
                      Ikke relevant
                    </Button>
                  </div>
                </div>

                {/* Risk circle */}
                <div className="shrink-0">
                  <div
                    className={cn(
                      "flex h-14 w-14 items-center justify-center rounded-full border-2",
                      badge.ring,
                      badge.bg
                    )}
                  >
                    <span className={cn("text-xs font-semibold", badge.text)}>
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer — add own */}
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          Har Lara oversett noe? Beskriv selv en risiko du tenker på.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => createMutation.mutate()}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Legg til eget
        </Button>
      </div>

      {/* Edit Dialog */}
      <EditRiskScenarioDialog
        open={!!editingScenario}
        onOpenChange={(open) => !open && setEditingScenario(null)}
        scenario={editingScenario}
        onSave={(updated) => {
          updateMutation.mutate(updated);
          if (editingScenario) setUserState(editingScenario.id, "adjusted");
        }}
        onRiskReduced={handleRiskReduced}
      />

      {/* Success Dialog */}
      <RiskReductionSuccessDialog
        open={successDialog.open}
        onOpenChange={(open) => setSuccessDialog((prev) => ({ ...prev, open }))}
        previousLevel={successDialog.previousLevel}
        newLevel={successDialog.newLevel}
        mitigation={successDialog.mitigation}
        frameworks={successDialog.frameworks}
      />
    </div>
  );
};
