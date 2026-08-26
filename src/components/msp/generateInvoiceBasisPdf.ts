import jsPDF from "jspdf";
import { addMynderFooter } from "@/lib/pdfBranding";
import { computeTaxBreakdown, type PartnerTaxSettings } from "@/lib/partnerTax";
import type { PartnerBranding } from "@/hooks/usePartnerBranding";

export interface InvoiceBasisRow {
  name: string;
  meta?: string;
  activated: string[];
  monthly: number;
  oneTime: number;
  fixed: number;
  setup: number;
}

export interface InvoiceBasisExportInput {
  rows: InvoiceBasisRow[];
  branding: PartnerBranding;
  tax: PartnerTaxSettings;
  /** F.eks. "August 2026" */
  periodLabel: string;
}

const fmt = (n: number) => n.toLocaleString("nb-NO");

export function invoiceBasisFileName(periodLabel: string, ext: "pdf" | "csv") {
  const slug = periodLabel.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
  return `fakturagrunnlag-${slug || "periode"}.${ext}`;
}

/** Laster en logo-URL til en data-URL slik at jsPDF kan tegne den. */
export async function loadLogoDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function buildInvoiceBasisCsv({ rows, tax }: InvoiceBasisExportInput): string {
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;
  const head = [
    "Kunde",
    "Aktiverte produkter og regelverk",
    "Fastpris og etablering (NOK)",
    "Abonnement per mnd (NOK)",
    `${taxLabel} (NOK)`,
    "Total inkl. avgift (NOK)",
  ];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [head.map(esc).join(";")];
  for (const r of rows) {
    const net = r.monthly + r.oneTime;
    const b = computeTaxBreakdown(net, { ...tax, mode: "exclusive" });
    lines.push(
      [r.name, r.activated.join(", "), r.oneTime, r.monthly, b.taxAmount, b.gross].map(esc).join(";"),
    );
  }
  const netTotal = rows.reduce((s, r) => s + r.monthly + r.oneTime, 0);
  const tb = computeTaxBreakdown(netTotal, { ...tax, mode: "exclusive" });
  lines.push(
    [
      "Totalt",
      "",
      rows.reduce((s, r) => s + r.oneTime, 0),
      rows.reduce((s, r) => s + r.monthly, 0),
      tb.taxAmount,
      tb.gross,
    ]
      .map(esc)
      .join(";"),
  );
  return lines.join("\n");
}

