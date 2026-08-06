import { supabase } from "@/integrations/supabase/client";
import { LICENSE_TIERS, getDiscountPercent } from "./mspLicenseUtils";

const DEMO_CUSTOMERS = [
  { customer_name: "Bergen Energi AS", industry: "Energi", employees: "51-200", compliance_score: 78, status: "active", subscription_plan: "Premium", org_number: "987654321", contact_person: "Erik Solheim", contact_email: "erik@bergenenergi.no", country_code: "NO", url: "https://www.bergenenergi.no", contact_company_role: "IT-ansvarlig", business_description: "Regional kraftleverandør som drifter nettstasjoner og selger strøm til bedrifts- og privatkunder på Vestlandet. Har SCADA-systemer og kundeportal i egen drift." },
  { customer_name: "Fjordtech Solutions", industry: "Teknologi", employees: "11-50", compliance_score: 92, status: "active", subscription_plan: "Basis", org_number: "912345678", contact_person: "Kari Fjord", contact_email: "kari@fjordtech.no", country_code: "NO", url: "https://www.fjordtech.no", contact_company_role: "CTO/CIO", business_description: "Utvikler og drifter en SaaS-plattform for prosjektstyring i maritim sektor. Behandler kundedata i skyen og leverer til kunder i Norden." },
  { customer_name: "Vest Helse Klinikk", industry: "Helse", employees: "11-50", compliance_score: 65, status: "active", subscription_plan: "Premium", org_number: "923456789", contact_person: "Maria Hansen", contact_email: "maria@vesthelse.no", country_code: "NO", url: "https://www.vesthelse.no", contact_company_role: "DPO/Personvernombud", business_description: "Privat klinikk med allmennlege- og spesialisttjenester. Behandler helseopplysninger i journalsystem og tilbyr digitale konsultasjoner." },
  { customer_name: "Kystbygg Entreprenør", industry: "Bygg og anlegg", employees: "201-500", compliance_score: 45, status: "onboarding", subscription_plan: "Basis", org_number: "934567890", contact_person: "Anders Berg", contact_email: "anders@kystbygg.no", country_code: "NO", url: "https://www.kystbygg.no", contact_company_role: "Daglig leder", business_description: "Totalentreprenør innen næringsbygg og infrastruktur langs kysten. Bruker prosjekt- og HMS-systemer med underleverandører i verdikjeden." },
  { customer_name: "NordFinans Rådgivning", industry: "Finans", employees: "1-10", compliance_score: 88, status: "active", subscription_plan: "Premium", org_number: "945678901", contact_person: "Johan Nordahl", contact_email: "johan@nordfinans.no", country_code: "SE", url: "https://www.nordfinans.se", contact_company_role: "CFO", business_description: "Uavhengig rådgivningsselskap innen investering og risikostyring for SMB. Underlagt finanstilsynets krav og behandler sensitive kundeporteføljer." },
  { customer_name: "Stavanger Logistikk", industry: "Transport", employees: "51-200", compliance_score: 52, status: "active", subscription_plan: "Basis", org_number: "956789012", contact_person: "Lisa Strand", contact_email: "lisa@stavangerlogistikk.no", country_code: "NO", url: "https://www.stavangerlogistikk.no", contact_company_role: "IT-ansvarlig", business_description: "Tredjepartslogistikk med lager og distribusjon for olje- og industrikunder. Drifter flåtestyring, sporing og integrasjoner mot kundenes ERP." },
  { customer_name: "Larvik Handel AS", industry: "Handel", employees: "11-50", compliance_score: 35, status: "inactive", subscription_plan: "Basis", org_number: "967890123", contact_person: "Thomas Larsen", contact_email: "thomas@larvikhandel.no", country_code: "DK", url: "https://www.larvikhandel.dk", contact_company_role: "Daglig leder", business_description: "Detaljhandel med fysiske butikker og nettbutikk. Håndterer betalingsdata og kundeklubb med markedsføringssamtykker." },
  { customer_name: "Digitale Løsninger Nord", industry: "Teknologi", employees: "51-200", compliance_score: 85, status: "active", subscription_plan: "Premium", org_number: "978901234", contact_person: "Sarah Nilsen", contact_email: "sarah@dlnord.no", country_code: "NO", url: "https://www.dlnord.no", contact_company_role: "CISO/Sikkerhetsleder", business_description: "IT-konsulenthus som leverer skymigrering og driftstjenester til offentlig sektor. Har tilgang til kundenes produksjonsmiljøer." },
  { customer_name: "Tromsø Utdanning", industry: "Utdanning", employees: "201-500", compliance_score: 71, status: "onboarding", subscription_plan: "Basis", org_number: "989012345", contact_person: "Ole Karlsen", contact_email: "ole@tromsoutdanning.no", country_code: "NO", url: "https://www.tromsoutdanning.no", contact_company_role: "Compliance Manager", business_description: "Utdanningsinstitusjon med yrkesfaglige og digitale kurs. Behandler personopplysninger om elever og benytter læringsplattform i skyen." },
];

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export interface SeedResult {
  customers: number;
  purchases: number;
  licenses: number;
  invoices: number;
  alreadySeeded: boolean;
}

