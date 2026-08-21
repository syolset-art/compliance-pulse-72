import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRIORITY_KEYS, PRIORITY_META, type PriorityKey } from "@/lib/derivedPriority";

export const VENDOR_MODULE_SETTINGS_KEY = ["vendor-module-settings"];

export type PriorityLabelMap = Record<PriorityKey, string>;

/** Standard visningsnavn (kortform) fra den globale prioritetsskalaen. */
export const DEFAULT_PRIORITY_LABELS: PriorityLabelMap = PRIORITY_KEYS.reduce(
  (acc, key) => {
    acc[key] = PRIORITY_META[key].shortNb;
    return acc;
  },
  {} as PriorityLabelMap,
);

/**
 * Visningsnavn for P0–P3 som KUN gjelder inne i leverandørmodulen.
 * Faller tilbake til standardnavnene når ingen overstyring er lagret.
 */
export function useVendorPriorityLabels() {
  const query = useQuery({
    queryKey: VENDOR_MODULE_SETTINGS_KEY,
    queryFn: async (): Promise<Record<string, string>> => {
      const { data, error } = await supabase
        .from("vendor_module_settings")
        .select("priority_labels")
        .eq("scope", "global")
        .maybeSingle();
      if (error) throw error;
      return (data?.priority_labels as Record<string, string> | null) || {};
    },
  });

  const saved = query.data || {};
  const labels = PRIORITY_KEYS.reduce((acc, key) => {
    const value = saved[key];
    acc[key] = typeof value === "string" && value.trim() ? value.trim() : DEFAULT_PRIORITY_LABELS[key];
    return acc;
  }, {} as PriorityLabelMap);

  return { ...query, labels, hasOverride: Object.keys(saved).length > 0 };
}
