import { supabase } from "@/integrations/supabase/client";

interface DemoVendor {
  name: string;
  org_number: string;
  country: string;
  region: string;
  vendor: string;
  vendor_category: string;
  category: string;
  gdpr_role: string;
  compliance_score: number;
  risk_score: number;
  risk_level: string;
  criticality: string;
  publish_mode: string;
  contact_person: string;
  contact_email: string;
  description: string;
  metadata: Record<string, unknown>;
  documents: DemoDocument[];
}

interface DemoDocument {
  document_type: string;
  display_name: string;
  file_name: string;
  file_path: string;
  category: string;
  status: string;
  valid_from: string;
  valid_to: string;
  source: string;
  linked_regulations: string[];
}

const today = new Date();
const fmt = (d: Date) => d.toISOString().split("T")[0];
const addYears = (y: number) => {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() + y);
  return fmt(d);
};
const subYears = (y: number) => {
  const d = new Date(today);
  d.setFullYear(d.getFullYear() - y);
  return fmt(d);
};
const subMonths = (m: number) => {
  const d = new Date(today);
  d.setMonth(d.getMonth() - m);
  return fmt(d);
};

const DEMO_VENDOR_PROFILES: DemoVendor[] = [
  {
    name: "Fløyen AS",
    org_number: "999888771",
    country: "NO",
    region: "norway",
    vendor: "Fløyen AS",
    vendor_category: "consulting",
    category: "Rådgivning",
    gdpr_role: "databehandler",
    compliance_score: 72,
    risk_score: 42,
    risk_level: "medium",
    criticality: "medium",
    publish_mode: "public",
    contact_person: "Drift & Compliance",
    contact_email: "compliance@floyen-demo.no",
    description: "Konsulentselskap som leverer rådgivning innen IT-sikkerhet og compliance for offentlige og private virksomheter i Vestland.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "floyen_dpa.pdf", file_path: "/demo/floyen_dpa.pdf", category: "privacy", status: "current", valid_from: subYears(1), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "floyen_iso27001.pdf", file_path: "/demo/floyen_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(6), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["ISO 27001"] },
    ],
  },
  {
    name: "YouWell AS",
    org_number: "999888772",
    country: "NO",
    region: "norway",
    vendor: "YouWell AS",
    vendor_category: "saas",
    category: "Helseteknologi",
    gdpr_role: "databehandler",
    compliance_score: 85,
    risk_score: 18,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "Personvern & Sikkerhet",
    contact_email: "privacy@youwell-demo.no",
    description: "Norsk helsetech-selskap som leverer digital pasientoppfølging og selvhjelpsverktøy for spesialisthelsetjenesten.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "SOC 2 Type II", "Norm for informasjonssikkerhet"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "youwell_dpa.pdf", file_path: "/demo/youwell_dpa.pdf", category: "privacy", status: "current", valid_from: subYears(1), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "youwell_iso27001.pdf", file_path: "/demo/youwell_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(3), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "soc2", display_name: "SOC 2 Type II-rapport", file_name: "youwell_soc2.pdf", file_path: "/demo/youwell_soc2.pdf", category: "audit", status: "current", valid_from: subMonths(2), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["SOC 2"] },
      { document_type: "other", display_name: "Norm-egenerklæring", file_name: "youwell_norm.pdf", file_path: "/demo/youwell_norm.pdf", category: "compliance", status: "current", valid_from: subMonths(4), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["Normen"] },
    ],
  },
  {
    name: "Vipps MobilePay AS",
    org_number: "918713867",
    country: "NO",
    region: "norway",
    vendor: "Vipps MobilePay AS",
    vendor_category: "saas",
    gdpr_role: "databehandler",
    compliance_score: 96,
    risk_score: 8,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "Compliance Team",
    contact_email: "compliance@vippsmobilepay-demo.no",
    description: "Norges ledende betalingsløsning med over 4 millioner brukere. Tilbyr mobilbetaling, faktura og netthandelsløsninger.",
    metadata: { is_demo_profile: true, certifications: ["PCI DSS", "ISO 27001", "SOC 2 Type II"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "vipps_dpa.pdf", file_path: "/demo/vipps_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(6), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "vipps_iso27001.pdf", file_path: "/demo/vipps_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(4), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "soc2", display_name: "SOC 2 Type II-rapport", file_name: "vipps_soc2.pdf", file_path: "/demo/vipps_soc2.pdf", category: "audit", status: "current", valid_from: subMonths(1), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["SOC 2"] },
      { document_type: "other", display_name: "PCI DSS-sertifikat", file_name: "vipps_pcidss.pdf", file_path: "/demo/vipps_pcidss.pdf", category: "certification", status: "current", valid_from: subMonths(3), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["PCI DSS"] },
    ],
  },
  {
    name: "Ulriken 643 AS",
    org_number: "999888774",
    country: "NO",
    region: "norway",
    vendor: "Ulriken 643 AS",
    vendor_category: "facilities",
    gdpr_role: "databehandler",
    compliance_score: 45,
    risk_score: 65,
    risk_level: "high",
    criticality: "low",
    publish_mode: "private",
    contact_person: "Daglig leder",
    contact_email: "post@ulriken643-demo.no",
    description: "Fasilitetsselskap som drifter kontorlokaler og fellesarealer. Begrenset digital modenhet og compliance-dokumentasjon.",
    metadata: { is_demo_profile: true, certifications: [] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale (utgått)", file_name: "ulriken_dpa.pdf", file_path: "/demo/ulriken_dpa.pdf", category: "privacy", status: "expired", valid_from: subYears(3), valid_to: subYears(1), source: "manual_upload", linked_regulations: ["GDPR"] },
    ],
  },
  {
    name: "BankID BankAxept AS",
    org_number: "919131857",
    country: "NO",
    region: "norway",
    vendor: "BankID BankAxept AS",
    vendor_category: "infrastructure",
    gdpr_role: "databehandler",
    compliance_score: 98,
    risk_score: 5,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "Security & Compliance",
    contact_email: "security@bankid-demo.no",
    description: "Nasjonal infrastruktur for digital identitet og betalingsløsninger. BankID brukes av over 4,5 millioner nordmenn.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "SOC 2 Type II", "PCI DSS", "eIDAS"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "bankid_dpa.pdf", file_path: "/demo/bankid_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(2), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "bankid_iso27001.pdf", file_path: "/demo/bankid_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(1), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "soc2", display_name: "SOC 2 Type II-rapport", file_name: "bankid_soc2.pdf", file_path: "/demo/bankid_soc2.pdf", category: "audit", status: "current", valid_from: subMonths(3), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["SOC 2"] },
      { document_type: "other", display_name: "PCI DSS-sertifikat", file_name: "bankid_pcidss.pdf", file_path: "/demo/bankid_pcidss.pdf", category: "certification", status: "current", valid_from: subMonths(5), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["PCI DSS"] },
      { document_type: "pentest", display_name: "Penetrasjonstest 2024", file_name: "bankid_pentest.pdf", file_path: "/demo/bankid_pentest.pdf", category: "security", status: "current", valid_from: subMonths(2), valid_to: addYears(1), source: "manual_upload", linked_regulations: [] },
    ],
  },
  {
    name: "Mynder AS",
    org_number: "929553669",
    country: "NO",
    region: "norway",
    vendor: "Mynder AS",
    vendor_category: "saas",
    gdpr_role: "databehandler",
    compliance_score: 91,
    risk_score: 12,
    risk_level: "low",
    criticality: "medium",
    publish_mode: "public",
    contact_person: "Compliance & Privacy",
    contact_email: "compliance@mynder-demo.no",
    description: "Compliance-plattform som hjelper virksomheter med å etterleve GDPR, ISO 27001, NIS2 og AI Act gjennom automatisert styring.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "SOC 2 Type II"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "mynder_dpa.pdf", file_path: "/demo/mynder_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(3), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "mynder_iso27001.pdf", file_path: "/demo/mynder_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(2), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "soc2", display_name: "SOC 2 Type II-rapport", file_name: "mynder_soc2.pdf", file_path: "/demo/mynder_soc2.pdf", category: "audit", status: "current", valid_from: subMonths(1), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["SOC 2"] },
    ],
  },
  {
    name: "DIPS AS",
    org_number: "979873454",
    country: "NO",
    region: "norway",
    vendor: "DIPS AS",
    vendor_category: "saas",
    gdpr_role: "databehandler",
    compliance_score: 88,
    risk_score: 15,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "Informasjonssikkerhet",
    contact_email: "security@dips-demo.no",
    description: "Norges ledende leverandør av elektroniske pasientjournalsystemer (EPJ) til sykehus og helseforetak.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "Norm for informasjonssikkerhet", "ISO 13485"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "dips_dpa.pdf", file_path: "/demo/dips_dpa.pdf", category: "privacy", status: "current", valid_from: subYears(1), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "dips_iso27001.pdf", file_path: "/demo/dips_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(5), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "other", display_name: "Norm-egenerklæring", file_name: "dips_norm.pdf", file_path: "/demo/dips_norm.pdf", category: "compliance", status: "current", valid_from: subMonths(4), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["Normen"] },
      { document_type: "pentest", display_name: "Penetrasjonstest 2024", file_name: "dips_pentest.pdf", file_path: "/demo/dips_pentest.pdf", category: "security", status: "current", valid_from: subMonths(3), valid_to: addYears(1), source: "manual_upload", linked_regulations: [] },
    ],
  },
  {
    name: "CheckWare AS",
    org_number: "999888778",
    country: "NO",
    region: "norway",
    vendor: "CheckWare AS",
    vendor_category: "saas",
    gdpr_role: "databehandler",
    compliance_score: 78,
    risk_score: 25,
    risk_level: "low",
    criticality: "medium",
    publish_mode: "public",
    contact_person: "IT-avdeling",
    contact_email: "it@checkware-demo.no",
    description: "Helsetech-selskap som leverer digitale verktøy for pasientrapporterte data (PROM/PREM) til kliniske studier og helsetjenester.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "checkware_dpa.pdf", file_path: "/demo/checkware_dpa.pdf", category: "privacy", status: "current", valid_from: subYears(1), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "checkware_iso27001.pdf", file_path: "/demo/checkware_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(8), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["ISO 27001"] },
    ],
  },
  {
    name: "Connect Vest AS",
    org_number: "999888779",
    country: "NO",
    region: "norway",
    vendor: "Connect Vest AS",
    vendor_category: "it_operations",
    gdpr_role: "databehandler",
    compliance_score: 62,
    risk_score: 48,
    risk_level: "medium",
    criticality: "medium",
    publish_mode: "private",
    contact_person: "Driftsleder",
    contact_email: "drift@connectvest-demo.no",
    description: "Regional IT-driftsleverandør som tilbyr managed services, nettverksdrift og brukerstøtte til SMB-markedet i Vestland.",
    metadata: { is_demo_profile: true, certifications: [] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "connectvest_dpa.pdf", file_path: "/demo/connectvest_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(10), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "other", display_name: "SLA-avtale", file_name: "connectvest_sla.pdf", file_path: "/demo/connectvest_sla.pdf", category: "contract", status: "current", valid_from: subYears(1), valid_to: addYears(1), source: "manual_upload", linked_regulations: [] },
    ],
  },
  {
    name: "Altinn (Digitaliseringsdirektoratet)",
    org_number: "991825827",
    country: "NO",
    region: "norway",
    vendor: "Digitaliseringsdirektoratet",
    vendor_category: "infrastructure",
    gdpr_role: "behandlingsansvarlig",
    compliance_score: 94,
    risk_score: 10,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "Sikkerhet & Personvern",
    contact_email: "sikkerhet@digdir-demo.no",
    description: "Nasjonal felleskomponent for digital dialog mellom innbyggere, næringsliv og offentlig sektor. Brukes av alle norske virksomheter.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "eIDAS", "Sikkerhetsloven"] },
    documents: [
      { document_type: "dpa", display_name: "Behandleravtale", file_name: "altinn_dpa.pdf", file_path: "/demo/altinn_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(4), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "altinn_iso27001.pdf", file_path: "/demo/altinn_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(2), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "other", display_name: "Sikkerhetsvurdering", file_name: "altinn_security.pdf", file_path: "/demo/altinn_security.pdf", category: "security", status: "current", valid_from: subMonths(6), valid_to: addYears(1), source: "manual_upload", linked_regulations: ["Sikkerhetsloven"] },
    ],
  },
  {
    name: "NAV (Arbeids- og velferdsdirektoratet)",
    org_number: "889640782",
    country: "NO",
    region: "norway",
    vendor: "Arbeids- og velferdsdirektoratet",
    vendor_category: "infrastructure",
    gdpr_role: "behandlingsansvarlig",
    compliance_score: 90,
    risk_score: 14,
    risk_level: "low",
    criticality: "high",
    publish_mode: "public",
    contact_person: "IT-sikkerhet",
    contact_email: "sikkerhet@nav-demo.no",
    description: "Norges arbeids- og velferdsforvaltning. Forvalter ytelser, arbeidsmarkedstiltak og store mengder persondata for hele befolkningen.",
    metadata: { is_demo_profile: true, certifications: ["ISO 27001", "Sikkerhetsloven"] },
    documents: [
      { document_type: "dpa", display_name: "Databehandleravtale", file_name: "nav_dpa.pdf", file_path: "/demo/nav_dpa.pdf", category: "privacy", status: "current", valid_from: subMonths(5), valid_to: addYears(2), source: "manual_upload", linked_regulations: ["GDPR"] },
      { document_type: "iso27001", display_name: "ISO 27001-sertifikat", file_name: "nav_iso27001.pdf", file_path: "/demo/nav_iso27001.pdf", category: "certification", status: "current", valid_from: subMonths(3), valid_to: addYears(3), source: "manual_upload", linked_regulations: ["ISO 27001"] },
      { document_type: "pentest", display_name: "Sikkerhetstest 2024", file_name: "nav_pentest.pdf", file_path: "/demo/nav_pentest.pdf", category: "security", status: "current", valid_from: subMonths(2), valid_to: addYears(1), source: "manual_upload", linked_regulations: [] },
    ],
  },
];

