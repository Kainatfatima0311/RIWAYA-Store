import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { BRAND_NAME } from './constants';
import { formatPrice } from './format';

// RIWAYA brand colors (deep wine + champagne gold)
const BRAND = {
  primary: [139, 21, 56],      // #8B1538
  accent: [201, 169, 110],     // #C9A96E
  text: [31, 14, 19],          // dark wine
  muted: [107, 114, 128],      // slate
  rowAlt: [250, 247, 243],     // warm cream
};

const PAGE_MARGIN = 40;

/**
 * Create a new branded PDF document.
 * Returns the jsPDF instance with a `cursorY` helper to track vertical position.
 */
export function createReportDoc(title, subtitle) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Brand header bar
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 56, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(BRAND_NAME, PAGE_MARGIN, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${format(new Date(), 'PPpp')}`, pageWidth - PAGE_MARGIN, 36, { align: 'right' });

  // Title
  doc.setTextColor(...BRAND.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, PAGE_MARGIN, 92);

  let cursorY = 104;
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text(subtitle, PAGE_MARGIN, cursorY);
    cursorY += 16;
  }

  // Decorative gold accent line
  doc.setDrawColor(...BRAND.accent);
  doc.setLineWidth(1.5);
  doc.line(PAGE_MARGIN, cursorY + 4, pageWidth - PAGE_MARGIN, cursorY + 4);

  doc.cursorY = cursorY + 22;
  return doc;
}

/** Section heading inside the report. */
export function addSection(doc, title) {
  ensureSpace(doc, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND.primary);
  doc.text(title, PAGE_MARGIN, doc.cursorY);
  doc.cursorY += 18;
}

/** Plain paragraph text. */
export function addParagraph(doc, text) {
  ensureSpace(doc, 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.text);
  const pageWidth = doc.internal.pageSize.getWidth();
  const lines = doc.splitTextToSize(text, pageWidth - 2 * PAGE_MARGIN);
  doc.text(lines, PAGE_MARGIN, doc.cursorY);
  doc.cursorY += lines.length * 13 + 6;
}

/** Two-column key/value list — great for summary stats. */
export function addKeyValueList(doc, items, labelWidth = 200) {
  ensureSpace(doc, items.length * 16 + 10);
  doc.setFontSize(10);
  for (const [label, value] of items) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BRAND.muted);
    doc.text(String(label), PAGE_MARGIN, doc.cursorY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BRAND.text);
    doc.text(String(value), PAGE_MARGIN + labelWidth, doc.cursorY);
    doc.cursorY += 16;
  }
  doc.cursorY += 6;
}

/** Tile grid (e.g. dashboard-style stat cards). 2 or 4 columns. */
export function addTileGrid(doc, tiles, cols = 4) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const available = pageWidth - 2 * PAGE_MARGIN;
  const gap = 10;
  const tileWidth = (available - gap * (cols - 1)) / cols;
  const tileHeight = 58;
  const rows = Math.ceil(tiles.length / cols);
  ensureSpace(doc, rows * (tileHeight + gap) + 10);

  for (let i = 0; i < tiles.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAGE_MARGIN + col * (tileWidth + gap);
    const y = doc.cursorY + row * (tileHeight + gap);
    const [label, value, sub] = tiles[i];

    doc.setFillColor(...BRAND.rowAlt);
    doc.roundedRect(x, y, tileWidth, tileHeight, 4, 4, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text(String(label), x + 10, y + 16);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...BRAND.primary);
    doc.text(String(value), x + 10, y + 36);

    if (sub) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...BRAND.muted);
      doc.text(String(sub), x + 10, y + 50);
    }
  }
  doc.cursorY += rows * (tileHeight + gap) + 6;
}

/** Branded table using jspdf-autotable. */
export function addTable(doc, headers, rows, options = {}) {
  autoTable(doc, {
    startY: doc.cursorY,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: BRAND.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    bodyStyles: { textColor: BRAND.text, fontSize: 9 },
    styles: { cellPadding: 6, lineColor: [230, 224, 216] },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    didDrawPage: () => {
      // re-draw the brand header bar on every new page if needed
    },
    ...options,
  });
  doc.cursorY = doc.lastAutoTable.finalY + 18;
}

/** Empty-state message inside the report. */
export function addEmpty(doc, message = 'No data available.') {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(message, PAGE_MARGIN, doc.cursorY);
  doc.cursorY += 18;
}

/** Add page numbers + brand footer to every page. Call before save(). */
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `${BRAND_NAME} · Confidential · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 18,
      { align: 'center' }
    );
  }
}

/** Ensure enough vertical space — add a new page if not. */
function ensureSpace(doc, needed) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (doc.cursorY + needed > pageHeight - 50) {
    doc.addPage();
    doc.cursorY = 50;
  }
}

/** Save and trigger download. */
export function savePdf(doc, filename) {
  addFooter(doc);
  const safeName = `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(safeName);
}

/** Convenience: format currency for PDF cells. */
export const fmtPdfPrice = (n) => formatPrice(n).replace('Rs', 'Rs.');
