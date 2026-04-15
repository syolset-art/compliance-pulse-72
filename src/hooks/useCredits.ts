import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const PLAN_CREDITS: Record<string, number> = {
  free: 10,
  basis: 100,
  premium: 300,
  enterprise: 999999,
};

export function useCredits() {
  const queryClient = useQueryClient();
  const { companyProfile, currentTier } = useSubscription();
  const monthlyAllowance = PLAN_CREDITS[currentTier] ?? 10;

  const { data: credits, isLoading } = useQuery({
    queryKey: ["company-credits", companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return null;
      const { data, error } = await supabase
        .from("company_credits")
        .select("*")
        .eq("company_id", companyProfile.id)
        .maybeSingle();
      if (error) throw error;

      // Auto-create if missing
      if (!data) {
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        nextReset.setDate(1);
        const { data: newCredits, error: insertErr } = await supabase
          .from("company_credits")
          .insert({
            company_id: companyProfile.id,
            balance: monthlyAllowance,
            monthly_allowance: monthlyAllowance,
            next_reset_at: nextReset.toISOString(),
          })
          .select()
          .single();
        if (insertErr) throw insertErr;
        return newCredits;
      }
      return data;
    },
    enabled: !!companyProfile?.id,
  });

  const { data: recentTransactions } = useQuery({
    queryKey: ["credit-transactions", companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return [];
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("company_id", companyProfile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!companyProfile?.id,
  });

  const balance = credits?.balance ?? 0;
  const percentUsed = monthlyAllowance > 0
    ? Math.round(((monthlyAllowance - balance) / monthlyAllowance) * 100)
    : 0;
  const percentRemaining = 100 - percentUsed;
  const isLow = percentRemaining <= 20 && percentRemaining > 0;
  const isExhausted = balance <= 0;
  const isUnlimited = currentTier === "enterprise";

  const deductMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!companyProfile?.id) throw new Error("No company");
      const newBalance = Math.max(0, balance - amount);
      
      // Update balance
      const { error: updateErr } = await supabase
        .from("company_credits")
        .update({ balance: newBalance })
        .eq("company_id", companyProfile.id);
      if (updateErr) throw updateErr;

      // Log transaction
      const { error: txErr } = await supabase
        .from("credit_transactions")
        .insert({
          company_id: companyProfile.id,
          amount: -amount,
          balance_after: newBalance,
          transaction_type: "usage",
          description,
        });
      if (txErr) throw txErr;

      return newBalance;
    },
    onSuccess: (newBalance) => {
      queryClient.invalidateQueries({ queryKey: ["company-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      if (newBalance <= (monthlyAllowance * 0.2)) {
        toast.warning("Du har lite credits igjen. Vurder å oppgradere planen din.");
      }
    },
  });

  return {
    balance,
    monthlyAllowance,
    percentUsed,
    percentRemaining,
    isLow,
    isExhausted,
    isUnlimited,
    isLoading,
    recentTransactions: recentTransactions ?? [],
    deductCredits: (amount: number, description: string) =>
      deductMutation.mutateAsync({ amount, description }),
    isDeducting: deductMutation.isPending,
  };
}
