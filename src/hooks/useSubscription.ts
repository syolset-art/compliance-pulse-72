import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  included_domains: string[];
  features: Record<string, unknown>;
  sort_order: number;
}

interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  status: string;
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

// Domain addon pricing (in øre)
export const DOMAIN_ADDON_PRICES: Record<string, number> = {
  security: 99000, // 990 kr
  ai: 79000, // 790 kr
  other: 49000, // 490 kr
  privacy: 0, // Included in all plans
};

export function useSubscription() {
  const queryClient = useQueryClient();

  // Fetch subscription plans
  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as SubscriptionPlan[];
    }
  });

  // Fetch company profile
  const { data: companyProfile } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('company_profile')
        .select('*')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  // Fetch current subscription
  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ['company-subscription', companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return null;

      const { data, error } = await supabase
        .from('company_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('company_id', companyProfile.id)
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) throw error;
      
      // If no subscription exists, create a default "professional" subscription
      if (!data) {
        const professionalPlan = plans?.find(p => p.name === 'professional');
        if (professionalPlan) {
          const { data: newSub, error: insertError } = await supabase
            .from('company_subscriptions')
            .insert({
              company_id: companyProfile.id,
              plan_id: professionalPlan.id,
              status: 'active',
              current_period_start: new Date().toISOString().split('T')[0],
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            })
            .select(`
              *,
              plan:subscription_plans(*)
            `)
            .single();
          
          if (insertError) throw insertError;
          return newSub as CompanySubscription;
        }
      }
      
      return data as CompanySubscription | null;
    },
    enabled: !!companyProfile?.id && !!plans
  });

  // Fetch domain addons
  const { data: addons, isLoading: isLoadingAddons } = useQuery({
    queryKey: ['domain-addons', companyProfile?.id],
    queryFn: async () => {
      if (!companyProfile?.id) return [];

      const { data, error } = await supabase
        .from('domain_addons')
        .select('*')
        .eq('company_id', companyProfile.id)
        .eq('status', 'active');
      
      if (error) throw error;
      return data as DomainAddon[];
    },
    enabled: !!companyProfile?.id
  });

  // Check if a domain is included in current plan or via addon
  const isDomainIncluded = (domainId: string): boolean => {
    // Check if included in plan
    const planIncludes = subscription?.plan?.included_domains?.includes(domainId) || false;
    if (planIncludes) return true;

    // Check if activated as addon
    const addonActive = addons?.some(a => a.domain_id === domainId && a.status === 'active');
    return addonActive || false;
  };

  // Get addon price for a domain
  const getAddonPrice = (domainId: string): number => {
    return DOMAIN_ADDON_PRICES[domainId] || 0;
  };

  // Activate domain addon mutation
  const activateAddonMutation = useMutation({
    mutationFn: async (domainId: string) => {
      if (!companyProfile?.id) throw new Error('No company profile');

      const { data, error } = await supabase
        .from('domain_addons')
        .insert({
          company_id: companyProfile.id,
          domain_id: domainId,
          monthly_price: DOMAIN_ADDON_PRICES[domainId] || 0,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, domainId) => {
      queryClient.invalidateQueries({ queryKey: ['domain-addons'] });
      queryClient.invalidateQueries({ queryKey: ['domain-summary-regulations'] });
      toast.success(`Fagområde aktivert! Vil bli fakturert på neste periode.`);
    },
    onError: (error) => {
      console.error('Failed to activate addon:', error);
      toast.error('Kunne ikke aktivere fagområdet. Prøv igjen.');
    }
  });

  // Calculate total monthly cost
  const getTotalMonthlyCost = (): number => {
    const planCost = subscription?.plan?.price_monthly || 0;
    const addonsCost = addons?.reduce((sum, addon) => sum + addon.monthly_price, 0) || 0;
    return planCost + addonsCost;
  };

  return {
    plans,
    subscription,
    addons,
    companyProfile,
    isLoading: isLoadingSubscription || isLoadingAddons,
    isDomainIncluded,
    getAddonPrice,
    activateAddon: activateAddonMutation.mutate,
    isActivatingAddon: activateAddonMutation.isPending,
    getTotalMonthlyCost
  };
}
