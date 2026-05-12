import { supabase } from "@/integrations/supabase/client";

const FRAMDRIFT_PROFILE = {
  name: "Framdrift Innovasjon AS",
  org_number: "936431127",
  industry: "Rådgivning",
  brreg_industry: "Bedriftsrådgivning og annen administrativ rådgivning",
  domain: "framdrift.no",
  employees: "1-10",
  brreg_employees: 5,
  compliance_officer: "Marte Solberg",
  compliance_officer_email: "marte@framdrift.no",
  dpo_name: "Marte Solberg",
  dpo_email: "marte@framdrift.no",
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
  name: "Framdrift Innovasjon AS",
  description: "Bedriftsrådgivning og innovasjonspartner med kontor i Bergen. Spesialiserer seg på strategisk rådgivning, bærekraft og digital transformasjon for SMB-markedet.",
  compliance_score: 62,
  publish_mode: "public",
  lifecycle_status: "active",
  criticality: "high",
  risk_level: "medium",
  country: "Norge",
  region: "Vestland",
  org_number: "936431127",
  contact_person: "Marte Solberg",
  contact_email: "marte@framdrift.no",
  url: "https://framdrift.no",
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
      .update(FRAMDRIFT_PROFILE)
      .eq("id", existing[0].id);
    if (error) throw new Error("Kunne ikke oppdatere bedriftsprofil: " + error.message);
  } else {
    const { error } = await supabase
      .from("company_profile")
      .insert(FRAMDRIFT_PROFILE);
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

export interface ActivationDocument {
  slot: string;
  title: string;
  status: "found" | "uploaded" | "skipped";
  fileName?: string;
}

export interface ActivationValues {
  name: string;
  orgNumber: string;
  country: string;
  region?: string;
  industry?: string;
  employees?: string;
  description: string;
  url?: string;
  contactPerson?: string;
  contactEmail?: string;
  dpoName?: string;
  dpoEmail?: string;
  securityEmail?: string;
  maturityAnswers?: Record<string, "yes" | "no" | "later">;
  documents?: ActivationDocument[];
  publishNow: boolean;
}

export async function seedFromActivation(values: ActivationValues) {
  const profile = {
    name: values.name,
    org_number: values.orgNumber,
    industry: values.industry || "Annet",
    domain: values.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") || null,
    employees: values.employees || null,
    compliance_officer: values.contactPerson || null,
    compliance_officer_email: values.contactEmail || null,
    dpo_name: values.dpoName || null,
    dpo_email: values.dpoEmail || null,
    geographic_scope: values.country || "Norge",
    governance_level: "medium",
    sensitive_data: "limited",
    maturity: "developing",
    use_cases: ["gdpr"],
    active_roles: values.dpoName ? ["compliance_officer", "dpo"] : ["compliance_officer"],
    is_msp_partner: false,
  };

  const selfAsset = {
    asset_type: "self" as const,
    name: values.name,
    description: values.description,
    compliance_score: 55,
    publish_mode: values.publishNow ? "public" : "private",
    lifecycle_status: "active",
    criticality: "high",
    risk_level: "medium",
    country: values.country || "Norge",
    region: values.region || null,
    org_number: values.orgNumber,
    contact_person: values.contactPerson || null,
    contact_email: values.contactEmail || null,
    url: values.url || null,
  };

  const { data: existing } = await supabase.from("company_profile").select("id").limit(1);
  if (existing && existing.length > 0) {
    const { error } = await supabase.from("company_profile").update(profile).eq("id", existing[0].id);
    if (error) throw new Error("Kunne ikke oppdatere bedriftsprofil: " + error.message);
  } else {
    const { error } = await supabase.from("company_profile").insert(profile);
    if (error) throw new Error("Kunne ikke opprette bedriftsprofil: " + error.message);
  }

  const { data: selfAssets } = await supabase.from("assets").select("id").eq("asset_type", "self").limit(1);
  let selfAssetId: string;
  if (selfAssets && selfAssets.length > 0) {
    selfAssetId = selfAssets[0].id;
    const { error } = await supabase.from("assets").update(selfAsset).eq("id", selfAssetId);
    if (error) throw new Error("Kunne ikke oppdatere self-asset: " + error.message);
  } else {
    const { data, error } = await supabase.from("assets").insert(selfAsset).select("id").single();
    if (error) throw new Error("Kunne ikke opprette self-asset: " + error.message);
    selfAssetId = data.id;
  }

  await supabase.from("evidence_checks").delete().eq("asset_id", selfAssetId);
  const checksToInsert = EVIDENCE_CHECKS.map((c) => ({
    ...c,
    asset_id: selfAssetId,
    last_verified_at: c.status === "missing" ? null : new Date(Date.now() - c.staleness_days * 86400000).toISOString(),
    details: c.details as any,
  }));
  await supabase.from("evidence_checks").insert(checksToInsert as any);

  return { selfAssetId };
}

export async function deleteDemoTrustProfile() {
  // Reset company profile to empty
  const { data: existing } = await supabase.from("company_profile").select("id").limit(1);
  if (existing && existing.length > 0) {
    await supabase
      .from("company_profile")
      .update({ name: "Min bedrift", org_number: null, domain: null, industry: "Teknologi", employees: null, brreg_industry: null, brreg_employees: null, compliance_officer: null, compliance_officer_email: null, dpo_name: null, dpo_email: null, maturity: null })
      .eq("id", existing[0].id);
  }

  // Reset self-asset
  const { data: selfAssets } = await supabase.from("assets").select("id").eq("asset_type", "self").limit(1);
  if (selfAssets && selfAssets.length > 0) {
    await supabase.from("evidence_checks").delete().eq("asset_id", selfAssets[0].id);
    await supabase
      .from("assets")
      .update({ name: "Min bedrift", description: null, compliance_score: 0, publish_mode: "private", country: null, region: null, org_number: null, contact_person: null, contact_email: null, url: null })
      .eq("id", selfAssets[0].id);
  }
}
