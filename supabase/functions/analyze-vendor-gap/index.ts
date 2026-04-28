// Edge function: analyze-vendor-gap
// Runs a gap analysis of a vendor (asset) against a chosen framework
// Combines structured signals from assets/metadata + AI-doc-analysis (Lovable AI)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Status = "implemented" | "partial" | "missing" | "not_relevant";

interface ResultItem {
  requirement_id: string;
  name: string;
  domain: string;
  status: Status;
  weight: number;
  evidence: string[];
  rationale: string;
  next_action: string;
  signal_key: string;
}

const DOMAIN_BY_PREFIX: Record<string, string> = {
  "normen-5": "governance",
  "normen-6": "operations",
  "normen-7": "privacy",
  "normen-8": "privacy",
  "nis2-21-a": "governance",
  "nis2-21-b": "operations",
  "nis2-21-c": "operations",
  "nis2-21-d": "third_party",
  "nis2-21-e": "operations",
  "nis2-21-f": "governance",
  "nis2-21-g": "third_party",
  "nis2-21-h": "operations",
  "iso27001-a5": "governance",
  "iso27001-a8": "operations",
  "iso27001-a15": "third_party",
  "iso27001-a16": "operations",
  "iso27001-a18": "governance",
  "gdpr-art-28": "third_party",
  "gdpr-art-30": "governance",
  "gdpr-art-32": "operations",
  "gdpr-art-33": "operations",
  "gdpr-art-44": "privacy",
  "gdpr-art-28-4": "third_party",
  "gdpr-art-13": "privacy",
  "gdpr-art-20": "privacy",
};

function deriveDomain(reqId: string): string {
  for (const key of Object.keys(DOMAIN_BY_PREFIX)) {
    if (reqId.startsWith(key)) return DOMAIN_BY_PREFIX[key];
  }
  return "operations";
}

// Structured-signal evaluation (mirrors useTrustControlEvaluation rules for vendor)
function evaluateSignal(
  signalKey: string,
  asset: any,
  meta: Record<string, any>,
  docs: any[],
): { status: Status; evidence: string[]; rationale: string } {
  const evidence: string[] = [];
  const docNames = docs.map((d) => d.file_name || d.title).filter(Boolean);

  switch (signalKey) {
    case "dpa_verified": {
      if (meta.dpa_verified) {
        return { status: "implemented", evidence: ["metadata.dpa_verified"], rationale: "DPA er bekreftet i leverandørens metadata." };
      }
      const dpaDoc = docs.find((d) => /dpa|databehandler/i.test(d.file_name || d.title || ""));
      if (dpaDoc) return { status: "partial", evidence: [dpaDoc.file_name], rationale: "DPA-dokument funnet, men ikke verifisert." };
      return { status: "missing", evidence: [], rationale: "Ingen databehandleravtale registrert." };
    }
    case "security_contact": {
      if (asset.contact_email) return { status: "implemented", evidence: ["contact_email"], rationale: "Sikkerhetskontakt er registrert." };
      if (asset.contact_person) return { status: "partial", evidence: ["contact_person"], rationale: "Kontaktperson finnes, men ikke e-post." };
      return { status: "missing", evidence: [], rationale: "Mangler dedikert sikkerhetskontakt." };
    }
    case "sub_processors_disclosed":
      return meta.sub_processors_disclosed
        ? { status: "implemented", evidence: ["metadata"], rationale: "Underleverandører er opplistet." }
        : { status: "missing", evidence: [], rationale: "Ingen oversikt over underleverandører." };
    case "vendor_security_review":
      if (meta.vendor_security_review) return { status: "implemented", evidence: ["metadata"], rationale: "Sikkerhetsgjennomgang er utført." };
      if (docs.some((d) => /iso\s*27001|soc\s*2|pentest/i.test(d.file_name || ""))) {
        return { status: "partial", evidence: docNames.slice(0, 2), rationale: "Tredjepartsattest funnet (ISO/SOC/pentest)." };
      }
      return { status: "missing", evidence: [], rationale: "Mangler sikkerhetsgjennomgang." };
    case "vendor_privacy_policy":
      if (meta.vendor_privacy_policy || meta.privacy_policy_url) {
        return { status: "implemented", evidence: ["metadata"], rationale: "Personvernerklæring er registrert." };
      }
      return { status: "missing", evidence: [], rationale: "Personvernerklæring mangler." };
    case "vendor_data_location":
      if (meta.vendor_data_location) return { status: "implemented", evidence: ["metadata"], rationale: "Datalokasjon dokumentert." };
      if (meta.data_locations) return { status: "partial", evidence: ["metadata"], rationale: "Datalokasjon delvis angitt." };
      return { status: "missing", evidence: [], rationale: "Datalokasjon ikke spesifisert." };
    case "vendor_data_retention":
      return meta.vendor_data_retention
        ? { status: "implemented", evidence: ["metadata"], rationale: "Sletterutiner er definert." }
        : { status: "missing", evidence: [], rationale: "Sletterutiner mangler." };
    case "vendor_data_portability":
      return meta.vendor_data_portability
        ? { status: "implemented", evidence: ["metadata"], rationale: "Dataportabilitet støttes." }
        : { status: "missing", evidence: [], rationale: "Dataportabilitet ikke bekreftet." };
    case "vendor_gdpr_compliant":
      if (meta.vendor_gdpr_compliant) return { status: "implemented", evidence: ["metadata"], rationale: "GDPR-etterlevelse bekreftet." };
      if (meta.gdpr_status === "partial") return { status: "partial", evidence: ["metadata"], rationale: "GDPR delvis etterlevd." };
      return { status: "missing", evidence: [], rationale: "GDPR-status ikke bekreftet." };
    case "vendor_risk_assessment":
      if (meta.vendor_risk_assessment) return { status: "implemented", evidence: ["metadata"], rationale: "Risikovurdering utført." };
      if (asset.risk_level) return { status: "partial", evidence: ["risk_level"], rationale: "Risikonivå satt, men ikke fullstendig vurdering." };
      return { status: "missing", evidence: [], rationale: "Mangler risikovurdering." };
    case "vendor_followup":
      return meta.vendor_followup
        ? { status: "implemented", evidence: ["metadata"], rationale: "Oppfølging dokumentert." }
        : { status: "missing", evidence: [], rationale: "Mangler dokumentert oppfølging." };
    default:
      return { status: "missing", evidence: [], rationale: "Signal ikke evaluert." };
  }
}

