// Fakturagrunnlag for Mynder — linjer, perioder og summering.
//
// Demolinjene utledes fra kundens moduler og regelverk, slik at summen
// alltid matcher `mrrNok` i admin-demodataene.

import { CUSTOMERS, PARTNERS, type CustomerRow, type PartnerRow } from "./adminDemoData";

export type BillingLineKind = "module" | "framework" | "service";

export interface BillingLine {
  id: string;
  label: string;
  kind: BillingLineKind;
  /** ISO-dato for aktivering. */
  activatedAt: string;
  /** ISO-dato for avvikling — faktureres ut perioden. */
  endedAt?: string;
  monthlyNok: number;
}

const FRAMEWORK_PRICE = 500;
const MODULE_LABEL: Record<string, string> = {
  Vendors: "Leverandørmodul",
  Systems: "Mynder Core",
  Assets: "Eiendeler",
};

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Legger til et antall dager på en ISO-dato og returnerer ny ISO-dato. */
function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Dato i inneværende måned — brukes for å vise ferske aktiveringer. */
function thisMonth(day: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

function buildLines(c: CustomerRow): BillingLine[] {
  const h = hash(c.id);
  const lines: BillingLine[] = [];

  // Regelverk — fast pris per stk. Ett regelverk hos hver tredje kunde er nytt i inneværende måned.
  c.frameworks.forEach((f, i) => {
    const isNew = h % 3 === 0 && i === c.frameworks.length - 1;
    lines.push({
      id: `${c.id}-f${i}`,
      label: f,
      kind: "framework",
      activatedAt: isNew ? thisMonth(4 + (h % 20)) : addDays(c.since, 20 * i),
      monthlyNok: FRAMEWORK_PRICE,
    });
  });

  const frameworkSum = lines.reduce((s, l) => s + l.monthlyNok, 0);
  const moduleBudget = Math.max(c.mrrNok - frameworkSum, 0);

  // Modulene deler resten av MRR. Første modul får resten etter avrunding.
  const count = c.modules.length || 1;
  const per = Math.round(moduleBudget / count / 100) * 100;
  c.modules.forEach((m, i) => {
    const isLast = i === c.modules.length - 1;
    const amount = isLast ? moduleBudget - per * (count - 1) : per;
    const isNew = h % 4 === 1 && isLast && c.modules.length > 1;
    const isEnded = h % 7 === 2 && isLast && c.modules.length > 2;
    lines.push({
      id: `${c.id}-m${i}`,
      label: MODULE_LABEL[m] ?? m,
      kind: "module",
      activatedAt: isNew ? thisMonth(2 + (h % 22)) : addDays(c.since, 14 * i),
      endedAt: isEnded ? thisMonth(18) : undefined,
      monthlyNok: Math.max(amount, 0),
    });
  });

  return lines;
}

const LINE_CACHE = new Map<string, BillingLine[]>();

export function linesForCustomer(c: CustomerRow): BillingLine[] {
  const cached = LINE_CACHE.get(c.id);
  if (cached) return cached;
  const built = buildLines(c);
  LINE_CACHE.set(c.id, built);
  return built;
}

// ─── Periode ─────────────────────────────────────────────────────────

export interface Period {
  year: number;
  /** 0-indeksert måned. */
  month: number;
}

export function currentPeriod(): Period {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

export function shiftPeriod(p: Period, delta: number): Period {
  const d = new Date(p.year, p.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function formatPeriod(p: Period): string {
  return new Date(p.year, p.month, 1).toLocaleDateString("nb-NO", { month: "long", year: "numeric" });
}

function periodStart(p: Period) {
  return new Date(p.year, p.month, 1);
}
function periodEnd(p: Period) {
  return new Date(p.year, p.month + 1, 0, 23, 59, 59);
}

export function isNewInPeriod(line: BillingLine, p: Period): boolean {
  const d = new Date(line.activatedAt);
  return d >= periodStart(p) && d <= periodEnd(p);
}

export function isEndedInPeriod(line: BillingLine, p: Period): boolean {
  if (!line.endedAt) return false;
  const d = new Date(line.endedAt);
  return d >= periodStart(p) && d <= periodEnd(p);
}

/** Linjer som faktureres i perioden — aktivert senest ved periodeslutt og ikke avviklet før periodestart. */
export function linesForPeriod(c: CustomerRow, p: Period): BillingLine[] {
  return linesForCustomer(c).filter((l) => {
    if (new Date(l.activatedAt) > periodEnd(p)) return false;
    if (l.endedAt && new Date(l.endedAt) < periodStart(p)) return false;
    return true;
  });
}

// ─── Summering ───────────────────────────────────────────────────────

export interface CustomerBasis {
  customer: CustomerRow;
  lines: BillingLine[];
  total: number;
  newCount: number;
}

export interface RecipientBasis {
  id: string;
  name: string;
  /** Partner når fakturaen går til en partner, ellers direkte kunde. */
  partner?: PartnerRow;
  customers: CustomerBasis[];
  subtotal: number;
  commissionPct: number;
  commission: number;
  toInvoice: number;
  newCount: number;
}

function customerBasis(c: CustomerRow, p: Period): CustomerBasis {
  const lines = linesForPeriod(c, p);
  return {
    customer: c,
    lines,
    total: lines.reduce((s, l) => s + l.monthlyNok, 0),
    newCount: lines.filter((l) => isNewInPeriod(l, p)).length,
  };
}

export function partnerRecipients(p: Period): RecipientBasis[] {
  return PARTNERS.map((partner) => {
    const customers = CUSTOMERS.filter((c) => c.salesChannel === "partner" && c.partnerId === partner.id).map((c) =>
      customerBasis(c, p),
    );
    const subtotal = customers.reduce((s, c) => s + c.total, 0);
    const commission = Math.round((subtotal * partner.commissionPct) / 100);
    return {
      id: partner.id,
      name: partner.name,
      partner,
      customers,
      subtotal,
      commissionPct: partner.commissionPct,
      commission,
      toInvoice: subtotal - commission,
      newCount: customers.reduce((s, c) => s + c.newCount, 0),
    };
  }).sort((a, b) => b.subtotal - a.subtotal);
}

export function directRecipients(p: Period): RecipientBasis[] {
  return CUSTOMERS.filter((c) => c.salesChannel === "direct")
    .map((c) => {
      const basis = customerBasis(c, p);
      return {
        id: c.id,
        name: c.name,
        customers: [basis],
        subtotal: basis.total,
        commissionPct: 0,
        commission: 0,
        toInvoice: basis.total,
        newCount: basis.newCount,
      };
    })
    .sort((a, b) => b.subtotal - a.subtotal);
}

// ─── Eksport ─────────────────────────────────────────────────────────

const KIND_LABEL: Record<BillingLineKind, string> = {
  module: "Produkt",
  framework: "Regelverk",
  service: "Tjeneste",
};

export function buildCsv(recipients: RecipientBasis[], p: Period): string {
  const rows: string[][] = [
    ["Periode", "Mottaker", "Kanal", "Kunde", "Type", "Linje", "Aktivert", "Avviklet", "Beløp per mnd (NOK)"],
  ];
  for (const r of recipients) {
    for (const c of r.customers) {
      for (const l of c.lines) {
        rows.push([
          formatPeriod(p),
          r.name,
          r.partner ? "Partner" : "Direkte",
          c.customer.name,
          KIND_LABEL[l.kind],
          l.label,
          l.activatedAt,
          l.endedAt ?? "",
          String(l.monthlyNok),
        ]);
      }
    }
  }
  return rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
