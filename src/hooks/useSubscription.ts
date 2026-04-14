import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  PLAN_TIERS,
  FRAMEWORK_ADDONS,
  FREE_FRAMEWORKS,
  planNameToTier,
  type PlanTier,
  type BillingInterval,
} from "@/lib/planConstants";

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly?: number;
  included_domains: string[];
  features: Record<string, unknown>;
  sort_order: number;
}

interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
  billing_interval: string;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  plan?: SubscriptionPlan;
}

interface DomainAddon {
  id: string;
  company_id: string;
  domain_id: string;
  monthly_price: number;
  status: string;
  activated_at: string;
}

// Legacy export – framework addon prices in øre (yearly)
export const DOMAIN_ADDON_PRICES: Record<string, number> = {
  nis2: 5000000,
  dora: 5000000,
  transparency_act: 5000000,
  ai_act: 5000000,
  cra: 5000000,
  privacy: 0,
  security: 0,
};

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data: plans } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const { data: companyProfile } = useQuery({
    queryKey: ["company-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile")
        .select("*")
        .limit(1)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["company-subscription", companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return null;
      const { data, error } = await supabase
        .from("company_subscriptions")
        .select(`*, plan:subscription_plans(*)`)
        .eq("company_id", companyProfile.id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;

      if (!data) {
        const freePlan = plans?.find((p) => p.name === "free");
        if (freePlan) {
          const { data: newSub, error: insertError } = await supabase
            .from("company_subscriptions")
            .insert({
              company_id: companyProfile.id,
              plan_id: freePlan.id,
              status: "active",
              current_period_start: new Date().toISOString().split("T")[0],
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            })
            .select(`*, plan:subscription_plans(*)`)
            .single();
          if (insertError) throw insertError;
          return newSub as CompanySubscription;
        }
      }
      return data as CompanySubscription | null;
    },
    enabled: !!companyProfile?.id && !!plans,
  });

  const { data: addons, isLoading: isLoadingAddons } = useQuery({
    queryKey: ["domain-addons", companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return [];
      const { data, error } = await supabase
        .from("domain_addons")
        .select("*")
        .eq("company_id", companyProfile.id)
        .eq("status", "active");
      if (error) throw error;
      return data as DomainAddon[];
    },
    enabled: !!companyProfile?.id,
  });

  // Derived state
  const currentTier: PlanTier = planNameToTier(subscription?.plan?.name);
  const billingInterval: BillingInterval =
    (subscription?.billing_interval as BillingInterval) || "monthly";
  const tierConfig = PLAN_TIERS[currentTier];
  const hasCoreAccess = currentTier !== "free";
  const hasModule = (moduleId: "systems" | "vendors"): boolean => currentTier !== "free";

  const isDomainIncluded = (domainId: string): boolean => {
    const planIncludes =
      subscription?.plan?.included_domains?.includes(domainId) || false;
    if (planIncludes) return true;
    return addons?.some((a) => a.domain_id === domainId && a.status === "active") || false;
  };

  const getAddonPrice = (domainId: string): number => {
    return DOMAIN_ADDON_PRICES[domainId] || 0;
  };

  const activateAddonMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!companyProfile?.id) throw new Error("No company profile");
      const { data, error } = await supabase
        .from("domain_addons")
        .insert({
          company_id: companyProfile.id,
          domain_id: domainId,
          monthly_price: DOMAIN_ADDON_PRICES[domainId] || 0,
          status: "active",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domain-addons"] });
      queryClient.invalidateQueries({ queryKey: ["domain-summary-regulations"] });
      toast.success("Kontrollområde aktivert! Vil bli fakturert på neste periode.");
    },
    onError: (error) => {
      console.error("Failed to activate addon:", error);
      toast.error("Kunne ikke aktivere kontrollområdet. Prøv igjen.");
    },
  });

  const getTotalMonthlyCost = (): number => {
    const planCost = subscription?.plan?.price_monthly || 0;
    const addonsCost =
      addons?.reduce((sum, addon) => sum + addon.monthly_price, 0) || 0;
    return planCost + addonsCost;
  };

  return {
    plans,
    subscription,
    addons,
    companyProfile,
    isLoading: isLoadingSubscription || isLoadingAddons,
    // Unified tier helpers
    currentTier,
    billingInterval,
    tierConfig,
    maxSystems: tierConfig.maxSystems,
    maxVendors: tierConfig.maxVendors,
    canAddSystem: (count: number) => count < tierConfig.maxSystems,
    canAddVendor: (count: number) => count < tierConfig.maxVendors,
    // Access helpers
    hasCoreAccess,
    hasModule,
    // Domain / framework helpers
    isDomainIncluded,
    getAddonPrice,
    activateAddon: activateAddonMutation.mutate,
    isActivatingAddon: activateAddonMutation.isPending,
    getTotalMonthlyCost,
  };
}
