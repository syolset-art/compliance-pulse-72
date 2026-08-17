import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_documentation_status",
  title: "Get documentation status",
  description: "Return the documentation/maturity status for each activated framework, including how many requirements are covered and the overall maturity level.",
  inputSchema: {
    framework_id: z.string().optional().describe("Optional framework ID to get status for a single framework."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ framework_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let selectedQuery = supabase.from("selected_frameworks").select("framework_id, framework_name, category, is_selected").eq("is_selected", true);
    if (framework_id) {
      selectedQuery = selectedQuery.eq("framework_id", framework_id);
    }
    const { data: frameworks, error: fwError } = await selectedQuery;
    if (fwError) {
      return { content: [{ type: "text", text: fwError.message }], isError: true };
    }
    if (!frameworks || frameworks.length === 0) {
      return { content: [{ type: "text", text: "No frameworks are currently activated." }] };
    }

    const ids = frameworks.map((f) => f.framework_id);
    const { data: requirements, error: reqError } = await supabase
      .from("compliance_requirements")
      .select("id, framework_id, name, name_no")
      .in("framework_id", ids)
      .eq("is_active", true);
    if (reqError) {
      return { content: [{ type: "text", text: reqError.message }], isError: true };
    }

    const reqIds = (requirements ?? []).map((r) => r.id);
    const { data: statuses, error: statusError } = await supabase
      .from("requirement_status")
      .select("requirement_id, status, maturity_level, progress_percent, evidence_notes")
      .in("requirement_id", reqIds);
    if (statusError) {
      return { content: [{ type: "text", text: statusError.message }], isError: true };
    }

    const statusMap = new Map((statuses ?? []).map((s) => [s.requirement_id, s]));
    const result = frameworks.map((fw) => {
      const fwReqs = (requirements ?? []).filter((r) => r.framework_id === fw.framework_id);
      const fwStatuses = fwReqs.map((r) => statusMap.get(r.id) ?? null);
      const total = fwReqs.length;
      const covered = fwStatuses.filter((s) => s && (s.status === "fulfilled" || s.status === "complete" || s.status === "yes" || (s.progress_percent ?? 0) >= 100)).length;
      const inProgress = fwStatuses.filter((s) => s && (s.status === "in_progress" || ((s.progress_percent ?? 0) > 0 && (s.progress_percent ?? 0) < 100))).length;
      const notStarted = total - covered - inProgress;
      const avgMaturity = fwStatuses.length > 0
        ? Math.round(fwStatuses.reduce((sum, s) => sum + (s?.maturity_level ?? 0), 0) / fwStatuses.length)
        : 0;
      return {
        framework_id: fw.framework_id,
        framework_name: fw.framework_name,
        category: fw.category,
        total_requirements: total,
        covered,
        in_progress: inProgress,
        not_started: notStarted,
        average_maturity_level: avgMaturity,
      };
    });

    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  },
});
