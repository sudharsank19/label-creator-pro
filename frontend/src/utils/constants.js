// ─── Fields ───────────────────────────────────────────────────────────────
// The application intentionally exposes only these core fields.
// Model displays value-only; the rest show "Label : Value" with an editable
// display label (which NEVER changes the bound data key).
export const DYNAMIC_FIELDS = [
  { key: "model", label: "Model", icon: "Smartphone", valueOnly: true },
  { key: "product", label: "Product", icon: "Package", valueOnly: false },
  { key: "quality", label: "Quality", icon: "BadgeCheck", valueOnly: false },
  { key: "color", label: "Color", icon: "Palette", valueOnly: false },
];

// The single Barcode field. It behaves like a normal input: as soon as the
// user types a value the Code128 barcode generates automatically (live).
export const BARCODE_FIELD = {
  key: "barcode",
  label: "Barcode",
  icon: "Hash",
};

export const FIELD_LABELS = Object.fromEntries(
  DYNAMIC_FIELDS.map((f) => [f.key, f.label]),
);

// Standard defaults for barcode elements. `textGap` is the new
// "Barcode Text Gap" property: distance between the bars and the
// human-readable text (px, 0–30).
export const BARCODE_DEFAULTS = {
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
};

export const ELEMENT_TYPES = {
  text: { label: "Text", icon: "Type" },
  barcode: { label: "Barcode", icon: "Barcode" },
  qr: { label: "QR Code", icon: "QrCode" },
  rectangle: { label: "Rectangle", icon: "Square" },
  circle: { label: "Circle", icon: "Circle" },
  line: { label: "Line", icon: "Minus" },
  image: { label: "Image", icon: "Image" },
  logo: { label: "Company Logo", icon: "Building2" },
  date: { label: "Date", icon: "Calendar" },
  time: { label: "Time", icon: "Clock" },
};

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.5, 2];

export const MM_TO_PX = 3.7795275591;

export const FONT_FAMILIES = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Tahoma",
  "Impact",
  "Comic Sans MS",
  "SF Pro Display",
  "Roboto",
  "Open Sans",
  "Montserrat",
];

export const DEFAULT_CANVAS_SETTINGS = {
  showGrid: true,
  snapToGrid: true,
  showRulers: true,
  gridSize: 5,
  autoLayout: true,
  autoLayoutActive: false,
};

export const PRINTER_TYPES = [
  {
    value: "thermal",
    label: "Thermal Printer",
    desc: "Barcode/label printers (Zebra, TSC, Brother)",
  },
  {
    value: "laser",
    label: "Laser Printer",
    desc: "Standard laser printing on label sheets",
  },
  {
    value: "inkjet",
    label: "Inkjet Printer",
    desc: "Inkjet printing on glossy or matte paper",
  },
];

export const QR_ERROR_LEVELS = [
  { value: "L", label: "L — Low (~7%)" },
  { value: "M", label: "M — Medium (~15%)" },
  { value: "Q", label: "Q — Quartile (~25%)" },
  { value: "H", label: "H — High (~30%)" },
];

export const CATEGORY_COLORS = [
  { name: "Display / Screen", color: "#0a84ff" },
  { name: "Battery", color: "#34c759" },
  { name: "Camera", color: "#ff9f0a" },
  { name: "Charging Port", color: "#ff2d55" },
  { name: "Audio", color: "#af52de" },
  { name: "Motherboard", color: "#64d2ff" },
  { name: "Accessories", color: "#8e8e93" },
];

export const SAMPLE_DATA = {
  model: "iPhone 15 Pro",
  product: "Display Assembly",
  quality: "OEM",
  color: "Natural Titanium",
  barcode: "IP15PM-DISP-NT",
};
