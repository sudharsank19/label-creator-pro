# Label Designer Guide

The Label Designer is the heart of Label Creator Pro — a drag-and-drop canvas where you compose a physical label and bind it to dynamic data fields.

---

## Getting started

1. Log in and click **New Label** on the Dashboard (or **Label Designer** in the sidebar).
2. Choose the label size:
   - **Default**: 50mm × 25mm (standard thermal label)
   - **Custom**: width **20–200mm**, height **10–150mm**
3. Type values in the **Field Palette** — the canvas updates **live** (no refresh/save).
4. Click the **Auto Layout** toggle to keep the smart auto-layout, or click **+** on any field to place a **bound element** onto the canvas.
5. Drag/resize/rotate elements and edit them in the **Properties** panel.
6. **Save** to store the label, **Save as Template** to reuse the layout, or **Print / Export** directly.

---

## Auto Layout (always shows your data)

- A new label starts in **Auto Layout** mode: a clean, professional layout of all 12 dynamic fields is generated automatically.
- As you type in the Field Palette, the auto layout **re-renders live** — model, part number, barcode, meta rows, price and stock all update in real time.
- The first time you add a custom element (or place a field from the palette with **+**), the label switches to **Custom Layout** — your manual design takes over completely.
- Toggle back to **Auto Layout** anytime (clears custom elements).

---

## Field Palette

| Feature                | How it works                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **Live data entry**    | Each field has an input; typing updates every bound element on the canvas instantly    |
| **Per-field "+"**      | Drops a draggable, field-bound element onto the canvas at the current live value       |
| **Multiple instances** | You can place the same field multiple times (e.g. Model top-left **and** bottom-right) |
| **Auto Layout switch** | Toggle auto vs. custom layout from the palette header                                  |

Bound elements keep a permanent link to their source field (`fieldKey`). Change the value once and every linked instance updates — no duplicates are created on value change.

---

## Canvas

| Feature              | How it works                                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Live preview**     | Renders at exact physical size using `1mm = 3.7795px`; every change (typing, drag, resize, font, color, label size) renders immediately |
| **Drag & drop**      | Click any element and drag to reposition                                                                                                |
| **Snap to grid**     | Elements snap to a configurable grid (default 1mm; toggle in toolbar)                                                                   |
| **Alignment guides** | Red snap lines appear when an element aligns to the label center/edges or another element's edges/center                                |
| **Rulers**           | Top & left rulers display mm graduations (toggleable)                                                                                   |
| **Zoom**             | 50% / 75% / 100% / 150% / 200% from the toolbar                                                                                         |
| **Rotation**         | Drag the **blue dot above** a selected element to rotate freely                                                                         |
| **Resize**           | Drag any corner handle to resize (live)                                                                                                 |
| **Selection**        | Click to select; locked elements cannot be moved                                                                                        |

### Keyboard shortcuts

| Shortcut                                 | Action                                                    |
| ---------------------------------------- | --------------------------------------------------------- |
| `Ctrl/Cmd + Z`                           | Undo                                                      |
| `Ctrl/Cmd + Shift + Z` or `Ctrl/Cmd + Y` | Redo                                                      |
| `Ctrl/Cmd + C`                           | Copy selected element                                     |
| `Ctrl/Cmd + V`                           | Paste copied element                                      |
| `Ctrl/Cmd + D`                           | Duplicate selected element                                |
| `Delete` / `Backspace`                   | Delete selected                                           |
| `Esc`                                    | Deselect / clear guides                                   |
| `Ctrl/Cmd + S`                           | Save label                                                |
| `Ctrl/Cmd + P`                           | Print                                                     |
| Arrow keys                               | Nudge selected element (grid step, or 0.5mm without snap) |

---

## Elements

