import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Get all assets
    const { data: assets, error: assetsErr } = await supabase
      .from("assets")
      .select("id, asset_type, metadata");
    if (assetsErr) throw assetsErr;

    let checksUpserted = 0;
    let penaltiesApplied = 0;

    for (const asset of assets || []) {
      const evidenceChecks: Array<{
        asset_id: string;
        check_type: string;
        control_key: string;
        status: string;
        last_verified_at: string;
        expires_at: string | null;
        staleness_days: number;
        details: Record<string, unknown>;
        agent_id: string;
      }> = [];

      // 1. Check vendor_documents for this asset
      const { data: docs } = await supabase
        .from("vendor_documents")
        .select("id, document_type, file_name, valid_to, created_at, status")
        .eq("asset_id", asset.id);

      for (const doc of docs || []) {
        // Certificate expiry check
        if (doc.valid_to) {
          const validTo = new Date(doc.valid_to);
          const daysUntilExpiry = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          let status = "fresh";
          if (validTo <= now) {
            status = "expired";
          } else if (daysUntilExpiry <= 30) {
            status = "stale";
          }

          evidenceChecks.push({
            asset_id: asset.id,
            check_type: "certificate_expiry",
            control_key: doc.document_type === "certification" ? "vendor_security_review" : "dpa_verified",
            status,
            last_verified_at: now.toISOString(),
            expires_at: doc.valid_to,
            staleness_days: status === "expired" ? Math.abs(daysUntilExpiry) : 0,
            details: { document_id: doc.id, file_name: doc.file_name, days_until_expiry: daysUntilExpiry },
            agent_id: "check-evidence-freshness",
          });
        }

        // Document age check
        if (doc.created_at) {
          const createdAt = new Date(doc.created_at);
          const ageInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

          let status = "fresh";
          if (ageInDays > 365) {
            status = "stale";
          }

          evidenceChecks.push({
            asset_id: asset.id,
            check_type: "document_status",
            control_key: "documentation_available",
            status,
            last_verified_at: now.toISOString(),
            expires_at: null,
            staleness_days: ageInDays > 365 ? ageInDays - 365 : 0,
            details: { document_id: doc.id, file_name: doc.file_name, age_days: ageInDays },
            agent_id: "check-evidence-freshness",
          });
        }
      }

      // Upsert evidence checks
      for (const check of evidenceChecks) {
        const { error: upsertErr } = await supabase
          .from("evidence_checks")
          .upsert(check, { onConflict: "asset_id,check_type,control_key" });
        if (!upsertErr) checksUpserted++;
      }

      // Build penalties summary for asset metadata
      const penalties: Record<string, string> = {};
      for (const check of evidenceChecks) {
        if (check.status === "expired" || check.status === "stale") {
          penalties[check.control_key] = check.status;
        }
      }

      if (Object.keys(penalties).length > 0) {
        const meta = (asset.metadata as Record<string, unknown>) || {};
        const { error: updateErr } = await supabase
          .from("assets")
          .update({
            metadata: {
              ...meta,
              evidence_penalties: penalties,
              evidence_last_checked: now.toISOString(),
            },
          })
          .eq("id", asset.id);
        if (!updateErr) penaltiesApplied++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Evidence freshness check completed",
        assets_checked: (assets || []).length,
        checks_upserted: checksUpserted,
        penalties_applied: penaltiesApplied,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking evidence freshness:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
