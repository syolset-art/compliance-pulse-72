import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addMynderFooter } from "@/lib/pdfBranding";

interface VendorRow {
  name: string;
  category?: string | null;
  country?: string | null;
  risk_level?: string | null;
  compliance_score?: number | null;
  criticality?: string | null;
  gdpr_role?: string | null;
}

export function generateVendorPortfolioReport(vendors: VendorRow[], companyName: string) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const company = companyName || "Ukjent virksomhet";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text("Leverandørportefølje", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${company}  •  Generert ${now}`, 14, 30);

  // Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Sammendrag", 14, 44);

  const high = vendors.filter(v => v.risk_level === "high" || v.risk_level === "critical").length;
  const medium = vendors.filter(v => v.risk_level === "medium").length;
  const low = vendors.filter(v => v.risk_level === "low").length;
  const scoredVendors = vendors.filter(v => (v.compliance_score ?? 0) > 0);
  const avgScore = scoredVendors.length > 0
    ? Math.round(scoredVendors.reduce((s, v) => s + (v.compliance_score ?? 0), 0) / scoredVendors.length)
    : 0;
  const notAssessedCount = vendors.length - scoredVendors.length;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = [
    `Totalt ${vendors.length} leverandører registrert.`,
    `Gjennomsnittlig compliance-score: ${avgScore}%`,
    `Risikofordeling: ${high} høy/kritisk, ${medium} middels, ${low} lav, ${vendors.length - high - medium - low} ikke vurdert.`,
  ];
  summaryLines.forEach((line, i) => doc.text(line, 14, 52 + i * 6));

  // Table
  let startY = 52 + summaryLines.length * 6 + 8;

  const riskLabel = (r?: string | null) => {
    if (!r) return "–";
    const map: Record<string, string> = { critical: "Kritisk", high: "Høy", medium: "Middels", low: "Lav" };
    return map[r] || r;
  };

  const riskColor = (r?: string | null): [number, number, number] => {
    if (r === "critical" || r === "high") return [220, 50, 50];
    if (r === "medium") return [200, 150, 30];
    if (r === "low") return [50, 160, 80];
    return [120, 120, 120];
  };

  autoTable(doc, {
    startY,
    head: [["Leverandør", "Kategori", "Land", "Risiko", "Score", "Kritikalitet"]],
    body: vendors.map(v => [
      v.name,
      v.category || v.gdpr_role || "–",
      v.country || "–",
      riskLabel(v.risk_level),
      v.compliance_score != null && v.compliance_score > 0 ? `${v.compliance_score}%` : "Ikke vurdert",
      v.criticality || "–",
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
    didParseCell(data) {
      if (data.section === "body" && data.column.index === 3) {
        const raw = vendors[data.row.index]?.risk_level;
        data.cell.styles.textColor = riskColor(raw);
        data.cell.styles.fontStyle = "bold";
      }
    },
  });

  addMynderFooter(doc);
  doc.save(`leverandorportefolje_${now.replace(/\s/g, "_")}.pdf`);
}
