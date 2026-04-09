import jsPDF from "jspdf";
import { MYNDER_LOGO_BASE64 } from "./mynderLogoBase64";

const MYNDER_ORG_NR = "933 036 729";
const MYNDER_URL = "mynder.io";

/**
 * Adds a subtle Mynder-branded footer to every page of a jsPDF document.
 * Call this AFTER all content has been added, just before doc.save().
 */
export function addMynderFooter(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const footerY = pageHeight - 12;

    // Subtle separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);

    // Logo (small, left-aligned)
    try {
      doc.addImage(MYNDER_LOGO_BASE64, "PNG", 14, footerY - 2.5, 18, 5);
    } catch {
      // Fallback text if image fails
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.text("Mynder", 14, footerY + 1);
    }

    // Org number and URL (right-aligned, subtle)
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    const rightText = `Org.nr ${MYNDER_ORG_NR}  •  ${MYNDER_URL}`;
    const textWidth = doc.getTextWidth(rightText);
    doc.text(rightText, pageWidth - 14 - textWidth, footerY + 1);
  }
}
