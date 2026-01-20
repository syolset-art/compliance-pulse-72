import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getProcessAISuggestion } from "@/lib/processAISuggestions";

export interface AIDraft {
  hasAI: boolean;
  likelyHasAI: boolean;
  aiPurpose: string;
  suggestedFeatures: string[];
  suggestedRisk: string | null;
  suggestedAffectedPersons: string[];
  suggestedChecks: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  sources: DraftSource[];
  systemName: string | null;
  aiActNote: string;
  requiresUserInput: RequiredInput[];
}

export interface DraftSource {
  type: 'system_template' | 'system_data_handling' | 'asset_ai_usage' | 'process_suggestion';
  name: string;
  contribution: string;
}

export interface RequiredInput {
  field: string;
  label: string;
  reason: string;
}

interface SystemWithAI {
  id: string;
  name: string;
  vendor: string | null;
  hasAI: boolean;
  aiFeatures: string[];
  aiDescription: string | null;
  riskCategory: string | null;
}

export function useProcessAIDraft(
  processName: string,
  processDescription: string | undefined,
  systemId: string | undefined
) {
  return useQuery({
    queryKey: ["process-ai-draft", processName, systemId],
    queryFn: async (): Promise<AIDraft> => {
      const sources: DraftSource[] = [];
      let systemInfo: SystemWithAI | null = null;
      let templateAIFeatures: string[] = [];
      let dataHandlingAI: { hasAI: boolean; description: string | null } | null = null;

      // 1. Fetch system details if systemId is provided
      if (systemId) {
        const { data: system } = await supabase
          .from("systems")
          .select("id, name, vendor")
          .eq("id", systemId)
          .single();

        if (system) {
          systemInfo = {
            id: system.id,
            name: system.name,
            vendor: system.vendor,
            hasAI: false,
            aiFeatures: [],
            aiDescription: null,
            riskCategory: null,
          };

          // 2. Check system_templates for AI info based on system name/vendor
          const { data: templates } = await supabase
            .from("system_templates")
            .select("name, has_ai, ai_features, vendor")
            .eq("has_ai", true);

          if (templates) {
            // Find matching template by name or vendor
            const matchingTemplate = templates.find(t => 
              system.name.toLowerCase().includes(t.name.toLowerCase()) ||
              t.name.toLowerCase().includes(system.name.toLowerCase()) ||
              (system.vendor && t.vendor && system.vendor.toLowerCase().includes(t.vendor.toLowerCase()))
            );

            if (matchingTemplate && matchingTemplate.ai_features) {
              systemInfo.hasAI = true;
              templateAIFeatures = matchingTemplate.ai_features.split(',').map(f => f.trim()).filter(Boolean);
              systemInfo.aiFeatures = templateAIFeatures;
              
              sources.push({
                type: 'system_template',
                name: matchingTemplate.name,
                contribution: `AI-funksjoner fra ${matchingTemplate.name}: ${templateAIFeatures.join(', ')}`,
              });
            }
          }

          // 3. Check system_data_handling for AI usage
          const { data: dataHandling } = await supabase
            .from("system_data_handling")
            .select("ai_usage, ai_usage_description")
            .eq("system_id", systemId)
            .maybeSingle();

          if (dataHandling) {
            dataHandlingAI = {
              hasAI: dataHandling.ai_usage || false,
              description: dataHandling.ai_usage_description,
            };

            if (dataHandling.ai_usage) {
              systemInfo.hasAI = true;
              systemInfo.aiDescription = dataHandling.ai_usage_description;
              
              sources.push({
                type: 'system_data_handling',
                name: system.name,
                contribution: dataHandling.ai_usage_description || 'AI-bruk registrert i systemet',
              });
            }
          }

          // 4. Check asset_ai_usage for matching assets
          const { data: assets } = await supabase
            .from("assets")
            .select("id, name")
            .or(`name.ilike.%${system.name}%,name.ilike.%${system.vendor || 'no-vendor'}%`);

          if (assets && assets.length > 0) {
            const assetIds = assets.map(a => a.id);
            
            const { data: assetAIUsage } = await supabase
              .from("asset_ai_usage")
              .select("*")
              .in("asset_id", assetIds)
              .eq("has_ai", true);

            if (assetAIUsage && assetAIUsage.length > 0) {
              const usage = assetAIUsage[0];
              systemInfo.hasAI = true;
              systemInfo.riskCategory = usage.risk_category;
              
              // Parse features from asset
              const assetFeatures = parseAIFeatures(usage.ai_features);
              if (assetFeatures.length > 0) {
                systemInfo.aiFeatures = [...new Set([...systemInfo.aiFeatures, ...assetFeatures])];
              }

              sources.push({
                type: 'asset_ai_usage',
                name: assets.find(a => a.id === usage.asset_id)?.name || 'Eiendel',
                contribution: usage.purpose_description || `Risikoklassifisering: ${usage.risk_category || 'Ikke vurdert'}`,
              });
            }
          }
        }
      }

      // 5. Get process-based suggestions
      const processSuggestion = getProcessAISuggestion(processName, processDescription);
      
      if (processSuggestion.likelyAI || processSuggestion.suggestedAIFeatures.length > 0) {
        sources.push({
          type: 'process_suggestion',
          name: processName,
          contribution: processSuggestion.aiActNote || 'Prosessbasert analyse',
        });
      }

      // 6. Combine all data into draft
      const allFeatures = [...new Set([
        ...(systemInfo?.aiFeatures || []),
        ...processSuggestion.suggestedAIFeatures,
      ])];

      const likelyHasAI = systemInfo?.hasAI || processSuggestion.likelyAI;
      
      // Determine confidence level
      let confidenceLevel: 'high' | 'medium' | 'low' = 'low';
      if (sources.length >= 2 && systemInfo?.hasAI) {
        confidenceLevel = 'high';
      } else if (sources.length >= 1 && (systemInfo?.hasAI || processSuggestion.likelyAI)) {
        confidenceLevel = 'medium';
      }

      // Determine suggested risk
      let suggestedRisk = systemInfo?.riskCategory || null;
      if (!suggestedRisk && processSuggestion.suggestedRiskCategory) {
        suggestedRisk = processSuggestion.suggestedRiskCategory;
      }

      // Determine AI purpose
      let aiPurpose = '';
      if (systemInfo?.aiDescription) {
        aiPurpose = systemInfo.aiDescription;
      } else if (allFeatures.length > 0) {
        aiPurpose = `Prosessen bruker AI for: ${allFeatures.slice(0, 3).join(', ')}.`;
      }

      // Determine what requires user input
      const requiresUserInput: RequiredInput[] = [];
      
      if (!aiPurpose) {
        requiresUserInput.push({
          field: 'ai_purpose',
          label: 'Formål med AI',
          reason: 'Beskriv hva AI brukes til i denne prosessen',
        });
      }
      
      requiresUserInput.push({
        field: 'affected_persons',
        label: 'Berørte personer',
        reason: 'Hvilke persongrupper påvirkes av AI-beslutninger?',
      });
      
      requiresUserInput.push({
        field: 'human_oversight',
        label: 'Menneskelig tilsyn',
        reason: 'Beskriv hvordan menneskelig kontroll sikres',
      });

      if (!suggestedRisk || suggestedRisk === 'minimal') {
        requiresUserInput.push({
          field: 'risk_justification',
          label: 'Begrunnelse for risikoklassifisering',
          reason: 'Dokumenter hvorfor denne risikokategorien er valgt',
        });
      }

      return {
        hasAI: systemInfo?.hasAI || false,
        likelyHasAI,
        aiPurpose,
        suggestedFeatures: allFeatures,
        suggestedRisk,
        suggestedAffectedPersons: [],
        suggestedChecks: processSuggestion.suggestedChecks,
        confidenceLevel,
        sources,
        systemName: systemInfo?.name || null,
        aiActNote: processSuggestion.aiActNote,
        requiresUserInput,
      };
    },
    enabled: !!processName,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
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
