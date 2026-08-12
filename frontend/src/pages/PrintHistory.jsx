import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, Search, RotateCcw, Inbox, Trash2 } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatDateTime } from "../utils/format";

const PRINTER_TYPE_LABELS = {
  thermal: "Thermal",
  laser: "Laser",
  inkjet: "Inkjet",
};

export default function PrintHistory() {
  const toast = useToast();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [printerFilter, setPrinterFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const PAGE_SIZE = 12;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String((page - 1) * PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (printerFilter !== "all") params.set("printerType", printerFilter);
      const res = await api.get(`/prints?${params.toString()}`);
      setHistory(res.data || []);
      setTotalPages(Math.max(1, Math.ceil((res.meta?.total || 0) / PAGE_SIZE)));
      setTotal(res.meta?.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to load print history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await api.delete(`/prints/${confirmDelete.id}`);
      toast.success("Print record deleted");
      setConfirmDelete(null);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete print record");
      setConfirmDelete(null);
    }
  };

  const handleReprint = async (item) => {
    try {
      if (item.labelId) {
        navigate(`/preview/${item.labelId}`);
      } else {
        toast.error("Original label no longer available");
      }
    } catch (err) {
      toast.error(err.message || "Could not reprint");
    }
  };

  const doSearch = () => {
    setPage(1);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Print History"
        description={`${total} print jobs recorded`}
      />

      <div className="card p-4 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Search by label name or user…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            className="input !pl-9"
          />
        </div>
        <select
          value={printerFilter}
          onChange={(e) => {
            setPrinterFilter(e.target.value);
            setPage(1);
          }}
          className="input w-44 text-sm"
        >
          <option value="all">All printer types</option>
          <option value="thermal">Thermal</option>
          <option value="laser">Laser</option>
          <option value="inkjet">Inkjet</option>
        </select>
        <Button
          variant="secondary"
          onClick={() => {
            setSearch("");
            setPrinterFilter("all");
            setPage(1);
          }}
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 card animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <EmptyState
          icon={Printer}
          title="No print history"
          description="Labels you print will appear here with details about copies, printer, and timing."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Label</th>
                  <th className="px-4 py-3">Printer</th>
                  <th className="px-4 py-3">Copies</th>
                  <th className="px-4 py-3">By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">
                      {h.labelName}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                        {PRINTER_TYPE_LABELS[h.printerType] || h.printerType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {h.count} × {h.copies} {h.copies > 1 ? "copies" : "copy"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {h.createdBy?.fullName || h.createdBy?.username || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDateTime(h.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${h.status === "completed" ? "bg-green-500/10 text-green-600" : h.status === "failed" ? "bg-danger/10 text-danger" : "bg-yellow-500/10 text-yellow-600"}`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprint(h)}
                          title="Reprint"
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(h)}
                          title="Delete"
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/10">
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Print Record"
        message={`Delete print record for "${confirmDelete?.labelName}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
