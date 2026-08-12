import { MM_TO_PX, DYNAMIC_FIELDS, BARCODE_FIELD } from "../utils/constants";

export function uid(prefix = "el") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createElement(type, partial = {}) {
  const base = {
    id: uid(),
    type,
    x: 5,
    y: 5,
    width: 20,
    height: 8,
    rotation: 0,
    locked: false,
    opacity: 100,
  };

  switch (type) {
    case "text":
      return {
        ...base,
        width: 25,
        height: 6,
        text: "Text",
        fontSize: 10,
        bold: false,
        italic: false,
        underline: false,
        color: "#1c1c1e",
        align: "left",
        fontFamily: "Arial",
        ...partial,
      };
    case "barcode":
      return {
        ...base,
        width: 32,
        height: 10,
        value: `{{${BARCODE_FIELD.key}}}`,
        bcid: "code128",
        includeText: true,
        fontsize: 6,
        heightmm: 8,
        scale: 2,
        textGap: 4,
        textPosition: "bottom",
        barcolor: "#000000",
        textcolor: "#000000",
        backgroundcolor: "#ffffff",
        padding: 0,
        ...partial,
      };
    case "qr":
      return {
        ...base,
        width: 14,
        height: 14,
        value: "{{barcode}}",
        errorLevel: "M",
        color: "#000000",
        bg: "#ffffff",
        ...partial,
      };
    case "rectangle":
      return {
        ...base,
        width: 20,
        height: 12,
        fill: "#e5e5ea",
        stroke: "#1c1c1e",
        strokeWidth: 0.5,
        radius: 0,
        ...partial,
      };
    case "circle":
      return {
        ...base,
        width: 12,
        height: 12,
        fill: "#e5e5ea",
        stroke: "#1c1c1e",
        strokeWidth: 0.5,
        ...partial,
      };
    case "line":
      return {
        ...base,
        width: 20,
        height: 1,
        stroke: "#1c1c1e",
        strokeWidth: 0.5,
        lineStyle: "solid",
        ...partial,
      };
    case "image":
      return {
        ...base,
        width: 16,
        height: 12,
        src: "",
        fit: "contain",
        ...partial,
      };
    case "logo":
      return {
        ...base,
        width: 14,
        height: 8,
        src: "",
        text: "LOGO",
        fit: "contain",
        ...partial,
      };
    case "date":
      return {
        ...base,
        width: 22,
        height: 5,
        format: "MM/DD/YYYY",
        fontSize: 7,
        color: "#1c1c1e",
        bold: false,
        ...partial,
      };
    case "time":
      return {
        ...base,
        width: 16,
        height: 5,
        format: "HH:MM AM",
        fontSize: 7,
        color: "#1c1c1e",
        bold: false,
        ...partial,
      };
    default:
      return { ...base, ...partial };
  }
}

/**
 * Create a field-bound text element.
 *
 * Behavior:
 *  - Model renders value-only (no label).
 *  - All other fields render "DisplayLabel : value".
 *  - `displayLabel` is editable and NEVER affects the bound data key (`fieldKey`).
 *  - `showLabel` toggles the "Field Name" ON (Label : Value) / OFF (value only).
 *  - `labelGap` is the space between the label and the value (px).
 */
export function createFieldElement(fieldKey, partial = {}) {
  const field = DYNAMIC_FIELDS.find((f) => f.key === fieldKey);
  const label = field?.label || fieldKey;
  const valueOnly = field?.valueOnly || partial.valueOnly || false;
  return {
    id: uid("field"),
    type: "text",
    fieldKey,
    x: 5,
    y: 5,
    width: 30,
    height: 5,
    rotation: 0,
    locked: false,
    opacity: 100,
    text: `{{${fieldKey}}}`,
    value: `{{${fieldKey}}}`,
    displayLabel: label,
    showLabel: !valueOnly,
    labelGap: 4,
    valueOnly,
    labelColor: "#6e6e73",
    labelFontFamily: "Arial",
    labelFontSize: 10,
    labelFontWeight: "400",
    labelItalic: false,
    labelUnderline: false,
    labelBold: false,
    fontSize: 10,
    bold: false,
    italic: false,
    underline: false,
    color: "#1c1c1e",
    align: "left",
    fontFamily: "Arial",
    keepWhenEmpty: true,
    ...partial,
  };
}

export function interpolate(template, data = {}, settings = {}) {
  if (!template || typeof template !== "string") return "";
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    const value = data[key];
    if (value !== undefined && value !== null) return String(value);
    if (settings[key] !== undefined && settings[key] !== null)
      return String(settings[key]);
    return "";
  });
}

export function formatDateValue(format = "MM/DD/YYYY", date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const map = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    HH24: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds()),
  };
  let out = format;
  for (const [k, v] of Object.entries(map)) {
    out = out.split(k).join(v);
  }
  return out;
}

export function formatTimeValue(format = "HH:MM AM", date = new Date()) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");
  return format
    .replace(/HH/g, hh)
    .replace(/hh/g, String(hours))
    .replace(/MM/g, minutes)
    .replace(/mm/g, minutes)
    .replace(/AM/g, ampm)
    .replace(/PM/g, ampm);
}

export function resolveElementValue(el, data = {}, settings = {}) {
  switch (el.type) {
    case "text":
    case "barcode":
    case "qr":
      return interpolate(el.value ?? el.text ?? "", data, settings);
    case "date":
      return formatDateValue(
        el.format,
        data._date ? new Date(data._date) : new Date(),
      );
    case "time":
      return formatTimeValue(
        el.format,
        data._time ? new Date(data._time) : new Date(),
      );
    default:
      return "";
  }
}

