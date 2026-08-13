import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addMynderFooter } from "@/lib/pdfBranding";
import { frameworks } from "@/lib/frameworkDefinitions";
import { getRequirementsByFramework } from "@/lib/complianceRequirementsData";
import { ALL_ADDITIONAL_REQUIREMENTS } from "@/lib/additionalFrameworkRequirements";
import type { ComplianceRequirement } from "@/lib/complianceRequirementsData";
import type { ReportData } from "./DownloadReportDialog";
import { CONTROL_AREAS } from "@/lib/controlAreas";
import {
  buildReportEvidenceRow,
  getEvidenceCount,
  getReportStatus,
  matchesEvidenceFilter,
  REPORT_STATUS_COLOR,
  REPORT_STATUS_LABEL,
  type EvidenceFilter,
  type ReportEvidenceRow,
} from "@/lib/reportRequirementStatus";

interface Options {
  includeRequirements: boolean;
  includeEvaluators: boolean;
  evidenceFilter?: EvidenceFilter;
}

function getReqs(frameworkId: string): ComplianceRequirement[] {
  const main = getRequirementsByFramework(frameworkId);
  if (main.length > 0) return main;
  return ALL_ADDITIONAL_REQUIREMENTS.filter((r) => r.framework_id === frameworkId);
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

  const evidenceFilter: EvidenceFilter = options.evidenceFilter ?? "all";

  // Aggregert kravstatus på tvers av alle regelverk i scope
  const allReqs = data.frameworks.flatMap((fw) =>
    getReqs(fw.id).map((req) => ({ req, frameworkName: fw.name })),
  );
  const relevantReqs = allReqs.filter(({ req }) => getReportStatus(req) !== "not_applicable");
  const fulfilledCount = relevantReqs.filter(({ req }) => getReportStatus(req) === "fulfilled").length;
  const notStartedCount = relevantReqs.length - fulfilledCount;
  const notApplicableCount = allReqs.length - relevantReqs.length;
  const withEvidence = relevantReqs.filter(({ req }) => getEvidenceCount(req) > 0).length;
  const relevantPct = relevantReqs.length
    ? Math.round((fulfilledCount / relevantReqs.length) * 100)
    : 0;

  const fwCount = data.frameworks.length;
  const totalImprovements = data.improvements.length;
  const highSev = data.improvements.filter(i => i.severity === "high").length;
  const levelWord = data.overallScore >= 80 ? "høy" : data.overallScore >= 50 ? "moderat" : "lav";
  const summaryText = `Denne rapporten gir en samlet oversikt over samsvarsstatus for ${company}. `
    + `Virksomheten har en ${levelWord} modenhetsscore på ${data.overallScore}% basert på ${fwCount} aktive regelverk. `
    + `Av ${allReqs.length} krav er ${notApplicableCount} markert som ikke relevante av virksomheten selv, og disse holdes utenfor beregningen. `
    + `Av de ${relevantReqs.length} relevante kravene oppfylles ${fulfilledCount} (${relevantPct}%), mens ${notStartedCount} ikke er påbegynt. `
    + `${withEvidence} av de oppfylte kravene har bevis (dokumentasjon) knyttet til seg. `
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
    startY: summaryEndY + 6,
    head: [["Kategori", "Score", "Nivå", "Kontrollpunkter"]],
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

  // ── Kontrollpunkter ──
  currentY += 10;
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFontSize(13);
  doc.setTextColor(30, 30, 30);
  doc.text("Kontrollpunkter", 14, currentY);
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

  // ── Dokumentasjon per kontrollområde ──
  const evidenceRows: ReportEvidenceRow[] = allReqs.map(({ req, frameworkName }) =>
    buildReportEvidenceRow(req, frameworkName),
  );

  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);
  doc.text("Dokumentasjon per kontrollområde", 14, 20);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const evidenceNote = doc.splitTextToSize(
    "Bevis er dokumentasjon som policy, rutine, logg, avtale, sertifikat eller revisjonsrapport. "
      + "Ikke alle krav krever bevis: et krav satt til «Ja, dette oppfylles» regnes som oppfylt også uten "
      + "dokumentasjon. Bevis gir økt tillit til vurderingen, men påvirker ikke etterlevelsesgraden.",
    182,
  );
  doc.text(evidenceNote, 14, 26);

  let areaY = 26 + evidenceNote.length * 4.5 + 6;

  for (const area of CONTROL_AREAS) {
    const rows = evidenceRows.filter((r) => r.area === area.key);
    if (rows.length === 0) continue;

    const received = rows.filter((r) => r.status !== "Mangler").length;

    if (areaY > 250) {
      doc.addPage();
      areaY = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`${area.labelNb}  (${received}/${rows.length} dokumentert)`, 14, areaY);

    autoTable(doc, {
      startY: areaY + 3,
      head: [["Dokumentasjon", "Regelverk", "Krav", "Status"]],
      body: rows.map((r) => [r.docLabel, r.frameworkName, `${r.requirementId} ${r.requirementName}`, r.status]),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [90, 49, 132], textColor: 255, fontStyle: "bold" },
      columnStyles: { 0: { cellWidth: 48 }, 1: { cellWidth: 34 }, 2: { cellWidth: 72 }, 3: { cellWidth: 28 } },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      didParseCell: (d) => {
        if (d.column.index === 3 && d.section === "body") {
          const v = d.cell.raw as string;
          if (v === "Opplastet") d.cell.styles.textColor = [16, 185, 129];
          else if (v === "Agent-bekreftet") d.cell.styles.textColor = [59, 130, 246];
          else d.cell.styles.textColor = [239, 68, 68];
        }
      },
    });

    areaY = ((doc as any).lastAutoTable?.finalY ?? areaY + 20) + 10;
  }

  // ── Per-framework requirements ──
  if (options.includeRequirements) {
    const filterLabel =
      evidenceFilter === "with"
        ? "Kun krav med bevis"
        : evidenceFilter === "without"
          ? "Kun krav uten bevis"
          : "Alle krav";

    for (const fw of data.frameworks) {
      const fwDef = frameworks.find((f) => f.id === fw.id);
      const reqs = getReqs(fw.id).filter((req) => matchesEvidenceFilter(req, evidenceFilter));
      if (reqs.length === 0) continue;

      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(30, 30, 30);
      doc.text(`Krav: ${fwDef?.name || fw.name}`, 14, 20);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`${filterLabel} — ${reqs.length} krav`, 14, 25);

      const columns = options.includeEvaluators
        ? [["ID", "Krav", "Kategori", "Prioritet", "Status", "Bevis", "Evaluator"]]
        : [["ID", "Krav", "Kategori", "Prioritet", "Status", "Bevis"]];

      const body = reqs.map((req, i) => {
        const count = getEvidenceCount(req);
        const row = [
          req.requirement_id,
          req.name_no || req.name,
          req.category,
          req.priority === "critical" ? "Kritisk" : req.priority === "high" ? "Høy" : req.priority === "medium" ? "Medium" : "Lav",
          REPORT_STATUS_LABEL[getReportStatus(req)],
          count > 0
            ? `${count} vedlegg`
            : getReportStatus(req) === "fulfilled"
              ? "Uten bevis"
              : "Mangler",

        ];
        if (options.includeEvaluators) row.push(getEvaluatorName(i));
        return row;
      });

      autoTable(doc, {
        startY: 30,
        head: columns,
        body,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold" },
        columnStyles: options.includeEvaluators
          ? { 0: { cellWidth: 16 }, 1: { cellWidth: 45 }, 2: { cellWidth: 24 }, 3: { cellWidth: 16 }, 4: { cellWidth: 30 }, 5: { cellWidth: 18 }, 6: { cellWidth: 33 } }
          : { 0: { cellWidth: 20 }, 1: { cellWidth: 60 }, 2: { cellWidth: 30 }, 3: { cellWidth: 18 }, 4: { cellWidth: 34 }, 5: { cellWidth: 20 } },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        didParseCell: (d) => {
          if (d.section !== "body") return;
          if (d.column.index === 4) {
            const v = d.cell.raw as string;
            if (v === REPORT_STATUS_LABEL.fulfilled) d.cell.styles.textColor = REPORT_STATUS_COLOR.fulfilled;
            else if (v === REPORT_STATUS_LABEL.not_started) d.cell.styles.textColor = REPORT_STATUS_COLOR.not_started;
            else d.cell.styles.textColor = REPORT_STATUS_COLOR.not_applicable;
          }
          if (d.column.index === 5) {
            const v = d.cell.raw as string;
            d.cell.styles.textColor = v === "Mangler" ? [239, 68, 68] : [16, 185, 129];
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

  addMynderFooter(doc);
  doc.save("samsvarsrapport.pdf");
}
