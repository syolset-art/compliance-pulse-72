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

const SECURITY_SERVICE_QUOTES = [
  { type: "quote-mdr", subject: "Tilbud: Managed Detection & Response (MDR)", vendor: "7 Security" },
  { type: "quote-backup", subject: "Tilbud: Acronis Cyber Protect – Backup", vendor: "Hult IT AS" },
  { type: "quote-endpoint", subject: "Tilbud: Endepunktbeskyttelse – Advanced Security", vendor: "Hult IT AS" },
  { type: "quote-email", subject: "Tilbud: E-postsikkerhet – Advanced Email Security", vendor: "Atea Security" },
];

export async function seedDemoSecurityQuotes(selfAssetId: string) {
  const items = SECURITY_SERVICE_QUOTES.map((quote) => {
    const slug = quote.vendor.toLowerCase().replace(/[^a-z0-9]/g, "");
    return {
      matched_asset_id: selfAssetId,
      matched_document_type: quote.type,
      subject: `${quote.subject} – ${quote.vendor}`,
      file_name: `Tilbud_${quote.type.replace("quote-", "")}_${slug}.pdf`,
      sender_name: `Tilbudsavdeling – ${quote.vendor}`,
      sender_email: `tilbud@${slug}.no`,
      confidence_score: 0.98,
      status: "new",
      received_at: randomDaysAgo(0, 3),
    };
  });

  const { error } = await supabase.from("lara_inbox").insert(items);
  if (error) {
    console.error("Failed to seed security quotes:", error);
  }
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const EXPIRED_DOC_TEMPLATES = [
  { type: "dpa", name: "Databehandleravtale", prefix: "DPA" },
  { type: "soc2", name: "SOC 2 Type II", prefix: "SOC2" },
  { type: "iso27001", name: "ISO 27001-sertifikat", prefix: "ISO27001" },
  { type: "nda", name: "Taushetserklæring", prefix: "NDA" },
  { type: "pentest", name: "Penetrasjonstest", prefix: "Pentest" },
  { type: "risk-assessment", name: "Risikovurdering", prefix: "Risk_Assessment" },
];

export async function seedDemoDocuments() {
  const { data: vendors } = await supabase
    .from("assets")
    .select("id, name")
    .eq("asset_type", "vendor");

  if (!vendors || vendors.length === 0) return;

  // Delete old demo documents
  await supabase.from("vendor_documents").delete().like("file_path", "demo/%");

  const docs: any[] = [];
  const shuffled = [...EXPIRED_DOC_TEMPLATES];

  vendors.forEach((vendor, i) => {
    const slug = vendor.name.replace(/\s/g, "_");

    if (i % 3 !== 2) {
      // ~2/3 of vendors get expired documents
      const template = shuffled[i % shuffled.length];
      docs.push({
        asset_id: vendor.id,
        file_name: `${template.prefix}_${slug}.pdf`,
        file_path: `demo/${template.prefix}_${slug}.pdf`,
        document_type: template.type,
        valid_from: daysAgo(365),
        valid_to: daysAgo(10 + Math.floor(Math.random() * 90)),
        status: "current",
        source: "manual_upload",
      });
      // Some vendors get a second expired doc
      if (i % 4 === 0) {
        const t2 = shuffled[(i + 1) % shuffled.length];
        docs.push({
          asset_id: vendor.id,
          file_name: `${t2.prefix}_${slug}.pdf`,
          file_path: `demo/${t2.prefix}_${slug}.pdf`,
          document_type: t2.type,
          valid_from: daysAgo(400),
          valid_to: daysAgo(5 + Math.floor(Math.random() * 30)),
          status: "current",
          source: "manual_upload",
        });
      }
    } else {
      // ~1/3 get valid documents (for contrast)
      docs.push({
        asset_id: vendor.id,
        file_name: `DPA_${slug}.pdf`,
        file_path: `demo/DPA_${slug}.pdf`,
        document_type: "dpa",
        valid_from: daysAgo(180),
        valid_to: daysFromNow(180),
        status: "current",
        source: "manual_upload",
      });
    }
  });

  const { error } = await supabase.from("vendor_documents").insert(docs);
  if (error) {
    console.error("Failed to seed demo documents:", error);
  }
}