export function getFieldList(data = {}) {
  const list = {};
  for (const f of DYNAMIC_FIELDS) {
    list[f.key] =
      data[f.key] !== undefined && data[f.key] !== null
        ? String(data[f.key])
        : "";
  }
  return list;
}

export function elementsToJSON(elements) {
  return elements.map((el) => ({ ...el }));
}

export function mmToPx(mm) {
  return Math.round(mm * MM_TO_PX * 100) / 100;
}

export function pxToMm(px) {
  return Math.round((px / MM_TO_PX) * 100) / 100;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeElement(el) {
  return {
    ...el,
    x: clamp(Number(el.x) || 0, 0, 500),
    y: clamp(Number(el.y) || 0, 0, 500),
    width: clamp(Number(el.width) || 1, 1, 300),
    height: clamp(Number(el.height) || 1, 1, 300),
  };
}

export function gridSnap(value, grid = 1) {
  return Math.round(value / grid) * grid;
}

/**
 * Standard field keys that map automatically from imported rows.
 * The DB is the source of truth for templates; these keys are used to
 * bind imported Excel/provided values into template {{placeholders}}.
 */
export const STANDARD_FIELD_KEYS = [
  "model",
  "product",
  "quality",
  "color",
  "barcode",
  "warranty",
  "description",
  "category",
  "supplier",
  "batchNumber",
  "price",
  "stock",
];

/**
 * Scale all element geometry proportionally when a label size changes.
 * `oldW/oldH` and `newW/newH` are in mm. Default behavior keeps object
 * positions (as required); pass `scale: true` to scale proportionally.
 */
export function scaleElements(
  elements,
  oldW,
  oldH,
  newW,
  newH,
  { scale = false } = {},
) {
  if (!Array.isArray(elements)) return [];
  if (!scale) return elements.map((el) => ({ ...el }));
  const sx = newW / (oldW || newW);
  const sy = newH / (oldH || newH);
  return elements.map((el) => ({
    ...el,
    x: clamp(Number(el.x) || 0, 0, 500) * sx,
    y: clamp(Number(el.y) || 0, 0, 500) * sy,
    width: clamp(Number(el.width) || 1, 1, 300) * sx,
    height: clamp(Number(el.height) || 1, 1, 300) * sy,
  }));
}

/**
 * Build the {fieldKey: value} data map for a single imported row.
 * Matches standard fields by case-insensitive key OR label, then maps any
 * custom fields that exist on the template (settings.customFields).
 * Unknown/missing columns safely fall back to template defaults/blank.
 */
export function buildDataMap(row = {}, customFields = []) {
  const out = {};
  // Normalize the row into a case-insensitive lookup for matching.
  const lowered = {};
  for (const key of Object.keys(row)) {
    const val = row[key];
    if (val === undefined || val === null) continue;
    lowered[String(key).toLowerCase()] = val;
    lowered[key] = val;
  }

  const pick = (...names) => {
    for (const n of names) {
      if (lowered[String(n).toLowerCase()] !== undefined) {
        return String(lowered[String(n).toLowerCase()]);
      }
    }
    return "";
  };

  for (const fk of STANDARD_FIELD_KEYS) {
    const label = fk[0].toUpperCase() + fk.slice(1);
    out[fk] = pick(fk, label);
  }

  // Custom fields from template settings
  if (Array.isArray(customFields)) {
    for (const cf of customFields) {
      if (!cf || !cf.key) continue;
      const key = cf.key;
      let val = lowered[String(key).toLowerCase()];
      if (val === undefined) val = lowered[cf.label];
      // Fall back to template default value
      if ((val === undefined || val === "") && cf.defaultValue != null) {
        val = cf.defaultValue;
      }
      out[key] = val === undefined ? "" : String(val);
    }
  }

  return out;
}

/**
 * Combine a saved template + imported row into a final printable label.
 * This is the SINGLE shared renderer used by batch printing, preview and
 * print — the template controls design, positions, fonts, colors, size.
 * Returns { name, width, height, background, elements, data, copies }.
 */
export function buildBatchLabel(
  template,
  row = {},
  { customFields = [], index = 0 } = {},
) {
  let elements = [];
  let data = {};
  let width = 50;
  let height = 25;
  let background = "#ffffff";
  let name = "Label";

  if (template) {
    // Template is the single source of truth.
    elements = parseJsonArray(template.elements);
    data = buildDataMap(
      row,
      customFields.length
        ? customFields
        : parseJsonArray(template.settings)?.customFields,
    );
    const tWidth = Number(template.widthMm ?? template.width);
    const tHeight = Number(template.heightMm ?? template.height);
    width = tWidth > 0 ? tWidth : 50;
    height = tHeight > 0 ? tHeight : 25;
    background = template.background || "#ffffff";
    name = template.name || "Label";
  } else {
    // Fallback (shouldn't happen in normal flow) — build from row directly.
    data = buildDataMap(row, customFields);
  }

  // Friendly name from row for display only (never part of the printed label).
  const rowName =
    row.Model ||
    row.model ||
    row.Name ||
    row.name ||
    row.Barcode ||
    row.barcode ||
    "";
  const displayName = rowName ? `${name} — ${rowName}` : name;

  return {
    id: `batch-${Date.now().toString(36)}-${index}`,
    name: displayName,
    width,
    height,
    background,
    elements,
    data,
    copies: 1,
  };
}

export function parseJson(str) {
  if (Array.isArray(str)) return str;
  if (typeof str !== "string" || !str) return {};
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
}

function parseJsonArray(str) {
  if (Array.isArray(str)) return str;
  if (typeof str !== "string" || !str) return [];
  try {
    const v = JSON.parse(str);
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}
