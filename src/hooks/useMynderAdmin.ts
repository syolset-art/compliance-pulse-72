import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PartnerAgreement {
  id: string;
  partner_key: string;
  partner_name: string;
  share_pct: number;
  valid_from: string | null;
  valid_to: string | null;
  agreement_url: string | null;
  agent_verified: boolean;
  agent_verified_at: string | null;
  agent_verified_by: string | null;
  note: string | null;
  updated_at?: string;
}

export interface AgreementEvent {
  id: string;
  agreement_id: string;
  event_type: string;
  old_share_pct: number | null;
  new_share_pct: number | null;
  effective_from: string | null;
  note: string | null;
  changed_by_name: string | null;
  created_at: string;
}

export interface MynderProject {
  id: string;
  customer_name: string;
  project_name: string;
  partner_key: string | null;
  agreement_ref: string | null;
  start_date: string | null;
  end_date: string | null;
  price: number;
  status: string;
  owner_name: string | null;
  note: string | null;
}

/** Partneravtaler — kun tilgjengelig for Mynder-admin (super_admin / daglig_leder). */
export function usePartnerAgreements() {
  const qc = useQueryClient();

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ["mynder-partner-agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_agreements" as any)
        .select("*")
        .order("partner_name");
      if (error) throw error;
      return (data as any[]) as PartnerAgreement[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["mynder-agreement-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_agreement_events" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) as AgreementEvent[];
    },
  });

  const byPartner = (partnerKey: string) => agreements.find((a) => a.partner_key === partnerKey) ?? null;
  const eventsFor = (agreementId?: string) =>
    agreementId ? events.filter((e) => e.agreement_id === agreementId) : [];

  const save = useMutation({
    mutationFn: async (input: {
      partnerKey: string;
      partnerName: string;
      sharePct: number;
      validFrom?: string | null;
      agreementUrl?: string | null;
      agentVerified?: boolean;
      agentVerifiedBy?: string | null;
      note?: string | null;
      changeNote?: string | null;
      changedByName?: string | null;
    }) => {
      const existing = byPartner(input.partnerKey);
      const payload: Record<string, any> = {
        partner_key: input.partnerKey,
        partner_name: input.partnerName,
        share_pct: input.sharePct,
        valid_from: input.validFrom || null,
        agreement_url: input.agreementUrl || null,
        agent_verified: !!input.agentVerified,
        agent_verified_by: input.agentVerifiedBy || null,
        agent_verified_at: input.agentVerified ? new Date().toISOString() : null,
        note: input.note || null,
      };

      let agreementId = existing?.id;
      if (existing) {
        const { error } = await supabase
          .from("partner_agreements" as any)
          .update(payload as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("partner_agreements" as any)
          .insert(payload as any)
          .select("id")
          .single();
        if (error) throw error;
        agreementId = (data as any).id;
      }

      const oldShare = existing ? Number(existing.share_pct) : null;
      if (agreementId && oldShare !== input.sharePct) {
        const { error } = await supabase.from("partner_agreement_events" as any).insert({
          agreement_id: agreementId,
          event_type: existing ? "share_change" : "agreement_created",
          old_share_pct: oldShare,
          new_share_pct: input.sharePct,
          effective_from: input.validFrom || null,
          note: input.changeNote || null,
          changed_by_name: input.changedByName || null,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mynder-partner-agreements"] });
      qc.invalidateQueries({ queryKey: ["mynder-agreement-events"] });
    },
  });

  return { agreements, events, isLoading, byPartner, eventsFor, save };
}

/** Prosjekter Mynder leverer direkte mot kunder. */
export function useMynderProjects() {
  const qc = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["mynder-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mynder_projects" as any)
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data as any[]) as MynderProject[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<MynderProject> & { customer_name: string; project_name: string }) => {
      const payload: Record<string, any> = {
        customer_name: input.customer_name,
        project_name: input.project_name,
        partner_key: input.partner_key || null,
        agreement_ref: input.agreement_ref || null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        price: Number(input.price) || 0,
        status: input.status || "planned",
        owner_name: input.owner_name || null,
        note: input.note || null,
      };
      if (input.id) {
        const { error } = await supabase
          .from("mynder_projects" as any)
          .update(payload as any)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("mynder_projects" as any).insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mynder-projects"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mynder_projects" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["mynder-projects"] }),
  });

  return { projects, isLoading, upsert, remove };
}
