import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_requirements",
  title: "List requirements",
  description: "List compliance requirements and their articles from the frameworks that are currently activated in Mynder.",
  inputSchema: {
    framework_id: z.string().optional().describe("Optional framework ID to filter requirements to a specific framework."),
    limit: z.number().min(1).max(200).default(50).describe("Maximum number of requirements to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ framework_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("compliance_requirements")
      .select("id, requirement_id, framework_id, name, name_no, description, description_no, domain, category, priority, is_active, is_relevant")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(limit);
    if (framework_id) {
      query = query.eq("framework_id", framework_id);
    }
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
});
