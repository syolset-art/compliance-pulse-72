import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Hvilke tabeller som inngår i eksporten per modul.
const MODULE_TABLES: Record<string, string[]> = {
  core: [
    "systems",
    "system_incidents",
    "system_processes",
    "system_compliance",
    "tasks",
    "uploaded_documents",
  ],
  frameworks: ["selected_frameworks", "framework_documents", "requirement_status"],
  vendors: ["vendor_documents", "vendor_deliveries", "vendor_gap_analyses"],
  assets: ["assets", "asset_data_categories", "work_area_documents"],
  partner: ["msp_customers", "msp_licenses", "msp_invoices"],
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  return [
    cols.join(","),
    ...rows.map((r) => cols.map((c) => esc(r[c])).join(",")),
  ].join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Ikke autentisert" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Ugyldig sesjon" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const moduleId = String(body.moduleId ?? "");
    const format = body.format === "csv" ? "csv" : "json";
    const tables = MODULE_TABLES[moduleId];
    if (!tables) {
      return new Response(JSON.stringify({ error: "Ukjent modul" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: Record<string, unknown> = {
      module: moduleId,
      exportedAt: new Date().toISOString(),
      format: "Mynder dataeksport (maskinlesbar)",
      data: {},
    };
    const csvParts: string[] = [];

    for (const table of tables) {
      // deno-lint-ignore no-explicit-any
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .limit(5000);
      if (error) {
        console.error(`export-module-data: ${table}`, error.message);
        continue;
      }
      (payload.data as Record<string, unknown>)[table] = data ?? [];
      if (format === "csv" && data?.length) {
        csvParts.push(`# ${table}\n${toCsv(data)}\n`);
      }
    }

    const contents = format === "csv"
      ? csvParts.join("\n")
      : JSON.stringify(payload, null, 2);
    const ext = format === "csv" ? "csv" : "json";
    const path =
      `${userData.user.id}/exports/${moduleId}-${Date.now()}.${ext}`;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { error: uploadErr } = await admin.storage
      .from("documents")
      .upload(path, new Blob([contents]), {
        contentType: format === "csv" ? "text/csv" : "application/json",
        upsert: true,
      });
    if (uploadErr) throw uploadErr;

    const { data: signed, error: signErr } = await admin.storage
      .from("documents")
      .createSignedUrl(path, 60 * 60 * 24 * 7);
    if (signErr) throw signErr;

    return new Response(
      JSON.stringify({
        url: signed?.signedUrl,
        path,
        expiresInDays: 7,
        tables,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("export-module-data error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