| Element            | Description                                                                                                        | Key properties                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Text**           | Static or dynamic text                                                                                             | text, `{{field}}`, font family/size/weight, italic/underline, color, align, letter-spacing, line-height |
| **Barcode**        | Code128 (or EAN13, UPC-A, Code39, 2of5) auto-generated                                                             | value, bcid, height, text size, bar color, human-readable                                               |
| **QR**             | QR code (optional)                                                                                                 | value, error correction `L/M/Q/H`, custom dark/light colors, size                                       |
| **Rectangle**      | Shape                                                                                                              | fill, stroke, stroke width, corner radius                                                               |
| **Circle**         | Shape                                                                                                              | fill, stroke, stroke width                                                                              |
| **Line**           | Straight line                                                                                                      | color, thickness, solid/dashed/dotted                                                                   |
| **Image**          | Uploaded image or URL                                                                                              | src, fit (contain/cover/fill)                                                                           |
| **Company Logo**   | Logo from URL/base64                                                                                               | src, fit                                                                                                |
| **Date**           | Today's date                                                                                                       | format                                                                                                  |
| **Time**           | Current time                                                                                                       | 12/24-hour                                                                                              |
| **Dynamic fields** | Model, Product, Quality, Color, Part Number, Warranty, Description, Category, Supplier, Batch Number, Price, Stock | placed via Field Palette "+" or `{{key}}` in any text                                                   |

---

## Properties panel

Select any element to edit, in real time:

- **Position & size** (X, Y, W, H in mm)
- **Rotation** (°) and **Opacity** (%)
- **Typography**: font family, size, weight, align, letter-spacing, line-height, bold/italic/underline
- **Colors**: text/fill, background, border color, border width, corner radius
- **Spacing**: padding X/Y, margin top/bottom (px)
- **Behavior**: lock position, visibility
- **Z-order**: Bring Forward / Send Backward buttons

The **Layers** tab shows every element with visibility toggle (eye) and z-order controls (bring forward/send backward). Array order = z-index (bottom of list = front).

---

## Dynamic fields

Use placeholder syntax anywhere text content is expected:

```
Model: {{model}}
Part No: {{partNumber}}
Category: {{category}}
```

When the label is saved with a `data` object (e.g. `{ "model": "iPhone 13", "partNumber": "IP13-SCR" }`), every `{{field}}` is replaced at render/print time. Batch Import populates these automatically from CSV/Excel columns.

> If a placeholder has no value, it renders as an empty string.

---

## Barcode & QR best practices

- **Code128** is used by default — works for alphanumeric part numbers.
- Keep the **height ≥ 8mm** and human-readable text **on** for scannable labels.
- QR **error correction `M`** is a good default for spare-part tags.
- Always include a quiet zone: set barcode margin ≥ 2mm and QR margin ≥ 2 modules.

---

## Undo / Redo & editing

- Every add/move/resize/property change is captured for **undo/redo** (up to 50 steps).
- Use **Duplicate** or **Ctrl+C / Ctrl+V** to clone an element.
- The **Properties** and **Layers** panels reflect the selected element; changes apply live.

---

## Templates (full persistence)

- **Save as Template** persists the **complete layout**: every element, position, size, font, color, rotation, margin, border, barcode/QR settings, label dimensions, background, z-order, data bindings, and canvas settings (grid, snap, rulers, auto-layout).
- New templates appear **instantly** on the **Templates** page with a **live thumbnail**, name, description, size, element count, and updated time.
- Click **Use** (or the thumbnail) to reload the **exact design** onto the canvas — it restores everything, including grid settings and bound fields.
- **Set as Default** makes new labels start from that layout.

---

## Saving, printing & exporting

1. **Save** stores the label in the database (restorable from Dashboard → Recent Labels).
2. **Save as Template** reuses the layout.
3. **Export** produces PNG/JPEG/PDF/SVG.
4. **Print Preview** shows exact physical size; adjust **copies** and **calibration offsets** (X/Y mm) for off-center labels.

---

## Batch Import workflow

1. Prepare a spreadsheet with columns matching field keys:
   `model, product, quality, color, partNumber, warranty, description, category, supplier, batchNumber, price, stock` (plus an optional `name`).
2. **Batch Import → Choose File** (CSV/XLSX/JSON).
3. Review parsed rows; select which to keep.
4. **Save Labels** writes them to the DB, or **Print** sends them straight to Print Preview with the default template applied.
