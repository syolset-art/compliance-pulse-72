import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AIMetricsSummary {
  totalSystems: number;
  systemsByRisk: {
    unacceptable: number;
    high: number;
    limited: number;
    minimal: number;
    not_assessed: number;
  };
  totalDecisionsPerMonth: number;
  totalAffectedPersons: number;
  averageOverrideRate: number;
  totalIncidents: number;
  totalComplaints: number;
  systemsWithHighRisk: Array<{
    id: string;
    name: string;
    provider: string | null;
    decisions_per_month: number;
    override_rate_percent: number;
    risk_category: string;
  }>;
}

export interface AIMetricsHistory {
  period: string;
  total_uses: number;
  total_decisions: number;
  affected_persons_count: number;
  incidents: number;
}

export function useAIMetricsSummary() {
  return useQuery({
    queryKey: ["ai-metrics-summary"],
    queryFn: async (): Promise<AIMetricsSummary> => {
      const { data: systems, error } = await supabase
        .from("ai_system_registry")
        .select("*")
        .eq("status", "active");
      
      if (error) throw error;
      
      const allSystems = systems || [];
      
      // Calculate summary
      const systemsByRisk = {
        unacceptable: 0,
        high: 0,
        limited: 0,
        minimal: 0,
        not_assessed: 0,
      };
      
      let totalDecisions = 0;
      let totalAffected = 0;
      let totalOverrideSum = 0;
      let overrideCount = 0;
      let totalIncidents = 0;
      let totalComplaints = 0;
      
      for (const system of allSystems) {
        const risk = system.risk_category as keyof typeof systemsByRisk;
        if (risk in systemsByRisk) {
          systemsByRisk[risk]++;
        } else {
          systemsByRisk.not_assessed++;
        }
        
        totalDecisions += system.decisions_per_month || 0;
        totalAffected += system.estimated_affected_persons || 0;
        totalIncidents += system.incidents_count || 0;
        totalComplaints += system.complaints_count || 0;
        
        if (system.override_rate_percent > 0) {
          totalOverrideSum += system.override_rate_percent;
          overrideCount++;
        }
      }
      
      const highRiskSystems = allSystems
        .filter(s => s.risk_category === 'high' || s.risk_category === 'unacceptable')
        .map(s => ({
          id: s.id,
          name: s.name,
          provider: s.provider,
          decisions_per_month: s.decisions_per_month || 0,
          override_rate_percent: s.override_rate_percent || 0,
          risk_category: s.risk_category || 'not_assessed',
        }));
      
      return {
        totalSystems: allSystems.length,
        systemsByRisk,
        totalDecisionsPerMonth: totalDecisions,
        totalAffectedPersons: totalAffected,
        averageOverrideRate: overrideCount > 0 ? Math.round(totalOverrideSum / overrideCount) : 0,
        totalIncidents,
        totalComplaints,
        systemsWithHighRisk: highRiskSystems,
      };
    },
  });
}

export function useAIMetricsHistory(systemId?: string) {
  return useQuery({
    queryKey: ["ai-metrics-history", systemId],
    queryFn: async (): Promise<AIMetricsHistory[]> => {
      let query = supabase
        .from("ai_usage_metrics")
        .select("*")
        .order("period_start", { ascending: true });
      
      if (systemId) {
        query = query.eq("ai_system_id", systemId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return (data || []).map(m => ({
        period: m.period_start,
        total_uses: m.total_uses || 0,
        total_decisions: m.total_decisions || 0,
        affected_persons_count: m.affected_persons_count || 0,
        incidents: m.incidents || 0,
      }));
    },
  });
}

// Aggregate metrics from process_ai_usage for systems not yet in registry
export function useAggregatedProcessMetrics() {
  return useQuery({
    queryKey: ["aggregated-process-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("process_ai_usage")
        .select(`
          *,
          system_processes(name, system_id)
        `)
        .eq("has_ai", true);
      
      if (error) throw error;
      
      let totalProcessesWithAI = 0;
      let totalEstimatedDecisions = 0;
      let totalEstimatedAffected = 0;
      const riskDistribution = {
        unacceptable: 0,
        high: 0,
        limited: 0,
        minimal: 0,
        not_assessed: 0,
      };
      
      for (const process of data || []) {
        totalProcessesWithAI++;
        totalEstimatedDecisions += process.estimated_monthly_decisions || 0;
        totalEstimatedAffected += process.estimated_affected_persons || 0;
        
        const risk = process.risk_category as keyof typeof riskDistribution;
        if (risk in riskDistribution) {
          riskDistribution[risk]++;
        } else {
          riskDistribution.not_assessed++;
        }
      }
      
      return {
        totalProcessesWithAI,
        totalEstimatedDecisions,
        totalEstimatedAffected,
        riskDistribution,
      };
    },
  });
}
