import jsPDF from "jspdf";
import { addMynderFooter } from "@/lib/pdfBranding";

interface InvoiceData {
  invoice_number: string;
  description: string | null;
  amount: number;
  currency: string;
  status: string;
  issued_at: string;
  due_date: string;
  paid_at: string | null;
}

export function formatAmount(amountInOre: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 2,
  }).format(amountInOre / 100);
}

export function generateInvoicePdf(invoice: InvoiceData) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138);
  doc.text("Mynder", 20, 25);

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("Mynder AS", 20, 35);
  doc.text("Compliance & Security Platform", 20, 40);

  // Invoice title
  doc.setFontSize(18);
  doc.setTextColor(0, 0, 0);
  doc.text("FAKTURA", 140, 25);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Fakturanr: ${invoice.invoice_number}`, 140, 35);
  doc.text(`Dato: ${new Date(invoice.issued_at).toLocaleDateString("nb-NO")}`, 140, 41);
  doc.text(`Forfallsdato: ${new Date(invoice.due_date).toLocaleDateString("nb-NO")}`, 140, 47);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(20, 55, 190, 55);

  // Status
  const statusLabel = invoice.status === "paid" ? "Betalt" : invoice.status === "overdue" ? "Forfalt" : "Ubetalt";
  doc.setFontSize(11);
  doc.setTextColor(
    invoice.status === "paid" ? 22 : invoice.status === "overdue" ? 185 : 180,
    invoice.status === "paid" ? 163 : invoice.status === "overdue" ? 28 : 140,
    invoice.status === "paid" ? 74 : invoice.status === "overdue" ? 28 : 0,
  );
  doc.text(`Status: ${statusLabel}`, 20, 65);

  if (invoice.paid_at) {
    doc.setTextColor(100, 100, 100);
    doc.text(`Betalt: ${new Date(invoice.paid_at).toLocaleDateString("nb-NO")}`, 20, 72);
  }

  // Table header
  const tableY = 85;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, tableY - 5, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text("Beskrivelse", 25, tableY + 1);
  doc.text("Beløp", 160, tableY + 1, { align: "right" });

  // Table row
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.description || "-", 25, tableY + 14);
  doc.text(formatAmount(invoice.amount), 160, tableY + 14, { align: "right" });

  // Divider
  doc.line(20, tableY + 20, 190, tableY + 20);

  // Total
  doc.setFontSize(12);
  doc.setFont(undefined!, "bold");
  doc.text("Totalt:", 120, tableY + 30);
  doc.text(formatAmount(invoice.amount), 160, tableY + 30, { align: "right" });

  // Footer
  doc.setFont(undefined!, "normal");
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Denne fakturaen er generert av Mynder-plattformen.", 20, 270);

  addMynderFooter(doc);
  doc.save(`faktura-${invoice.invoice_number}.pdf`);
}
