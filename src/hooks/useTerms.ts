import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface TermsVersion {
  id: string;
  version: string;
  effective_date: string;
  content_md: string;
}

export interface TermsAcceptance {
  id: string;
  terms_version_id: string;
  context: string;
  context_ref: string | null;
  accepted_at: string;
}

export type TermsContext =
  | "module_activation"
  | "license_purchase"
  | "framework_activation"
  | "signup"
  | "settings";

/**
 * Loads the single current terms document plus the signed-in user's
 * acceptance history, and records new acceptances.
 */
export function useTerms() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<TermsVersion | null>(null);
  const [acceptances, setAcceptances] = useState<TermsAcceptance[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: version } = await supabase
        .from("terms_versions")
        .select("id, version, effective_date, content_md")
        .eq("is_current", true)
        .order("effective_date", { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrent((version as TermsVersion) ?? null);

      if (user?.id) {
        const { data: rows } = await supabase
          .from("terms_acceptances")
          .select("id, terms_version_id, context, context_ref, accepted_at")
          .order("accepted_at", { ascending: false });
        setAcceptances((rows as TermsAcceptance[]) ?? []);
      } else {
        setAcceptances([]);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const hasAcceptedCurrent = Boolean(
    current && acceptances.some((a) => a.terms_version_id === current.id)
  );

  const currentAcceptedAt =
    current
      ? acceptances.find((a) => a.terms_version_id === current.id)?.accepted_at ?? null
      : null;

  const acceptTerms = useCallback(
    async (context: TermsContext, contextRef?: string) => {
      if (!user?.id || !current) return false;
      const { error } = await supabase.from("terms_acceptances").insert({
        user_id: user.id,
        terms_version_id: current.id,
        context,
        context_ref: contextRef ?? null,
      });
      if (error) return false;
      await load();
      return true;
    },
    [user?.id, current, load]
  );

  return {
    current,
    acceptances,
    loading,
    hasAcceptedCurrent,
    currentAcceptedAt,
    acceptTerms,
    refresh: load,
  };
}
