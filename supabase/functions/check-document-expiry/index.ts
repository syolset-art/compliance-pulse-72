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
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Find documents expiring within 30 days
    const { data: expiringDocs, error: docsError } = await supabase
      .from("vendor_documents")
      .select("id, asset_id, file_name, document_type, valid_to")
      .not("valid_to", "is", null)
      .gte("valid_to", now.toISOString())
      .lte("valid_to", in30Days.toISOString());

    if (docsError) throw docsError;
    if (!expiringDocs || expiringDocs.length === 0) {
      return new Response(JSON.stringify({ message: "No expiring documents found", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all users who have NOT disabled document_expiry notifications
    const { data: disabledPrefs } = await supabase
      .from("notification_preferences")
      .select("user_id")
      .eq("notification_type", "document_expiry")
      .eq("enabled", false);

    const disabledUserIds = new Set((disabledPrefs || []).map((p: any) => p.user_id));

    // Get all authenticated users (from auth.users via admin API)
    const { data: { users: allUsers } } = await supabase.auth.admin.listUsers();
    const activeUsers = (allUsers || []).filter((u: any) => !disabledUserIds.has(u.id));

    let notificationsCreated = 0;

    for (const doc of expiringDocs) {
      const validTo = new Date(doc.valid_to);
      const daysLeft = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let notificationType: string | null = null;
      if (daysLeft <= 7) {
        notificationType = "7_days";
      } else if (daysLeft <= 30) {
        notificationType = "30_days";
      }

      if (!notificationType) continue;

      for (const user of activeUsers) {
        // Check if notification already sent for this doc + type + user
        const { data: existing } = await supabase
          .from("document_expiry_notifications")
          .select("id")
          .eq("document_id", doc.id)
          .eq("user_id", user.id)
          .eq("notification_type", notificationType)
          .limit(1);

        if (existing && existing.length > 0) continue;

        const docTypeLabel = doc.document_type || "document";
        const message = daysLeft <= 7
          ? `Dokumentet "${doc.file_name}" (${docTypeLabel}) utløper om ${daysLeft} dager.`
          : `Dokumentet "${doc.file_name}" (${docTypeLabel}) utløper om ${daysLeft} dager. Planlegg fornyelse.`;

        const { error: insertError } = await supabase
          .from("document_expiry_notifications")
          .insert({
            document_id: doc.id,
            asset_id: doc.asset_id,
            user_id: user.id,
            notification_type: notificationType,
            sent_via: "app",
            message,
          });

        if (!insertError) notificationsCreated++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Document expiry check completed",
        expiring_documents: expiringDocs.length,
        notifications_created: notificationsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking document expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
