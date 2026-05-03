// Lara discovers trust sources for an asset by inferring likely
// public-facing pages (privacy policy, security, trust center, transparency
// report) and mapping them to control areas. If LOVABLE_API_KEY isn't
// available, falls back to a static template so the UI still has data.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CONTROL_AREAS = [
  "governance",
  "risk_compliance",
  "security_posture",
  "privacy_data",
  "supplier_governance",
];

interface DiscoveredSource {
  control_area: string;
  title: string;
  url?: string;
  snippet?: string;
}

function templateSources(domain: string | null, name: string): DiscoveredSource[] {
  const base = domain ? `https://${domain}` : "";
  const u = (p: string) => (base ? `${base}${p}` : "");
  return [
    { control_area: "governance",          title: `Trust / Security Center — ${name}`, url: u("/trust"),         snippet: "Vendor's public trust center page." },
    { control_area: "privacy_data",        title: "Privacy Policy",                     url: u("/privacy"),       snippet: "Public privacy policy describing data handling." },
    { control_area: "privacy_data",        title: "DPA reference",                      url: u("/legal/dpa"),     snippet: "Data Processing Agreement reference." },
    { control_area: "security_posture",    title: "Security overview",                  url: u("/security"),      snippet: "Security practices and certifications." },
    { control_area: "risk_compliance",     title: "Compliance / Certifications",        url: u("/compliance"),    snippet: "ISO 27001, SOC 2 and similar references." },
    { control_area: "supplier_governance", title: "Sub-processors",                     url: u("/subprocessors"), snippet: "List of sub-processors and third parties." },
  ];
}

async function llmSources(name: string, domain: string | null): Promise<DiscoveredSource[] | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return null;
  const prompt = `You are mapping publicly available trust/compliance information for the vendor "${name}"${domain ? ` (${domain})` : ""}.
Return a JSON object: { "sources": [{ "control_area": one of [${CONTROL_AREAS.join(", ")}], "title": string, "url": string|null, "snippet": short reason (max 140 chars) }] }
Include 4-8 plausible public pages (privacy policy, security/trust center, sub-processors, transparency report, certifications, ToS). Use realistic URLs based on the domain when known. Do not invent URLs for unknown domains — use null instead.`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const txt = data?.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(txt);
    const list: DiscoveredSource[] = (parsed.sources || []).filter(
      (s: any) => s && s.title && CONTROL_AREAS.includes(s.control_area)
    );
    return list.length ? list : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { assetId } = await req.json();
    if (!assetId) {
      return new Response(JSON.stringify({ error: "assetId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: asset } = await supabase
      .from("assets").select("id, name, vendor, metadata").eq("id", assetId).maybeSingle();

    const name = (asset?.name || asset?.vendor || "vendor") as string;
    const meta = (asset?.metadata as Record<string, any>) || {};
    let domain: string | null = meta.website || meta.domain || null;
    if (domain) domain = String(domain).replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const sources = (await llmSources(name, domain)) ?? templateSources(domain, name);

    let inserted = 0;
    for (const s of sources) {
      const { error } = await supabase.from("trust_profile_sources").upsert(
        {
          asset_id: assetId,
          control_area: s.control_area,
          title: s.title,
          url: s.url || null,
          snippet: s.snippet || null,
          source_type: "webpage",
          status: "suggested",
          discovered_by: "lara",
        },
        { onConflict: "asset_id,control_area,url", ignoreDuplicates: true }
      );
      if (!error) inserted += 1;
    }

    return new Response(JSON.stringify({ ok: true, count: sources.length, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
