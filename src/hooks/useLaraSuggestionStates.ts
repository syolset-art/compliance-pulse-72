import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LaraSuggestionContext {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  insight: string;
  vendorName?: string | null;
  vendorId?: string | null;
  category?: string | null;
  source?: string;
}

export interface LaraSuggestionState {
  id: string;
  user_id: string;
  suggestion_key: string;
  state: "snoozed" | "dismissed";
  snoozed_until: string | null;
  context_snapshot: LaraSuggestionContext;
  created_at: string;
  updated_at: string;
}

const DEFAULT_SNOOZE_DAYS = 7;

export function useLaraSuggestionStates() {
  const qc = useQueryClient();

  const { data: states = [], isLoading } = useQuery({
    queryKey: ["lara-suggestion-states"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [] as LaraSuggestionState[];
      const { data, error } = await supabase
        .from("lara_suggestion_states")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LaraSuggestionState[];
    },
  });

  const now = Date.now();
  /** Keys that should be hidden from active banners right now */
  const hiddenKeys = new Set(
    states
      .filter(s =>
        s.state === "dismissed" ||
        (s.state === "snoozed" && s.snoozed_until && new Date(s.snoozed_until).getTime() > now)
      )
      .map(s => s.suggestion_key)
  );

  const upsert = async (
    key: string,
    state: "snoozed" | "dismissed",
    snapshot: LaraSuggestionContext,
    snoozedUntil: string | null
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("lara_suggestion_states")
      .upsert(
        {
          user_id: user.id,
          suggestion_key: key,
          state,
          snoozed_until: snoozedUntil,
          context_snapshot: snapshot as any,
        },
        { onConflict: "user_id,suggestion_key" }
      );
    if (error) throw error;
  };

  const snooze = useMutation({
    mutationFn: async ({
      key,
      snapshot,
      days = DEFAULT_SNOOZE_DAYS,
    }: { key: string; snapshot: LaraSuggestionContext; days?: number }) => {
      const until = new Date(Date.now() + days * 86400000).toISOString();
      await upsert(key, "snoozed", snapshot, until);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lara-suggestion-states"] }),
  });

  const dismiss = useMutation({
    mutationFn: async ({ key, snapshot }: { key: string; snapshot: LaraSuggestionContext }) => {
      await upsert(key, "dismissed", snapshot, null);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lara-suggestion-states"] }),
  });

  const restore = useMutation({
    mutationFn: async (key: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("lara_suggestion_states")
        .delete()
        .eq("user_id", user.id)
        .eq("suggestion_key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lara-suggestion-states"] }),
  });

  return {
    states,
    hiddenKeys,
    isLoading,
    snooze: snooze.mutate,
    dismiss: dismiss.mutate,
    restore: restore.mutate,
  };
}
