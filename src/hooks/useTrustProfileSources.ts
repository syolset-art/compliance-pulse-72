import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SourceStatus = "suggested" | "accepted" | "rejected" | "manual";
export type SourceType = "webpage" | "document_link" | "manual";

export interface TrustProfileSource {
  id: string;
  asset_id: string;
  control_area: string;
  title: string;
  url: string | null;
  snippet: string | null;
  source_type: SourceType;
  status: SourceStatus;
  discovered_by: "lara" | "user";
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useTrustProfileSources(assetId: string, controlArea?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["trust-profile-sources", assetId, controlArea ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("trust_profile_sources" as any)
        .select("*")
        .eq("asset_id", assetId)
        .order("created_at", { ascending: false });
      if (controlArea) q = q.eq("control_area", controlArea);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as TrustProfileSource[];
    },
    enabled: !!assetId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["trust-profile-sources", assetId] });
  };

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: SourceStatus }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("trust_profile_sources" as any)
        .update({ status, decided_at: new Date().toISOString(), decided_by: u.user?.id ?? null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Kunne ikke oppdatere kilden"),
  });

  const addManual = useMutation({
    mutationFn: async ({ title, url, snippet, area }: { title: string; url?: string; snippet?: string; area: string }) => {
      const { error } = await supabase.from("trust_profile_sources" as any).insert({
        asset_id: assetId,
        control_area: area,
        title,
        url: url || null,
        snippet: snippet || null,
        source_type: "manual",
        status: "manual",
        discovered_by: "user",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Kilde lagt til");
    },
    onError: () => toast.error("Kunne ikke legge til kilde"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trust_profile_sources" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const discover = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("discover-trust-sources", {
        body: { assetId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Lara har oppdatert kildene");
    },
    onError: () => toast.error("Kunne ikke kjøre Lara-analyse"),
  });

  return { ...query, setStatus, addManual, remove, discover };
}