function nextActionFor(signalKey: string, status: Status, vendorName: string): string {
  if (status === "implemented") return "Verifiser at dokumentasjonen er oppdatert (≤ 12 mnd).";
  const map: Record<string, string> = {
    dpa_verified: `Be ${vendorName} sende signert databehandleravtale (DPA).`,
    security_contact: `Be ${vendorName} oppgi e-post til sikkerhetsansvarlig.`,
    sub_processors_disclosed: `Be ${vendorName} sende oppdatert liste over underleverandører.`,
    vendor_security_review: `Be om ISO 27001-sertifikat eller SOC 2-rapport.`,
    vendor_privacy_policy: `Be ${vendorName} dele lenke til gjeldende personvernerklæring.`,
    vendor_data_location: `Be ${vendorName} bekrefte datalokasjon (EU/EØS).`,
    vendor_data_retention: `Be om dokumentasjon på sletterutiner og oppbevaringstid.`,
    vendor_data_portability: `Be ${vendorName} bekrefte støtte for dataportabilitet.`,
    vendor_gdpr_compliant: `Be ${vendorName} bekrefte GDPR-etterlevelse skriftlig.`,
    vendor_risk_assessment: `Gjennomfør oppdatert risikovurdering for ${vendorName}.`,
    vendor_followup: `Planlegg neste oppfølgingsmøte og dokumenter resultater.`,
  };
  return map[signalKey] ?? `Følg opp ${vendorName} på dette kravet.`;
}

