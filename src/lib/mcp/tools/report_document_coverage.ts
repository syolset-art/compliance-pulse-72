import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const coverageSchema = z.object({
  article_id: z.string().min(1).describe("Identifier of the article/requirement article covered by the document."),
  covered: z.boolean().describe("Whether the article is covered by the document."),
});

export default defineTool({
  name: "report_document_coverage",
  title: "Report document coverage",
  description: "Report how many articles in a requirement are covered by a document found in the caller's own infrastructure. This updates the requirement maturity/progress in Mynder without uploading the actual document.",
  inputSchema: {
    requirement_id: z.string().min(1).describe("Mynder requirement ID to update."),
    coverage: z.array(coverageSchema).min(1).describe("Array of article coverage results."),
    notes: z.string().max(2000).optional().describe("Optional notes about the document or coverage assessment."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false, destructiveHint: false },
  handler: async ({ requirement_id, coverage, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const { data: req, error: reqError } = await supabase
      .from("compliance_requirements")
      .select("id, framework_id, name, is_active")
      .eq("id", requirement_id)
      .single();
    if (reqError || !req) {
      throw new ToolError(`Requirement ${requirement_id} not found or not accessible.`);
    }
    if (!req.is_active) {
      throw new ToolError(`Requirement ${requirement_id} is not active and cannot be updated.`);
    }

    const coveredCount = coverage.filter((c) => c.covered).length;
    const totalCount = coverage.length;
    const progressPercent = totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100);
    const maturityLevel = progressPercent >= 75 ? 3 : progressPercent >= 50 ? 2 : progressPercent > 0 ? 1 : 0;
    const status = progressPercent >= 100 ? "fulfilled" : progressPercent > 0 ? "in_progress" : "not_started";

    const { data: existing, error: existingError } = await supabase
      .from("requirement_status")
      .select("id")
      .eq("requirement_id", requirement_id)
      .maybeSingle();
    if (existingError) {
      return { content: [{ type: "text", text: existingError.message }], isError: true };
    }

    const payload = {
      requirement_id,
      status,
      maturity_level: maturityLevel,
      progress_percent: progressPercent,
      evidence_notes: notes ? `${notes}\n\nCoverage: ${coveredCount}/${totalCount} articles covered.` : `Coverage: ${coveredCount}/${totalCount} articles covered.`,
      updated_at: new Date().toISOString(),
      completed_at: progressPercent >= 100 ? new Date().toISOString() : null,
    };

    let result;
    if (existing?.id) {
      const { data, error } = await supabase.from("requirement_status").update(payload).eq("id", existing.id).select().single();
      result = { data, error };
    } else {
      const { data, error } = await supabase.from("requirement_status").insert({ ...payload, created_at: new Date().toISOString() }).select().single();
      result = { data, error };
    }
    if (result.error) {
      return { content: [{ type: "text", text: result.error.message }], isError: true };
    }

    return {
      content: [
        {
          type: "text",
          text: `Updated requirement "${req.name}" (${requirement_id}). Coverage: ${coveredCount}/${totalCount} articles (${progressPercent}%). Maturity level: ${maturityLevel}.`,
        },
      ],
    };
  },
});
