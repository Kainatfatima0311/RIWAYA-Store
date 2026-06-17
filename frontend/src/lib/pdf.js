import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BRAND_NAME } from './constants';
import { formatPrice, formatDate } from './format';

// ---------------------------------------------------------------------------
// RIWAYA premium PDF toolkit — branded letterheads, invoices, purchase orders,
// receipts and reports. Built on jsPDF + jspdf-autotable. Deep wine + champagne
// gold brand, serif (Times) wordmark/headings paired with a clean sans body.
// ---------------------------------------------------------------------------

const BRAND = {
  wine: [139, 21, 56], // #8B1538 deep wine
  gold: [201, 169, 110], // #C9A96E champagne gold
  goldDark: [166, 124, 60], // deeper gold for small labels
  ink: [31, 14, 19], // near-black wine
  text: [54, 44, 40], // body text
  muted: [122, 113, 108], // slate/taupe
  line: [225, 216, 205], // soft divider
  rowAlt: [250, 247, 243], // warm cream
  paid: [22, 119, 78], // emerald
  partial: [176, 122, 38], // amber
  unpaid: [183, 45, 54], // red
};

const PAGE_MARGIN = 42;
const SERIF = 'times';
const SANS = 'helvetica';
const TAGLINE = 'PREMIUM PAKISTANI COUTURE';

const setText = (doc, c) => doc.setTextColor(c[0], c[1], c[2]);
const setFill = (doc, c) => doc.setFillColor(c[0], c[1], c[2]);
const setDraw = (doc, c) => doc.setDrawColor(c[0], c[1], c[2]);
const pageW = (doc) => doc.internal.pageSize.getWidth();
const pageH = (doc) => doc.internal.pageSize.getHeight();

const newDoc = () => new jsPDF({ unit: 'pt', format: 'a4' });

/** Ensure enough vertical room — add a page (with a slim brand top) if not. */
function ensureSpace(doc, needed) {
  if (doc.cursorY + needed > pageH(doc) - 56) {
    doc.addPage();
    pageTopBrand(doc);
    doc.cursorY = 64;
  }
}

/** Slim brand mark + gold rule drawn at the top of continuation pages. */
function pageTopBrand(doc) {
  doc.setFont(SERIF, 'bold');
  doc.setFontSize(12);
  setText(doc, BRAND.wine);
  doc.text(BRAND_NAME, PAGE_MARGIN, 36);
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(0.8);
  doc.line(PAGE_MARGIN, 44, pageW(doc) - PAGE_MARGIN, 44);
}

// ===== Shared premium primitives ==========================================

/**
 * Branded letterhead: serif RIWAYA wordmark + gold tagline (left), document
 * type + number + date (right), and a gold hairline rule. Sets doc.cursorY
 * below the rule.
 */
export function addLetterhead(doc, { docType, number, date } = {}) {
  const x = PAGE_MARGIN;
  const right = pageW(doc) - PAGE_MARGIN;
  const top = 54;

  doc.setFont(SERIF, 'bold');
  doc.setFontSize(26);
  setText(doc, BRAND.wine);
  doc.text(BRAND_NAME, x, top);

  doc.setFont(SANS, 'normal');
  doc.setFontSize(7.5);
  setText(doc, BRAND.goldDark);
  doc.text(TAGLINE, x, top + 13, { charSpace: 1.6 });

  let metaY = top - 6;
  if (docType) {
    doc.setFont(SERIF, 'bold');
    doc.setFontSize(19);
    setText(doc, BRAND.ink);
    doc.text(String(docType).toUpperCase(), right, metaY, { align: 'right' });
    metaY += 16;
  }
  doc.setFont(SANS, 'normal');
  doc.setFontSize(9.5);
  setText(doc, BRAND.muted);
  if (number) {
    doc.text(String(number), right, metaY, { align: 'right' });
    metaY += 12;
  }
  if (date) {
    doc.text(String(date), right, metaY, { align: 'right' });
    metaY += 12;
  }

  const ruleY = Math.max(top + 22, metaY);
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(1.3);
  doc.line(x, ruleY, right, ruleY);
  doc.cursorY = ruleY + 24;
}

const STATUS_COLOR = (status) => {
  const s = String(status || '').toLowerCase();
  if (['paid', 'completed', 'delivered', 'fully_received'].includes(s)) return BRAND.paid;
  if (['partial', 'partially_received', 'pending', 'placed', 'confirmed', 'packed', 'shipped', 'out_for_delivery'].includes(s)) return BRAND.partial;
  if (['unpaid', 'failed', 'cancelled'].includes(s)) return BRAND.unpaid;
  return BRAND.muted;
};

