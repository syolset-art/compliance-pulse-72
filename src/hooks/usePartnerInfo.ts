import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PartnerType = "msp" | "mssp" | "it_partner" | "consultant" | "other";

export interface PartnerInfo {
  hasPartner: boolean;
  partnerName: string | null;
  partnerType: PartnerType | null;
  partnerRoleDescription: string | null;
  partnerSince: string | null;
  partnerCompanyId: string | null;
  showOnTrustProfile: boolean;
}

const EMPTY: PartnerInfo = {
  hasPartner: false,
  partnerName: null,
  partnerType: null,
  partnerRoleDescription: null,
  partnerSince: null,
  partnerCompanyId: null,
  showOnTrustProfile: true,
};

export const PARTNER_TYPE_LABEL: Record<PartnerType, string> = {
  msp: "MSP",
  mssp: "MSSP",
  it_partner: "IT-partner",
  consultant: "Konsulent",
  other: "Annet",
};

/**
 * Reads partner relationship for the active company profile.
 * Returns hasPartner=false when no partner is configured.
 */
export function usePartnerInfo(companyId?: string) {
  return useQuery({
    queryKey: ["partner-info", companyId ?? "active"],
    queryFn: async (): Promise<PartnerInfo> => {
      let query = supabase.from("company_profile").select("*");
      query = companyId ? query.eq("id", companyId) : query.limit(1);
      const { data, error } = await query.maybeSingle();
      if (error || !data) return EMPTY;
      const p = data as any;
      const hasPartner = Boolean(p.managed_by_partner && p.partner_name);
      return {
        hasPartner,
        partnerName: p.partner_name ?? null,
        partnerType: (p.partner_type as PartnerType) ?? null,
        partnerRoleDescription: p.partner_role_description ?? null,
        partnerSince: p.partner_since ?? null,
        partnerCompanyId: p.partner_company_id ?? null,
        showOnTrustProfile: p.show_partner_on_trust_profile ?? true,
      };
    },
  });
}
