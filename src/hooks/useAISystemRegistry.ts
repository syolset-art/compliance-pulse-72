import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AISystem {
  id: string;
  name: string;
  provider: string | null;
  version: string | null;
  risk_category: string | null;
  risk_justification: string | null;
  annex_iii_category: string | null;
  use_cases: string[];
  affected_persons: string[];
  transparency_measures: string | null;
  human_oversight_level: string | null;
  logging_enabled: boolean;
  status: string;
  compliance_status: string;
  last_assessment_date: string | null;
  next_assessment_date: string | null;
  linked_asset_ids: string[];
  linked_process_count: number;
  usage_frequency: string | null;
  estimated_daily_uses: number;
  estimated_affected_persons: number;
  decisions_per_month: number;
  automation_level: string | null;
  override_rate_percent: number;
  accuracy_percent: number | null;
  last_performance_review: string | null;
  performance_notes: string | null;
  incidents_count: number;
  complaints_count: number;
  created_at: string;
  updated_at: string;
}

export interface AISystemInput {
  name: string;
  provider?: string;
  version?: string;
  risk_category?: string;
  risk_justification?: string;
  annex_iii_category?: string;
  use_cases?: string[];
  affected_persons?: string[];
  transparency_measures?: string;
  human_oversight_level?: string;
  logging_enabled?: boolean;
  status?: string;
  compliance_status?: string;
  last_assessment_date?: string;
  next_assessment_date?: string;
  usage_frequency?: string;
  estimated_daily_uses?: number;
  estimated_affected_persons?: number;
  decisions_per_month?: number;
  automation_level?: string;
  override_rate_percent?: number;
  accuracy_percent?: number;
}

// Known AI providers for matching
export const AI_PROVIDERS = [
  { patterns: ['openai', 'gpt', 'chatgpt', 'dall-e', 'whisper'], name: 'OpenAI' },
  { patterns: ['microsoft', 'copilot', 'azure ai', 'azure openai'], name: 'Microsoft' },
  { patterns: ['google', 'gemini', 'bard', 'vertex', 'palm'], name: 'Google' },
  { patterns: ['anthropic', 'claude'], name: 'Anthropic' },
  { patterns: ['meta', 'llama'], name: 'Meta' },
  { patterns: ['amazon', 'bedrock', 'aws'], name: 'Amazon' },
  { patterns: ['hugging', 'huggingface'], name: 'Hugging Face' },
  { patterns: ['stability', 'stable diffusion'], name: 'Stability AI' },
];

export function identifyProvider(text: string): string | null {
  const lowerText = text.toLowerCase();
  for (const provider of AI_PROVIDERS) {
    if (provider.patterns.some(p => lowerText.includes(p))) {
      return provider.name;
    }
  }
  return null;
}

export function useAISystemRegistry() {
  return useQuery({
    queryKey: ["ai-system-registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_system_registry")
        .select("*")
        .order("name");
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        use_cases: Array.isArray(item.use_cases) ? item.use_cases : [],
        affected_persons: Array.isArray(item.affected_persons) ? item.affected_persons : [],
        linked_asset_ids: Array.isArray(item.linked_asset_ids) ? item.linked_asset_ids : [],
      })) as AISystem[];
    },
  });
}

export function useAISystem(systemId: string | undefined) {
  return useQuery({
    queryKey: ["ai-system-registry", systemId],
    queryFn: async () => {
      if (!systemId) return null;
      
      const { data, error } = await supabase
        .from("ai_system_registry")
        .select("*")
        .eq("id", systemId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        use_cases: Array.isArray(data.use_cases) ? data.use_cases : [],
        affected_persons: Array.isArray(data.affected_persons) ? data.affected_persons : [],
        linked_asset_ids: Array.isArray(data.linked_asset_ids) ? data.linked_asset_ids : [],
      } as AISystem;
    },
    enabled: !!systemId,
  });
}

