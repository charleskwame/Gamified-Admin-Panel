import { jsPDF } from "jspdf";

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_LABEL = {
  computer_architecture: "Computer Architecture",
  computer_networking: "Computer Networking",
  software_engineering: "Software Engineering",
};

const PRIORITY_COLOR = {
  high: { r: 220, g: 38, b: 38 }, // red
  medium: { r: 217, g: 119, b: 6 }, // amber
  low: { r: 5, g: 150, b: 105 }, // green
};

const PRIMARY = { r: 0, g: 63, b: 145 }; // #003F91
const WHITE = { r: 255, g: 255, b: 255 };
const DARK = { r: 0, g: 63, b: 145 }; // #003F91 — main text
const MUTED = { r: 80, g: 110, b: 155 }; // muted blue-grey
const LIGHT_BG = { r: 236, g: 248, b: 248 }; // #ecf8f8
const BORDER = { r: 180, g: 215, b: 215 }; // soft teal border

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setColor(doc, { r, g, b }, type = "text") {
  if (type === "text") doc.setTextColor(r, g, b);
  else if (type === "fill") doc.setFillColor(r, g, b);
  else doc.setDrawColor(r, g, b);
}

function drawHRule(doc, x, y, w, { r, g, b } = BORDER) {
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.3);
  doc.line(x, y, x + w, y);
}

// ─── Main export function ─────────────────────────────────────────────────────

