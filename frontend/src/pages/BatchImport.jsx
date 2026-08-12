import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileUp,
  FileSpreadsheet,
  FileJson,
  X,
  CheckCircle2,
  AlertCircle,
  Printer,
  Layers,
  Ruler,
} from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Input";
import { MM_TO_PX } from "../utils/constants";
import { ElementRenderer } from "../designer/elementRenderer";
import { buildBatchLabel, parseJson } from "../designer/elementUtils";

export default function BatchImport() {
  const { settings, fetchLabels, templates, fetchTemplates } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [savedCount, setSavedCount] = useState(null);
  const [errors, setErrors] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [copyCount, setCopyCount] = useState(1);
  const [selectedRows, setSelectedRows] = useState(new Set());

  // The selected template is the SINGLE source of truth for the design.
  // If no template is selected, fall back to the default template so batch
  // printing never silently uses a hardcoded/default layout.
  const selectedTemplate =
    templates.find((t) => t.id === templateId) ||
    templates.find((t) => t.isDefault) ||
    templates[0] ||
    null;

  // Selected row indices (empty selection = all rows). Computed BEFORE any
  // useMemo that depends on it to avoid a temporal-dead-zone reference error.
  const selectedRanges = selectedRows.size
    ? [...selectedRows].sort((a, b) => a - b)
    : rows.map((_, i) => i);
  const filteredRows = selectedRanges.map((i) => rows[i]).filter(Boolean);

  // Custom fields belonging to the selected template (settings.customFields).
  const templateCustomFields = useMemo(() => {
    const s = parseJson(selectedTemplate?.settings, {});
    return Array.isArray(s.customFields) ? s.customFields : [];
  }, [selectedTemplate]);

  // Build printable labels for every selected row using the shared renderer.
  const previewItems = useMemo(() => {
    if (!rows.length || !filteredRows.length) return [];
    return filteredRows.map((row, i) =>
      buildBatchLabel(selectedTemplate, row, {
        customFields: templateCustomFields,
        index: i,
      }),
    );
  }, [rows, filteredRows, selectedTemplate, templateCustomFields]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setErrors([]);
    setSavedCount(null);
    setFileName(file.name);

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors?.length) {
            setErrors(
              result.errors
                .slice(0, 5)
                .map((er) => `Row ${er.row + 2}: ${er.message}`),
            );
          }
          setRows(
            result.data.filter((r) =>
              Object.values(r).some((v) => String(v ?? "").trim() !== ""),
            ),
          );
          // Select all rows by default
          setSelectedRows(new Set());
        },
      });
    } else if (ext === "xlsx" || ext === "xls" || ext === "json") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          if (ext === "json") {
            const data = JSON.parse(ev.target.result);
            const arr = Array.isArray(data)
              ? data
              : data?.rows || data?.data || [];
            const parsed = arr.filter(
              (r) =>
                r &&
                Object.values(r).some(
                  (v) => v != null && String(v).trim() !== "",
                ),
            );
            setRows(parsed);
            setSelectedRows(new Set());
          } else {
            const wb = XLSX.read(ev.target.result, { type: "array" });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            const parsed = json.filter((r) =>
              Object.values(r).some(
                (v) => v != null && String(v).trim() !== "",
              ),
            );
            setRows(parsed);
            setSelectedRows(new Set());
          }
        } catch (err) {
          toast.error(`Failed to parse file: ${err.message}`);
        }
      };
      if (ext === "json") reader.readAsText(file);
      else reader.readAsArrayBuffer(file);
    } else {
      toast.error("Unsupported file type. Use CSV, Excel (xlsx/xls), or JSON.");
    }
  };

  const toggleRow = (idx) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((_, i) => i)),
    );
  };

  const saveSelected = async () => {
    if (!filteredRows.length) {
      toast.error("No rows selected");
      return;
    }
    setImporting(true);
    setErrors([]);
    try {
      // Save labels using the selected template design (or default template).
      const template = selectedTemplate || {
        width: Number(settings.defaultWidth) || 50,
        height: Number(settings.defaultHeight) || 25,
        background: "#ffffff",
        elements: [],
        settings: "{}",
      };
      const tElements = parseJson(template.elements, []);
      const tCustom = parseJson(template.settings, {}).customFields || [];
      const items = filteredRows.map((row, i) => {
        const label = buildBatchLabel(template, row, {
          customFields: tCustom,
          index: i,
        });
        return {
          name: label.name,
          width: label.width,
          height: label.height,
          background: label.background,
          elements: label.elements,
          data: label.data,
        };
      });
      const res = await api.post("/labels/batch", { items });
      setSavedCount(res.data.length);
      fetchLabels();
      toast.success(`Saved ${res.data.length} labels`);
    } catch (err) {
      toast.error(err.message || "Import failed");
      if (err.details)
        setErrors(Array.isArray(err.details) ? err.details : [err.details]);
    } finally {
      setImporting(false);
    }
  };

  const printSelected = () => {
    if (!filteredRows.length) {
      toast.error("No rows selected");
      return;
    }
    if (!selectedTemplate) {
      toast.error("No template available — save a template first");
      return;
    }
    // Every label uses the selected template's exact design, size and data.
    const payload = previewItems.map((item) => ({
      ...item,
      copies: Number(copyCount) || 1,
    }));
    const state = { items: payload, batch: true };
    navigate("/preview", { state });
  };

  const columns =
    rows.length && typeof rows[0] === "object"
      ? Object.keys(rows[0]).filter((k) => k !== "__rowNum__")
      : [];

  const fieldLabels = Object.fromEntries(
    [
      { key: "model", label: "Model" },
      { key: "product", label: "Product" },
      { key: "quality", label: "Quality" },
      { key: "color", label: "Color" },
      { key: "barcode", label: "Barcode" },
      { key: "warranty", label: "Warranty" },
      { key: "description", label: "Description" },
      { key: "category", label: "Category" },
      { key: "supplier", label: "Supplier" },
      { key: "batchNumber", label: "Batch Number" },
      { key: "price", label: "Price" },
      { key: "stock", label: "Stock" },
    ].map((f) => [f.key, f.label]),
  );

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Batch Import"
        description="Create and print labels from CSV, Excel, or JSON"
        actions={
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="hidden"
            onChange={handleFile}
          />
        }
      />

      <div className="card p-8 text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-accent-500/10 text-accent-500 flex items-center justify-center mb-4">
          <FileUp className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Import your data
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
          Import rows, pick the saved template that defines the design, then
          preview and print exactly those labels.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <Button onClick={() => fileRef.current?.click()}>
            <FileSpreadsheet className="w-4 h-4" /> Choose File
          </Button>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <FileSpreadsheet className="w-3.5 h-3.5" /> CSV ·{" "}
            <FileSpreadsheet className="w-3.5 h-3.5" /> XLSX ·{" "}
            <FileJson className="w-3.5 h-3.5" /> JSON
          </span>
        </div>
        {fileName && (
          <p className="text-xs text-gray-500 mt-3">
            <CheckCircle2 className="w-3.5 h-3.5 inline text-green-500 mr-1" />
            Loaded <strong>{rows.length}</strong> rows from {fileName}
          </p>
        )}
      </div>

      {errors.length > 0 && (
        <div className="card border-danger/30 bg-danger/5 p-4 mb-6">
          <div className="flex items-center gap-2 text-danger font-semibold mb-2">
            <AlertCircle className="w-4 h-4" /> Import Issues
          </div>
          <ul className="text-sm text-danger/90 space-y-1 list-disc pl-5">
            {errors.map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <>
          {/* Template selection — the saved template is the single source of truth */}
          <div className="card p-4 mb-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Layers className="w-4 h-4 text-gray-400" />
                <Select
                  label="Select Template"
                  value={
                    templateId || (selectedTemplate ? selectedTemplate.id : "")
                  }
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="flex-1"
                >
                  <option value="">Select a saved template…</option>
                  {templates.map((t) => {
                    const w = Number(t.widthMm ?? t.width) || 50;
                    const h = Number(t.heightMm ?? t.height) || 25;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.name} — {w}×{h} mm
                      </option>
                    );
                  })}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-500 font-medium">
                  Copies per label
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={copyCount}
                  onChange={(e) => setCopyCount(e.target.value)}
                  className="input !py-2 w-20 text-sm"
                />
              </div>
            </div>
            {selectedTemplate && (
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-500 dark:text-gray-400">
                <span className="inline-flex items-center gap-1 font-semibold text-accent-500">
                  <Ruler className="w-3.5 h-3.5" />
                  {Number(selectedTemplate.widthMm ?? selectedTemplate.width) ||
                    50}
                  ×
                  {Number(
                    selectedTemplate.heightMm ?? selectedTemplate.height,
                  ) || 25}{" "}
                  mm
                </span>
                <span>Design: {selectedTemplate.name}</span>
                <span className="text-gray-400">
                  {parseJson(selectedTemplate.elements, []).length} elements
                </span>
              </div>
            )}
          </div>

          {/* Preview table of imported rows (# is UI-only, never printed) */}
          <div className="card overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-12">
                      <input
                        type="checkbox"
                        checked={selectedRows.size === rows.length}
                        onChange={toggleAll}
                        className="accent-accent-500"
                      />
                    </th>
                    <th className="px-4 py-3">#</th>
                    {columns.map((c) => (
                      <th key={c} className="px-4 py-3">
                        <span className="block">{fieldLabels[c] || c}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                  {rows.slice(0, 100).map((row, i) => (
                    <tr
                      key={i}
                      className={`hover:bg-gray-50 dark:hover:bg-white/5 ${selectedRows.has(i) ? "bg-accent-500/5" : ""}`}
                    >
                      <td className="px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(i)}
                          onChange={() => toggleRow(i)}
                          className="accent-accent-500"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{i + 1}</td>
                      {columns.map((c) => (
                        <td
                          key={c}
                          className="px-4 py-2.5 text-gray-700 dark:text-gray-300"
                        >
                          {String(row[c] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && (
              <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 dark:border-white/10">
                Showing first 100 of {rows.length} rows. All{" "}
                {filteredRows.length} selected rows will be processed.
              </div>
            )}
          </div>

          {/* Live generated-label preview using the exact template design */}
          {selectedTemplate && previewItems.length > 0 && (
            <div className="card p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Generated Label Preview
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {previewItems.length} label
                    {previewItems.length !== 1 ? "s" : ""} · uses the exact{" "}
                    {selectedTemplate.name} design ·{" "}
                    {Number(
                      selectedTemplate.widthMm ?? selectedTemplate.width,
                    ) || 50}
                    ×
                    {Number(
                      selectedTemplate.heightMm ?? selectedTemplate.height,
                    ) || 25}{" "}
                    mm
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 items-start">
                {previewItems.slice(0, 12).map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className="relative bg-white shadow-lg overflow-hidden"
                      style={{
                        width: item.width * MM_TO_PX,
                        height: item.height * MM_TO_PX,
                        background: item.background || "#ffffff",
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
                          elements={item.elements}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={saveSelected}
              loading={importing}
              disabled={!filteredRows.length}
            >
              <CheckCircle2 className="w-4 h-4" />{" "}
              {importing ? "Saving…" : `Save ${filteredRows.length} Labels`}
            </Button>
            <Button
              variant="secondary"
              onClick={printSelected}
              disabled={!filteredRows.length || !selectedTemplate}
            >
              <Printer className="w-4 h-4" /> Print{" "}
              {filteredRows.length * (Number(copyCount) || 1)} Labels
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRows([]);
                setFileName("");
                setSavedCount(null);
                setTemplateId("");
              }}
            >
              <X className="w-4 h-4" /> Clear
            </Button>
            {savedCount != null && (
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {savedCount} labels saved
                successfully
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
