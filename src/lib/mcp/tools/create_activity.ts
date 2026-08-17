import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_activity",
  title: "Create activity",
  description: "Create a user task/activity in Mynder, typically tied to a vendor or follow-up item.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Title of the activity."),
    description: z.string().trim().max(2000).optional().describe("Optional description of the activity."),
    asset_id: z.string().uuid().optional().describe("Optional asset/vendor ID to link the activity to."),
    due_date: z.string().datetime().optional().describe("Optional due date in ISO 8601 format."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false, destructiveHint: false },
  handler: async ({ title, description, asset_id, due_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("user_tasks")
      .insert({
        user_id: ctx.getUserId(),
        title,
        description: description ?? null,
        asset_id: asset_id ?? null,
        due_date: due_date ?? null,
        status: "open",
      })
      .select("id, title, description, asset_id, due_date, status, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  },
});
