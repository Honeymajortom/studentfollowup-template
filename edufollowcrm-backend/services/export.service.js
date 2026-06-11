// services/export.service.js
// CSV and PDF export helpers for students and fees lists
const PDFDocument = require("pdfkit");

const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";
const DARK   = "#0F172A";
const GRAY   = "#64748B";
const LIGHT  = "#F8FAFC";
const GREEN  = "#16A34A";
const RED    = "#DC2626";

// ── CSV helpers ────────────────────────────────────────────────

function esc(val) {
  if (val == null) return "";
  const s = String(val);
  return (s.includes(",") || s.includes('"') || s.includes("\n"))
    ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(fields) { return fields.map(esc).join(","); }

function inr(n) { return Number(n || 0).toLocaleString("en-IN"); }
function d(v)   { return v ? new Date(v).toLocaleDateString("en-IN") : ""; }

// ── Students CSV ───────────────────────────────────────────────

function studentsToCSV(rows) {
  const hdr = [
    "Student Code","Full Name","Email","Mobile","Parent Mobile",
    "Course","Batch Timing","Counselor","Enrolled At","Status",
    "Total Fees","Paid","Discount","Pending","Fees Status","Due Date","Next Follow-up",
  ];
  const lines = [csvRow(hdr)];
  for (const s of rows) {
    const pending = Math.max(0, Number(s.total_fees||0) - Number(s.paid||0) - Number(s.discount||0));
    lines.push(csvRow([
      s.student_code, s.full_name, s.email||"", s.mobile, s.parent_mobile||"",
      s.course_name||"", s.batch_timing||"", s.counselor_name||"",
      d(s.enrolled_at), s.status||"",
      s.total_fees||"", s.paid||"", s.discount||"", pending,
      s.fees_status||"", d(s.due_date), d(s.next_followup),
    ]));
  }
  return lines.join("\n");
}

// ── Fees CSV ───────────────────────────────────────────────────

function feesToCSV(rows) {
  const hdr = [
    "Student Code","Student Name","Mobile","Course",
    "Total Fees","Paid","Discount","Pending","Due Date","Status",
  ];
  const lines = [csvRow(hdr)];
  for (const s of rows) {
    const pending = Math.max(0, Number(s.total_fees||0) - Number(s.paid||0) - Number(s.discount||0));
    lines.push(csvRow([
      s.student_code, s.full_name, s.mobile, s.course_name||"",
      s.total_fees||"", s.paid||"", s.discount||"", pending,
      d(s.due_date), s.fees_status||"",
    ]));
  }
  return lines.join("\n");
}

// ── PDF shared helpers ─────────────────────────────────────────

function pdfHeader(doc, title, subtitle) {
  doc.rect(0, 0, 595, 90).fill(BLUE);
  doc
    .fillColor("#FFFFFF").fontSize(17).font("Helvetica-Bold")
    .text(process.env.INSTITUTE_NAME || "EduSpark Institute", 40, 22);
  doc
    .fillColor("#CBD5E1").fontSize(8).font("Helvetica")
    .text(process.env.INSTITUTE_ADDRESS || "MIDC Area, Nagpur, Maharashtra", 40, 46)
    .text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 58);
  doc
    .fillColor("#FFFFFF").fontSize(14).font("Helvetica-Bold")
    .text(title, 40, 28, { width: 515, align: "right" });
  doc
    .fillColor("#93C5FD").fontSize(8).font("Helvetica")
    .text(subtitle, 40, 50, { width: 515, align: "right" });
  doc.rect(0, 90, 595, 4).fill(PURPLE);
  return 110;
}

const ROW_H = 18;

function tblHeader(doc, y, cols) {
  doc.rect(40, y, 515, 20).fill(DARK);
  doc.fillColor("#FFFFFF").fontSize(7.5).font("Helvetica-Bold");
  let x = 40;
  for (const col of cols) {
    doc.text(col.label, x + 3, y + 6, { width: col.w - 4, align: col.align || "left", lineBreak: false });
    x += col.w;
  }
  return y + 20;
}

