import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tag, Plus, Pencil, Trash2, Printer, Search } from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { formatDateTime } from "../utils/format";

export default function Labels() {
  const { labels, loading, fetchLabels } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchLabels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = labels.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(l.data || {})
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const handleDelete = async () => {
    try {
      await api.delete(`/labels/${confirmDelete.id}`);
      toast.success("Label deleted");
      fetchLabels();
    } catch (err) {
      toast.error(err.message || "Failed to delete label");
    }
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        title="Saved Labels"
        description={`${labels.length} labels in your library`}
        actions={
          <Button onClick={() => navigate("/designer")}>
            <Plus className="w-4 h-4" /> New Label
          </Button>
        }
      />

      <div className="relative max-w-md mb-5">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          placeholder="Search labels…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input !pl-9"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 card animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={search ? "No matching labels" : "No labels yet"}
          description={
            search
              ? "Try a different search term."
              : "Design your first label in the designer."
          }
          action={
            !search && (
              <Button onClick={() => navigate("/designer")}>
                <Plus className="w-4 h-4" /> Create Label
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const data = JSON.parse(l.data || "{}");
            const elementCount = JSON.parse(l.elements || "[]").length;
            const previewVal = data.product || data.model || l.name;
            return (
              <div
                key={l.id}
                className="card p-5 hover:shadow-card-hover transition-shadow flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-500/10 text-accent-500 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {elementCount} elements
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                  {l.name}
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {l.width}×{l.height}mm · updated {formatDateTime(l.updatedAt)}
                </p>
                <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 font-mono text-[10px] text-gray-500 dark:text-gray-400 break-all">
                  {previewVal}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    onClick={() => navigate(`/preview/${l.id}`)}
                  >
                    <Printer className="w-4 h-4" /> Print
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/designer/${l.id}`)}
                  >
                    <Pencil className="w-4 h-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger hover:text-danger"
                    onClick={() => setConfirmDelete(l)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Label"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
