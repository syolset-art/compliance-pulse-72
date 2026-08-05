import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerOnboardingFindings {
  privacyPolicyUrl: string | null;
  websiteUrl: string | null;
}

/**
 * Funn fra Laras kartlegging da kunden ble lagt til (AddMSPCustomerDialog):
 * personvernerklæring lagres på kundens self-asset, hjemmeside på msp_customers.
 */
export function useCustomerOnboardingFindings(customerId: string | undefined) {
  const { data } = useQuery({
    queryKey: ["msp-customer-findings", customerId],
    enabled: !!customerId,
    queryFn: async (): Promise<CustomerOnboardingFindings> => {
      const [assetRes, customerRes] = await Promise.all([
        supabase
          .from("assets" as any)
          .select("metadata")
          .eq("asset_type", "self")
          .contains("metadata", { msp_customer_id: customerId } as any)
          .limit(1),
        supabase
          .from("msp_customers" as any)
          .select("url")
          .eq("id", customerId)
          .maybeSingle(),
      ]);

      const meta = ((assetRes.data as any[])?.[0]?.metadata ?? {}) as Record<string, any>;
      return {
        privacyPolicyUrl: (meta.privacy_policy_url as string) || null,
        websiteUrl: ((customerRes.data as any)?.url as string) || null,
      };
    },
  });

  return {
    privacyPolicyUrl: data?.privacyPolicyUrl ?? null,
    websiteUrl: data?.websiteUrl ?? null,
  };
}
