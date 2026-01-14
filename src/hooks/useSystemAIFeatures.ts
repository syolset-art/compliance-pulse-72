import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemAIFeature {
  systemId: string;
  systemName: string;
  hasAI: boolean;
  aiFeatures: string[];
  riskCategory: string | null;
  aiProvider: string | null;
  purposeDescription: string | null;
  humanOversightLevel: string | null;
  affectedPersons: string[] | null;
}

export interface AggregatedSystemAI {
  systems: SystemAIFeature[];
  totalWithAI: number;
  allFeatures: string[];
  highestRisk: string;
  suggestedFeatures: string[];
  suggestedRisk: string | null;
  suggestedAffectedPersons: string[];
}

export function useSystemAIFeatures(processSystemId: string | null) {
  return useQuery({
    queryKey: ["system-ai-features", processSystemId],
    queryFn: async (): Promise<AggregatedSystemAI> => {
      if (!processSystemId) {
        return {
          systems: [],
          totalWithAI: 0,
          allFeatures: [],
          highestRisk: 'minimal',
          suggestedFeatures: [],
          suggestedRisk: null,
          suggestedAffectedPersons: [],
        };
      }

      // Fetch the system
      const { data: system, error: systemError } = await supabase
        .from("systems")
        .select("id, name")
        .eq("id", processSystemId)
        .single();

      if (systemError || !system) {
        return {
          systems: [],
          totalWithAI: 0,
          allFeatures: [],
          highestRisk: 'minimal',
          suggestedFeatures: [],
          suggestedRisk: null,
          suggestedAffectedPersons: [],
        };
      }

      // Fetch AI usage for this system from asset_ai_usage
      // First, find assets linked to this system (assets with matching name or work_area)
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name")
        .ilike("name", `%${system.name}%`);

      const assetIds = assets?.map(a => a.id) || [];

      let aiUsageData: SystemAIFeature[] = [];

      if (assetIds.length > 0) {
        const { data: assetAIUsage } = await supabase
          .from("asset_ai_usage")
          .select("*")
          .in("asset_id", assetIds);

        if (assetAIUsage) {
          aiUsageData = assetAIUsage.map(usage => ({
            systemId: usage.asset_id,
            systemName: assets?.find(a => a.id === usage.asset_id)?.name || 'Ukjent',
            hasAI: usage.has_ai,
            aiFeatures: parseAIFeatures(usage.ai_features),
            riskCategory: usage.risk_category,
            aiProvider: usage.ai_provider,
            purposeDescription: usage.purpose_description,
            humanOversightLevel: usage.human_oversight_level,
            affectedPersons: usage.affected_persons,
          }));
        }
      }

      // Also check system_data_handling for AI usage
      const { data: dataHandling } = await supabase
        .from("system_data_handling")
        .select("*")
        .eq("system_id", processSystemId)
        .maybeSingle();

      if (dataHandling?.ai_usage && !aiUsageData.some(a => a.systemId === processSystemId)) {
        aiUsageData.push({
          systemId: processSystemId,
          systemName: system.name,
          hasAI: true,
          aiFeatures: dataHandling.ai_usage_description ? [dataHandling.ai_usage_description] : [],
          riskCategory: null,
          aiProvider: null,
          purposeDescription: dataHandling.ai_usage_description,
          humanOversightLevel: null,
          affectedPersons: null,
        });
      }

      // Aggregate data
      const systemsWithAI = aiUsageData.filter(s => s.hasAI);
      const allFeatures = [...new Set(systemsWithAI.flatMap(s => s.aiFeatures))];
      const allAffectedPersons = [...new Set(systemsWithAI.flatMap(s => s.affectedPersons || []))];

      // Determine highest risk
      const riskOrder = ['unacceptable', 'high', 'limited', 'minimal'];
      let highestRisk = 'minimal';
      let suggestedRisk: string | null = null;

      for (const sys of systemsWithAI) {
        if (sys.riskCategory) {
          const currentIndex = riskOrder.indexOf(highestRisk);
          const newIndex = riskOrder.indexOf(sys.riskCategory);
          if (newIndex !== -1 && newIndex < currentIndex) {
            highestRisk = sys.riskCategory;
            suggestedRisk = sys.riskCategory;
          }
        }
      }

      return {
        systems: aiUsageData,
        totalWithAI: systemsWithAI.length,
        allFeatures,
        highestRisk,
        suggestedFeatures: allFeatures,
        suggestedRisk,
        suggestedAffectedPersons: allAffectedPersons,
      };
    },
    enabled: !!processSystemId,
  });
}

function parseAIFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  if (typeof features === 'object' && features !== null) {
    // Handle object format like { feature1: true, feature2: true }
    return Object.entries(features)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  return [];
}
