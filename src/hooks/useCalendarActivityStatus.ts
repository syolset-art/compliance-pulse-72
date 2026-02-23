import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActivityStatus = "completed" | "in_progress" | "not_started";

export type CalendarStatusMap = Record<string, ActivityStatus>;

export function useCalendarActivityStatus(): {
  statuses: CalendarStatusMap;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["calendar-activity-status"],
    staleTime: 60_000,
    queryFn: async () => {
      // Run all queries in parallel
      const [
        reqStatusRes,
        complianceReqRes,
        selectedFrameworksRes,
        companyRes,
        riskScenariosRes,
        frameworkDocsRes,
        coursesRes,
        assetsRes,
        vendorDocRequestsRes,
        incidentsRes,
        tasksRes,
      ] = await Promise.all([
        supabase.from("requirement_status").select("id, requirement_id, status"),
        supabase.from("compliance_requirements").select("id, framework_id, requirement_id, name"),
        supabase.from("selected_frameworks").select("id, is_selected"),
        supabase.from("company_profile").select("compliance_officer, dpo_name, ciso_name").limit(1),
        supabase.from("process_risk_scenarios").select("id").limit(1),
        supabase.from("framework_documents").select("id, document_type"),
        supabase.from("security_micro_courses").select("id, is_active"),
        supabase.from("assets").select("id, asset_type"),
        supabase.from("vendor_document_requests").select("id, asset_id, status"),
        supabase.from("system_incidents").select("id, category"),
        supabase.from("tasks").select("id, status"),
      ]);

      const reqStatuses = reqStatusRes.data || [];
      const compReqs = complianceReqRes.data || [];
      const frameworks = selectedFrameworksRes.data || [];
      const company = companyRes.data?.[0];
      const riskScenarios = riskScenariosRes.data || [];
      const frameworkDocs = frameworkDocsRes.data || [];
      const courses = coursesRes.data || [];
      const assets = assetsRes.data || [];
      const vendorDocReqs = vendorDocRequestsRes.data || [];
      const incidents = incidentsRes.data || [];
      const tasks = tasksRes.data || [];

      // Build requirement_id -> compliance_requirement map
      const reqIdToComp = new Map(compReqs.map((r) => [r.id, r]));

      // Count completed requirements
      const completedReqs = reqStatuses.filter((s) => s.status === "completed");
      const totalReqs = compReqs.length;
      const completedPercent = totalReqs > 0 ? completedReqs.length / totalReqs : 0;

      // Check specific requirement completion by name pattern
      const isReqCompleted = (namePattern: string): boolean => {
        return completedReqs.some((s) => {
          const comp = reqIdToComp.get(s.requirement_id);
          return comp && comp.name?.toLowerCase().includes(namePattern.toLowerCase());
        });
      };

      const isReqInProgress = (namePattern: string): boolean => {
        return reqStatuses.some((s) => {
          const comp = reqIdToComp.get(s.requirement_id);
          return (
            comp &&
            comp.name?.toLowerCase().includes(namePattern.toLowerCase()) &&
            (s.status === "in_progress" || s.status === "completed")
          );
        });
      };

      // Count ISO 27001 completed
      const iso27001Reqs = compReqs.filter((r) => r.framework_id === "iso27001");
      const iso27001Completed = completedReqs.filter((s) => {
        const comp = reqIdToComp.get(s.requirement_id);
        return comp && comp.framework_id === "iso27001";
      });
      const isoCompletedPercent =
        iso27001Reqs.length > 0 ? iso27001Completed.length / iso27001Reqs.length : 0;

      // Helper: threshold-based status
      const thresholdStatus = (
        value: number,
        completeThreshold: number,
        progressThreshold = 0
      ): ActivityStatus => {
        if (value >= completeThreshold) return "completed";
        if (value > progressThreshold) return "in_progress";
        return "not_started";
      };

      // Q1
      const q1GapAnalysis = thresholdStatus(completedPercent, 0.2, 0);
      
      const selectedCount = frameworks.filter((f) => f.is_selected).length;
      const q1ScopeDefinition: ActivityStatus = selectedCount >= 1 ? "completed" : "not_started";

      const rolesCount = [
        company?.compliance_officer,
        company?.dpo_name,
        company?.ciso_name,
      ].filter(Boolean).length;
      const q1Roles = thresholdStatus(rolesCount, 2, 1);

      const q1ProcessingRecords: ActivityStatus = isReqCompleted("art. 30")
        ? "completed"
        : isReqInProgress("art. 30")
        ? "in_progress"
        : "not_started";

      // Q2
      const q2RiskAssessment: ActivityStatus =
        riskScenarios.length > 0 ? "completed" : "not_started";

      const policyDocs = frameworkDocs.filter(
        (d) => d.document_type?.toLowerCase() === "policy"
      );
      const q2PolicyDev: ActivityStatus = policyDocs.length > 0 ? "completed" : "not_started";

      const q2Dpia: ActivityStatus = isReqCompleted("art. 35")
        ? "completed"
        : isReqInProgress("art. 35")
        ? "in_progress"
        : "not_started";

      const activeCourses = courses.filter((c) => c.is_active);
      const q2Awareness: ActivityStatus = activeCourses.length > 0 ? "completed" : "not_started";

      // Q3
      const q3Controls = thresholdStatus(isoCompletedPercent, 0.3, 0);

      const vendorAssets = assets.filter(
        (a) => a.asset_type === "vendor" || a.asset_type === "supplier"
      );
      const vendorsWithDocs = vendorDocReqs.filter((d) =>
        vendorAssets.some((a) => a.id === d.asset_id)
      );
      const q3VendorReview: ActivityStatus =
        vendorAssets.length > 0 && vendorsWithDocs.length > 0
          ? "completed"
          : vendorAssets.length > 0
          ? "in_progress"
          : "not_started";

      const q3Deviations: ActivityStatus = incidents.length > 0 ? "completed" : "not_started";

      const testIncidents = incidents.filter(
        (i) => i.category?.toLowerCase() === "test"
      );
      const q3IncidentTest: ActivityStatus =
        testIncidents.length > 0 ? "completed" : "not_started";

      // Q4
      const q4InternalAudit: ActivityStatus = isReqCompleted("9.2")
        ? "completed"
        : isReqInProgress("9.2")
        ? "in_progress"
        : "not_started";

      const q4ManagementReview: ActivityStatus = isReqCompleted("9.3")
        ? "completed"
        : isReqInProgress("9.3")
        ? "in_progress"
        : "not_started";

      const dpaRequests = vendorDocReqs.filter(
        (d) => d.status === "completed" || d.status === "approved"
      );
      const q4DpaUpdate: ActivityStatus = dpaRequests.length > 0 ? "completed" : "not_started";

      const completedTasks = tasks.filter((t) => t.status === "completed");
      const q4Improvement: ActivityStatus =
        completedTasks.length > 0 ? "completed" : "not_started";

      return {
        q1_gap_analysis: q1GapAnalysis,
        q1_scope_definition: q1ScopeDefinition,
        q1_role_assignment: q1Roles,
        q1_processing_records: q1ProcessingRecords,
        q2_risk_assessment: q2RiskAssessment,
        q2_policy_development: q2PolicyDev,
        q2_dpia: q2Dpia,
        q2_awareness: q2Awareness,
        q3_controls: q3Controls,
        q3_vendor_review: q3VendorReview,
        q3_deviations: q3Deviations,
        q3_incident_test: q3IncidentTest,
        q4_internal_audit: q4InternalAudit,
        q4_management_review: q4ManagementReview,
        q4_dpa_update: q4DpaUpdate,
        q4_improvement: q4Improvement,
      } as CalendarStatusMap;
    },
  });

  return {
    statuses: data || {},
    isLoading,
  };
}
