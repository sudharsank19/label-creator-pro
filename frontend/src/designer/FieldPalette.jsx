import {
  Plus,
  Smartphone,
  Package,
  BadgeCheck,
  Palette,
  Hash,
  Pencil,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { DYNAMIC_FIELDS, BARCODE_FIELD } from "../utils/constants";

const ICONS = {
  Smartphone,
  Package,
  BadgeCheck,
  Palette,
  Hash,
};

/**
 * Field Palette — the only data entry point.
 *
 * Rows are professionally aligned: fixed height, equal spacing, icon on the
 * left, label + input in the middle, action buttons right-aligned. Long
 * labels truncate with ellipsis. Hover states highlight the row, and a
 * "selected" highlight (accent ring) marks fields already placed on canvas.
 */
export function FieldPalette({
  data,
  onDataChange,
  onAddField,
  onTogglePanel,
  onToggleAutoLayout,
  autoLayoutActive,
  customFields = [],
  placedKeys = [],
  onAddCustomField,
  onEditCustomField,
  onDeleteCustomField,
  onDuplicateCustomField,
  onToggleCustomFieldVisibility,
}) {
  const handleData = (key, value) => {
    onDataChange(key, value);
  };

  const allFields = [
    ...DYNAMIC_FIELDS,
    {
      key: BARCODE_FIELD.key,
      label: BARCODE_FIELD.label,
      icon: "Hash",
      isBarcode: true,
    },
  ];

  const isPlaced = (key) => placedKeys.includes(key);

  return (
    <div className="w-64 shrink-0 card p-4 overflow-y-auto hidden md:block">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
          Field Palette
        </h3>
        <button className="icon-btn" onClick={onTogglePanel}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-gray-400 mb-3">
        Type values below — they render live on the canvas. Click{" "}
        <Plus className="inline w-3 h-3" /> to place a linked field.
      </p>

      {/* Auto-layout toggle */}
      <div className="flex items-center justify-between gap-2 mb-3 px-2 py-2 rounded-lg bg-accent-500/10">
        <label className="text-[11px] font-semibold text-accent-600 dark:text-accent-400 cursor-pointer">
          Auto Layout
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={autoLayoutActive}
          onClick={() => onToggleAutoLayout()}
          className={`relative w-9 h-5 rounded-full transition-colors ${autoLayoutActive ? "bg-accent-500" : "bg-gray-300 dark:bg-[#48484a]"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${autoLayoutActive ? "translate-x-4" : "translate-x-0"}`}
          />
        </button>
      </div>

      <div className="space-y-1.5">
        {allFields.map((f) => {
          const Icon = ICONS[f.icon] || Hash;
          const isBarcode = f.isBarcode;
          const value = data[f.key] || "";
          const placed = isPlaced(f.key);
          return (
            <div
              key={f.key}
              className={`group flex items-center gap-2 h-11 px-2 rounded-xl transition-colors border ${
                placed
                  ? "bg-accent-500/5 border-accent-500/30"
                  : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
              }`}
            >
              <div
                className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${
                  placed
                    ? "bg-accent-500/15 text-accent-500"
                    : "bg-gray-100 dark:bg-white/5 text-gray-400"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <label
                  className={`text-[10px] font-semibold uppercase tracking-wide block truncate ${
                    placed
                      ? "text-accent-600 dark:text-accent-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                  title={f.label}
                >
                  {f.label}
                </label>
                <input
                  value={value}
                  onChange={(e) => handleData(f.key, e.target.value)}
                  className="input !py-0.5 !px-2 text-xs h-6"
                  placeholder={f.label}
                />
                {isBarcode && value && (
                  <p className="text-[9px] text-green-500 mt-0.5">
                    ✓ Barcode auto-generated
                  </p>
                )}
              </div>
              <button
                onClick={() =>
                  onAddField(isBarcode ? { ...f, type: "barcode" } : f)
                }
                className="w-7 h-7 shrink-0 rounded-lg bg-accent-500/10 text-accent-500 hover:bg-accent-500 hover:text-white flex items-center justify-center transition-colors"
                title={`Add ${f.label} to label`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-100 dark:border-white/10">
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block px-1">
              Custom Fields
            </label>
            <div className="space-y-1.5">
              {customFields.map((cf) => {
                const placed = isPlaced(cf.key);
                return (
                  <div
                    key={cf.key}
                    className={`group flex items-center gap-1.5 h-11 px-2 rounded-xl transition-colors border ${
                      placed
                        ? "bg-accent-500/5 border-accent-500/30"
                        : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5"
                    } ${cf.visible === false ? "opacity-60" : ""}`}
                  >
                    <div className="flex-1 min-w-0">
                      <label
                        className={`text-[10px] font-semibold uppercase tracking-wide block truncate ${
                          placed
                            ? "text-accent-600 dark:text-accent-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                        title={cf.label}
                      >
                        {cf.label}
                      </label>
                      <input
                        value={data[cf.key] || ""}
                        onChange={(e) => handleData(cf.key, e.target.value)}
                        className="input !py-0.5 !px-2 text-xs h-6"
                        placeholder={cf.label}
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() =>
                          onAddField({
                            key: cf.key,
                            label: cf.label,
                            customField: true,
                          })
                        }
                        className="w-6 h-6 rounded-md bg-accent-500/10 text-accent-500 hover:bg-accent-500 hover:text-white flex items-center justify-center transition-colors"
                        title={`Add ${cf.label} to label`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditCustomField?.(cf)}
                        className="w-6 h-6 rounded-md text-gray-400 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="Rename"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDuplicateCustomField?.(cf)}
                        className="w-6 h-6 rounded-md text-gray-400 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onToggleCustomFieldVisibility?.(cf)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                          cf.visible !== false
                            ? "text-gray-400 hover:text-accent-500 hover:bg-gray-100 dark:hover:bg-white/10"
                            : "text-gray-300 dark:text-gray-600 bg-gray-100 dark:bg-white/5"
                        }`}
                        title={cf.visible !== false ? "Hide" : "Show"}
                      >
                        {cf.visible !== false ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => onDeleteCustomField?.(cf)}
                        className="w-6 h-6 rounded-md text-gray-400 hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Add Custom Field button */}
        <button
          onClick={onAddCustomField}
          className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-accent-500 bg-accent-500/10 hover:bg-accent-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Custom Field
        </button>
      </div>
    </div>
  );
}
