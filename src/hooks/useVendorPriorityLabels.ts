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

/** Nivåer som er markert som «Ikke aktuelt» skjules i leverandørmodulen. */
export type DisabledPriorityLevels = PriorityKey[];

/**
 * Visningsnavn for P0–P4 som KUN gjelder inne i leverandørmodulen.
 * Faller tilbake til standardnavnene når ingen overstyring er lagret.
 */
export function useVendorPriorityLabels() {
  const query = useQuery({
    queryKey: VENDOR_MODULE_SETTINGS_KEY,
    queryFn: async (): Promise<{ labels: Record<string, string>; disabled: DisabledPriorityLevels }> => {
      const { data, error } = await supabase
        .from("vendor_module_settings")
        .select("priority_labels, disabled_priority_levels")
        .eq("scope", "global")
        .maybeSingle();
      if (error) throw error;
      return {
        labels: (data?.priority_labels as Record<string, string> | null) || {},
        disabled: ((data?.disabled_priority_levels as string[] | null) || []) as DisabledPriorityLevels,
      };
    },
  });

  const saved = query.data?.labels || {};
  const labels = PRIORITY_KEYS.reduce((acc, key) => {
    const value = saved[key];
    acc[key] = typeof value === "string" && value.trim() ? value.trim() : DEFAULT_PRIORITY_LABELS[key];
    return acc;
  }, {} as PriorityLabelMap);

  const disabled = (query.data?.disabled || []).filter((k) => PRIORITY_KEYS.includes(k));
  /** Aktive nivåer (ikke markert som «ikke aktuelt»). */
  const activeKeys = PRIORITY_KEYS.filter((k) => !disabled.includes(k));

  return { ...query, labels, disabled, activeKeys, hasOverride: Object.keys(saved).length > 0 || disabled.length > 0 };
}