/** Colored rounded status pill. Returns its height for layout. */
export function addStatusStamp(doc, status, x, y) {
  if (!status) return 0;
  const label = String(status).replace(/_/g, ' ').toUpperCase();
  const color = STATUS_COLOR(status);
  doc.setFont(SANS, 'bold');
  doc.setFontSize(9);
  const w = doc.getTextWidth(label) + 20;
  const h = 18;
  setFill(doc, color);
  doc.roundedRect(x, y, w, h, 9, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(label, x + w / 2, y + 12, { align: 'center' });
  return h;
}

/** Two side-by-side party blocks: { heading, lines:[] } each. */
export function addParties(doc, left, right) {
  const colW = (pageW(doc) - 2 * PAGE_MARGIN - 24) / 2;
  const x1 = PAGE_MARGIN;
  const x2 = PAGE_MARGIN + colW + 24;
  const top = doc.cursorY;

  const block = (x, party) => {
    let y = top;
    doc.setFont(SANS, 'bold');
    doc.setFontSize(7.5);
    setText(doc, BRAND.goldDark);
    doc.text(String(party.heading || '').toUpperCase(), x, y, { charSpace: 1.2 });
    y += 15;
    (party.lines || []).filter((l) => l != null && String(l).trim() !== '').forEach((ln, i) => {
      doc.setFont(SANS, i === 0 ? 'bold' : 'normal');
      doc.setFontSize(i === 0 ? 10.5 : 9.5);
      setText(doc, i === 0 ? BRAND.ink : BRAND.text);
      const wrapped = doc.splitTextToSize(String(ln), colW);
      doc.text(wrapped, x, y);
      y += wrapped.length * 12;
    });
    return y;
  };

  const yL = block(x1, left);
  const yR = block(x2, right);
  doc.cursorY = Math.max(yL, yR) + 16;
}

/**
 * Right-aligned totals summary. rows: [{ label, value, emphasize?, strong?, rule? }].
 * `rule` draws a gold line above the row; `emphasize` = grand total (wine, bold,
 * larger); `strong` = bold (e.g. balance due).
 */
export function addTotalsBox(doc, rows) {
  const boxW = 240;
  const x = pageW(doc) - PAGE_MARGIN - boxW;
  let y = doc.cursorY;
  rows.filter(Boolean).forEach((r) => {
    if (r.rule) {
      setDraw(doc, BRAND.gold);
      doc.setLineWidth(0.9);
      doc.line(x, y - 4, x + boxW, y - 4);
      y += 8;
    }
    const big = r.emphasize;
    doc.setFont(SANS, big || r.strong ? 'bold' : 'normal');
    doc.setFontSize(big ? 12 : 10);
    setText(doc, big ? BRAND.wine : BRAND.muted);
    doc.text(String(r.label), x, y);
    setText(doc, big ? BRAND.wine : BRAND.ink);
    doc.text(String(r.value), x + boxW, y, { align: 'right' });
    y += big ? 20 : 16;
  });
  doc.cursorY = y;
}

/** Italic "Notes" block. */
export function addNotes(doc, text) {
  if (!text) return;
  ensureSpace(doc, 46);
  doc.setFont(SANS, 'bold');
  doc.setFontSize(7.5);
  setText(doc, BRAND.goldDark);
  doc.text('NOTES', PAGE_MARGIN, doc.cursorY, { charSpace: 1.2 });
  doc.cursorY += 13;
  doc.setFont(SANS, 'italic');
  doc.setFontSize(9);
  setText(doc, BRAND.muted);
  const lines = doc.splitTextToSize(String(text), pageW(doc) - 2 * PAGE_MARGIN);
  doc.text(lines, PAGE_MARGIN, doc.cursorY);
  doc.cursorY += lines.length * 12 + 8;
}

// ===== Report-style helpers (kept API-compatible with Finance/Reports) =====

/** Create a branded report doc (premium letterhead + big title + subtitle). */
export function createReportDoc(title, subtitle) {
  const doc = newDoc();
  addLetterhead(doc, { docType: 'Report', date: formatDate(new Date(), 'PP') });
  doc.setFont(SERIF, 'bold');
  doc.setFontSize(20);
  setText(doc, BRAND.ink);
  doc.text(String(title), PAGE_MARGIN, doc.cursorY);
  doc.cursorY += 16;
  if (subtitle) {
    doc.setFont(SANS, 'normal');
    doc.setFontSize(10);
    setText(doc, BRAND.muted);
    doc.text(String(subtitle), PAGE_MARGIN, doc.cursorY);
    doc.cursorY += 14;
  }
  doc.cursorY += 6;
  return doc;
}

/** Section heading with a short gold underline. */
export function addSection(doc, title) {
  ensureSpace(doc, 34);
  doc.setFont(SERIF, 'bold');
  doc.setFontSize(13);
  setText(doc, BRAND.wine);
  doc.text(String(title), PAGE_MARGIN, doc.cursorY);
  setDraw(doc, BRAND.gold);
  doc.setLineWidth(1.2);
  doc.line(PAGE_MARGIN, doc.cursorY + 4, PAGE_MARGIN + 28, doc.cursorY + 4);
  doc.cursorY += 20;
}

export function addParagraph(doc, text) {
  ensureSpace(doc, 24);
  doc.setFont(SANS, 'normal');
  doc.setFontSize(10);
  setText(doc, BRAND.text);
  const lines = doc.splitTextToSize(String(text), pageW(doc) - 2 * PAGE_MARGIN);
  doc.text(lines, PAGE_MARGIN, doc.cursorY);
  doc.cursorY += lines.length * 13 + 6;
}

export function addKeyValueList(doc, items, labelWidth = 200) {
  ensureSpace(doc, items.length * 16 + 10);
  doc.setFontSize(10);
  for (const [label, value] of items) {
    doc.setFont(SANS, 'normal');
    setText(doc, BRAND.muted);
    doc.text(String(label), PAGE_MARGIN, doc.cursorY);
    doc.setFont(SANS, 'bold');
    setText(doc, BRAND.ink);
    doc.text(String(value), PAGE_MARGIN + labelWidth, doc.cursorY);
    doc.cursorY += 16;
  }
  doc.cursorY += 6;
}

/** Stat-tile grid (2–4 cols) with a thin gold top accent on each tile. */
export function addTileGrid(doc, tiles, cols = 4) {
  const available = pageW(doc) - 2 * PAGE_MARGIN;
  const gap = 12;
  const tileWidth = (available - gap * (cols - 1)) / cols;
  const tileHeight = 62;
  const rows = Math.ceil(tiles.length / cols);
  ensureSpace(doc, rows * (tileHeight + gap) + 10);

  for (let i = 0; i < tiles.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = PAGE_MARGIN + col * (tileWidth + gap);
    const y = doc.cursorY + row * (tileHeight + gap);
    const [label, value, sub] = tiles[i];

    setFill(doc, BRAND.rowAlt);
    doc.roundedRect(x, y, tileWidth, tileHeight, 5, 5, 'F');
    setFill(doc, BRAND.gold);
    doc.rect(x, y, tileWidth, 2.5, 'F');

    doc.setFont(SANS, 'normal');
    doc.setFontSize(8.5);
    setText(doc, BRAND.muted);
    doc.text(String(label), x + 11, y + 19);

    doc.setFont(SERIF, 'bold');
    doc.setFontSize(15);
    setText(doc, BRAND.wine);
    doc.text(String(value), x + 11, y + 40);

    if (sub) {
      doc.setFont(SANS, 'normal');
      doc.setFontSize(8);
      setText(doc, BRAND.muted);
      doc.text(String(sub), x + 11, y + 54);
    }
  }
  doc.cursorY += rows * (tileHeight + gap) + 8;
}

/** Branded table (jspdf-autotable). Right-align numeric columns via options.columnStyles. */
export function addTable(doc, headers, rows, options = {}) {
  autoTable(doc, {
    startY: doc.cursorY,
    head: [headers],
    body: rows,
    theme: 'plain',
    headStyles: {
      fillColor: BRAND.wine,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
    },
    bodyStyles: {
      textColor: BRAND.text,
      fontSize: 9,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
    },
    alternateRowStyles: { fillColor: BRAND.rowAlt },
    styles: { lineColor: BRAND.line, lineWidth: 0.5, overflow: 'linebreak', valign: 'middle' },
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 64 },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) pageTopBrand(doc);
    },
    ...options,
  });
  doc.cursorY = doc.lastAutoTable.finalY + 18;
}

