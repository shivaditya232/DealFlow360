import prisma from "../config/prisma.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

// ── Data query ────────────────────────────────────────────────────────────────

/**
 * Fetches quotations for the report, applying all optional filters.
 * SALES_REP is always scoped to their own quotations only.
 */
async function fetchReportData(companyId, role, userId, filters) {
  const { dateFrom, dateTo, repId, status, productId, category } = filters;

  // SALES_REP always sees only their own; other roles use the repId filter if supplied
  const resolvedRepId = role === "SALES_REP" ? userId : repId;

  const where = {
    companyId,
    ...(resolvedRepId ? { repId: resolvedRepId } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          createdAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
  };

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, tier: true } },
      rep: { select: { id: true, name: true } },
      lines: {
        include: {
          product: { select: { id: true, name: true, category: true } },
        },
        // Apply productId / category filter at the line level
        ...(productId || category
          ? {
              where: {
                ...(productId ? { productId } : {}),
                ...(category ? { product: { category } } : {}),
              },
            }
          : {}),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If a line-level filter is active, drop quotations with no matching lines
  const filtered =
    productId || category ? quotations.filter((q) => q.lines.length > 0) : quotations;

  return filtered.map((q) => {
    const orderTotal = q.lines.reduce(
      (sum, l) =>
        sum +
        Number(l.quantity) * Number(l.unitPrice) * (1 - Number(l.discountPercent) / 100),
      0
    );
    return {
      id: q.id,
      status: q.status,
      customerName: q.customer.name,
      customerTier: q.customer.tier,
      repName: q.rep.name,
      createdAt: q.createdAt,
      orderTotal: Math.round(orderTotal * 100) / 100,
      lineCount: q.lines.length,
      lines: q.lines.map((l) => ({
        productName: l.product.name,
        category: l.product.category,
        quantity: l.quantity,
        unitPrice: Number(l.unitPrice),
        discountPercent: Number(l.discountPercent),
        lineType: l.lineType,
        lineTotal:
          Math.round(
            Number(l.quantity) *
              Number(l.unitPrice) *
              (1 - Number(l.discountPercent) / 100) *
              100
          ) / 100,
      })),
    };
  });
}

// ── JSON ──────────────────────────────────────────────────────────────────────

export async function generateJsonReport(companyId, role, userId, filters) {
  return fetchReportData(companyId, role, userId, filters);
}

// ── PDF ───────────────────────────────────────────────────────────────────────

/**
 * Streams a PDF report to the Express response stream.
 */
export async function streamPdfReport(companyId, role, userId, filters, res) {
  const data = await fetchReportData(companyId, role, userId, filters);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dealflow360-report-${Date.now()}.pdf"`
  );

  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  // Header
  doc.fontSize(18).font("Helvetica-Bold").text("DealFlow360 — Quotations Report", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(10).font("Helvetica").fillColor("#666666")
    .text(`Generated: ${new Date().toISOString()}  |  Total records: ${data.length}`, { align: "center" });
  doc.moveDown(1);

  if (data.length === 0) {
    doc.fillColor("#333333").fontSize(12).text("No quotations match the selected filters.", { align: "center" });
    doc.end();
    return;
  }

  // Column definitions
  const cols = {
    id:      { x: 40,  w: 90,  label: "Quotation ID" },
    status:  { x: 135, w: 80,  label: "Status" },
    customer:{ x: 220, w: 100, label: "Customer" },
    rep:     { x: 325, w: 90,  label: "Rep" },
    total:   { x: 420, w: 70,  label: "Total (₹)" },
    date:    { x: 495, w: 65,  label: "Created" },
  };

  // Table header
  const headerY = doc.y;
  doc.rect(40, headerY, 520, 16).fill("#4f46e5");
  doc.fillColor("#ffffff").fontSize(8).font("Helvetica-Bold");
  for (const col of Object.values(cols)) {
    doc.text(col.label, col.x, headerY + 4, { width: col.w, lineBreak: false });
  }
  doc.moveDown(1.2);

  // Rows
  let rowIndex = 0;
  for (const q of data) {
    const y = doc.y;

    // Alternate row background
    if (rowIndex % 2 === 0) {
      doc.rect(40, y, 520, 14).fill("#f5f3ff");
    }

    doc.fillColor("#111827").fontSize(7).font("Helvetica");
    doc.text(q.id.slice(-8), cols.id.x, y + 3, { width: cols.id.w, lineBreak: false });
    doc.text(q.status, cols.status.x, y + 3, { width: cols.status.w, lineBreak: false });
    doc.text(q.customerName.slice(0, 18), cols.customer.x, y + 3, { width: cols.customer.w, lineBreak: false });
    doc.text(q.repName.slice(0, 16), cols.rep.x, y + 3, { width: cols.rep.w, lineBreak: false });
    doc.text(q.orderTotal.toFixed(2), cols.total.x, y + 3, { width: cols.total.w, lineBreak: false });
    doc.text(new Date(q.createdAt).toLocaleDateString("en-IN"), cols.date.x, y + 3, { width: cols.date.w, lineBreak: false });

    doc.moveDown(0.9);
    rowIndex++;

    // Page break check
    if (doc.y > 750) {
      doc.addPage();
    }
  }

  doc.end();
}

// ── XLSX ──────────────────────────────────────────────────────────────────────

/**
 * Streams an XLSX workbook to the Express response stream.
 */
export async function streamXlsxReport(companyId, role, userId, filters, res) {
  const data = await fetchReportData(companyId, role, userId, filters);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dealflow360-report-${Date.now()}.xlsx"`
  );

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "DealFlow360";
  workbook.created = new Date();

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summary = workbook.addWorksheet("Summary");

  summary.columns = [
    { header: "Quotation ID", key: "id",           width: 28 },
    { header: "Status",       key: "status",        width: 18 },
    { header: "Customer",     key: "customerName",  width: 24 },
    { header: "Tier",         key: "customerTier",  width: 10 },
    { header: "Rep",          key: "repName",       width: 20 },
    { header: "Order Total",  key: "orderTotal",    width: 14 },
    { header: "Lines",        key: "lineCount",     width: 8  },
    { header: "Created At",   key: "createdAt",     width: 22 },
  ];

  // Header style
  summary.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  data.forEach((q) => {
    summary.addRow({
      id: q.id,
      status: q.status,
      customerName: q.customerName,
      customerTier: q.customerTier,
      repName: q.repName,
      orderTotal: q.orderTotal,
      lineCount: q.lineCount,
      createdAt: new Date(q.createdAt),
    });
  });

  // ── Sheet 2: Line Detail ──────────────────────────────────────────────────
  const lines = workbook.addWorksheet("Line Detail");

  lines.columns = [
    { header: "Quotation ID",     key: "quotationId",     width: 28 },
    { header: "Product",          key: "productName",     width: 28 },
    { header: "Category",         key: "category",        width: 16 },
    { header: "Type",             key: "lineType",        width: 12 },
    { header: "Qty",              key: "quantity",        width: 8  },
    { header: "Unit Price",       key: "unitPrice",       width: 12 },
    { header: "Discount %",       key: "discountPercent", width: 12 },
    { header: "Line Total",       key: "lineTotal",       width: 14 },
  ];

  lines.getRow(1).eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
  });

  data.forEach((q) => {
    q.lines.forEach((l) => {
      lines.addRow({
        quotationId: q.id,
        productName: l.productName,
        category: l.category,
        lineType: l.lineType,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent,
        lineTotal: l.lineTotal,
      });
    });
  });

  await workbook.xlsx.write(res);
}