export function downloadCsv(csv: string, fileName: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export async function generateInvoiceBasisPdf(input: InvoiceBasisExportInput) {
  const { rows, branding, tax, periodLabel } = input;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;

  // ── Brevhode: partneren er avsender ────────────────────────────────
  let headerBottom = 22;
  const logo = await loadLogoDataUrl(branding.logoUrl);
  let textTop = 20;
  if (logo) {
    try {
      const props = doc.getImageProperties(logo);
      const h = 12;
      const w = Math.min(48, (props.width / props.height) * h);
      doc.addImage(logo, props.fileType || "PNG", marginX, 12, w, h);
      textTop = 12 + h + 6;
    } catch {
      /* faller tilbake til kun tekst */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(branding.name || "Partner", marginX, textTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110, 110, 110);
  const metaLine = [
    branding.orgNumber ? `Org.nr ${branding.orgNumber}` : "",
    branding.domain,
  ]
    .filter(Boolean)
    .join("  •  ");
  if (metaLine) doc.text(metaLine, marginX, textTop + 5);
  if (branding.tagline) doc.text(branding.tagline, marginX, textTop + 10);
  headerBottom = textTop + (branding.tagline ? 14 : 9);

  // Tittelblokk til høyre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text("Fakturagrunnlag", pageWidth - marginX, 20, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Periode: ${periodLabel}`, pageWidth - marginX, 26, { align: "right" });
  doc.text(
    `Eksportert: ${new Date().toLocaleDateString("nb-NO")}`,
    pageWidth - marginX,
    31,
    { align: "right" },
  );

  let y = Math.max(headerBottom, 36);
  doc.setDrawColor(215, 215, 215);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 8;

  // ── Tabell ─────────────────────────────────────────────────────────
  const taxLabel = tax.enabled && tax.rate > 0 ? `${tax.label} (${tax.rate} %)` : tax.label;
  const colCustomer = marginX;
  const colItems = marginX + 52;
  const rightEdge = pageWidth - marginX;
  const colTotal = rightEdge;
  const colTax = rightEdge - 34;
  const colMonthly = rightEdge - 68;
  const colOneTime = rightEdge - 104;
  const itemsWidth = colOneTime - colItems - 6;

  const drawHead = () => {
    doc.setFillColor(245, 245, 247);
    doc.rect(marginX, y - 5, pageWidth - marginX * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Kunde", colCustomer + 2, y);
    doc.text("Aktiverte produkter og regelverk", colItems, y);
    doc.text("Fastpris og etablering", colOneTime, y, { align: "right" });
    doc.text("Abonnement/mnd", colMonthly, y, { align: "right" });
    doc.text(taxLabel, colTax, y, { align: "right" });
    doc.text("Total inkl. avgift", colTotal - 2, y, { align: "right" });
    y += 8;
  };

  drawHead();

  doc.setFont("helvetica", "normal");
  for (const r of rows) {
    const items = r.activated.length ? r.activated.join(" · ") : "—";
    const itemLines = doc.splitTextToSize(items, itemsWidth) as string[];
    const rowHeight = Math.max(9, itemLines.length * 4 + 5);

    if (y + rowHeight > pageHeight - 22) {
      doc.addPage();
      y = 20;
      drawHead();
      doc.setFont("helvetica", "normal");
    }

    const net = r.monthly + r.oneTime;
    const b = computeTaxBreakdown(net, { ...tax, mode: "exclusive" });

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(doc.splitTextToSize(r.name, 48) as string[], colCustomer + 2, y);
    if (r.meta) {
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(r.meta, colCustomer + 2, y + 4);
    }

    doc.setFontSize(7.5);
    doc.setTextColor(90, 90, 90);
    doc.text(itemLines, colItems, y);

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(r.oneTime > 0 ? `${fmt(r.oneTime)} kr` : "—", colOneTime, y, { align: "right" });
    doc.text(r.monthly > 0 ? `${fmt(r.monthly)} kr` : "—", colMonthly, y, { align: "right" });
    doc.setTextColor(110, 110, 110);
    doc.text(net > 0 ? `${fmt(b.taxAmount)} kr` : "—", colTax, y, { align: "right" });
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(net > 0 ? `${fmt(b.gross)} kr` : "—", colTotal - 2, y, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += rowHeight;
    doc.setDrawColor(233, 233, 233);
    doc.line(marginX, y - 4, pageWidth - marginX, y - 4);
  }

  // Totalrad
  const monthlyTotal = rows.reduce((s, r) => s + r.monthly, 0);
  const oneTimeTotal = rows.reduce((s, r) => s + r.oneTime, 0);
  const tb = computeTaxBreakdown(monthlyTotal + oneTimeTotal, { ...tax, mode: "exclusive" });

  if (y + 12 > pageHeight - 22) {
    doc.addPage();
    y = 20;
  }
  doc.setFillColor(245, 245, 247);
  doc.rect(marginX, y - 5, pageWidth - marginX * 2, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(30, 30, 30);
  doc.text("Totalt", colCustomer + 2, y);
  doc.text(`${fmt(oneTimeTotal)} kr`, colOneTime, y, { align: "right" });
  doc.text(`${fmt(monthlyTotal)} kr`, colMonthly, y, { align: "right" });
  doc.text(`${fmt(tb.taxAmount)} kr`, colTax, y, { align: "right" });
  doc.text(`${fmt(tb.gross)} kr`, colTotal - 2, y, { align: "right" });
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text("Fakturagrunnlag generert i Mynder. Beløp er eks. avgift der annet ikke er angitt.", marginX, y);

  addMynderFooter(doc);
  doc.save(invoiceBasisFileName(periodLabel, "pdf"));
}
