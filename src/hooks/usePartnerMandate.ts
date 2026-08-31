import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTerms } from "@/hooks/useTerms";

/**
 * Partnerens fullmaktsbekreftelse per sluttkunde. Bekreftelsen logges som en
 * aksept av partnervilkårene med kundens id som kontekst, slik at den kan
 * dokumenteres i ettertid.
 */
export function usePartnerMandate(customerId?: string | null) {
  const { user } = useAuth();
  const { currentByType } = useTerms();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(Boolean(customerId));

  const partnerDoc = currentByType.partner;

  const load = useCallback(async () => {
    if (!customerId || !user?.id) {
      setConfirmed(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("terms_acceptances")
      .select("id")
      .eq("context", "partner_mandate")
      .eq("context_ref", customerId)
      .limit(1);
    setConfirmed((data?.length ?? 0) > 0);
    setLoading(false);
  }, [customerId, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmMandate = useCallback(async () => {
    if (!customerId || !user?.id || !partnerDoc) return false;
    const { error } = await supabase.from("terms_acceptances").insert({
      user_id: user.id,
      terms_version_id: partnerDoc.id,
      context: "partner_mandate",
      context_ref: customerId,
      operator_role: true,
    });
    if (error) return false;
    setConfirmed(true);
    return true;
  }, [customerId, user?.id, partnerDoc]);

  return { confirmed, loading, confirmMandate, refresh: load };
}
