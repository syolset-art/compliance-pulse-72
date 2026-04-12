import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addMynderFooter } from "@/lib/pdfBranding";

interface AssetRow {
  id: string;
  asset_type: string;
  risk_level?: string | null;
  compliance_score?: number | null;
  lifecycle_status?: string | null;
  name: string;
}

interface PortfolioStats {
  vendors: AssetRow[];
  systems: AssetRow[];
  allAssets: AssetRow[];
}

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

function countByRisk(items: AssetRow[]) {
  const high = items.filter(a => a.risk_level === "high" || a.risk_level === "critical").length;
  const medium = items.filter(a => a.risk_level === "medium").length;
  const low = items.filter(a => a.risk_level === "low").length;
  const unset = items.length - high - medium - low;
  return { high, medium, low, unset };
}

function avgScore(items: AssetRow[]) {
  const scored = items.filter(a => (a.compliance_score ?? 0) > 0);
  if (scored.length === 0) return null;
  return Math.round(scored.reduce((s, a) => s + (a.compliance_score ?? 0), 0) / scored.length);
}

export function generateExecutivePortfolioReport(stats: PortfolioStats, companyName: string) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const company = companyName || "Ukjent virksomhet";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text("Samlet porteføljerapport", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${company}  •  Generert ${now}`, 14, 30);

  // Executive summary
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Sammendrag", 14, 44);

  const totalRisk = countByRisk(stats.allAssets);
  const totalAvg = avgScore(stats.allAssets);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const lines = [
    `Totalt ${stats.allAssets.length} eiendeler registrert: ${stats.vendors.length} leverandører, ${stats.systems.length} systemer, ${stats.allAssets.length - stats.vendors.length - stats.systems.length} øvrige.`,
    `Gjennomsnittlig compliance-score: ${totalAvg ? totalAvg + "%" : "Ikke vurdert"}`,
    `Risikofordeling: ${totalRisk.high} høy/kritisk, ${totalRisk.medium} middels, ${totalRisk.low} lav, ${totalRisk.unset} ikke vurdert.`,
  ];
  lines.forEach((l, i) => doc.text(l, 14, 52 + i * 6));

  let y = 52 + lines.length * 6 + 10;

  // --- Vendor section ---
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Leverandørportefølje", 14, y);
  y += 8;

  if (stats.vendors.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Ingen leverandører registrert.", 14, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["Leverandør", "Risiko", "Score"]],
      body: stats.vendors.map(v => [
        v.name,
        riskLabel(v.risk_level),
        (v.compliance_score ?? 0) > 0 ? `${v.compliance_score}%` : "Ikke vurdert",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 1) {
          const raw = stats.vendors[data.row.index]?.risk_level;
          data.cell.styles.textColor = riskColor(raw);
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- System section ---
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Systemportefølje", 14, y);
  y += 8;

  if (stats.systems.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text("Ingen systemer registrert.", 14, y);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      head: [["System", "Status", "Risiko", "Score"]],
      body: stats.systems.map(s => [
        s.name,
        s.lifecycle_status || "–",
        riskLabel(s.risk_level),
        (s.compliance_score ?? 0) > 0 ? `${s.compliance_score}%` : "Ikke vurdert",
      ]),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 2) {
          const raw = stats.systems[data.row.index]?.risk_level;
          data.cell.styles.textColor = riskColor(raw);
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // --- Asset type summary ---
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Eiendeler per type", 14, y);
  y += 8;

  const typeCounts: Record<string, number> = {};
  stats.allAssets.forEach(a => {
    typeCounts[a.asset_type] = (typeCounts[a.asset_type] || 0) + 1;
  });

  autoTable(doc, {
    startY: y,
    head: [["Type", "Antall"]],
    body: Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, c]) => [t, String(c)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255] },
  });

  addMynderFooter(doc);
  doc.save(`portefoeljerapport_${now.replace(/\s/g, "_")}.pdf`);
}
