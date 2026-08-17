import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_vendors",
  title: "List vendors",
  description: "List the registered vendors/assets in Mynder with their criticality, risk level, and category. Returns a compact JSON array.",
  inputSchema: {
    limit: z.number().min(1).max(100).default(20).describe("Maximum number of vendors to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("assets")
      .select("id, name, asset_type, criticality, risk_level, risk_score, category, vendor_category, gdpr_role, url, compliance_score, tprm_status")
      .eq("asset_type", "vendor")
      .order("name", { ascending: true })
      .limit(limit);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }] };
  },
});
