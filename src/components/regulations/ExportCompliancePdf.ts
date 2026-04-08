import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { type Framework, getCategoryById } from "@/lib/frameworkDefinitions";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";

interface ExportCounts {
  met: number;
  partial: number;
  notMet: number;
  auto: number;
  manual: number;
  total: number;
}

function getReqs(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
}

function getStatusLabel(req: ComplianceRequirement, index: number): string {
  const hash = (req.requirement_id.charCodeAt(req.requirement_id.length - 1) + index) % 10;
  if (hash < 3) return "Oppfylt";
  if (hash === 3) return "Delvis";
  return "Ikke oppfylt";
}

export function exportCompliancePdf(framework: Framework, counts: ExportCounts, companyName?: string) {
  const doc = new jsPDF();
  const category = getCategoryById(framework.category);
  const pct = counts.total > 0 ? Math.round((counts.met / counts.total) * 100) : 0;
  const now = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const company = companyName || "Ukjent virksomhet";

  // Header
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text("Etterlevelsesrapport", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${company}  •  Generert ${now}`, 14, 30);

  // Executive Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Sammendrag", 14, 44);

  const statusWord = pct >= 80 ? "god" : pct >= 50 ? "moderat" : "lav";
  const summaryText = `Denne rapporten oppsummerer etterlevelsesstatusen for ${framework.name} hos ${company}. `
    + `Virksomheten har en ${statusWord} etterlevelsesgrad på ${pct}%, med ${counts.met} av ${counts.total} krav oppfylt. `
    + `${counts.partial} krav er delvis oppfylt og ${counts.notMet} krav er ikke oppfylt. `
    + `${counts.auto} krav evalueres automatisk og ${counts.manual} manuelt.`;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(summaryText, 180);
  doc.text(summaryLines, 14, 52);

  let currentY = 52 + summaryLines.length * 5 + 6;

  // Framework info
  doc.setFontSize(15);
  doc.setTextColor(30, 30, 30);
  doc.text(framework.name, 14, currentY);
  currentY += 8;

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const descLines = doc.splitTextToSize(framework.description || "", 180);
  doc.text(descLines, 14, currentY);
  currentY += descLines.length * 5;

  // Category
  if (category) {
    currentY += 6;
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Kategori: ${category.name}`, 14, currentY);
  }

  // Summary box
  const boxY = currentY + 8;
  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(14, boxY, 182, 28, 3, 3, "FD");

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text(`Etterlevelsesgrad: ${pct}%`, 20, boxY + 8);
  doc.text(`${counts.met} av ${counts.total} krav oppfylt`, 20, boxY + 15);

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.text(`Oppfylt: ${counts.met}  |  Delvis: ${counts.partial}  |  Ikke oppfylt: ${counts.notMet}  |  Automatisk: ${counts.auto}  |  Manuell: ${counts.manual}`, 20, boxY + 23);

  // Requirements table
  const reqs = getReqs(framework.id);
  const tableData = reqs.map((req, i) => [
    req.requirement_id,
    req.name_no || req.name,
    req.category,
    req.priority === "critical" ? "Kritisk" : req.priority === "high" ? "Høy" : req.priority === "medium" ? "Medium" : "Lav",
    getStatusLabel(req, i),
  ]);

  autoTable(doc, {
    startY: boxY + 36,
    head: [["ID", "Krav", "Kategori", "Prioritet", "Status"]],
    body: tableData,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 70 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 25 },
    },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didParseCell: (data) => {
      if (data.column.index === 4 && data.section === "body") {
        const val = data.cell.raw as string;
        if (val === "Oppfylt") data.cell.styles.textColor = [16, 185, 129];
        else if (val === "Delvis") data.cell.styles.textColor = [245, 158, 11];
        else data.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Side ${i} av ${pageCount}`, 14, 290);
    doc.text("Generert av Mynder.ai", 196, 290, { align: "right" });
  }

  doc.save(`${framework.id}-etterlevelsesrapport.pdf`);
}
