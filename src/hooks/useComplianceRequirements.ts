import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ALL_COMPLIANCE_REQUIREMENTS, 
  getRequirementsByFramework,
  getRequirementsByDomain,
  getFrameworkStats,
  type ComplianceRequirement,
  type AgentCapability,
  type RequirementDomain
} from "@/lib/complianceRequirementsData";
import type { RequirementStatus } from "@/components/compliance/RequirementCard";

export interface RequirementWithStatus extends ComplianceRequirement {
  status: RequirementStatus;
  progress_percent: number;
  is_ai_handling: boolean;
  maturity_level: number;
  is_relevant: boolean;
  completed_at?: string;
  completed_by?: string;
  evidence_notes?: string;
  linked_tasks?: string[];
  linked_assets?: string[];
  linked_processes?: string[];
  db_id?: string;
}

interface UseComplianceRequirementsOptions {
  frameworkId?: string;
  domain?: RequirementDomain;
  includeCompleted?: boolean;
}

export function useComplianceRequirements(options: UseComplianceRequirementsOptions = {}) {
  const { frameworkId, domain, includeCompleted = true } = options;
  const queryClient = useQueryClient();

  // Fetch requirement statuses from database
  const { data: statusData, isLoading, error } = useQuery({
    queryKey: ['requirement-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requirement_status')
        .select(`
          id,
          requirement_id,
          status,
          progress_percent,
          is_ai_handling,
          maturity_level,
          completed_at,
          completed_by,
          evidence_notes,
          linked_tasks,
          linked_assets,
          linked_processes
        `);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch compliance requirements from database (for IDs)
  const { data: dbRequirements } = useQuery({
    queryKey: ['compliance-requirements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_requirements')
        .select('id, framework_id, requirement_id');
      
      if (error) throw error;
      return data || [];
    }
  });

  // Merge static requirements with dynamic status
  const requirements = useMemo(() => {
    let baseRequirements = ALL_COMPLIANCE_REQUIREMENTS;
    
    if (frameworkId) {
      baseRequirements = getRequirementsByFramework(frameworkId);
    } else if (domain) {
      baseRequirements = getRequirementsByDomain(domain);
    }

    // Create a map of requirement_id -> db_id
    const requirementIdMap = new Map(
      dbRequirements?.map(r => [`${r.framework_id}-${r.requirement_id}`, r.id]) || []
    );

    // Create a map of db_id -> status
    const statusMap = new Map(
      statusData?.map(s => [s.requirement_id, s]) || []
    );

    return baseRequirements.map((req): RequirementWithStatus => {
      const dbId = requirementIdMap.get(`${req.framework_id}-${req.requirement_id}`);
      const status = dbId ? statusMap.get(dbId) : null;
      
      return {
        ...req,
        db_id: dbId,
        status: (status?.status as RequirementStatus) || 'not_started',
        progress_percent: status?.progress_percent || 0,
        is_ai_handling: status?.is_ai_handling || false,
        maturity_level: (status as any)?.maturity_level ?? 0,
        is_relevant: true, // default all relevant for now
        completed_at: status?.completed_at || undefined,
        completed_by: status?.completed_by || undefined,
        evidence_notes: status?.evidence_notes || undefined,
        linked_tasks: status?.linked_tasks || [],
        linked_assets: status?.linked_assets || [],
        linked_processes: status?.linked_processes || []
      };
    }).filter(req => includeCompleted || req.status !== 'completed');
  }, [frameworkId, domain, includeCompleted, statusData, dbRequirements]);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === 'completed').length;
    const inProgress = requirements.filter(r => r.status === 'in_progress').length;
    const notStarted = requirements.filter(r => r.status === 'not_started').length;
    const aiHandling = requirements.filter(r => r.is_ai_handling).length;
    
    const byCapability = {
      full: requirements.filter(r => r.agent_capability === 'full').length,
      assisted: requirements.filter(r => r.agent_capability === 'assisted').length,
      manual: requirements.filter(r => r.agent_capability === 'manual').length
    };

    const byPriority = {
      critical: requirements.filter(r => r.priority === 'critical').length,
      high: requirements.filter(r => r.priority === 'high').length,
      medium: requirements.filter(r => r.priority === 'medium').length,
      low: requirements.filter(r => r.priority === 'low').length
    };

    const completedByCapability = {
      full: requirements.filter(r => r.status === 'completed' && r.agent_capability === 'full').length,
      assisted: requirements.filter(r => r.status === 'completed' && r.agent_capability === 'assisted').length,
      manual: requirements.filter(r => r.status === 'completed' && r.agent_capability === 'manual').length
    };

    return {
      total,
      completed,
      inProgress,
      notStarted,
      aiHandling,
      progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      byCapability,
      byPriority,
      completedByCapability
    };
  }, [requirements]);

  // Update requirement status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ 
      requirementDbId, 
      status, 
      progressPercent,
      isAiHandling,
      evidenceNotes,
      completedBy
    }: {
      requirementDbId: string;
      status?: RequirementStatus;
      progressPercent?: number;
      isAiHandling?: boolean;
      evidenceNotes?: string;
      completedBy?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      
      if (status !== undefined) updates.status = status;
      if (progressPercent !== undefined) updates.progress_percent = progressPercent;
      if (isAiHandling !== undefined) updates.is_ai_handling = isAiHandling;
      if (evidenceNotes !== undefined) updates.evidence_notes = evidenceNotes;
      if (completedBy !== undefined) updates.completed_by = completedBy;
      
      if (status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      // Check if status record exists
      const { data: existing } = await supabase
        .from('requirement_status')
        .select('id')
        .eq('requirement_id', requirementDbId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from('requirement_status')
          .update(updates)
          .eq('requirement_id', requirementDbId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('requirement_status')
          .insert({
            requirement_id: requirementDbId,
            ...updates
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirement-status'] });
    }
  });

  // Get grouped requirements
  const grouped = useMemo(() => ({
    incompleteManual: requirements
      .filter(r => r.status !== 'completed' && r.status !== 'not_applicable' && r.agent_capability === 'manual')
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
    aiWorkingOn: requirements
      .filter(r => r.status === 'in_progress' && (r.is_ai_handling || r.agent_capability === 'full')),
    completed: requirements
      .filter(r => r.status === 'completed')
      .sort((a, b) => a.sort_order - b.sort_order),
    all: requirements
  }), [requirements]);

  return {
    requirements,
    grouped,
    stats,
    isLoading,
    error,
    updateStatus: updateStatus.mutate,
    isUpdating: updateStatus.isPending
  };
}

// Hook for getting framework-specific stats without loading all statuses
export function useFrameworkStats(frameworkId: string) {
  return useMemo(() => getFrameworkStats(frameworkId), [frameworkId]);
}