export function exportLearningResourcesPdf(materials, course, lecturerName) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PAGE_W = doc.internal.pageSize.getWidth();
  const PAGE_H = doc.internal.pageSize.getHeight();
  const ML = 20;                       // left margin
  const MR = 20;                       // right margin
  const MT = 20;                       // top margin (after header)
  const FOOTER = 18;                       // reserved space at bottom
  const CW = PAGE_W - ML - MR;        // usable content width
  const LINE_H = 5;                        // base line height (mm)
  const SAFE_BOTTOM = PAGE_H - FOOTER;

  const courseLabel = COURSE_LABEL[course] || (course || "").replace(/_/g, " ") || "Unknown Course";
  const now = new Date();
  const dateLong = now.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  const dateShort = now.toLocaleDateString("en-GB").replace(/\//g, "-");
  const fileName = `${courseLabel} Generated Learning Resources ${dateShort}.pdf`;

  // ── Keeps track of current Y; handles page breaks ──────────────────────────
  let y = MT;
  let pageNum = 1;

  function ensureSpace(needed) {
    if (y + needed > SAFE_BOTTOM) {
      addFooter();
      doc.addPage();
      pageNum++;
      drawPageHeader();
      y = MT;
    }
  }

  // ── Page header (repeats on page 2+) ────────────────────────────────────────
  function drawPageHeader() {
    setColor(doc, PRIMARY, "fill");
    doc.rect(0, 0, PAGE_W, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(doc, WHITE);
    doc.text("AI-Generated Learning Resources", ML, 9);
    doc.setTextColor(150, 200, 220);
    doc.text(courseLabel, PAGE_W - MR, 9, { align: "right" });
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  function addFooter() {
    drawHRule(doc, ML, PAGE_H - 12, CW);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    setColor(doc, MUTED);
    doc.text("AI-generated insights - verify before distributing to students.", ML, PAGE_H - 7);
    doc.text(`Page ${pageNum}`, PAGE_W - MR, PAGE_H - 7, { align: "right" });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Cover header
  // ═══════════════════════════════════════════════════════════════════════════

  // Full-width indigo banner
  setColor(doc, PRIMARY, "fill");
  doc.rect(0, 0, PAGE_W, 52, "F");

  // Decorative accent circle (slightly lighter shade of #003F91)
  doc.setFillColor(0, 82, 180);
  doc.circle(PAGE_W - 24, 10, 30, "F");

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(doc, WHITE);
  doc.text("Learning Resources", ML, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  // Lighter teal-white subtitle
  doc.setTextColor(180, 220, 235);
  doc.text("AI-Generated for " + courseLabel, ML, 32);

  doc.setFontSize(8);
  doc.setTextColor(150, 200, 220);
  doc.text(`${materials.length} resource${materials.length !== 1 ? "s" : ""}`, ML, 42);

  y = 62;

  // ── Meta info strip ──────────────────────────────────────────────────────────
  setColor(doc, LIGHT_BG, "fill");
  setColor(doc, BORDER, "draw");
  doc.setLineWidth(0.3);
  doc.roundedRect(ML, y, CW, 20, 2, 2, "FD");

  const col2x = ML + CW / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  setColor(doc, MUTED);
  doc.text("PREPARED BY", ML + 5, y + 7);
  doc.text("DATE GENERATED", col2x + 5, y + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(doc, DARK);
  doc.text(lecturerName || "Lecturer", ML + 5, y + 15);
  doc.text(dateLong, col2x + 5, y + 15);

  y += 28;

  // Section label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  setColor(doc, MUTED);
  doc.text("RESOURCES", ML, y);
  drawHRule(doc, ML, y + 2, CW);
  y += 10;

  // ═══════════════════════════════════════════════════════════════════════════
  // Resource list
  // ═══════════════════════════════════════════════════════════════════════════

  materials.forEach((mat, idx) => {
    const priority = (mat.priority || "low").toLowerCase();
    const pColor = PRIORITY_COLOR[priority] || PRIORITY_COLOR.low;
    const title = mat.title || "Untitled Resource";
    const topic = mat.topic || "";
    const resType = mat.resourceType || "";
    const desc = mat.description || "";
    const url = mat.url || "";

    // Pre-wrap text to know required height (CW - 14 left indent - 8 right padding)
    doc.setFontSize(10);
    const titleLines = doc.splitTextToSize(title, CW - 22);
    doc.setFontSize(8.5);
    const descLines = doc.splitTextToSize(desc, CW - 22);
    doc.setFontSize(7.5);
    const urlLines = url ? doc.splitTextToSize(url, CW - 22) : [];

    const cardH =
      4 +                              // top padding
      titleLines.length * 5.5 +       // title
      5 +                              // meta row
      descLines.length * 4.5 +        // description
      (urlLines.length > 0 ? 2 + urlLines.length * 4 : 0) + // url
      6;                               // bottom padding

    ensureSpace(cardH + 4);

    // ── Card background ────────────────────────────────────────────────────
    setColor(doc, LIGHT_BG, "fill");
    setColor(doc, BORDER, "draw");
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y, CW, cardH, 2, 2, "FD");

    // ── Priority stripe (left edge) ────────────────────────────────────────
    doc.setFillColor(pColor.r, pColor.g, pColor.b);
    doc.roundedRect(ML, y, 3.5, cardH, 2, 2, "F");
    // Cover the right half of the stripe rounded corners to make it flush
    doc.rect(ML + 1.5, y, 2, cardH, "F");

    // ── Index number ───────────────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    setColor(doc, MUTED);
    doc.text(String(idx + 1).padStart(2, "0"), ML + 6.5, y + 7);

    // ── Priority badge (top-right, 6mm from card right edge) ──────────────
    const badgeLabel = priority.toUpperCase();
    doc.setFontSize(6.5);
    doc.setFont("helvetica", "bold");
    doc.setFillColor(pColor.r, pColor.g, pColor.b);
    const badgeW = doc.getTextWidth(badgeLabel) + 5;
    const badgeX = ML + CW - badgeW - 6;   // 6mm from right edge
    doc.roundedRect(badgeX, y + 3, badgeW, 5, 1, 1, "F");
    setColor(doc, WHITE);
    doc.text(badgeLabel, badgeX + badgeW / 2, y + 7, { align: "center" });

    // ── Title ──────────────────────────────────────────────────────────────
    let cy = y + 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    setColor(doc, DARK);
    titleLines.forEach((line) => {
      doc.text(line, ML + 14, cy);
      cy += 5.5;
    });

    // ── Meta: topic · type ────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, MUTED);
    const metaParts = [topic, resType].filter(Boolean);
    if (metaParts.length) {
      doc.text(metaParts.join("  ·  "), ML + 14, cy);
    }
    cy += 5;

    // ── Description ───────────────────────────────────────────────────────
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(doc, { r: 55, g: 55, b: 75 });
    descLines.forEach((line) => {
      doc.text(line, ML + 14, cy);
      cy += 4.5;
    });

    // ── URL ───────────────────────────────────────────────────────────────
    if (urlLines.length > 0) {
      cy += 2;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setColor(doc, PRIMARY);
      urlLines.forEach((line) => {
        doc.textWithLink(line, ML + 14, cy, { url });
        cy += 4;
      });
    }

    y += cardH + 4;
  });

  // ── Final footer + add footer to last page ────────────────────────────────
  addFooter();

  doc.save(fileName);
}