export async function seedDemoMSP(): Promise<SeedResult> {
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || DEMO_USER_ID;

  const basisTier = LICENSE_TIERS.find(t => t.id === "basis")!;
  const premiumTier = LICENSE_TIERS.find(t => t.id === "premium")!;

  const qty1 = 5;
  const disc1 = getDiscountPercent(qty1);
  const total1 = Math.round(qty1 * basisTier.priceOre * (1 - disc1 / 100));
  const qty2 = 3;
  const disc2 = getDiscountPercent(qty2);
  const total2 = Math.round(qty2 * premiumTier.priceOre * (1 - disc2 / 100));

  // 1) Purchases — seed only if none exist
  const { data: existingPurchases } = await supabase
    .from("msp_license_purchases" as any)
    .select("id, quantity")
    .eq("msp_user_id", effectiveUserId);

  let p1Id: string;
  let p2Id: string;

  if (!existingPurchases || existingPurchases.length === 0) {
    const { data: inserted, error: pErr } = await supabase
      .from("msp_license_purchases" as any)
      .insert([
        { msp_user_id: effectiveUserId, quantity: qty1, unit_price: basisTier.priceOre, discount_percent: disc1, total_amount: total1, status: "active" },
        { msp_user_id: effectiveUserId, quantity: qty2, unit_price: premiumTier.priceOre, discount_percent: disc2, total_amount: total2, status: "active" },
      ])
      .select("id");
    if (pErr) throw new Error(`Lisenskjøp: ${pErr.message}`);
    p1Id = (inserted as any[])[0].id;
    p2Id = (inserted as any[])[1].id;
  } else {
    p1Id = (existingPurchases as any[])[0].id;
    p2Id = (existingPurchases as any[])[1]?.id || p1Id;
  }

  // 2) Licenses — seed only if none exist
  const { data: existingLicenses } = await supabase
    .from("msp_licenses" as any)
    .select("id")
    .eq("msp_user_id", effectiveUserId);

  let licIds: string[];
  if (!existingLicenses || existingLicenses.length === 0) {
    const licenseRows: any[] = [];
    for (let i = 0; i < qty1; i++) licenseRows.push({ purchase_id: p1Id, msp_user_id: effectiveUserId, status: "available" });
    for (let i = 0; i < qty2; i++) licenseRows.push({ purchase_id: p2Id, msp_user_id: effectiveUserId, status: "available" });

    const { data: inserted, error: lErr } = await supabase
      .from("msp_licenses" as any)
      .insert(licenseRows)
      .select("id");
    if (lErr) throw new Error(`Lisenser: ${lErr.message}`);
    licIds = (inserted as any[]).map(l => l.id);
  } else {
    licIds = (existingLicenses as any[]).map(l => l.id);
  }

  // 3) Customers — seed only if none exist
  const { data: existingCustomers } = await supabase
    .from("msp_customers" as any)
    .select("id, customer_name, url, business_description, contact_company_role, active_modules")
    .eq("msp_user_id", effectiveUserId);

  let custIds: string[];
  let customersInserted = 0;
  if (!existingCustomers || existingCustomers.length === 0) {
    const customerRows = DEMO_CUSTOMERS.map((c) => ({
      ...c,
      msp_user_id: effectiveUserId,
      onboarding_completed: c.status === "active",
      active_frameworks: c.subscription_plan === "Premium" ? ["ISO 27001", "GDPR"] : ["GDPR"],
      active_modules: DEMO_ACTIVE_MODULES[c.customer_name] ?? [],
    }));
    const { data: inserted, error: cErr } = await supabase
      .from("msp_customers" as any)
      .insert(customerRows)
      .select("id");
    if (cErr) throw new Error(`Kunder: ${cErr.message}`);
    custIds = (inserted as any[]).map(c => c.id);
    customersInserted = custIds.length;

    // Assign licenses to first 6 customers
    for (let i = 0; i < Math.min(6, licIds.length, custIds.length); i++) {
      await supabase
        .from("msp_licenses" as any)
        .update({ assigned_customer_id: custIds[i], status: "assigned" })
        .eq("id", licIds[i]);
    }
  } else {
    custIds = (existingCustomers as any[]).map(c => c.id);

    // Backfill onboarding-kartlagte felter på eksisterende demokunder
    for (const row of existingCustomers as any[]) {
      const demo = DEMO_CUSTOMERS.find(d => d.customer_name === row.customer_name);
      if (!demo) continue;
      const patch: Record<string, any> = {};
      if (!row.url) patch.url = demo.url;
      if (!row.business_description) patch.business_description = demo.business_description;
      if (!row.contact_company_role) patch.contact_company_role = demo.contact_company_role;
      const modules = DEMO_ACTIVE_MODULES[row.customer_name];
      if (modules && (!row.active_modules || row.active_modules.length === 0)) {
        patch.active_modules = modules;
      }
      if (Object.keys(patch).length === 0) continue;
      await supabase.from("msp_customers" as any).update(patch).eq("id", row.id);
    }
  }


  // 4) Invoices — seed only if none exist
  const { data: existingInvoices } = await supabase
    .from("msp_invoices" as any)
    .select("id")
    .eq("msp_user_id", effectiveUserId);

  let invoicesInserted = 0;
  if (!existingInvoices || existingInvoices.length === 0) {
    const { data: inserted, error: iErr } = await supabase.from("msp_invoices" as any).insert([
      { msp_user_id: effectiveUserId, invoice_number: "DEMO-2025-001", description: `${qty1}x Basis-lisens (demo)`, amount: total1, status: "paid", paid_at: new Date().toISOString() },
      { msp_user_id: effectiveUserId, invoice_number: "DEMO-2025-002", description: `${qty2}x Premium-lisens (demo)`, amount: total2, status: "paid", paid_at: new Date().toISOString() },
    ]).select("id");
    if (iErr) throw new Error(`Fakturaer: ${iErr.message}`);
    invoicesInserted = (inserted as any[])?.length || 0;
  }

  const alreadySeeded =
    (existingPurchases?.length || 0) > 0 &&
    (existingLicenses?.length || 0) > 0 &&
    (existingCustomers?.length || 0) > 0 &&
    (existingInvoices?.length || 0) > 0;

  return {
    customers: customersInserted,
    purchases: existingPurchases?.length ? 0 : 2,
    licenses: existingLicenses?.length ? 0 : qty1 + qty2,
    invoices: invoicesInserted,
    alreadySeeded,
  };
}

export async function deleteDemoMSP() {
  const { data: { user } } = await supabase.auth.getUser();
  const effectiveUserId = user?.id || DEMO_USER_ID;

  await supabase.from("msp_invoices" as any).delete().eq("msp_user_id", effectiveUserId);
  await supabase.from("msp_licenses" as any).delete().eq("msp_user_id", effectiveUserId);
  await supabase.from("msp_license_purchases" as any).delete().eq("msp_user_id", effectiveUserId);

  const { data: custs } = await supabase.from("msp_customers" as any).select("id").eq("msp_user_id", effectiveUserId);
  if (custs && custs.length > 0) {
    const ids = (custs as any[]).map(c => c.id);
    await supabase.from("msp_customer_assessments" as any).delete().in("msp_customer_id", ids);
  }

  await supabase.from("msp_customers" as any).delete().eq("msp_user_id", effectiveUserId);
}