export async function seedDemoVendorProfiles(): Promise<number> {
  // Check if already seeded
  const { data: existing } = await supabase
    .from("assets")
    .select("id")
    .eq("metadata->>is_demo_profile", "true")
    .limit(1);

  if (existing && existing.length > 0) {
    throw new Error("Demo-leverandører er allerede lastet inn. Slett dem først.");
  }

  let count = 0;

  for (const vendor of DEMO_VENDOR_PROFILES) {
    const { documents, ...assetData } = vendor;

    const { data: inserted, error } = await supabase
      .from("assets")
      .insert({
        ...assetData,
        asset_type: "vendor",
        lifecycle_status: "active",
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error(`Failed to insert ${vendor.name}:`, error);
      continue;
    }

    if (documents.length > 0) {
      const docs = documents.map((doc) => ({
        asset_id: inserted.id,
        ...doc,
      }));

      const { error: docError } = await supabase
        .from("vendor_documents")
        .insert(docs as any);

      if (docError) {
        console.error(`Failed to insert docs for ${vendor.name}:`, docError);
      }
    }

    count++;
  }

  return count;
}

export async function deleteDemoVendorProfiles(): Promise<number> {
  const { data: demoAssets } = await supabase
    .from("assets")
    .select("id")
    .eq("metadata->>is_demo_profile", "true");

  if (!demoAssets || demoAssets.length === 0) return 0;

  const ids = demoAssets.map((a) => a.id);

  // Delete related data
  await supabase.from("vendor_documents").delete().in("asset_id", ids);
  await supabase.from("lara_inbox").delete().in("matched_asset_id", ids);
  await supabase.from("asset_relationships").delete().in("source_asset_id", ids);
  await supabase.from("asset_relationships").delete().in("target_asset_id", ids);

  // Delete assets
  const { error } = await supabase.from("assets").delete().in("id", ids);
  if (error) throw error;

  return ids.length;
}
