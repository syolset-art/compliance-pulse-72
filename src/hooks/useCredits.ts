import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { CREDIT_PACKAGES, MODULES, type ModuleId } from "@/lib/planConstants";
import { useActivatedServices } from "@/hooks/useActivatedServices";

export function useCredits() {
  const queryClient = useQueryClient();
  const { companyProfile, tierConfig } = useSubscription();
  const { isServiceActive } = useActivatedServices();

  // Monthly allowance comes from the plan tier + any active module bonuses
  const planCredits = tierConfig?.monthlyCredits ?? 10;
  const moduleBonusCredits =
    (isServiceActive("module-systems") ? MODULES.systems.bonusCredits : 0) +
    (isServiceActive("module-vendors") ? MODULES.vendors.bonusCredits : 0);
  const monthlyAllowance = planCredits + moduleBonusCredits;

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
  const percentRemaining = Math.max(0, 100 - percentUsed);
  const isLow = percentRemaining <= 20 && percentRemaining > 0;
  const isExhausted = balance <= 0;
  const isUnlimited = false;

  const deductMutation = useMutation({
    mutationFn: async ({ amount, description }: { amount: number; description: string }) => {
      if (!companyProfile?.id) throw new Error("No company");
      const newBalance = Math.max(0, balance - amount);

      const { error: updateErr } = await supabase
        .from("company_credits")
        .update({ balance: newBalance })
        .eq("company_id", companyProfile.id);
      if (updateErr) throw updateErr;

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
        toast.warning("Du har lite credits igjen. Vurder å kjøpe flere.");
      }
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async (packageId: string) => {
      if (!companyProfile?.id) throw new Error("No company");
      const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
      if (!pkg) throw new Error("Unknown package");

      const newBalance = balance + pkg.credits;

      const { error: updateErr } = await supabase
        .from("company_credits")
        .update({ balance: newBalance })
        .eq("company_id", companyProfile.id);
      if (updateErr) throw updateErr;

      const { error: txErr } = await supabase
        .from("credit_transactions")
        .insert({
          company_id: companyProfile.id,
          amount: pkg.credits,
          balance_after: newBalance,
          transaction_type: "purchase",
          description: `Kjøpt ${pkg.name}-pakke (${pkg.credits} credits)`,
        });
      if (txErr) throw txErr;

      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      toast.success("Credits lagt til!");
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
    purchaseCredits: (packageId: string) =>
      purchaseMutation.mutateAsync(packageId),
    isPurchasing: purchaseMutation.isPending,
  };
}
