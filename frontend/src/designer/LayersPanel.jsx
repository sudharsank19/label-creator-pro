import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Type,
  Barcode,
  QrCode,
  Square,
  Circle,
  Minus,
  Image,
  Building2,
  Calendar,
  Clock,
} from "lucide-react";

const TYPE_ICONS = {
  text: Type,
  barcode: Barcode,
  qr: QrCode,
  rectangle: Square,
  circle: Circle,
  line: Minus,
  image: Image,
  logo: Building2,
  date: Calendar,
  time: Clock,
};

/**
 * Layers panel — click to select, eye to toggle visibility,
 * bring forward / send backward to change z-order.
 * Order in the array = z-index (last = front).
 */
export function LayersPanel({
  elements,
  selectedId,
  onSelect,
  onToggleVisible,
  onBringForward,
  onSendBackward,
}) {
  if (!elements.length) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-gray-400">
          No elements yet — add fields from the palette.
        </p>
      </div>
    );
  }

  // Display top-most first
  const ordered = [...elements].reverse();

  return (
    <div className="space-y-1">
      {ordered.map((el) => {
        const Icon = TYPE_ICONS[el.type] || Type;
        const fieldKey = el.fieldKey;
        // Use displayLabel for field elements, otherwise fall back to type name
        const label =
          el.displayLabel ||
          (fieldKey
            ? fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)
            : el.type === "text"
              ? el.text || "Text"
              : el.type.charAt(0).toUpperCase() + el.type.slice(1));
        return (
          <div
            key={el.id}
            onClick={() => onSelect(el.id)}
            className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${selectedId === el.id ? "bg-accent-500/10 ring-1 ring-accent-500/40" : "hover:bg-gray-100 dark:hover:bg-white/5"}`}
          >
            <Icon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="flex-1 text-xs text-gray-700 dark:text-gray-200 truncate">
              {label}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisible(el.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title={el.hidden ? "Show" : "Hide"}
            >
              {el.hidden ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBringForward(el.id);
                }}
                className="text-gray-400 hover:text-accent-500"
                title="Bring forward"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSendBackward(el.id);
                }}
                className="text-gray-400 hover:text-accent-500"
                title="Send backward"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
