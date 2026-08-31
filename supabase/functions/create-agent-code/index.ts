import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "unauthorized" }, 401);

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await anon.auth.getUser();
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" && body.name.trim()
      ? body.name.trim().slice(0, 60)
      : "Min agent";

    // Generer en lesbar, tilfeldig kode: mynder_<32 hex>
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const token = `mynder_${secret}`;
    const tokenHash = await sha256(token);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await admin
      .from("agent_access_tokens")
      .insert({
        user_id: userData.user.id,
        name,
        token_prefix: token.slice(0, 14),
        token_hash: tokenHash,
      })
      .select("id, name, token_prefix, created_at")
      .single();

    if (error) {
      console.error("insert error", error);
      return json({ error: "server_error" }, 500);
    }

    // Klarteksten returneres kun her – den lagres aldri.
    return json({ ok: true, token, record: data });
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
