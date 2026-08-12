import { Settings2 } from "lucide-react";
import { Input, Select, ColorInput, Toggle } from "../components/ui/Input";
import { FONT_FAMILIES } from "../utils/constants";
import { formatDateValue, formatTimeValue } from "./elementUtils";

/**
 * Property Panel — full editing for the selected element.
 * Every change is applied live to the canvas (no save/refresh).
 */
export function PropertyPanel({
  el,
  onUpdate,
  onBringForward,
  onSendBackward,
}) {
  if (!el) {
    return (
      <div className="text-center py-10">
        <Settings2 className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
        <p className="text-xs text-gray-400">
          Select an element to edit its properties.
        </p>
      </div>
    );
  }

  const set = (patch) => onUpdate(el.id, patch);
  const num = (v, d = 0) => Number(v) || d;

  // ── Field-bound element properties ──
  const isFieldElement = !!el.fieldKey;

  return (
    <div className="space-y-4">
      {/* Position & size */}
      <div className="space-y-2">
        <label className="label">Position & Size (mm)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="X"
            type="number"
            step="0.1"
            value={Math.round(el.x * 10) / 10}
            onChange={(e) => set({ x: num(e.target.value) })}
          />
          <Input
            label="Y"
            type="number"
            step="0.1"
            value={Math.round(el.y * 10) / 10}
            onChange={(e) => set({ y: num(e.target.value) })}
          />
          <Input
            label="W"
            type="number"
            step="0.1"
            value={Math.round(el.width * 10) / 10}
            onChange={(e) =>
              set({ width: Math.max(1, num(e.target.value, 1)) })
            }
          />
          <Input
            label="H"
            type="number"
            step="0.1"
            value={Math.round(el.height * 10) / 10}
            onChange={(e) =>
              set({ height: Math.max(1, num(e.target.value, 1)) })
            }
          />
        </div>
      </div>

      {/* Rotation & Opacity */}
      <div className="space-y-2">
        <label className="label">Rotation & Opacity</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Rotation °"
            type="number"
            step="1"
            value={el.rotation || 0}
            onChange={(e) => set({ rotation: num(e.target.value) })}
          />
          <Input
            label="Opacity %"
            type="number"
            min="0"
            max="100"
            value={el.opacity ?? 100}
            onChange={(e) =>
              set({
                opacity: Math.min(100, Math.max(0, num(e.target.value, 100))),
              })
            }
          />
        </div>
      </div>

      {/* ── FIELD ELEMENT PROPERTIES ── */}
      {isFieldElement && (
        <>
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
            <label className="label">Field Settings</label>

            {/* Display Label — editable, never changes data key */}
            <Input
              label="Display Label"
              value={el.displayLabel || el.fieldKey || ""}
              onChange={(e) => set({ displayLabel: e.target.value })}
              placeholder="Custom label"
            />

            {/* Show Field Name Toggle (except Model) */}
            {!el.valueOnly && (
              <Toggle
                label="Show Field Name"
                checked={el.showLabel !== false}
                onChange={(v) => set({ showLabel: v })}
              />
            )}

            {/* Gap Between Label And Value */}
            <Input
              label="Gap Between Label And Value (px)"
              type="number"
              min="0"
              max="60"
              step="1"
              value={el.labelGap ?? 4}
              onChange={(e) =>
                set({
                  labelGap: Math.min(60, Math.max(0, num(e.target.value, 4))),
                })
              }
            />

            {/* Colon spacing (independent, px 0–20) */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Space Before Colon"
                type="number"
                min="0"
                max="20"
                step="1"
                value={el.spaceBeforeColon ?? 0}
                onChange={(e) =>
                  set({
                    spaceBeforeColon: Math.min(
                      20,
                      Math.max(0, num(e.target.value, 0)),
                    ),
                  })
                }
              />
              <Input
                label="Space After Colon"
                type="number"
                min="0"
                max="20"
                step="1"
                value={el.spaceAfterColon ?? 4}
                onChange={(e) =>
                  set({
                    spaceAfterColon: Math.min(
                      20,
                      Math.max(0, num(e.target.value, 4)),
                    ),
                  })
                }
              />
            </div>
          </div>

          {/* Label Typography */}
          {el.showLabel !== false && !el.valueOnly && (
            <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
              <label className="label">Field Name Typography</label>
              <ColorInput
                label="Color"
                value={el.labelColor || "#6e6e73"}
                onChange={(v) => set({ labelColor: v })}
              />
              <Select
                label="Font"
                value={el.labelFontFamily || el.fontFamily || "Arial"}
                onChange={(e) => set({ labelFontFamily: e.target.value })}
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Size"
                  type="number"
                  step="0.5"
                  value={el.labelFontSize || el.fontSize || 7}
                  onChange={(e) =>
                    set({ labelFontSize: num(e.target.value, 7) })
                  }
                />
                <Select
                  label="Weight"
                  value={el.labelFontWeight || (el.labelBold ? "700" : "400")}
                  onChange={(e) =>
                    set({
                      labelFontWeight: e.target.value,
                      labelBold: e.target.value === "700",
                    })
                  }
                >
                  <option value="400">Regular</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                </Select>
              </div>
            </div>
          )}

          {/* Value Typography */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
            <label className="label">Value Typography</label>
            <ColorInput
              label="Color"
              value={el.color || "#1c1c1e"}
              onChange={(v) => set({ color: v })}
            />
            <Select
              label="Font"
              value={el.fontFamily || "Arial"}
              onChange={(e) => set({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Size"
                type="number"
                step="0.5"
                value={el.fontSize}
                onChange={(e) => set({ fontSize: num(e.target.value, 7) })}
              />
              <Select
                label="Weight"
                value={el.fontWeight || (el.bold ? "700" : "400")}
                onChange={(e) =>
                  set({
                    fontWeight: e.target.value,
                    bold: e.target.value === "700",
                  })
                }
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="700">Bold</option>
                <option value="800">Extra Bold</option>
              </Select>
            </div>
            <Select
              label="Align"
              value={el.align || "left"}
              onChange={(e) => set({ align: e.target.value })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </div>
        </>
      )}

      {/* ── TEXT-SPECIFIC (non-field) ── */}
      {el.type === "text" && !isFieldElement && (
        <>
          <div className="space-y-2">
            <label className="label">Content</label>
            <textarea
              value={el.text || ""}
              onChange={(e) => set({ text: e.target.value })}
              className="input resize-none"
              rows={2}
            />
            <p className="text-[10px] text-gray-400">
              Use {"{{fieldKey}}"} for dynamic fields, e.g. {"{{model}}"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="label">Typography</label>
            <Select
              label="Font Family"
              value={el.fontFamily || "Arial"}
              onChange={(e) => set({ fontFamily: e.target.value })}
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Font Size"
                type="number"
                step="0.5"
                value={el.fontSize}
                onChange={(e) => set({ fontSize: num(e.target.value, 7) })}
              />
              <Select
                label="Font Weight"
                value={el.fontWeight || (el.bold ? "700" : "400")}
                onChange={(e) =>
                  set({
                    fontWeight: e.target.value,
                    bold: e.target.value === "700",
                  })
                }
              >
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">Semi Bold</option>
                <option value="700">Bold</option>
                <option value="800">Extra Bold</option>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select
                label="Align"
                value={el.align || "left"}
                onChange={(e) => set({ align: e.target.value })}
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
                <option value="justify">Justify</option>
              </Select>
              <Input
                label="Letter Spacing"
                type="number"
                step="0.1"
                value={el.letterSpacing ?? 0}
                onChange={(e) => set({ letterSpacing: num(e.target.value) })}
              />
            </div>
            <Input
              label="Line Height"
              type="number"
              step="0.05"
              value={el.lineHeight ?? 1.15}
              onChange={(e) => set({ lineHeight: num(e.target.value, 1.15) })}
            />
            <div className="flex items-center gap-2">
              <Toggle
                label="Bold"
                checked={!!el.bold}
                onChange={(v) =>
                  set({ bold: v, fontWeight: v ? "700" : "400" })
                }
              />
              <Toggle
                label="Italic"
                checked={!!el.italic}
                onChange={(v) => set({ italic: v })}
              />
              <Toggle
                label="Underline"
                checked={!!el.underline}
                onChange={(v) => set({ underline: v })}
              />
            </div>
          </div>
        </>
      )}

      {/* ── BARCODE-SPECIFIC ── */}
      {el.type === "barcode" && (
        <>
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
            <label className="label">Barcode Data</label>
            <Input
              label="Link Field (use {{field}})"
              value={el.value || ""}
              onChange={(e) => set({ value: e.target.value })}
              placeholder="{{barcode}}"
            />
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
            <label className="label">Barcode Type</label>
            <Select
              value={el.bcid || "code128"}
              onChange={(e) => set({ bcid: e.target.value })}
            >
              <option value="code128">Code 128</option>
              <option value="ean13">EAN-13</option>
              <option value="upca">UPC-A</option>
              <option value="code39">Code 39</option>
              <option value="interleaved2of5">Interleaved 2 of 5</option>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="label">Dimensions</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Width (mm)"
                type="number"
                step="0.1"
                value={Math.round(el.width * 10) / 10}
                onChange={(e) =>
                  set({ width: Math.max(1, num(e.target.value, 1)) })
                }
              />
              <Input
                label="Height (mm)"
                type="number"
                step="0.5"
                value={el.heightmm}
                onChange={(e) => set({ heightmm: num(e.target.value, 10) })}
              />
            </div>
            <Input
              label="Scale"
              type="number"
              min="1"
              max="5"
              step="1"
              value={el.scale || 2}
              onChange={(e) =>
                set({ scale: Math.max(1, Math.min(5, num(e.target.value, 2))) })
              }
            />
          </div>

          <div className="space-y-2">
            <label className="label">Text</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Text Size"
                type="number"
                step="0.5"
                value={el.fontsize}
                onChange={(e) => set({ fontsize: num(e.target.value, 6) })}
              />
              <Select
                label="Text Position"
                value={el.textPosition || "bottom"}
                onChange={(e) => set({ textPosition: e.target.value })}
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </Select>
            </div>

            <Toggle
              label="Show Human Readable Text"
              checked={el.includeText !== false}
              onChange={(v) => set({ includeText: v })}
            />

            {el.includeText !== false && (
              <Input
                label="Barcode Text Gap (px)"
                type="number"
                min="0"
                max="30"
                step="1"
                value={el.textGap ?? 4}
                onChange={(e) =>
                  set({
                    textGap: Math.min(30, Math.max(0, num(e.target.value, 4))),
                  })
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <label className="label">Colors</label>
            <ColorInput
              label="Foreground"
              value={el.barcolor}
              onChange={(v) => set({ barcolor: v })}
            />
            <ColorInput
              label="Text Color"
              value={el.textcolor}
              onChange={(v) => set({ textcolor: v })}
            />
            <ColorInput
              label="Background"
              value={el.backgroundcolor || "#ffffff"}
              onChange={(v) => set({ backgroundcolor: v })}
            />
          </div>

          <div className="space-y-2">
            <label className="label">Spacing</label>
            <Input
              label="Margin (px)"
              type="number"
              min="0"
              max="20"
              step="1"
              value={el.padding ?? 0}
              onChange={(e) =>
                set({
                  padding: Math.min(20, Math.max(0, num(e.target.value, 0))),
                })
              }
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Padding X"
                type="number"
                step="1"
                value={el.paddingX ?? 0}
                onChange={(e) => set({ paddingX: num(e.target.value) })}
              />
              <Input
                label="Padding Y"
                type="number"
                step="1"
                value={el.paddingY ?? 0}
                onChange={(e) => set({ paddingY: num(e.target.value) })}
              />
            </div>
          </div>
        </>
      )}

      {/* ── QR-specific ── */}
      {el.type === "qr" && (
        <>
          <Input
            label="Value (use {{field}})"
            value={el.value || ""}
            onChange={(e) => set({ value: e.target.value })}
          />
          <Select
            label="Error Correction"
            value={el.errorLevel || "M"}
            onChange={(e) => set({ errorLevel: e.target.value })}
          >
            <option value="L">L — Low</option>
            <option value="M">M — Medium</option>
            <option value="Q">Q — Quartile</option>
            <option value="H">H — High</option>
          </Select>
          <ColorInput
            label="Color"
            value={el.color}
            onChange={(v) => set({ color: v })}
          />
          <ColorInput
            label="Background"
            value={el.bg}
            onChange={(v) => set({ bg: v })}
          />
        </>
      )}

      {/* ── Shapes ── */}
      {(el.type === "rectangle" || el.type === "circle") && (
        <>
          <ColorInput
            label="Fill"
            value={el.fill}
            onChange={(v) => set({ fill: v })}
          />
          <ColorInput
            label="Stroke"
            value={el.stroke}
            onChange={(v) => set({ stroke: v })}
          />
          <Input
            label="Stroke Width"
            type="number"
            step="0.1"
            value={el.strokeWidth}
            onChange={(e) => set({ strokeWidth: num(e.target.value, 0.5) })}
          />
          {el.type === "rectangle" && (
            <Input
              label="Corner Radius"
              type="number"
              step="0.5"
              value={el.radius}
              onChange={(e) => set({ radius: num(e.target.value) })}
            />
          )}
        </>
      )}

      {el.type === "line" && (
        <>
          <ColorInput
            label="Color"
            value={el.stroke}
            onChange={(v) => set({ stroke: v })}
          />
          <Input
            label="Stroke Width"
            type="number"
            step="0.1"
            value={el.strokeWidth}
            onChange={(e) => set({ strokeWidth: num(e.target.value, 0.5) })}
          />
          <Select
            label="Line Style"
            value={el.lineStyle || "solid"}
            onChange={(e) => set({ lineStyle: e.target.value })}
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </Select>
        </>
      )}

      {/* ── Image / logo ── */}
      {(el.type === "image" || el.type === "logo") && (
        <>
          <Input
            label={el.type === "logo" ? "Logo Source" : "Image Source"}
            placeholder="URL or {{field}}"
            value={el.src || ""}
            onChange={(e) => set({ src: e.target.value })}
          />
          <Select
            label="Fit"
            value={el.fit || "contain"}
            onChange={(e) => set({ fit: e.target.value })}
          >
            <option value="contain">Contain</option>
            <option value="cover">Cover</option>
            <option value="fill">Fill</option>
          </Select>
        </>
      )}

      {/* ── Date/time ── */}
      {el.type === "date" && (
        <>
          <Input
            label="Value"
            value={formatDateValue(el.format)}
            disabled
            className="!opacity-60"
          />
          <Select
            label="Format"
            value={el.format}
            onChange={(e) => set({ format: e.target.value })}
          >
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD MMM YYYY">DD MMM YYYY</option>
          </Select>
          <ColorInput
            label="Color"
            value={el.color}
            onChange={(v) => set({ color: v })}
          />
        </>
      )}

      {el.type === "time" && (
        <>
          <Input
            label="Value"
            value={formatTimeValue(el.format)}
            disabled
            className="!opacity-60"
          />
          <Select
            label="Format"
            value={el.format}
            onChange={(e) => set({ format: e.target.value })}
          >
            <option value="HH:MM AM">12-hour (10:30 AM)</option>
            <option value="HH:MM">24-hour (22:30)</option>
            <option value="HH:MM:SS AM">With seconds</option>
          </Select>
          <ColorInput
            label="Color"
            value={el.color}
            onChange={(v) => set({ color: v })}
          />
        </>
      )}

      {/* ── Colors & appearance (all types) ── */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
        <label className="label">Colors</label>
        {el.type === "text" && !isFieldElement && (
          <ColorInput
            label="Text Color"
            value={el.color}
            onChange={(v) => set({ color: v })}
          />
        )}
        <ColorInput
          label="Background"
          value={el.background || el.bg || "#ffffff00"}
          onChange={(v) => set({ background: v })}
        />
        <ColorInput
          label="Border Color"
          value={el.borderColor || "#000000"}
          onChange={(v) => set({ borderColor: v })}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Border Radius"
            type="number"
            step="1"
            value={el.borderRadius ?? 0}
            onChange={(e) => set({ borderRadius: num(e.target.value) })}
          />
          <Input
            label="Border Width"
            type="number"
            step="0.5"
            value={el.borderWidth ?? 0}
            onChange={(e) => set({ borderWidth: num(e.target.value) })}
          />
        </div>
      </div>

      {/* ── Spacing ── */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
        <label className="label">Spacing (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Padding X"
            type="number"
            step="1"
            value={el.paddingX ?? 0}
            onChange={(e) => set({ paddingX: num(e.target.value) })}
          />
          <Input
            label="Padding Y"
            type="number"
            step="1"
            value={el.paddingY ?? 0}
            onChange={(e) => set({ paddingY: num(e.target.value) })}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Margin Top"
            type="number"
            step="1"
            value={el.marginTop ?? 0}
            onChange={(e) => set({ marginTop: num(e.target.value) })}
          />
          <Input
            label="Margin Bottom"
            type="number"
            step="1"
            value={el.marginBottom ?? 0}
            onChange={(e) => set({ marginBottom: num(e.target.value) })}
          />
        </div>
      </div>

      {/* ── Lock & visibility ── */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-2">
        <label className="label">Behavior</label>
        <Toggle
          label="Lock Position"
          checked={!!el.locked}
          onChange={(v) => set({ locked: v })}
        />
        <Toggle
          label="Visible"
          checked={!el.hidden}
          onChange={(v) => set({ hidden: !v })}
        />
      </div>

      {/* ── Z-order ── */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex gap-2">
        <button
          onClick={() => onBringForward(el.id)}
          className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200"
        >
          Bring Forward
        </button>
        <button
          onClick={() => onSendBackward(el.id)}
          className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200"
        >
          Send Backward
        </button>
      </div>
    </div>
  );
}
