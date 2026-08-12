import { BARCODE_FIELD, DYNAMIC_FIELDS } from "../utils/constants";
import { createFieldElement, createElement, uid } from "./elementUtils";

/**
 * Builds the default label layout.
 *
 * Every new template automatically contains only:
 *   Model, Product, Quality, Color, Barcode
 *
 * Nothing else. Custom fields are added only when the user creates them.
 */
export function buildDefaultLayout(
  data = {},
  labelWidth = 50,
  labelHeight = 25,
) {
  const elements = [];
  const w = labelWidth || 50;
  const h = labelHeight || 25;

  // ── Model (value-only, top center) ──
  elements.push(
    createFieldElement("model", {
      x: 4,
      y: 2,
      width: w - 8,
      height: Math.max(4, h * 0.22),
      fontSize: Math.max(10, Math.round(h * 0.3)),
      bold: true,
      color: "#1c1c1e",
      align: "center",
      valueOnly: true,
      showLabel: false,
    }),
  );

  // ── Product (label: value) ──
  elements.push(
    createFieldElement("product", {
      x: 4,
      y: 2 + Math.max(4, h * 0.22) + 0.8,
      width: w - 8,
      height: Math.max(3.5, h * 0.16),
      fontSize: Math.max(7, Math.round(h * 0.18)),
      bold: false,
      color: "#3a3a3c",
      align: "left",
      labelColor: "#6e6e73",
      labelFontSize: Math.max(7, Math.round(h * 0.18)),
      labelFontWeight: "400",
      showLabel: true,
    }),
  );

  // ── Quality (label: value) ──
  elements.push(
    createFieldElement("quality", {
      x: 4,
      y: 2 + Math.max(4, h * 0.22) + Math.max(3.5, h * 0.16) + 1.6,
      width: (w - 10) / 2,
      height: Math.max(3, h * 0.13),
      fontSize: Math.max(6, Math.round(h * 0.14)),
      bold: false,
      color: "#3a3a3c",
      align: "left",
      labelColor: "#6e6e73",
      labelFontSize: Math.max(6, Math.round(h * 0.14)),
      labelFontWeight: "400",
      showLabel: true,
    }),
  );

  // ── Color (label: value) ──
  elements.push(
    createFieldElement("color", {
      x: 4 + (w - 10) / 2 + 2,
      y: 2 + Math.max(4, h * 0.22) + Math.max(3.5, h * 0.16) + 1.6,
      width: (w - 10) / 2,
      height: Math.max(3, h * 0.13),
      fontSize: Math.max(6, Math.round(h * 0.14)),
      bold: false,
      color: "#3a3a3c",
      align: "left",
      labelColor: "#6e6e73",
      labelFontSize: Math.max(6, Math.round(h * 0.14)),
      labelFontWeight: "400",
      showLabel: true,
    }),
  );

  // ── Divider line ──
  const lineY =
    2 +
    Math.max(4, h * 0.22) +
    Math.max(3.5, h * 0.16) +
    Math.max(3, h * 0.13) +
    2.5;
  elements.push(
    createElement("line", {
      id: uid("line"),
      x: 4,
      y: lineY,
      width: w - 8,
      height: 1,
      stroke: "#c7c7cc",
      strokeWidth: 0.3,
    }),
  );

  // ── Barcode ──
  elements.push(
    createElement("barcode", {
      id: uid("barcode"),
      x: Math.max(4, (w - Math.min(w - 8, w * 0.72)) / 2),
      y: lineY + 2.5,
      width: Math.min(w - 8, w * 0.72),
      height: Math.max(8, h * 0.35),
      value: `{{${BARCODE_FIELD.key}}}`,
      bcid: "code128",
      includeText: true,
      fontsize: 6,
      heightmm: Math.max(8, h * 0.3),
      scale: 2,
      textGap: 4,
      textPosition: "bottom",
      barcolor: "#000000",
      textcolor: "#000000",
      backgroundcolor: "#ffffff",
      padding: 0,
    }),
  );

  return elements;
}

/**
 * Returns true if the current elements are the "auto layout" (not user-designed).
 */
export function isAutoLayout(elements, autoLayoutActive) {
  if (!autoLayoutActive) return false;
  return !elements.some((el) => el.type !== "auto");
}
