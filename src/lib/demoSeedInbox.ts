import { supabase } from "@/integrations/supabase/client";

const DOCUMENT_TEMPLATES = [
  { type: "dpa", subject: "Databehandleravtale", filePrefix: "DPA" },
  { type: "soc2", subject: "SOC 2 Type II-rapport", filePrefix: "SOC2_Report" },
  { type: "iso27001", subject: "ISO 27001-sertifikat", filePrefix: "ISO27001_Certificate" },
  { type: "pentest", subject: "Penetrasjonstestrapport", filePrefix: "Pentest_Report" },
  { type: "dpia", subject: "DPIA-vurdering", filePrefix: "DPIA_Assessment" },
  { type: "nda", subject: "Taushetserklæring (NDA)", filePrefix: "NDA" },
  { type: "sub-processor", subject: "Underdatabehandlerliste", filePrefix: "SubProcessor_List" },
  { type: "incident-response", subject: "Hendelseshåndteringsplan", filePrefix: "Incident_Response_Plan" },
  { type: "risk-assessment", subject: "Risikovurdering", filePrefix: "Risk_Assessment" },
  { type: "security-policy", subject: "Sikkerhetspolicy", filePrefix: "Security_Policy" },
  { type: "business-continuity", subject: "Beredskapsplan", filePrefix: "BCP_Plan" },
  { type: "gdpr-record", subject: "GDPR behandlingsprotokoll", filePrefix: "GDPR_Record" },
];

function randomDaysAgo(min: number, max: number): string {
  const daysAgo = Math.floor(Math.random() * (max - min + 1)) + min;
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function senderForVendor(vendorName: string) {
  const slug = vendorName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const firstNames = ["Erik", "Kari", "Johan", "Maria", "Anders", "Lisa", "Thomas", "Sarah"];
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  return {
    sender_name: `${first} – ${vendorName}`,
    sender_email: `compliance@${slug}.com`,
  };
}

export async function seedDemoInbox() {
  // Fetch all vendors
  const { data: vendors } = await supabase
    .from("assets")
    .select("id, name")
    .eq("asset_type", "vendor");

  if (!vendors || vendors.length === 0) return;

  const shuffledTemplates = [...DOCUMENT_TEMPLATES].sort(() => Math.random() - 0.5);
  const items: any[] = [];

  // Each vendor gets 1-3 random document types
  vendors.forEach((vendor) => {
    const docCount = 1 + Math.floor(Math.random() * 3); // 1-3 docs per vendor
    const vendorDocs = shuffledTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, docCount);

    vendorDocs.forEach((template) => {
      const { sender_name, sender_email } = senderForVendor(vendor.name);
      items.push({
        matched_asset_id: vendor.id,
        matched_document_type: template.type,
        subject: `${template.subject} – ${vendor.name}`,
        file_name: `${template.filePrefix}_${vendor.name.replace(/\s/g, "_")}.pdf`,
        sender_name,
        sender_email,
        confidence_score: +(0.85 + Math.random() * 0.13).toFixed(2),
        status: "new",
        received_at: randomDaysAgo(0, 14),
      });
    });
  });

  const { error } = await supabase.from("lara_inbox").insert(items);
  if (error) {
    console.error("Failed to seed demo inbox:", error);
  }
}
