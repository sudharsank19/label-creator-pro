import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  PenTool,
  LayoutTemplate,
  Printer,
  TrendingUp,
  Plus,
  FileDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { StatCard } from "../components/ui/StatCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { formatDateTime, timeAgo } from "../utils/format";
import { exportDataToCsv, exportDataToJson } from "../utils/exportUtils";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { labels, templates, recentLabels, categories, settings, loading } =
    useData();
  const [stats, setStats] = useState({
    totalPrints: 0,
    todayPrints: 0,
    recent: [],
  });
  const [showExportMenu, setShowExportMenu] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get("/prints/stats");
      setStats(res.data);
    } catch {
      // stats optional
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExport = (format) => {
    const rows = labels.map((l) => ({
      id: l.id,
      name: l.name,
      width: l.width,
      height: l.height,
      updated: l.updatedAt,
    }));
    if (format === "csv") exportDataToCsv(rows, "labels-export");
    else exportDataToJson(rows, "labels-export");
    setShowExportMenu(false);
    toast.success(`Exported ${rows.length} labels to ${format.toUpperCase()}`);
  };

  const openLabel = (id) => navigate(`/designer/${id}`);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-3xl glass p-6 lg:p-8 mb-8">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent-500/15 blur-3xl" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome back, {user?.fullName?.split(" ")[0] || user?.username} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xl">
              Design labels, import spare part data, and print barcodes in
              seconds.
              {settings.companyName && ` Working with ${settings.companyName}.`}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => navigate("/designer")}>
              <Plus className="w-4 h-4" /> New Label
            </Button>
            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowExportMenu((s) => !s)}
              >
                <FileDown className="w-4 h-4" /> Export
              </Button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 card p-2 z-20 animate-scale-in">
                  <button
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Export as JSON
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Layers}
          label="Total Labels"
          value={labels.length}
          color="accent"
          sub={`${templates.length} templates`}
        />
        <StatCard
          icon={Printer}
          label="Total Prints"
          value={stats.totalPrints}
          color="green"
          sub={`${stats.todayPrints} today`}
        />
        <StatCard
          icon={LayoutTemplate}
          label="Templates"
          value={templates.length}
          color="purple"
          sub="Saved layouts"
        />
        <StatCard
          icon={TrendingUp}
          label="Categories"
          value={categories.length}
          color="orange"
          sub="Part categories"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent labels */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-500" /> Recent Labels
            </h2>
            <Link
              to="/designer"
              className="text-sm text-accent-500 hover:text-accent-600 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : recentLabels.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="No labels yet"
              description="Create your first label design to get started."
              action={
                <Button onClick={() => navigate("/designer")}>
                  <Plus className="w-4 h-4" /> Create Label
                </Button>
              }
            />
          ) : (
            <div className="space-y-2">
              {recentLabels.slice(0, 5).map((label) => (
                <button
                  key={label.id}
                  onClick={() => openLabel(label.id)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-accent-500/10 text-accent-500 flex items-center justify-center shrink-0">
                      <PenTool className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                        {label.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {label.width}×{label.height}mm
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">
                      {timeAgo(label.updatedAt)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-accent-500 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions + recent prints */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Designer",
                  icon: PenTool,
                  to: "/designer",
                  color: "text-accent-500 bg-accent-500/10",
                },
                {
                  label: "Templates",
                  icon: LayoutTemplate,
                  to: "/templates",
                  color: "text-purple-500 bg-purple-500/10",
                },
                {
                  label: "Import",
                  icon: Plus,
                  to: "/import",
                  color: "text-success bg-success/10",
                },
                {
                  label: "Print History",
                  icon: Printer,
                  to: "/history",
                  color: "text-warning bg-warning/10",
                },
              ].map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center`}
                  >
                    <a.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {a.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">
              Recent Prints
            </h2>
            {stats.recent.length === 0 ? (
              <p className="text-sm text-gray-400">No prints recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {stats.recent.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {p.labelName}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {p.copies}× {p.printerType} •{" "}
                        {formatDateTime(p.createdAt)}
                      </p>
                    </div>
                    <span className="badge bg-success/10 text-success">
                      Done
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