const FRAMEWORK_NAMES: Record<string, string> = {
  normen: "Normen (helsesektoren)",
  nis2: "NIS2-direktivet",
  iso27001: "ISO 27001",
  gdpr: "GDPR",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { asset_id, framework_id } = body || {};
    if (!asset_id || !framework_id) {
      return new Response(JSON.stringify({ error: "asset_id and framework_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch asset
    const { data: asset, error: assetErr } = await supabase
      .from("assets").select("*").eq("id", asset_id).maybeSingle();
    if (assetErr || !asset) {
      return new Response(JSON.stringify({ error: "Asset not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch documents
    const { data: docs = [] } = await supabase
      .from("vendor_documents").select("*").eq("asset_id", asset_id);

    // Fetch mappings + requirement metadata
    const { data: mappings = [] } = await supabase
      .from("framework_control_mappings").select("*").eq("framework_id", framework_id);

    if (!mappings || mappings.length === 0) {
      return new Response(JSON.stringify({
        error: "Ingen mappings for dette rammeverket ennå.",
        framework_id,
      }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Try to enrich with names from compliance_requirements
    const reqIds = [...new Set(mappings.map((m: any) => m.requirement_id))];
    const { data: reqRows = [] } = await supabase
      .from("compliance_requirements").select("requirement_id, name, name_no, domain")
      .eq("framework_id", framework_id).in("requirement_id", reqIds);
    const reqMap = new Map<string, any>();
    (reqRows || []).forEach((r: any) => reqMap.set(r.requirement_id, r));

    const meta = (asset.metadata as Record<string, any>) || {};
    const vendorName = asset.name || asset.vendor || "leverandøren";

    // Group mappings by requirement_id (multiple signals per requirement => take best)
    const byReq = new Map<string, any[]>();
    mappings.forEach((m: any) => {
      const arr = byReq.get(m.requirement_id) || [];
      arr.push(m);
      byReq.set(m.requirement_id, arr);
    });

    const results: ResultItem[] = [];
    let implCount = 0, partCount = 0, missCount = 0;
    let scoreNum = 0, scoreDen = 0;

    for (const [reqId, sigs] of byReq.entries()) {
      // Evaluate every signal, pick the best status (implemented > partial > missing)
      let best: { status: Status; evidence: string[]; rationale: string; signal_key: string } | null = null;
      const rank = (s: Status) => s === "implemented" ? 3 : s === "partial" ? 2 : s === "missing" ? 1 : 0;
      for (const sig of sigs) {
        const e = evaluateSignal(sig.signal_key, asset, meta, docs || []);
        if (!best || rank(e.status) > rank(best.status)) {
          best = { ...e, signal_key: sig.signal_key };
        }
      }
      const sig0 = sigs[0];
      const reqInfo = reqMap.get(reqId);
      const name = reqInfo?.name_no || reqInfo?.name || sig0.question || reqId;
      const domain = reqInfo?.domain || deriveDomain(reqId);
      const weight = sig0.weight || 1;

      const status = best!.status;
      if (status === "implemented") { implCount++; scoreNum += weight * 1; }
      else if (status === "partial") { partCount++; scoreNum += weight * 0.5; }
      else { missCount++; }
      scoreDen += weight;

      results.push({
        requirement_id: reqId,
        name,
        domain,
        status,
        weight,
        evidence: best!.evidence,
        rationale: best!.rationale,
        next_action: nextActionFor(best!.signal_key, status, vendorName),
        signal_key: best!.signal_key,
      });
    }

    const score = scoreDen > 0 ? Math.round((scoreNum / scoreDen) * 100) : 0;

    // Aggregate per domain
    const summary: Record<string, { total: number; implemented: number; partial: number; missing: number; score: number }> = {};
    results.forEach((r) => {
      const s = summary[r.domain] || { total: 0, implemented: 0, partial: 0, missing: 0, score: 0 };
      s.total++;
      if (r.status === "implemented") s.implemented++;
      else if (r.status === "partial") s.partial++;
      else s.missing++;
      summary[r.domain] = s;
    });
    Object.keys(summary).forEach((d) => {
      const s = summary[d];
      s.score = s.total > 0 ? Math.round(((s.implemented + s.partial * 0.5) / s.total) * 100) : 0;
    });

    // Persist
    const { data: saved, error: saveErr } = await supabase
      .from("vendor_gap_analyses").insert({
        asset_id,
        framework_id,
        framework_name: FRAMEWORK_NAMES[framework_id] || framework_id,
        score,
        implemented_count: implCount,
        partial_count: partCount,
        missing_count: missCount,
        not_relevant_count: 0,
        summary,
        results,
      }).select().maybeSingle();

    if (saveErr) console.error("save error", saveErr);

    return new Response(JSON.stringify({
      ok: true,
      analysis: saved || {
        asset_id, framework_id, score,
        implemented_count: implCount, partial_count: partCount, missing_count: missCount,
        summary, results,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-vendor-gap error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
