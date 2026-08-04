import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageSummary {
  tokens_day: number;
  tokens_month: number;
  tokens_in_month: number;
  tokens_out_month: number;
  calls_month: number;
  bytes_day: number;
  bytes_month: number;
  bytes_total: number;
  files_total: number;
}

const EMPTY: UsageSummary = {
  tokens_day: 0,
  tokens_month: 0,
  tokens_in_month: 0,
  tokens_out_month: 0,
  calls_month: 0,
  bytes_day: 0,
  bytes_month: 0,
  bytes_total: 0,
  files_total: 0,
};

export function useUsageSummary() {
  return useQuery({
    queryKey: ["usage-summary"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<UsageSummary> => {
      const { data, error } = await (supabase as any).rpc("get_usage_summary");
      if (error) throw error;
      const raw = (data ?? {}) as Record<string, unknown>;
      return {
        ...EMPTY,
        ...Object.fromEntries(
          Object.entries(raw).map(([k, v]) => [k, Number(v) || 0]),
        ),
      } as UsageSummary;
    },
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 MB";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}k`;
  return String(tokens ?? 0);
}
