import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Default vendor-management framework scope used before the user has saved a choice. */
export const DEFAULT_VENDOR_FRAMEWORK_SCOPE = [
  "gdpr",
  "personopplysningsloven",
  "iso27001",
  "iso27701",
  "nis2",
  "dora",
];

export interface VendorFrameworkScopeRow {
  framework_id: string;
  framework_name: string;
  is_enabled: boolean;
}

export const VENDOR_FRAMEWORK_SCOPE_KEY = ["vendor-framework-scope"];

/**
 * Global scope of frameworks that all vendors are managed against.
 * Falls back to the default set when nothing has been saved yet.
 */
export function useVendorFrameworkScope() {
  const query = useQuery({
    queryKey: VENDOR_FRAMEWORK_SCOPE_KEY,
    queryFn: async (): Promise<VendorFrameworkScopeRow[]> => {
      const { data, error } = await supabase
        .from("vendor_framework_scope")
        .select("framework_id, framework_name, is_enabled");
      if (error) throw error;
      return data || [];
    },
  });

  const rows = query.data;
  const hasSaved = Array.isArray(rows) && rows.length > 0;

  const scopeIds = hasSaved
    ? rows!.filter((r) => r.is_enabled).map((r) => r.framework_id)
    : DEFAULT_VENDOR_FRAMEWORK_SCOPE;

  return {
    ...query,
    rows: rows || [],
    hasSaved,
    scopeIds,
    isInScope: (frameworkId?: string | null) => {
      if (!frameworkId) return false;
      const id = frameworkId.toLowerCase();
      return scopeIds.some((s) => id.includes(s.toLowerCase()));
    },
  };
}
