import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listVendorsTool from "./tools/list_vendors";
import listRequirementsTool from "./tools/list_requirements";
import getDocumentationStatusTool from "./tools/get_documentation_status";
import createActivityTool from "./tools/create_activity";
import reportDocumentCoverageTool from "./tools/report_document_coverage";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mynder-core",
  title: "Mynder Core",
  version: "0.1.0",
  instructions:
    "Mynder Core MCP server exposes vendor, compliance, and documentation tools. " +
    "Use list_vendors to see registered vendors and their criticality. " +
    "Use list_requirements to see active compliance requirements. " +
    "Use get_documentation_status to see maturity per activated framework. " +
    "Use create_activity to create a follow-up task. " +
    "Use report_document_coverage to report how many articles a document in your own infrastructure covers, without uploading the document to Mynder.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listVendorsTool, listRequirementsTool, getDocumentationStatusTool, createActivityTool, reportDocumentCoverageTool],
});
