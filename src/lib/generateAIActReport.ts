import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addMynderFooter } from '@/lib/pdfBranding';
import type { AIActReportData, AISystemData, AIProcessData } from '@/hooks/useAIActReportData';

const RISK_LABELS: Record<string, string> = {
  unacceptable: 'Uakseptabel risiko',
  high: 'Høyrisiko',
  limited: 'Begrenset risiko',
  minimal: 'Minimal risiko',
  unknown: 'Ikke vurdert',
};

const RISK_COLORS: Record<string, [number, number, number]> = {
  unacceptable: [220, 38, 38],
  high: [234, 88, 12],
  limited: [202, 138, 4],
  minimal: [22, 163, 74],
  unknown: [107, 114, 128],
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function generateAIActReport(data: AIActReportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Helper function to add page if needed
  const checkPageBreak = (requiredSpace: number = 40) => {
    if (yPosition + requiredSpace > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      yPosition = 20;
    }
  };

  // Title Page
  doc.setFontSize(24);
  doc.setTextColor(30, 64, 175);
  doc.text('AI Act Compliance Rapport', pageWidth / 2, 60, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(100);
  doc.text(data.companyName, pageWidth / 2, 75, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`Bransje: ${data.companyIndustry}`, pageWidth / 2, 90, { align: 'center' });
  doc.text(`Generert: ${formatDate(data.generatedAt)}`, pageWidth / 2, 100, { align: 'center' });

  // Summary box
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(20, 120, pageWidth - 40, 60, 3, 3, 'F');

  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text('Sammendrag', 30, 135);

  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.text(`Totalt antall systemer: ${data.summary.totalSystems}`, 30, 150);
  doc.text(`Systemer med AI: ${data.summary.systemsWithAI}`, 30, 160);
  doc.text(`Totalt antall prosesser: ${data.summary.totalProcesses}`, 110, 150);
  doc.text(`Prosesser med AI: ${data.summary.processesWithAI}`, 110, 160);
  doc.text(`Compliance-rate: ${data.summary.complianceRate}%`, 30, 170);

  // Risk distribution
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Risikofordeling iht. AI Act', 20, yPosition);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setTextColor(60);

  Object.entries(data.summary.riskDistribution).forEach(([risk, count]) => {
    const color = RISK_COLORS[risk] || RISK_COLORS.unknown;
    doc.setFillColor(color[0], color[1], color[2]);
    doc.circle(25, yPosition - 2, 3, 'F');
    doc.text(`${RISK_LABELS[risk] || risk}: ${count}`, 32, yPosition);
    yPosition += 10;
  });

  // Systems with AI
  yPosition += 10;
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Systemer med AI-funksjonalitet', 20, yPosition);
  yPosition += 10;

  const systemsWithAI = data.systems.filter(s => s.hasAI);

  if (systemsWithAI.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Ingen systemer med AI-funksjonalitet registrert.', 20, yPosition);
    yPosition += 15;
  } else {
    const systemTableData = systemsWithAI.map(system => [
      system.systemName,
      system.workAreaName || '-',
      RISK_LABELS[system.riskCategory || 'unknown'],
      system.aiProvider || '-',
      system.humanOversightLevel || '-',
      system.complianceStatus || 'Ikke vurdert',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['System', 'Arbeidsområde', 'Risiko', 'AI-leverandør', 'Menneskelig tilsyn', 'Status']],
      body: systemTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Detailed system information
  systemsWithAI.forEach((system, index) => {
    checkPageBreak(80);

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(`${index + 1}. ${system.systemName}`, 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setTextColor(60);

    const details = [
      `Kategori: ${system.systemCategory || '-'}`,
      `Leverandør: ${system.vendor || '-'}`,
      `AI-leverandør: ${system.aiProvider || '-'}`,
      `Risikokategori: ${RISK_LABELS[system.riskCategory || 'unknown']}`,
    ];

    details.forEach(detail => {
      doc.text(detail, 25, yPosition);
      yPosition += 6;
    });

    if (system.purposeDescription) {
      checkPageBreak(20);
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text('Formålsbeskrivelse:', 25, yPosition);
      yPosition += 5;
      const purposeLines = doc.splitTextToSize(system.purposeDescription, pageWidth - 50);
      doc.text(purposeLines, 25, yPosition);
      yPosition += purposeLines.length * 5 + 3;
    }

    if (system.aiFeatures.length > 0) {
      doc.text(`AI-funksjoner: ${system.aiFeatures.join(', ')}`, 25, yPosition);
      yPosition += 6;
    }

    if (system.affectedPersons.length > 0) {
      doc.text(`Berørte personer: ${system.affectedPersons.join(', ')}`, 25, yPosition);
      yPosition += 6;
    }

    if (system.riskJustification) {
      checkPageBreak(20);
      doc.text('Risikobegrunnelse:', 25, yPosition);
      yPosition += 5;
      const justificationLines = doc.splitTextToSize(system.riskJustification, pageWidth - 50);
      doc.text(justificationLines, 25, yPosition);
      yPosition += justificationLines.length * 5 + 3;
    }

    // Compliance details
    doc.text(`Transparens implementert: ${system.transparencyImplemented ? 'Ja' : 'Nei'}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Logging aktivert: ${system.loggingEnabled ? 'Ja' : 'Nei'}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Data brukt til trening: ${system.dataUsedForTraining ? 'Ja' : 'Nei'}`, 25, yPosition);
    yPosition += 6;

    if (system.humanOversightDescription) {
      checkPageBreak(20);
      doc.text('Menneskelig tilsyn:', 25, yPosition);
      yPosition += 5;
      const oversightLines = doc.splitTextToSize(system.humanOversightDescription, pageWidth - 50);
      doc.text(oversightLines, 25, yPosition);
      yPosition += oversightLines.length * 5 + 3;
    }

    doc.text(`Siste vurdering: ${formatDate(system.lastAssessmentDate)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Neste vurdering: ${formatDate(system.nextAssessmentDate)}`, 25, yPosition);
    yPosition += 15;
  });

  // Processes with AI
  checkPageBreak(50);
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Prosesser med AI-funksjonalitet', 20, yPosition);
  yPosition += 10;

  const processesWithAI = data.processes.filter(p => p.hasAI);

  if (processesWithAI.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Ingen prosesser med AI-funksjonalitet registrert.', 20, yPosition);
    yPosition += 15;
  } else {
    const processTableData = processesWithAI.map(process => [
      process.processName,
      process.systemName || '-',
      RISK_LABELS[process.riskCategory || 'unknown'],
      process.automatedDecisions ? 'Ja' : 'Nei',
      process.humanOversightLevel || '-',
      process.complianceStatus || 'Ikke vurdert',
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Prosess', 'System', 'Risiko', 'Auto. beslutninger', 'Menneskelig tilsyn', 'Status']],
      body: processTableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
      },
    });

    yPosition = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
  }

  // Detailed process information
  processesWithAI.forEach((process, index) => {
    checkPageBreak(80);

    doc.setFontSize(12);
    doc.setTextColor(30, 64, 175);
    doc.text(`${index + 1}. ${process.processName}`, 20, yPosition);
    yPosition += 8;

    doc.setFontSize(9);
    doc.setTextColor(60);

    const details = [
      `System: ${process.systemName || '-'}`,
      `Arbeidsområde: ${process.workAreaName || '-'}`,
      `Risikokategori: ${RISK_LABELS[process.riskCategory || 'unknown']}`,
      `Automatiserte beslutninger: ${process.automatedDecisions ? 'Ja' : 'Nei'}`,
    ];

    details.forEach(detail => {
      doc.text(detail, 25, yPosition);
      yPosition += 6;
    });

    if (process.processDescription) {
      checkPageBreak(20);
      doc.text('Prosessbeskrivelse:', 25, yPosition);
      yPosition += 5;
      const descLines = doc.splitTextToSize(process.processDescription, pageWidth - 50);
      doc.text(descLines, 25, yPosition);
      yPosition += descLines.length * 5 + 3;
    }

    if (process.aiPurpose) {
      checkPageBreak(20);
      doc.text('AI-formål:', 25, yPosition);
      yPosition += 5;
      const purposeLines = doc.splitTextToSize(process.aiPurpose, pageWidth - 50);
      doc.text(purposeLines, 25, yPosition);
      yPosition += purposeLines.length * 5 + 3;
    }

    if (process.aiFeatures.length > 0) {
      doc.text(`AI-funksjoner: ${process.aiFeatures.join(', ')}`, 25, yPosition);
      yPosition += 6;
    }

    if (process.affectedPersons.length > 0) {
      doc.text(`Berørte personer: ${process.affectedPersons.join(', ')}`, 25, yPosition);
      yPosition += 6;
    }

    if (process.decisionImpact) {
      checkPageBreak(20);
      doc.text('Beslutningspåvirkning:', 25, yPosition);
      yPosition += 5;
      const impactLines = doc.splitTextToSize(process.decisionImpact, pageWidth - 50);
      doc.text(impactLines, 25, yPosition);
      yPosition += impactLines.length * 5 + 3;
    }

    if (process.riskJustification) {
      checkPageBreak(20);
      doc.text('Risikobegrunnelse:', 25, yPosition);
      yPosition += 5;
      const justificationLines = doc.splitTextToSize(process.riskJustification, pageWidth - 50);
      doc.text(justificationLines, 25, yPosition);
      yPosition += justificationLines.length * 5 + 3;
    }

    if (process.humanOversightDescription) {
      checkPageBreak(20);
      doc.text('Menneskelig tilsyn:', 25, yPosition);
      yPosition += 5;
      const oversightLines = doc.splitTextToSize(process.humanOversightDescription, pageWidth - 50);
      doc.text(oversightLines, 25, yPosition);
      yPosition += oversightLines.length * 5 + 3;
    }

    doc.text(`Siste gjennomgang: ${formatDate(process.lastReviewDate)}`, 25, yPosition);
    yPosition += 6;
    doc.text(`Neste gjennomgang: ${formatDate(process.nextReviewDate)}`, 25, yPosition);
    yPosition += 15;
  });

  // Compliance recommendations
  checkPageBreak(50);
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text('Anbefalinger', 20, yPosition);
  yPosition += 10;

  doc.setFontSize(10);
  doc.setTextColor(60);

  const recommendations: string[] = [];

  if (data.summary.riskDistribution.unacceptable > 0) {
    recommendations.push('• KRITISK: Det finnes systemer/prosesser med uakseptabel risiko. Disse må umiddelbart stoppes eller fundamentalt endres.');
  }

  if (data.summary.riskDistribution.high > 0) {
    recommendations.push('• Høyrisiko AI-systemer krever conformity assessment og registrering i EU-databasen før bruk.');
  }

  if (data.summary.riskDistribution.unknown > 0) {
    recommendations.push('• Det finnes AI-bruk som ikke er risikovurdert. Gjennomfør risikovurdering for alle AI-systemer.');
  }

  const noTransparency = systemsWithAI.filter(s => !s.transparencyImplemented).length;
  if (noTransparency > 0) {
    recommendations.push(`• ${noTransparency} system(er) mangler transparenskrav. Implementer informasjon til berørte personer.`);
  }

  const noLogging = systemsWithAI.filter(s => !s.loggingEnabled).length;
  if (noLogging > 0) {
    recommendations.push(`• ${noLogging} system(er) mangler logging. Aktiver logging for sporbarhet og revisjon.`);
  }

  if (data.summary.complianceRate < 100) {
    recommendations.push(`• Compliance-raten er ${data.summary.complianceRate}%. Fullfør vurdering av alle AI-systemer.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('• Ingen kritiske funn. Fortsett med regelmessige gjennomganger og oppdateringer.');
  }

  recommendations.forEach(rec => {
    checkPageBreak(15);
    const lines = doc.splitTextToSize(rec, pageWidth - 40);
    doc.text(lines, 20, yPosition);
    yPosition += lines.length * 6 + 3;
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Side ${i} av ${pageCount} | AI Act Compliance Rapport | ${data.companyName}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Download
  const fileName = `AI-Act-Rapport_${data.companyName.replace(/\s+/g, '-')}_${new Date().toISOString().split('T')[0]}.pdf`;
  addMynderFooter(doc);
  doc.save(fileName);
}