function tblRow(doc, y, cols, values, shade) {
  doc.rect(40, y, 515, ROW_H).fill(shade ? LIGHT : "#FFFFFF").stroke("#E8EEF4");
  doc.fontSize(7.5).font("Helvetica");
  let x = 40;
  for (let i = 0; i < cols.length; i++) {
    doc.fillColor(cols[i].color || DARK);
    doc.text(String(values[i] ?? "—"), x + 3, y + 5, { width: cols[i].w - 4, align: cols[i].align || "left", lineBreak: false });
    x += cols[i].w;
  }
  return y + ROW_H;
}

// ── Students PDF ───────────────────────────────────────────────

function studentsToPDF(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];
    doc.on("data",  c   => chunks.push(c));
    doc.on("end",   ()  => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    let y = pdfHeader(doc, "Student List", `${rows.length} student${rows.length !== 1 ? "s" : ""}`);

    const cols = [
      { label: "#",      w:  25 },
      { label: "Code",   w:  65 },
      { label: "Name",   w: 130 },
      { label: "Mobile", w:  85 },
      { label: "Course", w: 110 },
      { label: "Status", w:  60 },
      { label: "Fees",   w:  40, align: "right" },
    ];

    y = tblHeader(doc, y, cols);

    rows.forEach((s, i) => {
      if (y > 790) { doc.addPage(); y = 30; y = tblHeader(doc, y, cols); }
      const fColor = s.fees_status === "paid" ? GREEN : s.fees_status === "overdue" ? RED : GRAY;
      y = tblRow(doc, y, [
        ...cols.slice(0, 6),
        { ...cols[6], color: fColor },
      ], [
        i + 1, s.student_code, s.full_name, s.mobile,
        s.course_name || "—", s.status || "—", s.fees_status || "—",
      ], i % 2 === 0);
    });

    doc.fillColor(GRAY).fontSize(7.5).font("Helvetica")
      .text(`Total: ${rows.length} students`, 40, y + 10);
    doc.end();
  });
}

// ── Fees PDF ───────────────────────────────────────────────────

function feesToPDF(rows) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 0 });
    const chunks = [];
    doc.on("data",  c   => chunks.push(c));
    doc.on("end",   ()  => resolve(Buffer.concat(chunks)));
    doc.on("error", err => reject(err));

    const totalCollected = rows.reduce((s, r) => s + Number(r.paid || 0), 0);
    const totalPending   = rows.reduce((s, r) => s + Math.max(0,
      Number(r.total_fees||0) - Number(r.paid||0) - Number(r.discount||0)), 0);

    let y = pdfHeader(
      doc, "Fees Report",
      `${rows.length} records · Collected ₹${inr(totalCollected)} · Pending ₹${inr(totalPending)}`
    );

    const cols = [
      { label: "#",        w:  25 },
      { label: "Student",  w: 130 },
      { label: "Course",   w: 105 },
      { label: "Total",    w:  65, align: "right" },
      { label: "Paid",     w:  65, align: "right" },
      { label: "Pending",  w:  65, align: "right" },
      { label: "Status",   w:  60 },
    ];

    y = tblHeader(doc, y, cols);

    rows.forEach((s, i) => {
      if (y > 790) { doc.addPage(); y = 30; y = tblHeader(doc, y, cols); }
      const pending = Math.max(0,
        Number(s.total_fees||0) - Number(s.paid||0) - Number(s.discount||0));
      const sColor = s.fees_status === "paid" ? GREEN : s.fees_status === "overdue" ? RED : GRAY;
      y = tblRow(doc, y, [
        ...cols.slice(0, 5),
        { ...cols[5], color: pending > 0 ? RED : GREEN },
        { ...cols[6], color: sColor },
      ], [
        i + 1, s.full_name, s.course_name || "—",
        `₹${inr(s.total_fees)}`, `₹${inr(s.paid)}`, `₹${inr(pending)}`,
        s.fees_status || "—",
      ], i % 2 === 0);
    });

    doc.fillColor(GRAY).fontSize(7.5).font("Helvetica")
      .text(`Total: ${rows.length} records  ·  Collected: ₹${inr(totalCollected)}  ·  Pending: ₹${inr(totalPending)}`, 40, y + 10);
    doc.end();
  });
}

module.exports = { studentsToCSV, feesToCSV, studentsToPDF, feesToPDF };
