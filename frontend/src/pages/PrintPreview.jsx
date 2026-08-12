import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Printer,
  ChevronLeft,
  Settings,
  Copy,
  Ruler,
  RotateCcw,
  Save,
  Download,
  Thermometer,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Toggle } from "../components/ui/Input";
import { ElementRenderer } from "../designer/elementRenderer";
import { MM_TO_PX } from "../utils/constants";

export default function PrintPreview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { settings, fetchPrints } = useData();
  const toast = useToast();
  const printAreaRef = useRef(null);

  const batchItems = location.state?.items || null;
  const isBatch = location.state?.batch || !!batchItems;

  const [items, setItems] = useState([]);
  const [copies, setCopies] = useState(1);
  const [printerType, setPrinterType] = useState("thermal");
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [showCalibration, setShowCalibration] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadLabel = useCallback(async (labelId) => {
    const res = await api.get(`/labels/${labelId}`);
    const label = res.data;
    return {
      id: label.id,
      name: label.name,
      width: label.width,
      height: label.height,
      background: label.background || "#ffffff",
      elements: JSON.parse(label.elements || "[]"),
      data: JSON.parse(label.data || "{}"),
      copies: 1,
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        if (isBatch && batchItems) {
          setItems(batchItems);
        } else if (id) {
          const item = await loadLabel(id);
          if (!cancelled) setItems([item]);
        } else {
          // Recent printable — fall back to default template
          toast.error("No label specified for preview");
          navigate("/labels");
        }
      } catch (err) {
        toast.error(err.message || "Failed to load label");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isBatch]);

  const handlePrint = async () => {
    if (!printAreaRef.current) return;
    try {
      // Build print HTML with copies
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        toast.error("Popup blocked — allow popups to print");
        return;
      }
      // Clone the rendered label cards so barcode/QR canvases carry over
      const cards = Array.from(
        printAreaRef.current.querySelectorAll("[data-label-card]"),
      );
      const clones = [];
      for (const card of cards) {
        const copyCount = Number(card.dataset.copies ?? copies) || 1;
        for (let c = 0; c < copyCount; c++) {
          const clone = card.cloneNode(true);
          clone.style.margin = "0";
          clone.style.breakInside = "avoid";
          clones.push(clone.outerHTML);
        }
      }
      const labelHtml = clones.join("");

      const css = `
        @page { size: auto; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { display: flex; flex-wrap: wrap; gap: 2mm; padding: 2mm; background: #fff; }
        .label-page { overflow: hidden; box-sizing: border-box; }
        .label-inner { overflow: hidden; }
        @media print {
          body { gap: 0; padding: 0; }
        }
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head><title>Print Labels</title><style>${css}</style></head>
        <body>${labelHtml}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 400);

      toast.success("Sent to printer");
      fetchPrints();
      try {
        await api.post("/prints/log", {
          labelId: items.length === 1 && items[0].id ? items[0].id : null,
          labelName: items
            .map((i) => i.name)
            .join(", ")
            .slice(0, 100),
          copies,
          printerType,
          format: "print",
          count: items.reduce(
            (sum, i) => sum + (Number(i.copies ?? copies) || 1),
            0,
          ),
        });
      } catch (err) {
        /* logging is best-effort */
      }
    } catch (err) {
      toast.error(`Print failed: ${err.message}`);
    }
  };

  const handleDownloadPdf = async () => {
    const { exportToPdf } = await import("../utils/exportUtils");
    if (items[0]) {
      try {
        await exportToPdf(
          printAreaRef.current,
          items[0].width,
          items[0].height,
          items[0].name,
        );
        toast.success("PDF downloaded");
      } catch (err) {
        toast.error(err.message || "PDF export failed");
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="icon-btn">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Print Preview
            </h1>
            <p className="text-sm text-gray-500">
              {isBatch
                ? `${items.length} labels in batch`
                : items[0]?.name || "Label"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowCalibration((s) => !s)}
          >
            <Settings className="w-4 h-4" /> Calibration
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPdf}>
            <Download className="w-4 h-4" /> PDF
          </Button>
          <Button size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print
          </Button>
        </div>
      </div>

      {showCalibration && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-4 h-4" /> Calibration & Offsets
            </h3>
            <button
              className="icon-btn text-sm"
              onClick={() => {
                setOffsetX(0);
                setOffsetY(0);
              }}
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-4">
            Adjust the print position if labels are off-center. Positive X
            shifts right, positive Y shifts down.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Input
              label="Offset X (mm)"
              type="number"
              step="0.1"
              value={offsetX}
              onChange={(e) => setOffsetX(Number(e.target.value) || 0)}
            />
            <Input
              label="Offset Y (mm)"
              type="number"
              step="0.1"
              value={offsetY}
              onChange={(e) => setOffsetY(Number(e.target.value) || 0)}
            />
            <Select
              label="Printer Type"
              value={printerType}
              onChange={(e) => setPrinterType(e.target.value)}
            >
              <option value="thermal">Thermal</option>
              <option value="laser">Laser</option>
              <option value="inkjet">Inkjet</option>
            </Select>
            <Input
              label="Copies"
              type="number"
              min="1"
              max="999"
              value={copies}
              onChange={(e) =>
                setCopies(Math.max(1, Number(e.target.value) || 1))
              }
            />
          </div>
        </div>
      )}

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <Ruler className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Previewing at exact physical size — {items[0]?.width} ×{" "}
            {items[0]?.height} mm
          </span>
          <span className="badge bg-accent-500/10 text-accent-500 ml-auto">
            <Thermometer className="w-3 h-3" />{" "}
            {printerType.charAt(0).toUpperCase() + printerType.slice(1)}
          </span>
        </div>

        <div
          ref={printAreaRef}
          className="flex flex-wrap gap-4 items-start justify-center bg-[#f5f5f7] dark:bg-black/30 rounded-xl p-6 min-h-[200px]"
        >
          {items.map((item, idx) => {
            const w = (item.width + offsetX) * MM_TO_PX;
            const h = (item.height + offsetY) * MM_TO_PX;
            const innerW = item.width * MM_TO_PX;
            const innerH = item.height * MM_TO_PX;
            return (
              <div
                key={idx}
                className="relative"
                data-label-card
                data-copies={item.copies || copies}
              >
                <div
                  className="relative shadow-lg bg-white"
                  style={{ width: w, height: h }}
                >
                  <div
                    className="absolute"
                    style={{
                      width: innerW,
                      height: innerH,
                      background: item.background || "#ffffff",
                      transform: `translate(${offsetX * MM_TO_PX}px, ${offsetY * MM_TO_PX}px)`,
                    }}
                  >
                    {(item.elements || []).map((el) => (
                      <ElementRenderer
                        key={el.id}
                        el={el}
                        data={item.data || {}}
                        settings={settings}
                        selected={false}
                        onSelect={() => {}}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-gray-400" />
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Copies:
          </label>
          <input
            type="number"
            min="1"
            max="999"
            value={copies}
            onChange={(e) =>
              setCopies(Math.max(1, Number(e.target.value) || 1))
            }
            className="input !py-1.5 w-24 text-sm"
          />
        </div>
        <Toggle
          label="Show helper labels"
          checked={showLabels}
          onChange={setShowLabels}
        />
        <div className="ml-auto">
          <Button onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Print {items.length * copies} Labels
          </Button>
        </div>
      </div>
    </div>
  );
}
