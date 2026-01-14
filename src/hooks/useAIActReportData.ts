import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AISystemData {
  systemId: string;
  systemName: string;
  systemCategory: string | null;
  vendor: string | null;
  workAreaName: string | null;
  hasAI: boolean;
  aiFeatures: string[];
  riskCategory: string | null;
  riskJustification: string | null;
  aiProvider: string | null;
  purposeDescription: string | null;
  humanOversightLevel: string | null;
  humanOversightDescription: string | null;
  affectedPersons: string[];
  transparencyImplemented: boolean;
  transparencyDescription: string | null;
  loggingEnabled: boolean;
  dataUsedForTraining: boolean;
  complianceStatus: string | null;
  lastAssessmentDate: string | null;
  nextAssessmentDate: string | null;
}

export interface AIProcessData {
  processId: string;
  processName: string;
  processDescription: string | null;
  systemName: string | null;
  workAreaName: string | null;
  hasAI: boolean;
  aiFeatures: string[];
  aiPurpose: string | null;
  riskCategory: string | null;
  riskJustification: string | null;
  humanOversightRequired: boolean;
  humanOversightLevel: string | null;
  humanOversightDescription: string | null;
  automatedDecisions: boolean;
  decisionImpact: string | null;
  affectedPersons: string[];
  transparencyStatus: string | null;
  transparencyDescription: string | null;
  complianceStatus: string | null;
  lastReviewDate: string | null;
  nextReviewDate: string | null;
}

export interface AIActReportData {
  companyName: string;
  companyIndustry: string;
  generatedAt: string;
  systems: AISystemData[];
  processes: AIProcessData[];
  summary: {
    totalSystems: number;
    systemsWithAI: number;
    totalProcesses: number;
    processesWithAI: number;
    riskDistribution: Record<string, number>;
    complianceRate: number;
  };
}

function parseAIFeatures(features: unknown): string[] {
  if (Array.isArray(features)) {
    return features.filter((f): f is string => typeof f === 'string');
  }
  if (typeof features === 'object' && features !== null) {
    return Object.entries(features)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }
  return [];
}

export function useAIActReportData() {
  return useQuery({
    queryKey: ["ai-act-report-data"],
    queryFn: async (): Promise<AIActReportData> => {
      // Fetch company profile
      const { data: companyProfile } = await supabase
        .from("company_profile")
        .select("name, industry")
        .limit(1)
        .maybeSingle();

      // Fetch work areas
      const { data: workAreas } = await supabase
        .from("work_areas")
        .select("id, name");

      const workAreaMap = new Map(workAreas?.map(wa => [wa.id, wa.name]) || []);

      // Fetch systems with AI usage
      const { data: assets } = await supabase
        .from("assets")
        .select("id, name, category, vendor, work_area_id");

      const { data: assetAIUsage } = await supabase
        .from("asset_ai_usage")
        .select("*");

      // Map assets with their AI usage
      const systemsData: AISystemData[] = (assets || []).map(asset => {
        const aiUsage = assetAIUsage?.find(ai => ai.asset_id === asset.id);
        return {
          systemId: asset.id,
          systemName: asset.name,
          systemCategory: asset.category,
          vendor: asset.vendor,
          workAreaName: asset.work_area_id ? workAreaMap.get(asset.work_area_id) || null : null,
          hasAI: aiUsage?.has_ai || false,
          aiFeatures: parseAIFeatures(aiUsage?.ai_features),
          riskCategory: aiUsage?.risk_category || null,
          riskJustification: aiUsage?.risk_justification || null,
          aiProvider: aiUsage?.ai_provider || null,
          purposeDescription: aiUsage?.purpose_description || null,
          humanOversightLevel: aiUsage?.human_oversight_level || null,
          humanOversightDescription: aiUsage?.human_oversight_description || null,
          affectedPersons: aiUsage?.affected_persons || [],
          transparencyImplemented: aiUsage?.transparency_implemented || false,
          transparencyDescription: aiUsage?.transparency_description || null,
          loggingEnabled: aiUsage?.logging_enabled || false,
          dataUsedForTraining: aiUsage?.data_used_for_training || false,
          complianceStatus: aiUsage?.compliance_status || null,
          lastAssessmentDate: aiUsage?.last_assessment_date || null,
          nextAssessmentDate: aiUsage?.next_assessment_date || null,
        };
      });

      // Fetch processes with AI usage
      const { data: processes } = await supabase
        .from("system_processes")
        .select("id, name, description, system_id");

      const { data: systems } = await supabase
        .from("systems")
        .select("id, name, work_area_id");

      const { data: processAIUsage } = await supabase
        .from("process_ai_usage")
        .select("*");

      const systemMap = new Map(systems?.map(s => [s.id, { name: s.name, workAreaId: s.work_area_id }]) || []);

      const processesData: AIProcessData[] = (processes || []).map(process => {
        const aiUsage = processAIUsage?.find(ai => ai.process_id === process.id);
        const system = systemMap.get(process.system_id);
        return {
          processId: process.id,
          processName: process.name,
          processDescription: process.description,
          systemName: system?.name || null,
          workAreaName: system?.workAreaId ? workAreaMap.get(system.workAreaId) || null : null,
          hasAI: aiUsage?.has_ai || false,
          aiFeatures: parseAIFeatures(aiUsage?.ai_features),
          aiPurpose: aiUsage?.ai_purpose || null,
          riskCategory: aiUsage?.risk_category || null,
          riskJustification: aiUsage?.risk_justification || null,
          humanOversightRequired: aiUsage?.human_oversight_required || false,
          humanOversightLevel: aiUsage?.human_oversight_level || null,
          humanOversightDescription: aiUsage?.human_oversight_description || null,
          automatedDecisions: aiUsage?.automated_decisions || false,
          decisionImpact: aiUsage?.decision_impact || null,
          affectedPersons: aiUsage?.affected_persons || [],
          transparencyStatus: aiUsage?.transparency_status || null,
          transparencyDescription: aiUsage?.transparency_description || null,
          complianceStatus: aiUsage?.compliance_status || null,
          lastReviewDate: aiUsage?.last_review_date || null,
          nextReviewDate: aiUsage?.next_review_date || null,
        };
      });

      // Calculate summary
      const systemsWithAI = systemsData.filter(s => s.hasAI);
      const processesWithAI = processesData.filter(p => p.hasAI);

      const riskDistribution: Record<string, number> = {
        unacceptable: 0,
        high: 0,
        limited: 0,
        minimal: 0,
        unknown: 0,
      };

      [...systemsWithAI, ...processesWithAI].forEach(item => {
        const risk = item.riskCategory || 'unknown';
        if (risk in riskDistribution) {
          riskDistribution[risk]++;
        } else {
          riskDistribution['unknown']++;
        }
      });

      const assessedItems = [...systemsWithAI, ...processesWithAI].filter(
        item => item.complianceStatus === 'compliant' || item.complianceStatus === 'assessed'
      );
      const complianceRate = (systemsWithAI.length + processesWithAI.length) > 0
        ? Math.round((assessedItems.length / (systemsWithAI.length + processesWithAI.length)) * 100)
        : 0;

      return {
        companyName: companyProfile?.name || 'Ukjent virksomhet',
        companyIndustry: companyProfile?.industry || 'Ukjent bransje',
        generatedAt: new Date().toISOString(),
        systems: systemsData,
        processes: processesData,
        summary: {
          totalSystems: systemsData.length,
          systemsWithAI: systemsWithAI.length,
          totalProcesses: processesData.length,
          processesWithAI: processesWithAI.length,
          riskDistribution,
          complianceRate,
        },
      };
    },
  });
}