export function useCreateAISystem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: AISystemInput) => {
      const { data, error } = await supabase
        .from("ai_system_registry")
        .insert({
          name: input.name,
          provider: input.provider,
          version: input.version,
          risk_category: input.risk_category || 'not_assessed',
          risk_justification: input.risk_justification,
          annex_iii_category: input.annex_iii_category,
          use_cases: input.use_cases || [],
          affected_persons: input.affected_persons || [],
          transparency_measures: input.transparency_measures,
          human_oversight_level: input.human_oversight_level,
          logging_enabled: input.logging_enabled || false,
          status: input.status || 'active',
          compliance_status: input.compliance_status || 'not_assessed',
          last_assessment_date: input.last_assessment_date,
          next_assessment_date: input.next_assessment_date,
          usage_frequency: input.usage_frequency,
          estimated_daily_uses: input.estimated_daily_uses || 0,
          estimated_affected_persons: input.estimated_affected_persons || 0,
          decisions_per_month: input.decisions_per_month || 0,
          automation_level: input.automation_level || 'advisory',
          override_rate_percent: input.override_rate_percent || 0,
          accuracy_percent: input.accuracy_percent,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-system-registry"] });
    },
  });
}

export function useUpdateAISystem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...input }: AISystemInput & { id: string }) => {
      const { data, error } = await supabase
        .from("ai_system_registry")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-system-registry"] });
    },
  });
}

// Hook to discover AI systems from existing process documentation
export function useAISystemDiscovery() {
  return useQuery({
    queryKey: ["ai-system-discovery"],
    queryFn: async () => {
      // Fetch all process AI usage data
      const { data: processAIUsage, error: processError } = await supabase
        .from("process_ai_usage")
        .select(`
          *,
          system_processes!inner(
            id,
            name,
            system_id,
            systems(id, name, vendor)
          )
        `)
        .eq("has_ai", true);
      
      if (processError) throw processError;
      
      // Fetch existing registry entries
      const { data: existingRegistry, error: registryError } = await supabase
        .from("ai_system_registry")
        .select("name, provider");
      
      if (registryError) throw registryError;
      
      // Group by detected AI system
      const discoveredSystems = new Map<string, {
        name: string;
        provider: string | null;
        processes: Array<{
          id: string;
          name: string;
          riskCategory: string | null;
          affectedPersons: string[];
        }>;
        highestRisk: string;
        allAffectedPersons: Set<string>;
      }>();
      
      for (const usage of processAIUsage || []) {
        // Try to identify AI system from purpose or features
        const aiPurpose = usage.ai_purpose || '';
        const aiFeatures = Array.isArray(usage.ai_features) 
          ? usage.ai_features.map((f: any) => typeof f === 'string' ? f : f.name || '').join(' ')
          : '';
        
        const searchText = `${aiPurpose} ${aiFeatures}`;
        const provider = identifyProvider(searchText);
        
        // Use vendor from linked system or detected provider
        const systemVendor = (usage.system_processes as any)?.systems?.vendor;
        const systemName = (usage.system_processes as any)?.systems?.name || 'Ukjent system';
        
        const key = provider || systemVendor || systemName;
        
        if (!discoveredSystems.has(key)) {
          discoveredSystems.set(key, {
            name: key,
            provider: provider,
            processes: [],
            highestRisk: 'minimal',
            allAffectedPersons: new Set(),
          });
        }
        
        const system = discoveredSystems.get(key)!;
        system.processes.push({
          id: usage.process_id,
          name: (usage.system_processes as any)?.name || 'Ukjent prosess',
          riskCategory: usage.risk_category,
          affectedPersons: usage.affected_persons || [],
        });
        
        // Update highest risk
        const riskOrder = ['minimal', 'limited', 'high', 'unacceptable'];
        if (usage.risk_category && riskOrder.indexOf(usage.risk_category) > riskOrder.indexOf(system.highestRisk)) {
          system.highestRisk = usage.risk_category;
        }
        
        // Aggregate affected persons
        (usage.affected_persons || []).forEach((p: string) => system.allAffectedPersons.add(p));
      }
      
      // Filter out already registered systems
      const existingNames = new Set((existingRegistry || []).map(r => r.name.toLowerCase()));
      
      return Array.from(discoveredSystems.values())
        .filter(s => !existingNames.has(s.name.toLowerCase()))
        .map(s => ({
          ...s,
          allAffectedPersons: Array.from(s.allAffectedPersons),
        }));
    },
  });
}
