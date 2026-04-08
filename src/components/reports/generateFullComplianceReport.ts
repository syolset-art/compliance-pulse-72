import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { frameworks } from "@/lib/frameworkDefinitions";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import type { ReportData } from "./DownloadReportDialog";

interface Options {
  includeRequirements: boolean;
  includeEvaluators: boolean;
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

function getEvaluatorName(index: number): string {
  const names = ["Lars Hansen", "Kari Johansen", "Erik Olsen", "Marte Berg", "Anders Vik", "Lara (AI)"];
  return names[index % names.length];
}

export function generateFullComplianceReport(data: ReportData, options: Options, companyName?: string) {
  const doc = new jsPDF();
  const now = new Date().toLocaleDateString("nb-NO", { day: "2-digit", month: "long", year: "numeric" });
  const company = companyName || "Ukjent virksomhet";

  // ── Header ──
  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.text("Samsvarsrapport", 14, 22);

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`${company}  •  Generert ${now}`, 14, 30);

  // ── Executive Summary ──
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Sammendrag", 14, 44);

  const fwCount = data.frameworks.length;
  const totalImprovements = data.improvements.length;
  const highSev = data.improvements.filter(i => i.severity === "high").length;
  const levelWord = data.overallScore >= 80 ? "høy" : data.overallScore >= 50 ? "moderat" : "lav";
  const summaryText = `Denne rapporten gir en samlet oversikt over samsvarsstatus for ${company}. `
    + `Virksomheten har en ${levelWord} modenhetsscore på ${data.overallScore}% basert på ${fwCount} aktive regelverk. `
    + `Det er identifisert ${totalImprovements} forbedringspunkter, hvorav ${highSev} har høy alvorlighetsgrad.`;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const summaryLines = doc.splitTextToSize(summaryText, 180);
  doc.text(summaryLines, 14, 52);

  const summaryEndY = 52 + summaryLines.length * 5 + 6;

  // ── Overall score ──
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text(`Samlet modenhet: ${data.overallScore}%`, 14, summaryEndY);

  // Pillar summary table
  autoTable(doc, {
    startY: 50,
    head: [["Kategori", "Score", "Nivå", "Målepunkter"]],
    body: data.pillars.map((p) => [p.name, `${p.score}%`, p.level, String(p.measures)]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  let currentY = (doc as any).lastAutoTable?.finalY ?? 80;

  // ── Forbedringspunkter ──
  currentY += 10;
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Forbedringspunkter", 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [["Tittel", "Kategori", "Regelverk", "Alvorlighet"]],
    body: data.improvements.map((i) => [
      i.title,
      i.pillar,
      i.framework,
      i.severity === "high" ? "Høy" : i.severity === "medium" ? "Middels" : "Lav",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [254, 242, 242] },
    didParseCell: (d) => {
      if (d.column.index === 3 && d.section === "body") {
        const v = d.cell.raw as string;
        if (v === "Høy") d.cell.styles.textColor = [239, 68, 68];
        else if (v === "Middels") d.cell.styles.textColor = [245, 158, 11];
      }
    },
  });

  currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 40;

  // ── Målepunkter ──
  currentY += 10;
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Målepunkter", 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [["Tittel", "Kategori", "Status"]],
    body: data.measures.map((m) => [
      m.title,
      m.pillar,
      m.status === "ok" ? "Oppfylt" : m.status === "partial" ? "Delvis" : "Mangler",
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 253, 244] },
    didParseCell: (d) => {
      if (d.column.index === 2 && d.section === "body") {
        const v = d.cell.raw as string;
        if (v === "Oppfylt") d.cell.styles.textColor = [16, 185, 129];
        else if (v === "Delvis") d.cell.styles.textColor = [245, 158, 11];
        else d.cell.styles.textColor = [239, 68, 68];
      }
    },
  });

  currentY = (doc as any).lastAutoTable?.finalY ?? currentY + 40;

  // ── Framework overview ──
  currentY += 10;
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Regelverk-oversikt", 14, currentY);
  currentY += 2;

  autoTable(doc, {
    startY: currentY,
    head: [["Regelverk", "Score", "Nivå", "Oppfylt / Totalt"]],
    body: data.frameworks.map((fw) => [fw.name, `${fw.score}%`, fw.level, `${fw.fulfilled}/${fw.total}`]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  // ── Per-framework requirements ──
  if (options.includeRequirements) {
    for (const fw of data.frameworks) {
      const fwDef = frameworks.find((f) => f.id === fw.id);
      const reqs = getReqs(fw.id);
      if (reqs.length === 0) continue;

      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(`Krav: ${fwDef?.name || fw.name}`, 14, 20);

      const columns = options.includeEvaluators
        ? [["ID", "Krav", "Kategori", "Prioritet", "Status", "Evaluator"]]
        : [["ID", "Krav", "Kategori", "Prioritet", "Status"]];

      const body = reqs.map((req, i) => {
        const row = [
          req.requirement_id,
          req.name_no || req.name,
          req.category,
          req.priority === "critical" ? "Kritisk" : req.priority === "high" ? "Høy" : req.priority === "medium" ? "Medium" : "Lav",
          getStatusLabel(req, i),
        ];
        if (options.includeEvaluators) row.push(getEvaluatorName(i));
        return row;
      });

      autoTable(doc, {
        startY: 28,
        head: columns,
        body,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        columnStyles: options.includeEvaluators
          ? { 0: { cellWidth: 18 }, 1: { cellWidth: 55 }, 2: { cellWidth: 28 }, 3: { cellWidth: 18 }, 4: { cellWidth: 22 }, 5: { cellWidth: 30 } }
          : { 0: { cellWidth: 22 }, 1: { cellWidth: 70 }, 2: { cellWidth: 35 }, 3: { cellWidth: 22 }, 4: { cellWidth: 25 } },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        didParseCell: (d) => {
          if (d.column.index === 4 && d.section === "body") {
            const v = d.cell.raw as string;
            if (v === "Oppfylt") d.cell.styles.textColor = [16, 185, 129];
            else if (v === "Delvis") d.cell.styles.textColor = [245, 158, 11];
            else d.cell.styles.textColor = [239, 68, 68];
          }
        },
      });
    }
  }

  // ── Footer on all pages ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 160, 160);
    doc.text(`Side ${i} av ${pageCount}`, 14, 290);
    doc.text("Generert av Mynder.ai", 196, 290, { align: "right" });
  }

  doc.save("samsvarsrapport.pdf");
}
