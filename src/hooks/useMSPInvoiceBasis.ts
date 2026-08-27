import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  customerLicenseSummary,
  deriveActivatedFrameworks,
  deriveActivatedProducts,
  moduleKeyForActivatedLabel,
} from "@/lib/offerSuggestions";
import { getOffersForCustomer, normalizeServiceKey } from "@/lib/customerOffers";
import { SERVICE_LIBRARY } from "@/lib/serviceLibrary";
import { CUSTOMER_MODULES_EVENT, getCustomerRetiringModules } from "@/lib/customerModuleState";
import { computeTaxBreakdown } from "@/lib/partnerTax";
import { usePartnerBranding } from "@/hooks/usePartnerBranding";

export interface InvoiceBasisRow {
  id: string;
  name: string;
  meta: string;
  activated: string[];
  /** Abonnementslinjer med pris — brukes i fakturaforhåndsvisning. */
  lines: { label: string; price: number }[];
  monthly: number;
  fixed: number;
  fixedCount: number;
  /** Engangs etableringsgebyr — ikke alle kunder har dette. */
  setup: number;
  /** Avsluttede linjer: etikett → dato de faller bort. */
  retiring: Record<string, string>;
  createdAt?: string | null;
}

/** Fastprisleveranser: leverte tilbud med tjenester som prises som engangsbeløp. */
function fixedPriceForCustomer(customerId: string): { total: number; count: number } {
  const offers = getOffersForCustomer(customerId).filter((o) => o.status === "delivered");
  let total = 0;
  let count = 0;
  for (const offer of offers) {
    const keys = new Set([...(offer.templateIds || []), ...(offer.serviceKeys || [])]);
    for (const t of SERVICE_LIBRARY) {
      const match = keys.has(t.id) || keys.has(normalizeServiceKey(t.name));
      if (!match) continue;
      if (t.recommendedPrice.model !== "fixed") continue;
      total += t.recommendedPrice.min;
      count += 1;
    }
  }
  return { total, count };
}

const INDUSTRY_PALETTE = [
  "hsl(var(--primary))",
  "#5A3184",
  "#8E8C85",
  "#0F7A5A",
  "#E08A0B",
  "#2B6CB0",
  "#C53030",
  "#805AD5",
];

/**
 * Delt datagrunnlag for Fakturagrunnlag og Faktureringsrapporter.
 * Alle beløp er eks. mva; mva legges til i totalene.
 */
export function useMSPInvoiceBasis() {
  const { branding } = usePartnerBranding();
  const tax = branding.tax;

  const { data: customers = [], refetch } = useQuery({
    queryKey: ["msp-customers-invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("msp_customers" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  // Oppdater når partneren aktiverer eller endrer nivå på en modul.
  const [, setTick] = useState(0);
  useEffect(() => {
    const refresh = () => {
      setTick((n) => n + 1);
      refetch();
    };
    window.addEventListener(CUSTOMER_MODULES_EVENT, refresh);
    window.addEventListener("modules:changed", refresh);
    return () => {
      window.removeEventListener(CUSTOMER_MODULES_EVENT, refresh);
      window.removeEventListener("modules:changed", refresh);
    };
  }, [refetch]);

  const rows: InvoiceBasisRow[] = useMemo(() => {
    return customers
      .map((c: any) => {
        const { monthly, lines } = customerLicenseSummary(c);
        const fixed = fixedPriceForCustomer(c.id);
        const retiringModules = getCustomerRetiringModules(c.id);
        const products = deriveActivatedProducts(c);
        const frameworkLabels = deriveActivatedFrameworks(c);
        const retiring: Record<string, string> = {};
        for (const label of products) {
          const key = moduleKeyForActivatedLabel(label);
          if (key && retiringModules[key]) retiring[label] = retiringModules[key];
        }
        if (retiringModules.frameworks) {
          for (const label of frameworkLabels) retiring[label] = retiringModules.frameworks;
        }
        return {
          id: c.id,
          name: c.customer_name || "Uten navn",
          meta: [c.country_code || "NO", c.industry].filter(Boolean).join(" · "),
          activated: [...products, ...frameworkLabels],
          lines,
          retiring,
          monthly,
          fixed: fixed.total,
          fixedCount: fixed.count,
          setup: Number(c.setup_fee) > 0 ? Number(c.setup_fee) : 0,
          createdAt: c.created_at ?? null,
        };
      })
      .sort((a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name, "nb-NO"));
  }, [customers]);

  const monthlyTotal = rows.reduce((s, r) => s + r.monthly, 0);
  const fixedTotal = rows.reduce((s, r) => s + r.fixed, 0);
  const setupTotal = rows.reduce((s, r) => s + r.setup, 0);
  const payingCount = rows.filter((r) => r.monthly > 0).length;
  const oneTimeTotal = fixedTotal + setupTotal;

  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of rows) {
      for (const label of r.activated) {
        counts[label] = (counts[label] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nb-NO"))
      .slice(0, 3);
  }, [rows]);

  const industryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of customers) {
      const industry = (c as any).industry || "Ukjent bransje";
      counts[industry] = (counts[industry] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "nb-NO"))
      .slice(0, 5)
      .map(([name, value], i) => ({ name, value, fill: INDUSTRY_PALETTE[i % INDUSTRY_PALETTE.length] }));
  }, [customers]);

  /** Fakturagrunnlag viser alltid beløp eks. mva og legger mva til i totalen. */
  const invoiceTax = useMemo(() => ({ ...tax, mode: "exclusive" as const }), [tax]);

  const netTotal = monthlyTotal + fixedTotal + setupTotal;
  const totalBreakdown = computeTaxBreakdown(netTotal, invoiceTax);
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;

  const exportRows = rows.map((r) => ({
    name: r.name,
    meta: r.meta,
    activated: r.activated,
    monthly: r.monthly,
    oneTime: r.fixed + r.setup,
    fixed: r.fixed,
    setup: r.setup,
  }));

  const periodLabel = new Date().toLocaleDateString("nb-NO", { month: "long", year: "numeric" });

  return {
    branding,
    tax,
    invoiceTax,
    taxLabel,
    customers,
    rows,
    monthlyTotal,
    fixedTotal,
    setupTotal,
    oneTimeTotal,
    payingCount,
    netTotal,
    totalBreakdown,
    productCounts,
    industryCounts,
    exportRows,
    periodLabel,
    refetch,
  };
}
