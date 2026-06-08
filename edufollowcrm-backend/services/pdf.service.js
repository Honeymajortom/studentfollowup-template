// services/pdf.service.js
// Generates a professional payment receipt PDF using pdfkit
const PDFDocument = require("pdfkit");

/**
 * generateReceipt(payment)
 * payment: row from payments JOIN students JOIN courses JOIN fees JOIN users
 * Returns: Promise<Buffer>
 */
function generateReceipt(payment) {
  return new Promise((resolve, reject) => {
    const doc    = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];

    doc.on("data",  c   => chunks.push(c));
    doc.on("end",   ()  => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    // ── Colours & fonts ─────────────────────────────────────
    const BLUE   = "#2563EB";
    const PURPLE = "#7C3AED";
    const DARK   = "#0F172A";
    const GRAY   = "#64748B";
    const LIGHT  = "#F1F5F9";
    const GREEN  = "#16A34A";

    const pending = Math.max(
      0,
      Number(payment.total_fees || 0) -
      Number(payment.total_paid || 0) -
      Number(payment.discount   || 0)
    );

    // ── Header band ─────────────────────────────────────────
    doc.rect(0, 0, 595, 110).fill(BLUE);

    doc
      .fillColor("#FFFFFF")
      .fontSize(22).font("Helvetica-Bold")
      .text(process.env.INSTITUTE_NAME || "EduSpark Institute", 50, 28);

    doc
      .fillColor("#CBD5E1")
      .fontSize(9).font("Helvetica")
      .text(process.env.INSTITUTE_ADDRESS || "MIDC Area, Nagpur, Maharashtra", 50, 56)
      .text(`Ph: ${process.env.INSTITUTE_PHONE || "9876543210"}`, 50, 69);

    // Receipt label top-right
    doc
      .fillColor("#FFFFFF")
      .fontSize(20).font("Helvetica-Bold")
      .text("RECEIPT", 400, 30, { width: 145, align: "right" });
    doc
      .fillColor("#93C5FD")
      .fontSize(9).font("Helvetica")
      .text(`No: ${payment.receipt_no}`, 400, 58, { width: 145, align: "right" })
      .text(`Date: ${fmtDate(payment.payment_date)}`, 400, 71, { width: 145, align: "right" });

    // ── Divider accent strip ─────────────────────────────────
    doc.rect(0, 110, 595, 5).fill(PURPLE);

    // ── Student info box ─────────────────────────────────────
    doc.rect(50, 130, 495, 90).fill(LIGHT).stroke(LIGHT);

    doc
      .fillColor(GRAY)
      .fontSize(7.5).font("Helvetica-Bold")
      .text("STUDENT DETAILS", 65, 140, { characterSpacing: 1 });

    const info = [
      ["Name",       payment.full_name],
      ["Student ID", payment.student_code],
      ["Mobile",     payment.mobile],
      ["Course",     payment.course_name || "—"],
    ];
    info.forEach(([label, value], i) => {
      const x = i < 2 ? 65 : 320;
      const y = 155 + (i % 2) * 18;
      doc.fillColor(GRAY).fontSize(8).font("Helvetica").text(label + ":", x, y);
      doc.fillColor(DARK).fontSize(9).font("Helvetica-Bold").text(value || "—", x + 75, y);
    });

    // ── Payment details ──────────────────────────────────────
    let y = 240;
    doc
      .fillColor(GRAY)
      .fontSize(7.5).font("Helvetica-Bold")
      .text("PAYMENT DETAILS", 50, y, { characterSpacing: 1 });

    y += 14;

    // Table header
    doc.rect(50, y, 495, 22).fill(DARK);
    doc
      .fillColor("#FFFFFF")
      .fontSize(8.5).font("Helvetica-Bold")
      .text("Description",    60, y + 7)
      .text("Mode",          280, y + 7)
      .text("Ref No",        360, y + 7)
      .text("Amount",        470, y + 7, { width: 65, align: "right" });

    y += 22;

    // Single payment row
    doc.rect(50, y, 495, 24).fill("#FFFFFF").stroke("#E2E8F0");
    doc
      .fillColor(DARK)
      .fontSize(9).font("Helvetica")
      .text("Fee Payment", 60, y + 8)
      .text(titleCase(payment.mode || ""), 280, y + 8)
      .text(payment.reference_no || "—", 360, y + 8);
    doc
      .fillColor(GREEN)
      .fontSize(10).font("Helvetica-Bold")
      .text(`₹${fmt(payment.amount)}`, 470, y + 7, { width: 65, align: "right" });

    y += 24;

    // ── Fee summary box ──────────────────────────────────────
    y += 14;
    const summaryRows = [
      ["Total Course Fees",  `₹${fmt(payment.total_fees)}`,   DARK ],
      ["Discount Applied",   `₹${fmt(payment.discount)}`,     GRAY ],
      ["Amount Paid (This)", `₹${fmt(payment.amount)}`,       GREEN],
      ["Total Paid Till Now",`₹${fmt(payment.total_paid)}`,   BLUE ],
      ["Balance Due",        `₹${fmt(pending)}`,              pending > 0 ? "#DC2626" : GREEN],
    ];

    doc
      .fillColor(GRAY)
      .fontSize(7.5).font("Helvetica-Bold")
      .text("FEE SUMMARY", 50, y, { characterSpacing: 1 });

    y += 14;
    summaryRows.forEach(([label, value, colour], i) => {
      const bg = i === summaryRows.length - 1 ? (pending > 0 ? "#FEF2F2" : "#F0FDF4") : i % 2 === 0 ? "#FFFFFF" : LIGHT;
      doc.rect(300, y, 245, 20).fill(bg).stroke("#E2E8F0");
      doc.fillColor(GRAY).fontSize(8.5).font("Helvetica").text(label, 310, y + 6);
      doc.fillColor(colour).fontSize(9).font("Helvetica-Bold").text(value, 300, y + 6, { width: 235, align: "right" });
      y += 20;
    });

    // ── Note ─────────────────────────────────────────────────
    if (payment.note) {
      y += 10;
      doc
        .fillColor(GRAY)
        .fontSize(8).font("Helvetica")
        .text(`Note: ${payment.note}`, 50, y);
    }

    // ── Status stamp ─────────────────────────────────────────
    y += 30;
    const stampColour = pending > 0 ? "#EF4444" : GREEN;
    const stampLabel  = pending > 0 ? "PARTIALLY PAID" : "PAID IN FULL";
    doc
      .rect(50, y, 495, 36)
      .fill(stampColour + "14")
      .stroke(stampColour + "55");
    doc
      .fillColor(stampColour)
      .fontSize(11).font("Helvetica-Bold")
      .text(stampLabel, 50, y + 12, { width: 495, align: "center" });

    // ── Footer ───────────────────────────────────────────────
    y += 56;
    doc.moveTo(50, y).lineTo(545, y).stroke("#E2E8F0");
    y += 10;

    doc
      .fillColor(GRAY)
      .fontSize(8).font("Helvetica")
      .text(`Recorded by: ${payment.recorded_by_name || "System"}`, 50, y)
      .text(`Generated: ${new Date().toLocaleString("en-IN")}`,     50, y + 12);

    doc
      .fillColor(GRAY)
      .fontSize(8)
      .text("This is a computer-generated receipt and does not require a signature.", 50, y, {
        width: 495, align: "right",
      });

    doc.end();
  });
}

// ── helpers ──────────────────────────────────────────────────
function fmt(n)           { return Number(n || 0).toLocaleString("en-IN"); }
function fmtDate(d)       { return d ? new Date(d).toLocaleDateString("en-IN") : "—"; }
function titleCase(s)     { return s ? s[0].toUpperCase() + s.slice(1) : ""; }

module.exports = { generateReceipt };
