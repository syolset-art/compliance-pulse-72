import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { RequirementImpactSuggestion } from "@/lib/deviationImpact";
import { requiresConfirmation, suggestedMeasuresForDeviation } from "@/lib/deviationImpact";

export interface VendorDeviationInput {
  assetId: string;
  title: string;
  description: string;
  category: string;
  criticality: string;
  responsible: string;
  discoveredAt: Date;
  dueDate: Date | null;
  source: string;
  impacts: RequirementImpactSuggestion[];
}

/** Avvik registrert på én leverandør. */
export function useVendorDeviations(assetId?: string) {
  return useQuery({
    queryKey: ["vendor-deviations", assetId],
    enabled: !!assetId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_incidents")
        .select("*")
        .or(`asset_id.eq.${assetId},system_id.eq.${assetId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/** Krav som er satt til null av åpne avvik på leverandøren. */
export function useDeviationImpacts(deviationIds: string[]) {
  return useQuery({
    queryKey: ["deviation-impacts", deviationIds.slice().sort().join(",")],
    enabled: deviationIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deviation_requirement_impacts")
        .select("*")
        .in("deviation_id", deviationIds);
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

/** Alle leverandøravvik på tvers av porteføljen, med leverandørnavn. */
export function useAllVendorDeviations() {
  return useQuery({
    queryKey: ["all-vendor-deviations"],
    queryFn: async () => {
      const [{ data: deviations }, { data: assets }] = await Promise.all([
        supabase
          .from("system_incidents")
          .select("*")
          .not("asset_id", "is", null)
          .order("created_at", { ascending: false }),
        supabase.from("assets").select("id, name, criticality, asset_type"),
      ]);
      const assetMap = new Map((assets || []).map((a: any) => [a.id, a]));
      return (deviations || []).map((d: any) => ({
        ...d,
        vendorName: assetMap.get(d.asset_id)?.name || "Ukjent leverandør",
        vendorCriticality: assetMap.get(d.asset_id)?.criticality || null,
      }));
    },
  });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, assetId?: string) {
  qc.invalidateQueries({ queryKey: ["vendor-deviations", assetId] });
  qc.invalidateQueries({ queryKey: ["all-vendor-deviations"] });
  qc.invalidateQueries({ queryKey: ["system-incidents", assetId] });
  qc.invalidateQueries({ queryKey: ["deviations"] });
  qc.invalidateQueries({ queryKey: ["user-tasks"] });
}

export function useRegisterVendorDeviation(assetId?: string, onDone?: () => void) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: VendorDeviationInput) => {
      const needsConfirmation = requiresConfirmation(input.source);
      const measures = suggestedMeasuresForDeviation(input.title, input.category);

      const { data: inserted, error } = await supabase
        .from("system_incidents")
        .insert({
          asset_id: input.assetId,
          system_id: input.assetId,
          title: input.title,
          description: input.description || null,
          category: input.category || null,
          criticality: input.criticality,
          risk_level: input.criticality,
          status: "open",
          responsible: input.responsible,
          source: input.source,
          auto_created: false,
          discovered_at: format(input.discoveredAt, "yyyy-MM-dd"),
          due_date: input.dueDate ? format(input.dueDate, "yyyy-MM-dd") : null,
          measures_count: measures.length,
          measures_completed: 0,
          suggested_measures: measures as any,
          confirmed_by: needsConfirmation ? null : input.responsible,
          confirmed_at: needsConfirmation ? null : new Date().toISOString(),
          relevant_frameworks: Array.from(new Set(input.impacts.map((i) => i.framework_id))),
        } as any)
        .select()
        .single();
      if (error) throw error;

      // Kravkobling — grunnlaget for at berørte krav settes til null.
      if (input.impacts.length > 0) {
        await supabase.from("deviation_requirement_impacts").insert(
          input.impacts.map((i) => ({
            deviation_id: inserted.id,
            requirement_id: i.requirement_id,
            requirement_label: i.requirement_label,
            framework_id: i.framework_id,
            control_area: i.control_area,
            status: needsConfirmation ? "pending" : "active",
          })) as any,
        );
      }

      // Oppgaver til navngitt ansvarlig
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes?.user?.id;
      if (userId) {
        await supabase.from("user_tasks").insert(
          measures.map((m) => ({
            user_id: userId,
            title: m,
            description: `Tiltak fra leverandøravvik: ${input.title} (ansvarlig: ${input.responsible})`,
          })) as any,
        );
      }

      if (!needsConfirmation && input.impacts.length > 0) {
        await supabase.from("score_history_events").insert({
          subject_type: "vendor",
          subject_id: input.assetId,
          deviation_id: inserted.id,
          event_type: "deviation_opened",
          affected_requirements: input.impacts.length,
          control_areas: Array.from(new Set(input.impacts.map((i) => i.control_area))),
          note: `Avvik registrert: ${input.title}`,
          actor: input.responsible,
        } as any);
      }

      return inserted;
    },
    onSuccess: () => {
      invalidate(qc, assetId);
      toast.success("Avvik registrert. Oppgaver er sendt til ansvarlig.");
      onDone?.();
    },
    onError: (e: any) => toast.error(e?.message || "Kunne ikke registrere avviket"),
  });
}

/** Menneskelig bekreftelse av agent- eller selvrapporterte avvik. */
export function useConfirmDeviation(assetId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ deviation, confirmedBy }: { deviation: any; confirmedBy: string }) => {
      await supabase
        .from("system_incidents")
        .update({ confirmed_by: confirmedBy, confirmed_at: new Date().toISOString() } as any)
        .eq("id", deviation.id);
      await supabase
        .from("deviation_requirement_impacts")
        .update({ status: "active" } as any)
        .eq("deviation_id", deviation.id);
      const { data: impacts } = await supabase
        .from("deviation_requirement_impacts")
        .select("control_area")
        .eq("deviation_id", deviation.id);
      await supabase.from("score_history_events").insert({
        subject_type: "vendor",
        subject_id: deviation.asset_id || deviation.system_id,
        deviation_id: deviation.id,
        event_type: "deviation_confirmed",
        affected_requirements: impacts?.length || 0,
        control_areas: Array.from(new Set((impacts || []).map((i: any) => i.control_area))),
        note: `Avvik bekreftet: ${deviation.title}`,
        actor: confirmedBy,
      } as any);
    },
    onSuccess: () => {
      invalidate(qc, assetId);
      toast.success("Avviket er bekreftet. Berørte krav regnes ikke som oppfylt.");
    },
    onError: (e: any) => toast.error(e?.message || "Kunne ikke bekrefte avviket"),
  });
}

/** Lukking krever navngitt person og begrunnelse. Kravstatus gjenopprettes. */
export function useCloseDeviation(assetId?: string, onDone?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      deviation,
      closedBy,
      reason,
    }: {
      deviation: any;
      closedBy: string;
      reason: string;
    }) => {
      const now = new Date().toISOString();
      await supabase
        .from("system_incidents")
        .update({
          status: "resolved",
          closed_by: closedBy,
          closed_at: now,
          close_reason: reason,
          last_updated: now,
        } as any)
        .eq("id", deviation.id);

      const { data: impacts } = await supabase
        .from("deviation_requirement_impacts")
        .select("control_area")
        .eq("deviation_id", deviation.id);

      await supabase
        .from("deviation_requirement_impacts")
        .update({ status: "restored", restored_at: now } as any)
        .eq("deviation_id", deviation.id);

      await supabase.from("score_history_events").insert({
        subject_type: "vendor",
        subject_id: deviation.asset_id || deviation.system_id,
        deviation_id: deviation.id,
        event_type: "deviation_closed",
        affected_requirements: impacts?.length || 0,
        control_areas: Array.from(new Set((impacts || []).map((i: any) => i.control_area))),
        note: reason,
        actor: closedBy,
      } as any);
    },
    onSuccess: () => {
      invalidate(qc, assetId);
      toast.success("Avviket er lukket. Kravstatus gjenopprettes fra dokumentasjonen.");
      onDone?.();
    },
    onError: (e: any) => toast.error(e?.message || "Kunne ikke lukke avviket"),
  });
}

/** Scorehistorikk for én leverandør — fall og gjenoppretting. */
export function useScoreHistory(subjectId?: string) {
  return useQuery({
    queryKey: ["score-history", subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("score_history_events")
        .select("*")
        .eq("subject_id", subjectId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });
}
