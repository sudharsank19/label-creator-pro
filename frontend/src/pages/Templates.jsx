import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutTemplate,
  Plus,
  Copy,
  Trash2,
  PenTool,
  Star,
  Ruler,
  Clock,
} from "lucide-react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Modal } from "../components/ui/Modal";
import { Input, Textarea } from "../components/ui/Input";
import { ElementRenderer } from "../designer/elementRenderer";
import { MM_TO_PX } from "../utils/constants";
import { formatDateTime, timeAgo } from "../utils/format";

export default function Templates() {
  const { templates, settings, loading, fetchTemplates } = useData();
  const toast = useToast();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    width: 50,
    height: 25,
  });
  const [creating, setCreating] = useState(false);

  // Fetch templates immediately on mount so newly saved ones appear instantly
  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async () => {
    try {
      await api.delete(`/templates/${confirmDelete.id}`);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to delete template");
    }
    setConfirmDelete(null);
  };

  const handleDuplicate = async (t) => {
    try {
      await api.post(`/templates/${t.id}/duplicate`);
      toast.success("Template duplicated");
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to duplicate template");
    }
  };

  const handleSetDefault = async (t) => {
    try {
      await api.put(`/templates/${t.id}`, {
        name: t.name,
        description: t.description,
        width: t.width,
        height: t.height,
        background: t.background,
        elements: JSON.parse(t.elements || "[]"),
        data: JSON.parse(t.data || "{}"),
        settings: JSON.parse(t.settings || "{}"),
        isDefault: true,
      });
      toast.success("Set as default template");
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to update template");
    }
  };

  const handleCreate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error("Template name is required");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/templates", {
        name: newTemplate.name.trim(),
        description: newTemplate.description,
        width: Number(newTemplate.width) || 50,
        height: Number(newTemplate.height) || 25,
        elements: [],
        data: {},
        settings: {},
      });
      setShowCreate(false);
      toast.success("Template created — add elements in the designer");
      navigate(`/designer?template=${res.data.id}`);
    } catch (err) {
      toast.error(err.message || "Failed to create template");
    } finally {
      setCreating(false);
    }
  };

  const TemplateThumbnail = ({ t }) => {
    const elements = JSON.parse(t.elements || "[]");
    const data = JSON.parse(t.data || "{}");
    const scale = 0.22;
    const w = Math.round(t.width * MM_TO_PX * scale);
    const h = Math.round(t.height * MM_TO_PX * scale);
    return (
      <div
        className="relative mx-auto bg-white rounded-lg shadow-inner overflow-hidden"
        style={{ width: w, height: h }}
      >
        <div
          className="absolute"
          style={{
            width: w,
            height: h,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: t.background || "#ffffff",
          }}
        >
          {elements.map((el) => (
            <ElementRenderer
              key={el.id}
              el={el}
              data={data}
              settings={settings}
              selected={false}
              onSelect={() => {}}
              elements={elements}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        title="Templates"
        description="Reusable label layouts for your spare parts"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> New Template
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 card animate-pulse" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates yet"
          description="Create a template to reuse label layouts across different parts."
          action={
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" /> Create Template
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t) => {
            const elements = JSON.parse(t.elements || "[]");
            return (
              <div
                key={t.id}
                className="card p-5 hover:shadow-card-hover transition-shadow flex flex-col"
              >
                {/* Thumbnail preview */}
                <div className="mb-3 bg-[#f5f5f7] dark:bg-black/30 rounded-xl p-3 flex items-center justify-center min-h-[110px]">
                  {elements.length ? (
                    <TemplateThumbnail t={t} />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-300 dark:text-gray-600">
                      <LayoutTemplate className="w-8 h-8" />
                      <span className="text-[10px] font-medium">Blank</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex items-center gap-1">
                    {t.isDefault && (
                      <span className="badge bg-accent-500/10 text-accent-500">
                        <Star className="w-3 h-3" /> Default
                      </span>
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">
                  {t.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 flex-1">
                  {t.description || "No description"}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  <span className="inline-flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> {t.width}×{t.height}mm
                  </span>
                  <span>{elements.length} elements</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>Updated {timeAgo(t.updatedAt)}</span>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/designer?template=${t.id}`)}
                  >
                    <PenTool className="w-4 h-4" /> Use
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDuplicate(t)}
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  {!t.isDefault && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleSetDefault(t)}
                      title="Set as default"
                    >
                      <Star className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmDelete(t)}
                    className="text-danger hover:text-danger"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Template"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={creating}>
              {creating ? "Creating…" : "Create & Design"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Template Name"
            placeholder="e.g. Screen Replacement Label"
            value={newTemplate.name}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, name: e.target.value })
            }
          />
          <Textarea
            label="Description (optional)"
            placeholder="Describe this template"
            value={newTemplate.description}
            onChange={(e) =>
              setNewTemplate({ ...newTemplate, description: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Width (mm)"
              type="number"
              min="20"
              max="200"
              value={newTemplate.width}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, width: e.target.value })
              }
            />
            <Input
              label="Height (mm)"
              type="number"
              min="10"
              max="150"
              value={newTemplate.height}
              onChange={(e) =>
                setNewTemplate({ ...newTemplate, height: e.target.value })
              }
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Template"
        message={`Delete "${confirmDelete?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
