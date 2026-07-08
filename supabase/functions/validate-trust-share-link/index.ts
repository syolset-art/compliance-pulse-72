import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string" || token.length < 16) {
      return json({ error: "invalid_token" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: link, error } = await supabase
      .from("trust_share_links")
      .select("id, asset_id, expires_at, password_hash, revoked_at, view_count")
      .eq("token", token)
      .maybeSingle();

    if (error) {
      console.error("lookup error", error);
      return json({ error: "server_error" }, 500);
    }
    if (!link) return json({ error: "not_found" }, 404);
    if (link.revoked_at) return json({ error: "revoked" }, 410);
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return json({ error: "expired" }, 410);
    }

    if (link.password_hash) {
      if (!password) return json({ error: "password_required" }, 401);
      const hash = await sha256(password);
      if (hash !== link.password_hash) {
        return json({ error: "invalid_password" }, 401);
      }
    }

    // Log the view (best-effort)
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const ipHash = ip ? await sha256(ip) : null;
    const ua = req.headers.get("user-agent") ?? "";

    await supabase.from("trust_share_link_views").insert({
      link_id: link.id,
      ip_hash: ipHash,
      user_agent: ua.slice(0, 512),
    });

    await supabase
      .from("trust_share_links")
      .update({
        view_count: (link.view_count ?? 0) + 1,
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", link.id);

    return json({ ok: true, asset_id: link.asset_id });
  } catch (e) {
    console.error(e);
    return json({ error: "server_error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
