import { useQuery } from "@tanstack/react-query";
import { fetchRequirementEvidence, type StoredRequirementEvidence } from "@/lib/requirementEvidence";

/** Lagrede bevis for et regelverk, gruppert per krav. */
export function useRequirementEvidence(frameworkId: string) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["requirement-evidence", frameworkId],
    queryFn: () => fetchRequirementEvidence(frameworkId),
    staleTime: 1000 * 30,
    enabled: !!frameworkId,
  });

  const byRequirement: Record<string, StoredRequirementEvidence[]> = {};
  (data ?? []).forEach((row) => {
    (byRequirement[row.requirementId] ??= []).push(row);
  });

  return { evidence: data ?? [], byRequirement, isLoading, refetch };
}