export function addEmpty(doc, message = 'No data available.') {
  doc.setFont(SANS, 'italic');
  doc.setFontSize(9);
  setText(doc, BRAND.muted);
  doc.text(String(message), PAGE_MARGIN, doc.cursorY);
  doc.cursorY += 18;
}

/** Footer with a thin gold rule, brand line and page numbers. Call via savePdf. */
function addFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const w = pageW(doc);
    const h = pageH(doc);
    setDraw(doc, BRAND.line);
    doc.setLineWidth(0.6);
    doc.line(PAGE_MARGIN, h - 30, w - PAGE_MARGIN, h - 30);
    doc.setFont(SANS, 'normal');
    doc.setFontSize(7.5);
    setText(doc, BRAND.muted);
    doc.text(`${BRAND_NAME} · Premium Pakistani Couture`, PAGE_MARGIN, h - 18);
    doc.text(`Page ${i} of ${pageCount}`, w - PAGE_MARGIN, h - 18, { align: 'right' });
    doc.text('Confidential', w / 2, h - 18, { align: 'center' });
  }
}

/** Add footer to every page, then download with a timestamped filename. */
export function savePdf(doc, filename) {
  addFooter(doc);
  const safeName = `${filename}-${formatDate(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(safeName);
}

/** Currency for PDF cells (e.g. "Rs. 25,000"). */
export const fmtPdfPrice = (n) => formatPrice(n).replace('Rs', 'Rs.');

// ===== Document builders ===================================================

const SELLER = { heading: 'Sold By', lines: [BRAND_NAME, 'Premium Pakistani Couture', 'Lahore, Pakistan'] };

/** Premium A4 customer invoice from a full order object. */
export function downloadOrderInvoice(order) {
  if (!order) return;
  const doc = newDoc();
  addLetterhead(doc, { docType: 'Invoice', number: order.orderNumber, date: formatDate(order.orderedAt, 'PP') });

  const ship = order.shippingAddress || {};
  const cust = order.customer && typeof order.customer === 'object' ? order.customer : {};
  addParties(
    doc,
    {
      heading: 'Billed To',
      lines: [
        ship.fullName || cust.name || '—',
        ship.phone || cust.phone,
        cust.email,
        [ship.line1, ship.line2].filter(Boolean).join(', '),
        [ship.city, ship.province].filter(Boolean).join(', '),
      ],
    },
    SELLER
  );

  // Order meta line (type) + payment status pill
  doc.setFont(SANS, 'normal');
  doc.setFontSize(9.5);
  setText(doc, BRAND.muted);
  doc.text(`${order.orderType === 'walk_in' ? 'Walk-in' : 'Online'} order`, PAGE_MARGIN, doc.cursorY);
  addStatusStamp(doc, order.paymentStatus, pageW(doc) - PAGE_MARGIN - (doc.getTextWidth(String(order.paymentStatus || '').replace(/_/g, ' ').toUpperCase()) + 20), doc.cursorY - 12);
  doc.cursorY += 16;

  const rows = (order.items || []).map((it) => [
    [it.productName, it.variantLabel, it.productSku ? `SKU: ${it.productSku}` : '']
      .filter(Boolean)
      .join('\n'),
    String(it.quantity ?? ''),
    fmtPdfPrice(it.unitPrice),
    fmtPdfPrice(it.totalPrice),
  ]);
  if (!rows.length) addEmpty(doc, 'This order has no line items.');
  else
    addTable(doc, ['Item', 'Qty', 'Unit Price', 'Amount'], rows, {
      columnStyles: {
        1: { halign: 'right', cellWidth: 45 },
        2: { halign: 'right', cellWidth: 95 },
        3: { halign: 'right', cellWidth: 95 },
      },
    });

  const balance = Math.max(0, (order.grandTotal || 0) - (order.paidAmount || 0));
  addTotalsBox(doc, [
    { label: 'Subtotal', value: fmtPdfPrice(order.subtotal) },
    order.discount ? { label: 'Discount', value: `- ${fmtPdfPrice(order.discount)}` } : null,
    order.taxAmount ? { label: 'Tax', value: fmtPdfPrice(order.taxAmount) } : null,
    order.shippingFee ? { label: 'Shipping', value: fmtPdfPrice(order.shippingFee) } : null,
    { label: 'Grand Total', value: fmtPdfPrice(order.grandTotal), emphasize: true, rule: true },
    { label: 'Paid', value: fmtPdfPrice(order.paidAmount) },
    { label: 'Balance Due', value: fmtPdfPrice(balance), strong: true },
  ]);

  doc.cursorY += 8;
  addNotes(
    doc,
    'Thank you for shopping with RIWAYA. For returns or exchanges, please contact us within 7 days of delivery with your order number. Prices are in PKR and inclusive where applicable.'
  );

  savePdf(doc, `riwaya-invoice-${order.orderNumber || 'order'}`);
}

/** Premium purchase order document from a full PO object. */
export function downloadPurchaseOrderPdf(po) {
  if (!po) return;
  const doc = newDoc();
  addLetterhead(doc, { docType: 'Purchase Order', number: po.poNumber, date: formatDate(po.orderDate, 'PP') });

  const sup = po.supplier || {};
  addParties(
    doc,
    {
      heading: 'Supplier',
      lines: [sup.name || '—', sup.code, sup.phone || sup.contactPhone, sup.email || sup.contactEmail, sup.address],
    },
    { heading: 'Ship To', lines: [BRAND_NAME, 'Premium Pakistani Couture', 'Lahore, Pakistan'] }
  );

  doc.setFont(SANS, 'normal');
  doc.setFontSize(9.5);
  setText(doc, BRAND.muted);
  doc.text(`Status: ${String(po.status || '').replace(/_/g, ' ')}`, PAGE_MARGIN, doc.cursorY);
  addStatusStamp(doc, po.paymentStatus, pageW(doc) - PAGE_MARGIN - (doc.getTextWidth(String(po.paymentStatus || '').replace(/_/g, ' ').toUpperCase()) + 20), doc.cursorY - 12);
  doc.cursorY += 16;

  const rows = (po.items || []).map((it) => [
    [it.name, it.variant].filter(Boolean).join('\n'),
    `${it.quantityOrdered ?? ''} ${it.unit || ''}`.trim(),
    fmtPdfPrice(it.unitPrice),
    fmtPdfPrice(it.totalPrice),
  ]);
  if (!rows.length) addEmpty(doc, 'This purchase order has no line items.');
  else
    addTable(doc, ['Item', 'Qty', 'Unit Price', 'Amount'], rows, {
      columnStyles: {
        1: { halign: 'right', cellWidth: 70 },
        2: { halign: 'right', cellWidth: 90 },
        3: { halign: 'right', cellWidth: 90 },
      },
    });

  const balance = Math.max(0, (po.grandTotal || 0) - (po.paidAmount || 0));
  addTotalsBox(doc, [
    { label: 'Subtotal', value: fmtPdfPrice(po.subtotal) },
    po.discount ? { label: 'Discount', value: `- ${fmtPdfPrice(po.discount)}` } : null,
    po.taxAmount ? { label: `Tax${po.taxRate ? ` (${po.taxRate}%)` : ''}`, value: fmtPdfPrice(po.taxAmount) } : null,
    po.shippingCost ? { label: 'Shipping', value: fmtPdfPrice(po.shippingCost) } : null,
    { label: 'Grand Total', value: fmtPdfPrice(po.grandTotal), emphasize: true, rule: true },
    { label: 'Paid', value: fmtPdfPrice(po.paidAmount) },
    { label: 'Balance Due', value: fmtPdfPrice(balance), strong: true },
  ]);

  doc.cursorY += 8;
  addNotes(doc, 'Please supply the items above per the agreed terms. Reference this PO number on the delivery note and invoice.');

  savePdf(doc, `riwaya-po-${po.poNumber || 'po'}`);
}

/** Compact branded payment receipt. */
export function downloadPaymentReceipt(payment) {
  if (!payment) return;
  const doc = newDoc();
  addLetterhead(doc, { docType: 'Receipt', number: payment.paymentNumber, date: formatDate(payment.paidAt, 'PPp') });

  const cust = payment.customer && typeof payment.customer === 'object' ? payment.customer : {};
  const orderNo = payment.order && typeof payment.order === 'object' ? payment.order.orderNumber : payment.order;
  addParties(
    doc,
    { heading: 'Received From', lines: [cust.name || '—', cust.phone, cust.email] },
    { heading: 'Reference', lines: [orderNo ? `Order ${orderNo}` : null, payment.transactionId || payment.referenceNumber, payment.method ? `via ${String(payment.method).replace(/_/g, ' ')}` : null].filter(Boolean) }
  );

  // Big amount + status
  doc.setFont(SANS, 'normal');
  doc.setFontSize(9);
  setText(doc, BRAND.muted);
  doc.text('AMOUNT RECEIVED', PAGE_MARGIN, doc.cursorY, { charSpace: 1 });
  doc.cursorY += 22;
  doc.setFont(SERIF, 'bold');
  doc.setFontSize(26);
  setText(doc, BRAND.wine);
  doc.text(fmtPdfPrice(payment.amount), PAGE_MARGIN, doc.cursorY);
  addStatusStamp(doc, payment.status, pageW(doc) - PAGE_MARGIN - (doc.getTextWidth(String(payment.status || '').replace(/_/g, ' ').toUpperCase()) + 20), doc.cursorY - 16);
  doc.cursorY += 16;

  addNotes(doc, 'This is a computer-generated receipt and does not require a signature. Thank you for your payment.');

  savePdf(doc, `riwaya-receipt-${payment.paymentNumber || 'payment'}`);
}
