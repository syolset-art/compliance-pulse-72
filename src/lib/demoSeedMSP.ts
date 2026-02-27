import { supabase } from "@/integrations/supabase/client";
import { LICENSE_TIERS, getDiscountPercent } from "./mspLicenseUtils";

const DEMO_CUSTOMERS = [
  { customer_name: "Bergen Energi AS", industry: "Energi", employees: "51-200", compliance_score: 78, status: "active", subscription_plan: "Premium", org_number: "987654321", contact_person: "Erik Solheim", contact_email: "erik@bergenenergi.no" },
  { customer_name: "Fjordtech Solutions", industry: "Teknologi", employees: "11-50", compliance_score: 92, status: "active", subscription_plan: "Basis", org_number: "912345678", contact_person: "Kari Fjord", contact_email: "kari@fjordtech.no" },
  { customer_name: "Vest Helse Klinikk", industry: "Helse", employees: "11-50", compliance_score: 65, status: "active", subscription_plan: "Premium", org_number: "923456789", contact_person: "Maria Hansen", contact_email: "maria@vesthelse.no" },
  { customer_name: "Kystbygg Entreprenør", industry: "Bygg og anlegg", employees: "201-500", compliance_score: 45, status: "onboarding", subscription_plan: "Basis", org_number: "934567890", contact_person: "Anders Berg", contact_email: "anders@kystbygg.no" },
  { customer_name: "NordFinans Rådgivning", industry: "Finans", employees: "1-10", compliance_score: 88, status: "active", subscription_plan: "Premium", org_number: "945678901", contact_person: "Johan Nordahl", contact_email: "johan@nordfinans.no" },
  { customer_name: "Stavanger Logistikk", industry: "Transport", employees: "51-200", compliance_score: 52, status: "active", subscription_plan: "Basis", org_number: "956789012", contact_person: "Lisa Strand", contact_email: "lisa@stavangerlogistikk.no" },
  { customer_name: "Larvik Handel AS", industry: "Handel", employees: "11-50", compliance_score: 35, status: "inactive", subscription_plan: "Basis", org_number: "967890123", contact_person: "Thomas Larsen", contact_email: "thomas@larvikhandel.no" },
  { customer_name: "Digitale Løsninger Nord", industry: "Teknologi", employees: "51-200", compliance_score: 85, status: "active", subscription_plan: "Premium", org_number: "978901234", contact_person: "Sarah Nilsen", contact_email: "sarah@dlnord.no" },
  { customer_name: "Tromsø Utdanning", industry: "Utdanning", employees: "201-500", compliance_score: 71, status: "onboarding", subscription_plan: "Basis", org_number: "989012345", contact_person: "Ole Karlsen", contact_email: "ole@tromsoutdanning.no" },
];

export async function seedDemoMSP() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Ikke innlogget");

  // Check if demo data already exists
  const { data: existing } = await supabase
    .from("msp_customers" as any)
    .select("id")
    .eq("msp_user_id", user.id)
    .limit(1);
  if (existing && existing.length > 0) return;

  const basisTier = LICENSE_TIERS.find(t => t.id === "basis")!;
  const premiumTier = LICENSE_TIERS.find(t => t.id === "premium")!;

  // Purchase 1: 5 Basis licenses
  const qty1 = 5;
  const disc1 = getDiscountPercent(qty1);
  const total1 = qty1 * basisTier.priceOre * (1 - disc1 / 100);

  // Purchase 2: 3 Premium licenses
  const qty2 = 3;
  const disc2 = getDiscountPercent(qty2);
  const total2 = qty2 * premiumTier.priceOre * (1 - disc2 / 100);

  const { data: purchases, error: pErr } = await supabase
    .from("msp_license_purchases" as any)
    .insert([
      { msp_user_id: user.id, quantity: qty1, unit_price: basisTier.priceOre, discount_percent: disc1, total_amount: total1, status: "active" },
      { msp_user_id: user.id, quantity: qty2, unit_price: premiumTier.priceOre, discount_percent: disc2, total_amount: total2, status: "active" },
    ])
    .select("id");
  if (pErr) { console.error("Seed purchases failed:", pErr); return; }

  const p1Id = (purchases as any[])[0].id;
  const p2Id = (purchases as any[])[1].id;

  // Create 8 licenses (5 basis + 3 premium)
  const licenseRows: any[] = [];
  for (let i = 0; i < qty1; i++) licenseRows.push({ purchase_id: p1Id, msp_user_id: user.id, status: "available" });
  for (let i = 0; i < qty2; i++) licenseRows.push({ purchase_id: p2Id, msp_user_id: user.id, status: "available" });

  const { data: licenses, error: lErr } = await supabase
    .from("msp_licenses" as any)
    .insert(licenseRows)
    .select("id");
  if (lErr) { console.error("Seed licenses failed:", lErr); return; }

  const licIds = (licenses as any[]).map(l => l.id);

  // Insert 9 customers; assign a license to first 6
  const customerRows = DEMO_CUSTOMERS.map((c, i) => ({
    ...c,
    msp_user_id: user.id,
    onboarding_completed: c.status === "active",
    active_frameworks: c.subscription_plan === "Premium" ? ["ISO 27001", "GDPR"] : ["GDPR"],
  }));

  const { data: customers, error: cErr } = await supabase
    .from("msp_customers" as any)
    .insert(customerRows)
    .select("id");
  if (cErr) { console.error("Seed customers failed:", cErr); return; }

  const custIds = (customers as any[]).map(c => c.id);

  // Assign licenses to first 6 customers
  for (let i = 0; i < Math.min(6, licIds.length, custIds.length); i++) {
    await supabase
      .from("msp_licenses" as any)
      .update({ assigned_customer_id: custIds[i], status: "assigned" })
      .eq("id", licIds[i]);
  }

  // Create 2 invoices
  await supabase.from("msp_invoices" as any).insert([
    { msp_user_id: user.id, invoice_number: "DEMO-2025-001", description: `${qty1}x Basis-lisens (demo)`, amount: total1, status: "paid", paid_at: new Date().toISOString() },
    { msp_user_id: user.id, invoice_number: "DEMO-2025-002", description: `${qty2}x Premium-lisens (demo)`, amount: total2, status: "paid", paid_at: new Date().toISOString() },
  ]);
}

export async function deleteDemoMSP() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Delete in correct order: invoices, licenses, purchases, customers
  await supabase.from("msp_invoices" as any).delete().eq("msp_user_id", user.id);
  await supabase.from("msp_licenses" as any).delete().eq("msp_user_id", user.id);
  await supabase.from("msp_license_purchases" as any).delete().eq("msp_user_id", user.id);

  // Delete assessments for user's customers first
  const { data: custs } = await supabase.from("msp_customers" as any).select("id").eq("msp_user_id", user.id);
  if (custs && custs.length > 0) {
    const ids = (custs as any[]).map(c => c.id);
    await supabase.from("msp_customer_assessments" as any).delete().in("msp_customer_id", ids);
  }

  await supabase.from("msp_customers" as any).delete().eq("msp_user_id", user.id);
}
