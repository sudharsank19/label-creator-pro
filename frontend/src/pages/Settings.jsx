import { useState, useEffect } from "react";
import {
  Building2,
  Printer,
  Palette,
  Download,
  Database,
  Save,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import {
  Input,
  Textarea,
  Select,
  Toggle,
  ColorInput,
} from "../components/ui/Input";
import { CATEGORY_COLORS } from "../utils/constants";

export default function Settings() {
  const { settings, categories, fetchSettings, fetchCategories } = useData();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("company");

  useEffect(() => {
    if (settings) {
      const s = {};
      for (const [k, v] of Object.entries(settings)) s[k] = v;
      setForm(s);
    }
  }, [settings]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", form);
      fetchSettings();
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const res = await api.get("/settings/export");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `label-creator-pro-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  };

  const tabs = [
    { id: "company", label: "Company", icon: Building2 },
    { id: "printer", label: "Printer", icon: Printer },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "data", label: "Data", icon: Database },
  ];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        title="Settings"
        description="Configure your label printing workspace"
      />

      <div className="flex gap-6 flex-col md:flex-row">
        <div className="md:w-52 shrink-0 card p-2 self-start w-full md:sticky md:top-24">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-accent-500/10 text-accent-500"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-5">
          {activeTab === "company" && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Company Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={form.companyName || ""}
                  onChange={(e) => set("companyName", e.target.value)}
                />
                <Input
                  label="Phone"
                  value={form.companyPhone || ""}
                  onChange={(e) => set("companyPhone", e.target.value)}
                />
              </div>
              <Input
                label="Company Address"
                value={form.companyAddress || ""}
                onChange={(e) => set("companyAddress", e.target.value)}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email"
                  type="email"
                  value={form.companyEmail || ""}
                  onChange={(e) => set("companyEmail", e.target.value)}
                />
                <Input
                  label="Default Label Width (mm)"
                  type="number"
                  min="20"
                  max="200"
                  value={form.defaultWidth || 50}
                  onChange={(e) => set("defaultWidth", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Default Label Height (mm)"
                  type="number"
                  min="10"
                  max="150"
                  value={form.defaultHeight || 25}
                  onChange={(e) => set("defaultHeight", e.target.value)}
                />
              </div>
              <Button onClick={save} loading={saving}>
                <Save className="w-4 h-4" /> Save Settings
              </Button>
            </div>
          )}

          {activeTab === "printer" && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Printer Defaults
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Default Printer Type"
                  value={form.defaultPrinter || "thermal"}
                  onChange={(e) => set("defaultPrinter", e.target.value)}
                >
                  <option value="thermal">Thermal (receipt/label)</option>
                  <option value="laser">Laser</option>
                  <option value="inkjet">Inkjet</option>
                </Select>
                <Input
                  label="Default Copies"
                  type="number"
                  min="1"
                  max="999"
                  value={form.defaultCopies || 1}
                  onChange={(e) => set("defaultCopies", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Barcode Type"
                  value={form.barcodeType || "CODE128"}
                  onChange={(e) => set("barcodeType", e.target.value)}
                >
                  <option value="CODE128">Code 128</option>
                  <option value="EAN13">EAN-13</option>
                  <option value="UPCA">UPC-A</option>
                  <option value="CODE39">Code 39</option>
                </Select>
                <Select
                  label="QR Error Correction"
                  value={form.qrErrorLevel || "M"}
                  onChange={(e) => set("qrErrorLevel", e.target.value)}
                >
                  <option value="L">L — Low</option>
                  <option value="M">M — Medium</option>
                  <option value="Q">Q — Quartile</option>
                  <option value="H">H — High</option>
                </Select>
              </div>
              <Toggle
                label="Enable QR codes on labels"
                checked={String(form.qrEnabled) === "true"}
                onChange={(v) => set("qrEnabled", String(v))}
              />
              <Button onClick={save} loading={saving}>
                <Save className="w-4 h-4" /> Save Printer Settings
              </Button>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Appearance
              </h3>
              <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-gray-50 dark:bg-white/5">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Dark Mode
                  </p>
                  <p className="text-xs text-gray-400">
                    Use the dark theme across the app
                  </p>
                </div>
                <Toggle checked={theme === "dark"} onChange={toggleTheme} />
              </div>
              <div className="pt-2">
                <label className="label mb-2">Category Colors</label>
                <div className="space-y-2">
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                      <ColorInput
                        value={
                          CATEGORY_COLORS.find((x) => x.name === c.name)
                            ?.color || c.color
                        }
                        onChange={(v) => c.color}
                        compact
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Data Management
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Export all labels, templates, print history, settings,
                categories, and users as a JSON backup file.
              </p>
              <Button variant="secondary" onClick={exportData}>
                <Download className="w-4 h-4" /> Export All Data (JSON)
              </Button>
              <hr className="border-gray-100 dark:border-white/10" />
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Your Account
                </h4>
                <p className="text-sm text-gray-500">
                  Signed in as <strong>{user?.fullName}</strong> ({user?.role})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
