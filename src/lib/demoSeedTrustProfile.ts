import { supabase } from "@/integrations/supabase/client";

const HULTIT_PROFILE = {
  name: "HULT-IT AS",
  org_number: "920862981",
  industry: "IT-tjenester",
  brreg_industry: "Konsulentvirksomhet tilknyttet informasjonsteknologi",
  domain: "hult-it.no",
  employees: "1-10",
  brreg_employees: 8,
  compliance_officer: "Thomas Hult",
  compliance_officer_email: "thomas@hult-it.no",
  dpo_name: "Thomas Hult",
  dpo_email: "thomas@hult-it.no",
  geographic_scope: "Norge",
  governance_level: "medium",
  sensitive_data: "limited",
  maturity: "developing",
  use_cases: ["gdpr", "iso27001"],
  active_roles: ["compliance_officer", "dpo"],
  is_msp_partner: false,
};

const SELF_ASSET = {
  asset_type: "self",
  name: "HULT-IT AS",
  description: "Norsk IT-partner med fokus på drift, sikkerhet og compliance for små og mellomstore bedrifter. Tilbyr helhetlige managed services med kontor i Haugesund.",
  compliance_score: 62,
  publish_mode: "public",
  lifecycle_status: "active",
  criticality: "high",
  risk_level: "medium",
  country: "Norge",
  region: "Rogaland",
  org_number: "920862981",
  contact_person: "Thomas Hult",
  contact_email: "thomas@hult-it.no",
  url: "https://hult-it.no",
};

const EVIDENCE_CHECKS = [
  { control_key: "gov.policy", check_type: "document", status: "fresh", staleness_days: 5, details: { title: "Informasjonssikkerhetspolicy", verified: true } },
  { control_key: "gov.roles", check_type: "self_assessment", status: "fresh", staleness_days: 2, details: { title: "Roller og ansvar definert", verified: true } },
  { control_key: "gov.risk_assessment", check_type: "self_assessment", status: "stale", staleness_days: 95, details: { title: "Risikovurdering", note: "Bør oppdateres" } },
  { control_key: "sec.access_control", check_type: "integration", status: "fresh", staleness_days: 1, details: { title: "Tilgangskontroll", provider: "Microsoft 365" } },
  { control_key: "sec.encryption", check_type: "self_assessment", status: "fresh", staleness_days: 10, details: { title: "Kryptering i transit og hvile" } },
  { control_key: "sec.incident_response", check_type: "document", status: "missing", staleness_days: 0, details: { title: "Hendelseshåndteringsplan", note: "Mangler dokument" } },
  { control_key: "priv.dpa", check_type: "document", status: "fresh", staleness_days: 15, details: { title: "Databehandleravtaler", count: 4 } },
  { control_key: "priv.privacy_policy", check_type: "document", status: "fresh", staleness_days: 30, details: { title: "Personvernerklæring publisert" } },
  { control_key: "priv.data_inventory", check_type: "self_assessment", status: "stale", staleness_days: 120, details: { title: "Behandlingsprotokoll", note: "Ikke oppdatert siden januar" } },
  { control_key: "tp.vendor_assessment", check_type: "self_assessment", status: "missing", staleness_days: 0, details: { title: "Leverandørvurderinger", note: "Ikke startet" } },
];

export async function seedDemoTrustProfile() {
  // 1. Upsert company profile
  const { data: existing } = await supabase.from("company_profile").select("id").limit(1);
  
  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("company_profile")
      .update(HULTIT_PROFILE)
      .eq("id", existing[0].id);
    if (error) throw new Error("Kunne ikke oppdatere bedriftsprofil: " + error.message);
  } else {
    const { error } = await supabase
      .from("company_profile")
      .insert(HULTIT_PROFILE);
    if (error) throw new Error("Kunne ikke opprette bedriftsprofil: " + error.message);
  }

  // 2. Upsert self-asset
  const { data: selfAssets } = await supabase
    .from("assets")
    .select("id")
    .eq("asset_type", "self")
    .limit(1);

  let selfAssetId: string;

  if (selfAssets && selfAssets.length > 0) {
    selfAssetId = selfAssets[0].id;
    const { error } = await supabase
      .from("assets")
      .update(SELF_ASSET)
      .eq("id", selfAssetId);
    if (error) throw new Error("Kunne ikke oppdatere self-asset: " + error.message);
  } else {
    const { data, error } = await supabase
      .from("assets")
      .insert(SELF_ASSET)
      .select("id")
      .single();
    if (error) throw new Error("Kunne ikke opprette self-asset: " + error.message);
    selfAssetId = data.id;
  }

  // 3. Delete old evidence checks for this asset, then insert fresh ones
  await supabase.from("evidence_checks").delete().eq("asset_id", selfAssetId);

  const checksToInsert = EVIDENCE_CHECKS.map((c) => ({
    ...c,
    asset_id: selfAssetId,
    last_verified_at: c.status === "missing"
      ? null
      : new Date(Date.now() - c.staleness_days * 86400000).toISOString(),
    details: c.details as any,
  }));

  const { error: checksErr } = await supabase
    .from("evidence_checks")
    .insert(checksToInsert as any);
  if (checksErr) console.error("Evidence checks seed error:", checksErr);

  return { selfAssetId };
}

export async function deleteDemoTrustProfile() {
  // Reset company profile to empty
  const { data: existing } = await supabase.from("company_profile").select("id").limit(1);
  if (existing && existing.length > 0) {
    await supabase
      .from("company_profile")
      .update({ name: "HULT-IT AS", org_number: null, domain: null, industry: "IT-tjenester", employees: null, brreg_industry: null, brreg_employees: null, compliance_officer: null, compliance_officer_email: null, dpo_name: null, dpo_email: null, maturity: null })
      .eq("id", existing[0].id);
  }

  // Reset self-asset
  const { data: selfAssets } = await supabase.from("assets").select("id").eq("asset_type", "self").limit(1);
  if (selfAssets && selfAssets.length > 0) {
    await supabase.from("evidence_checks").delete().eq("asset_id", selfAssets[0].id);
    await supabase
      .from("assets")
      .update({ name: "HULT-IT AS", description: null, compliance_score: 0, publish_mode: "private", country: null, region: null, org_number: null, contact_person: null, contact_email: null, url: null })
      .eq("id", selfAssets[0].id);
  }
}
