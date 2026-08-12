import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Undo2,
  Redo2,
  Copy,
  Trash2,
  Printer,
  Plus,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Type,
  Barcode,
  QrCode,
  Square,
  Circle,
  Minus,
  Image as ImageIcon,
  Building2,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Ruler,
  Download,
  FileText,
  Settings2,
  MousePointer2,
  Layers,
  Lock,
  Unlock,
  Sparkles,
  Pencil,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import { api } from "../api/client";
import { Button } from "../components/ui/Button";
import { Input, Select, Toggle } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { ElementRenderer } from "../designer/elementRenderer";
import { FieldPalette } from "../designer/FieldPalette";
import { PropertyPanel } from "../designer/PropertyPanel";
import { LayersPanel } from "../designer/LayersPanel";
import { buildDefaultLayout } from "../designer/defaultLayout";
import {
  createElement,
  createFieldElement,
  uid,
  interpolate,
  normalizeElement,
  gridSnap,
  mmToPx,
  pxToMm,
  scaleElements,
  formatDateValue,
  formatTimeValue,
} from "../designer/elementUtils";
import {
  DYNAMIC_FIELDS,
  ZOOM_LEVELS,
  MM_TO_PX,
  SAMPLE_DATA,
  DEFAULT_CANVAS_SETTINGS,
} from "../utils/constants";
import {
  exportToPng,
  exportToJpeg,
  exportToPdf,
  exportToSvg,
  printElement,
} from "../utils/exportUtils";
import { formatDateTime } from "../utils/format";

const TOOLBAR_ITEMS = [
  { type: "text", icon: Type, label: "Text" },
  { type: "barcode", icon: Barcode, label: "Barcode" },
  { type: "qr", icon: QrCode, label: "QR Code" },
  { type: "rectangle", icon: Square, label: "Rectangle" },
  { type: "circle", icon: Circle, label: "Circle" },
  { type: "line", icon: Minus, label: "Line" },
  { type: "image", icon: ImageIcon, label: "Image" },
  { type: "logo", icon: Building2, label: "Logo" },
  { type: "date", icon: Calendar, label: "Date" },
  { type: "time", icon: Clock, label: "Time" },
];

const GUIDES_THRESHOLD_PX = 5;

export default function Designer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { settings, fetchLabels, fetchRecent, fetchTemplates } = useData();
  const toast = useToast();

  const [name, setName] = useState("Untitled Label");
  const [width, setWidth] = useState(50);
  const [height, setHeight] = useState(25);
  const [background, setBackground] = useState("#ffffff");
  const [elements, setElements] = useState([]);
  const [data, setData] = useState({});
  const [canvasSettings, setCanvasSettings] = useState(DEFAULT_CANVAS_SETTINGS);
  const [selectedId, setSelectedId] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightTab, setRightTab] = useState("properties");
  const [autoLayoutActive, setAutoLayoutActive] = useState(false);
  const [guides, setGuides] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [customFieldEdit, setCustomFieldEdit] = useState(null);
  const [keepPositionsOnResize, setKeepPositionsOnResize] = useState(true);
  // When the designer is opened from Templates ("Use"), this holds the
  // template id so "Save" updates the EXISTING template rather than creating
  // a new label or a duplicate template.
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  const canvasRef = useRef(null);
  const labelRef = useRef(null);
  const dragState = useRef(null);
  const clipboardRef = useRef(null);

  const selectedElement = elements.find((el) => el.id === selectedId) || null;

  // ---- Effective elements (auto-layout OR user layout) ----
  const effectiveElements = useMemo(() => {
    if (autoLayoutActive && elements.length === 0) {
      return buildDefaultLayout(data, width, height);
    }
    return elements;
  }, [autoLayoutActive, elements, data, width, height]);

  // ---- History helpers ----
  const pushHistory = useCallback(
    (nextElements, nextName, nextWidth, nextHeight, nextBg, nextSettings) => {
      setHistory((prev) => {
        const newState = {
          elements: (nextElements || []).map((e) => ({ ...e })),
          name: nextName,
          width: nextWidth,
          height: nextHeight,
          background: nextBg,
          settings: { ...(nextSettings || {}) },
        };
        const trimmed = prev.slice(0, historyIndex + 1);
        return [...trimmed, newState].slice(-50);
      });
      setHistoryIndex((prev) => Math.min(prev + 1, 49));
    },
    [historyIndex],
  );

  const updateElements = useCallback(
    (updater, options = {}) => {
      setElements((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (!options.skipHistory) {
          pushHistory(next, name, width, height, background, canvasSettings);
        }
        setDirty(true);
        return next;
      });
    },
    [pushHistory, name, width, height, background, canvasSettings],
  );

  const undo = useCallback(() => {
    setHistoryIndex((prev) => {
      if (prev <= 0) return prev;
      const newIdx = prev - 1;
      const state = history[newIdx];
      if (state) {
        setElements(state.elements.map((e) => ({ ...e })));
        setName(state.name);
        setWidth(state.width);
        setHeight(state.height);
        setBackground(state.background);
        if (state.settings) setCanvasSettings(state.settings);
        setDirty(true);
      }
      return newIdx;
    });
  }, [history]);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => {
      if (prev >= history.length - 1) return prev;
      const newIdx = prev + 1;
      const state = history[newIdx];
      if (state) {
        setElements(state.elements.map((e) => ({ ...e })));
        setName(state.name);
        setWidth(state.width);
        setHeight(state.height);
        setBackground(state.background);
        if (state.settings) setCanvasSettings(state.settings);
        setDirty(true);
      }
      return newIdx;
    });
  }, [history]);

  // ---- Load existing label ----
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    api
      .get(`/labels/${id}`)
      .then((res) => {
        if (cancelled) return;
        const label = res.data;
        setName(label.name || "Untitled Label");
        setWidth(label.width || 50);
        setHeight(label.height || 25);
        setBackground(label.background || "#ffffff");
        const els = JSON.parse(label.elements || "[]");
        const d = JSON.parse(label.data || "{}");
        const s = JSON.parse(label.settings || "{}");
        setElements(els);
        setData(d);
        setCanvasSettings({ ...DEFAULT_CANVAS_SETTINGS, ...s });
        // Restore custom fields belonging to this label
        setCustomFields(Array.isArray(s.customFields) ? s.customFields : []);
        setAutoLayoutActive(els.length === 0);
        setHistory([
          {
            elements: els.map((e) => ({ ...e })),
            name: label.name,
            width: label.width,
            height: label.height,
            background: label.background,
            settings: { ...DEFAULT_CANVAS_SETTINGS, ...s },
          },
        ]);
        setHistoryIndex(0);
        setDirty(false);
        fetchRecent();
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err.message || "Failed to load label");
          navigate("/designer");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate, toast, fetchRecent]);

  // ---- Load template as starting point ----
  useEffect(() => {
    if (id) return;
    const templateId = searchParams.get("template");
    // Track the template being edited so "Save" updates it in place.
    setEditingTemplateId(templateId || null);
    const loadTemplate = (tid) => {
      setLoading(true);
      api
        .get(`/templates/${tid}`)
        .then((res) => {
          const t = res.data;
          setName(t.name);
          setWidth(t.width || 50);
          setHeight(t.height || 25);
          setBackground(t.background || "#ffffff");
          const els = JSON.parse(t.elements || "[]");
          const s = JSON.parse(t.settings || "{}");
          setElements(els);
          setCanvasSettings({ ...DEFAULT_CANVAS_SETTINGS, ...s });
          // Restore custom fields belonging to this template only
          setCustomFields(Array.isArray(s.customFields) ? s.customFields : []);
          setAutoLayoutActive(els.length === 0);
          setData(JSON.parse(t.data || "{}"));
          pushHistory(els, t.name, t.width, t.height, t.background, {
            ...DEFAULT_CANVAS_SETTINGS,
            ...s,
          });
        })
        .catch((err) => toast.error(err.message || "Failed to load template"))
        .finally(() => setLoading(false));
    };
    if (templateId) {
      loadTemplate(templateId);
    } else {
      // Load default template
      api
        .get("/templates/default")
        .then((res) => {
          if (res.data && res.data.elements) {
            loadTemplate(res.data.id);
          } else {
            setAutoLayoutActive(true);
          }
        })
        .catch(() => setAutoLayoutActive(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e) => {
      const target = e.target;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;

      if (isInput) return;

      if (meta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (meta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      } else if (meta && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveLabel();
      } else if (meta && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelected();
      } else if (meta && e.key.toLowerCase() === "c") {
        if (selectedElement) {
          clipboardRef.current = { ...selectedElement };
          toast.info("Element copied");
        }
      } else if (meta && e.key.toLowerCase() === "v") {
        e.preventDefault();
        if (clipboardRef.current) {
          const paste = {
            ...clipboardRef.current,
            id: uid(),
            x: (clipboardRef.current.x || 0) + 3,
            y: (clipboardRef.current.y || 0) + 3,
          };
          updateElements((prev) => [...prev, paste]);
          setSelectedId(paste.id);
        }
      } else if (meta && e.key.toLowerCase() === "p") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === "Escape") {
        setSelectedId(null);
        setGuides([]);
      } else if (selectedId && !meta) {
        // Arrow-key nudge
        const step = canvasSettings.snapToGrid
          ? canvasSettings.gridSize || 1
          : 0.5;
        let dx = 0;
        let dy = 0;
        if (e.key === "ArrowLeft") dx = -step;
        else if (e.key === "ArrowRight") dx = step;
        else if (e.key === "ArrowUp") dy = -step;
        else if (e.key === "ArrowDown") dy = step;
        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          setElements((prev) =>
            prev.map((el) =>
              el.id === selectedId
                ? {
                    ...el,
                    x: Math.round((el.x + dx) * 10) / 10,
                    y: Math.round((el.y + dy) * 10) / 10,
                  }
                : el,
            ),
          );
          setDirty(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [undo, redo, selectedId, selectedElement, canvasSettings, elements]);

  // ---- Add element ----
  const addElement = (type) => {
    if (autoLayoutActive) setAutoLayoutActive(false);
    const el = createElement(type);
    el.x = Math.max(2, (width - el.width) / 2);
    el.y = Math.max(2, (height - el.height) / 2);
    updateElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} element added`);
  };

  // ---- Add bound field element from palette "+" ----
  const addFieldElement = (field) => {
    if (autoLayoutActive) setAutoLayoutActive(false);
    // Barcode "+" creates a real barcode element bound to the field key.
    if (field.type === "barcode") {
      const el = createElement("barcode", {
        fieldKey: field.key,
        value: `{{${field.key}}}`,
        displayLabel: field.label || "Barcode",
        x: Math.max(2, (width - 32) / 2),
        y: Math.max(2, (height - 10) / 2),
        width: 32,
        height: 10,
        fontsize: 6,
        heightmm: 8,
        scale: 2,
        includeText: true,
        textGap: 4,
        textPosition: "bottom",
        barcolor: "#000000",
        textcolor: "#000000",
        backgroundcolor: "#ffffff",
      });
      updateElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      toast.success(`${field.label} barcode placed on label`);
      return;
    }
    // Use createFieldElement so field-bound elements get the proper
    // displayLabel / showLabel / valueOnly behavior (Model = value only,
    // all others = "Display Label : Value").
    const el = createFieldElement(field.key, {
      fieldKey: field.key,
      displayLabel: field.label || field.key,
      x: Math.max(2, (width - 30) / 2),
      y: Math.max(2, (height - 5) / 2),
      width: 30,
      height: 5,
    });
    updateElements((prev) => [...prev, el]);
    setSelectedId(el.id);
    toast.success(`${field.label} field placed on label`);
  };

  // ---- Data change (live) ----
  const handleDataChange = (key, value) => {
    setData((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };

  // ---- Editable label size (mm). Changes propagate to canvas, rulers,
  // export, print and templates. Supports decimals within the allowed range.
  const applyLabelSize = (newW, newH) => {
    const w = Math.min(200, Math.max(20, Number(newW) || 50));
    const h = Math.min(150, Math.max(10, Number(newH) || 25));
    if (w === width && h === height) return;
    const prevW = width || 50;
    const prevH = height || 25;
    if (!keepPositionsOnResize && elements.length) {
      // Scale design proportionally.
      setElements(scaleElements(elements, prevW, prevH, w, h, { scale: true }));
    }
    pushHistory(elements, name, w, h, background, canvasSettings);
    setWidth(w);
    setHeight(h);
    setDirty(true);
  };

  const toggleAutoLayout = () => {
    if (!autoLayoutActive && elements.length > 0) {
      toast.info("Custom elements removed — switched to Auto Layout");
      setElements([]);
      setSelectedId(null);
    }
    setAutoLayoutActive((a) => !a);
  };

  // ---- Custom Field management ----
  const addCustomField = () => {
    setCustomFieldEdit(null);
    setShowCustomFieldModal(true);
  };

  const saveCustomField = (field) => {
    if (customFieldEdit) {
      // Update existing — propagate label changes to any linked canvas elements
      setCustomFields((prev) =>
        prev.map((cf) => (cf.key === customFieldEdit.key ? field : cf)),
      );
      // If the display label changed, update linked elements so the
      // "Field Name : value" text on the canvas reflects it immediately.
      if (field.label !== customFieldEdit.label) {
        setElements((prev) =>
          prev.map((el) =>
            el.fieldKey === customFieldEdit.key
              ? { ...el, displayLabel: field.label }
              : el,
          ),
        );
      }
      toast.success(`Custom field "${field.label}" updated`);
    } else {
      // Add new
      setCustomFields((prev) => [...prev, field]);
      toast.success(`Custom field "${field.label}" added`);
    }
    setShowCustomFieldModal(false);
    setCustomFieldEdit(null);
  };

  const editCustomField = (field) => {
    setCustomFieldEdit(field);
    setShowCustomFieldModal(true);
  };

  const deleteCustomField = (field) => {
    setCustomFields((prev) => prev.filter((cf) => cf.key !== field.key));
    // Also remove any elements on canvas tied to this field
    setElements((prev) => prev.filter((el) => el.fieldKey !== field.key));
    setData((d) => {
      const next = { ...d };
      delete next[field.key];
      return next;
    });
    // If the deleted field was selected, clear selection
    if (
      selectedId &&
      elements.find((el) => el.id === selectedId)?.fieldKey === field.key
    ) {
      setSelectedId(null);
    }
    toast.success(`Custom field "${field.label}" deleted`);
  };

  const duplicateCustomField = (field) => {
    const newKey = `${field.key}_copy`;
    const newField = {
      ...field,
      key: newKey,
      label: `${field.label} (Copy)`,
      visible: true,
    };
    // Check if key already exists
    if (customFields.find((cf) => cf.key === newKey)) {
      toast.error("A field with that key already exists");
      return;
    }
    setCustomFields((prev) => [...prev, newField]);
    toast.success(`Custom field "${field.label}" duplicated`);
  };

  const toggleCustomFieldVisibility = (field) => {
    setCustomFields((prev) =>
      prev.map((cf) =>
        cf.key === field.key
          ? { ...cf, visible: cf.visible !== false ? false : true }
          : cf,
      ),
    );
  };

  // ---- Duplicate / Delete ----
  const duplicateSelected = useCallback(() => {
    if (!selectedElement) return;
    if (autoLayoutActive) setAutoLayoutActive(false);
    const copy = {
      ...selectedElement,
      id: uid(),
      x: selectedElement.x + 3,
      y: selectedElement.y + 3,
    };
    updateElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
    toast.success("Element duplicated");
  }, [selectedElement, updateElements, toast, autoLayoutActive]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    if (autoLayoutActive) return;
    updateElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, updateElements, autoLayoutActive]);

  const handleDeleteElement = () => {
    deleteSelected();
    setConfirmDelete(false);
  };

  // ---- Update element property (real-time) ----
  const updateElement = useCallback(
    (idToUpdate, patch) => {
      updateElements((prev) =>
        prev.map((el) => (el.id === idToUpdate ? { ...el, ...patch } : el)),
      );
    },
    [updateElements],
  );

  // ---- Z-order ----
  const bringForward = useCallback(
    (elId) => {
      updateElements((prev) => {
        const idx = prev.findIndex((el) => el.id === elId);
        if (idx < 0 || idx >= prev.length - 1) return prev;
        const next = [...prev];
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
        return next;
      });
    },
    [updateElements],
  );

  const sendBackward = useCallback(
    (elId) => {
      updateElements((prev) => {
        const idx = prev.findIndex((el) => el.id === elId);
        if (idx <= 0) return prev;
        const next = [...prev];
        [next[idx], next[idx - 1]] = [next[idx - 1], next[idx]];
        return next;
      });
    },
    [updateElements],
  );

  const toggleVisible = useCallback(
    (elId) => {
      updateElements((prev) =>
        prev.map((el) => (el.id === elId ? { ...el, hidden: !el.hidden } : el)),
      );
    },
    [updateElements],
  );

  // ---- Alignment guides computation ----
  const computeGuides = (orig, pos) => {
    const gs = [];
    const labelW = width * MM_TO_PX;
    const labelH = height * MM_TO_PX;
    const el = {
      left: orig.x * MM_TO_PX,
      top: orig.y * MM_TO_PX,
      right: (orig.x + orig.width) * MM_TO_PX,
      bottom: (orig.y + orig.height) * MM_TO_PX,
      cx: (orig.x + orig.width / 2) * MM_TO_PX,
      cy: (orig.y + orig.height / 2) * MM_TO_PX,
    };
    const newEl = {
      left: el.left + (pos.x - orig.x) * MM_TO_PX,
      top: el.top + (pos.y - orig.y) * MM_TO_PX,
      right: el.right + (pos.x - orig.x) * MM_TO_PX,
      bottom: el.bottom + (pos.y - orig.y) * MM_TO_PX,
      cx: el.cx + (pos.x - orig.x) * MM_TO_PX,
      cy: el.cy + (pos.y - orig.y) * MM_TO_PX,
    };

    const targets = [
      {
        left: 0,
        right: labelW,
        cx: labelW / 2,
        top: 0,
        bottom: labelH,
        cy: labelH / 2,
      },
    ];
    for (const other of effectiveElements) {
      if (other.id === orig.id) continue;
      targets.push({
        left: other.x * MM_TO_PX,
        right: (other.x + other.width) * MM_TO_PX,
        cx: (other.x + other.width / 2) * MM_TO_PX,
        top: other.y * MM_TO_PX,
        bottom: (other.y + other.height) * MM_TO_PX,
        cy: (other.y + other.height / 2) * MM_TO_PX,
      });
    }

    const refs = ["left", "right", "cx"];
    const refsY = ["top", "bottom", "cy"];

    for (const t of targets) {
      for (const r of refs) {
        const d = Math.abs(newEl[r] - t[r]);
        if (d < GUIDES_THRESHOLD_PX) {
          gs.push({ axis: "v", pos: t[r], match: r });
        }
      }
      for (const r of refsY) {
        const d = Math.abs(newEl[r] - t[r]);
        if (d < GUIDES_THRESHOLD_PX) {
          gs.push({ axis: "h", pos: t[r], match: r });
        }
      }
    }
    return gs;
  };

  const applyGuidesToPos = (nx, ny, orig, matches) => {
    let outX = nx;
    let outY = ny;
    for (const g of matches) {
      if (g.axis === "v") {
        if (g.match === "left") outX = g.pos / MM_TO_PX - orig.x;
        else if (g.match === "right")
          outX = g.pos / MM_TO_PX - orig.x - orig.width;
        else if (g.match === "cx")
          outX = g.pos / MM_TO_PX - orig.x - orig.width / 2;
      } else {
        if (g.match === "top") outY = g.pos / MM_TO_PX - orig.y;
        else if (g.match === "bottom")
          outY = g.pos / MM_TO_PX - orig.y - orig.height;
        else if (g.match === "cy")
          outY = g.pos / MM_TO_PX - orig.y - orig.height / 2;
      }
    }
    return { x: outX, y: outY };
  };

  // ---- Drag & drop on canvas ----
  const handleCanvasMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest("[data-el-id]")) return;
    setSelectedId(null);
    setGuides([]);
  };

  const handleElementMouseDown = (e) => {
    const rotateHandle = e.target.closest("[data-rotate]");
    const resizeHandle = e.target.closest("[data-handle]");
    const elWrap = e.target.closest("[data-el-id]");
    const elId = elWrap?.dataset.elId;
    if (!elId) return;
    const labelEl = labelRef.current;
    if (!labelEl) return;

    e.stopPropagation();
    e.preventDefault();
    setSelectedId(elId);

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = labelEl.getBoundingClientRect();
    const scaleX = (width * MM_TO_PX) / rect.width;
    const scaleY = (height * MM_TO_PX) / rect.height;
    const origEl = effectiveElements.find((el) => el.id === elId);
    if (!origEl) return;

    const getPos = (cx, cy) => ({
      x: ((cx - rect.left) * scaleX) / MM_TO_PX,
      y: ((cy - rect.top) * scaleY) / MM_TO_PX,
    });

    // Rotate
    if (rotateHandle) {
      const orig = { ...origEl };
      const centerX = (orig.x + orig.width / 2) * MM_TO_PX;
      const centerY = (orig.y + orig.height / 2) * MM_TO_PX;
      const onMove = (ev) => {
        const pos = getPos(ev.clientX, ev.clientY);
        const angle =
          (Math.atan2(pos.y * MM_TO_PX - centerY, pos.x * MM_TO_PX - centerX) *
            180) /
          Math.PI;
        const deg = Math.round(angle);
        setElements((prev) =>
          prev.map((el) => (el.id === elId ? { ...el, rotation: deg } : el)),
        );
        setDirty(true);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return;
    }

    if (resizeHandle) {
      const dir = resizeHandle.dataset.handle;
      const orig = { ...origEl };
      const onMove = (ev) => {
        const pos = getPos(ev.clientX, ev.clientY);
        const next = { ...orig };
        if (dir.includes("e")) next.width = Math.max(2, pos.x - orig.x);
        if (dir.includes("s")) next.height = Math.max(2, pos.y - orig.y);
        if (dir.includes("w")) {
          next.width = Math.max(2, orig.x + orig.width - pos.x);
          next.x = orig.x + orig.width - next.width;
        }
        if (dir.includes("n")) {
          next.height = Math.max(2, orig.y + orig.height - pos.y);
          next.y = orig.y + orig.height - next.height;
        }
        setElements((prev) =>
          prev.map((el) => (el.id === elId ? { ...el, ...next } : el)),
        );
        setDirty(true);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return;
    }

    // Move (with snap + alignment guides)
    const orig = { ...origEl };
    const startPos = getPos(startX, startY);
    let moved = false;
    const onMove = (ev) => {
      moved = true;
      let pos = getPos(ev.clientX, ev.clientY);
      let nx = orig.x + (pos.x - startPos.x);
      let ny = orig.y + (pos.y - startPos.y);

      const guideMatches = computeGuides(orig, pos);
      if (guideMatches.length) {
        const adjusted = applyGuidesToPos(nx, ny, orig, guideMatches);
        nx = adjusted.x;
        ny = adjusted.y;
      }
      setGuides(guideMatches);

      if (canvasSettings.snapToGrid) {
        nx = gridSnap(nx, canvasSettings.gridSize || 1);
        ny = gridSnap(ny, canvasSettings.gridSize || 1);
      }
      nx = Math.max(0, Math.min(width - orig.width / 2, nx));
      ny = Math.max(0, Math.min(height - orig.height / 2, ny));
      setElements((prev) =>
        prev.map((el) =>
          el.id === elId
            ? {
                ...el,
                x: Math.round(nx * 10) / 10,
                y: Math.round(ny * 10) / 10,
              }
            : el,
        ),
      );
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setGuides([]);
      if (moved) {
        pushHistory(elements, name, width, height, background, canvasSettings);
        setDirty(true);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ---- Save label ----
  const saveLabel = async () => {
    setSaving(true);
    try {
      const payload = {
        name: name.trim() || "Untitled Label",
        width,
        height,
        background,
        elements: autoLayoutActive ? [] : elements,
        data,
        settings: { ...canvasSettings, customFields },
      };
      let res;
      if (editingTemplateId) {
        // Editing an opened template — update the template in place.
        await api.put(`/templates/${editingTemplateId}`, payload);
        res = { data: { id: editingTemplateId } };
        setDirty(false);
        toast.success("Template updated successfully");
        fetchTemplates();
        setEditingTemplateId(null);
        navigate("/templates", { replace: true });
        return;
      }
      if (id) {
        res = await api.put(`/labels/${id}`, payload);
      } else {
        res = await api.post("/labels", payload);
      }
      setDirty(false);
      toast.success("Label saved successfully");
      fetchLabels();
      if (!id) {
        navigate(`/designer/${res.data.id}`, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Failed to save label");
    } finally {
      setSaving(false);
    }
  };

  // ---- Save as template ----
  const saveAsTemplate = async () => {
    try {
      const payload = {
        name: name.trim() || "Untitled Template",
        description: `Saved from designer on ${formatDateTime(new Date())}`,
        width,
        height,
        background,
        elements: autoLayoutActive ? [] : elements,
        data,
        settings: { ...canvasSettings, customFields },
        isDefault: false,
      };
      await api.post("/templates", payload);
      setShowSaveAsTemplate(false);
      toast.success("Template saved — it appears in Templates now");
      fetchTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to save template");
    }
  };

  // ---- Print ----
  const handlePrint = () => {
    if (!labelRef.current) {
      toast.error("Label canvas not ready");
      return;
    }
    printElement(labelRef.current, 1);
    api
      .post("/prints/log", {
        labelId: id || null,
        labelName: name,
        copies: 1,
        printerType: "thermal",
        format: "print",
        count: 1,
      })
      .catch(() => {});
  };

  // ---- Image upload ----
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setImageUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      updateElement(selectedId, { src: reader.result });
      setImageUploading(false);
      toast.success("Image added");
    };
    reader.onerror = () => {
      setImageUploading(false);
      toast.error("Failed to read image");
    };
    reader.readAsDataURL(file);
  };

  // ---- Export ----
  const handleExport = async (format) => {
    if (!labelRef.current) {
      toast.error("Canvas not ready");
      return;
    }
    setExportMenuOpen(false);
    const fileName = (name || "label").replace(/[^a-zA-Z0-9-_]/g, "_");
    try {
      if (format === "png") await exportToPng(labelRef.current, fileName);
      else if (format === "jpg") await exportToJpeg(labelRef.current, fileName);
      else if (format === "pdf")
        await exportToPdf(labelRef.current, width, height, fileName);
      else if (format === "svg")
        exportToSvg(labelRef.current, width, height, fileName);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(`Export failed: ${err.message}`);
    }
  };

  // ---- Zoom ----
  const zoomIn = () => setZoom((z) => Math.min(2, z + 0.25));
  const zoomOut = () => setZoom((z) => Math.max(0.5, z - 0.25));

  const mmPx = MM_TO_PX * zoom;
  const canvasW = Math.round(width * MM_TO_PX);
  const canvasH = Math.round(height * MM_TO_PX);
  const gridSizePx = Math.round((canvasSettings.gridSize || 5) * MM_TO_PX);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] lg:h-[calc(100vh-4rem)] animate-fade-in">
      {/* Top toolbar */}
      <div className="glass-sm rounded-2xl px-3 py-2 flex items-center gap-1 flex-wrap mb-3">
        <button onClick={() => navigate("/")} className="icon-btn">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-1 mr-2">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setDirty(true);
            }}
            className="bg-transparent font-semibold text-sm text-gray-800 dark:text-gray-100 outline-none border-b border-transparent focus:border-accent-500 w-40 lg:w-56 px-2 py-1 rounded"
            placeholder="Label name"
          />
          {dirty && (
            <span className="text-[10px] font-semibold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
              Unsaved
            </span>
          )}
        </div>

        {/* Editable label size (mm) */}
        <div className="flex items-center gap-1 mr-1">
          <Ruler className="w-4 h-4 text-gray-400" />
          <input
            type="number"
            min="20"
            max="200"
            step="0.5"
            value={width}
            onChange={(e) => {
              const v = Number(e.target.value);
              applyLabelSize(v || width, height);
            }}
            onBlur={(e) => applyLabelSize(Number(e.target.value) || 50, height)}
            className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none border-b border-transparent focus:border-accent-500 w-12 text-right"
            title="Label width (20–200 mm)"
          />
          <span className="text-[11px] text-gray-400">×</span>
          <input
            type="number"
            min="10"
            max="150"
            step="0.5"
            value={height}
            onChange={(e) => {
              const v = Number(e.target.value);
              applyLabelSize(width, v || height);
            }}
            onBlur={(e) => applyLabelSize(width, Number(e.target.value) || 25)}
            className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none border-b border-transparent focus:border-accent-500 w-12 text-right"
            title="Label height (10–150 mm)"
          />
          <span className="text-[10px] text-gray-400">mm</span>
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <button
          className="icon-btn"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          className="icon-btn"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <button
          className="icon-btn"
          onClick={duplicateSelected}
          disabled={!selectedId}
          title="Duplicate (Ctrl+D)"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          className="icon-btn text-danger hover:text-danger"
          onClick={() => setConfirmDelete(true)}
          disabled={!selectedId}
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          className={`icon-btn ${selectedElement?.locked ? "text-accent-500" : ""}`}
          onClick={() =>
            selectedElement &&
            updateElement(selectedElement.id, {
              locked: !selectedElement.locked,
            })
          }
          disabled={!selectedId}
          title="Lock / Unlock"
        >
          {selectedElement?.locked ? (
            <Lock className="w-4 h-4" />
          ) : (
            <Unlock className="w-4 h-4" />
          )}
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <button className="icon-btn" onClick={zoomOut}>
          <ZoomOut className="w-4 h-4" />
        </button>
        <select
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="bg-transparent text-xs font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer rounded px-1 py-1"
        >
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>
        <button className="icon-btn" onClick={zoomIn}>
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 hidden sm:block" />

        <button
          className={`icon-btn ${canvasSettings.showGrid ? "text-accent-500" : ""}`}
          onClick={() =>
            setCanvasSettings((s) => ({ ...s, showGrid: !s.showGrid }))
          }
          title="Toggle grid"
        >
          <Grid3X3 className="w-4 h-4" />
        </button>
        <button
          className={`icon-btn ${canvasSettings.showRulers ? "text-accent-500" : ""}`}
          onClick={() =>
            setCanvasSettings((s) => ({ ...s, showRulers: !s.showRulers }))
          }
          title="Toggle rulers"
        >
          <Ruler className="w-4 h-4" />
        </button>
        <button
          className={`icon-btn ${canvasSettings.snapToGrid ? "text-accent-500" : ""}`}
          onClick={() =>
            setCanvasSettings((s) => ({ ...s, snapToGrid: !s.snapToGrid }))
          }
          title="Snap to grid"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        <div className="relative">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setExportMenuOpen((s) => !s)}
          >
            <Download className="w-4 h-4" /> Export
          </Button>
          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 card p-2 z-30 animate-scale-in">
              {[
                ["png", "PNG Image"],
                ["jpg", "JPEG Image"],
                ["pdf", "PDF Document"],
                ["svg", "SVG Vector"],
              ].map(([fmt, label]) => (
                <button
                  key={fmt}
                  onClick={() => handleExport(fmt)}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowSaveAsTemplate(true)}
        >
          <Save className="w-4 h-4" /> Template
        </Button>
        <Button size="sm" onClick={saveLabel} loading={saving}>
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={handlePrint}
          title="Print (Ctrl+P)"
        >
          <Printer className="w-4 h-4" /> Print
        </Button>
      </div>

      {/* Element insertion bar */}
      <div className="glass-sm rounded-2xl px-2 py-1.5 flex items-center gap-1 overflow-x-auto mb-3">
        {TOOLBAR_ITEMS.map((item) => (
          <button
            key={item.type}
            onClick={() => addElement(item.type)}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl hover:bg-accent-500/10 hover:text-accent-500 text-gray-600 dark:text-gray-300 transition-colors min-w-[64px]"
            title={`Add ${item.label}`}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1" />
        <button
          onClick={toggleAutoLayout}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-colors text-[11px] font-semibold min-w-[90px] ${
            autoLayoutActive
              ? "bg-accent-500 text-white"
              : "bg-accent-500/10 text-accent-500 hover:bg-accent-500/20"
          }`}
          title="Toggle auto layout"
        >
          <Sparkles className="w-4 h-4" />
          {autoLayoutActive ? "Auto ON" : "Auto OFF"}
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Left panel - Field palette */}
        {leftPanelOpen && (
          <div className="hidden md:block">
            <FieldPalette
              data={data}
              onDataChange={handleDataChange}
              onAddField={addFieldElement}
              onTogglePanel={() => setLeftPanelOpen(false)}
              onToggleAutoLayout={toggleAutoLayout}
              autoLayoutActive={autoLayoutActive}
              customFields={customFields}
              placedKeys={elements.map((el) => el.fieldKey).filter(Boolean)}
              onAddCustomField={addCustomField}
              onEditCustomField={editCustomField}
              onDeleteCustomField={deleteCustomField}
              onDuplicateCustomField={duplicateCustomField}
              onToggleCustomFieldVisibility={toggleCustomFieldVisibility}
            />
          </div>
        )}

        {/* Canvas area with rulers */}
        <div className="flex-1 card relative overflow-auto p-6 bg-[#fafafa] dark:bg-[#222224]">
          <div className="min-w-max min-h-full flex items-start justify-center">
            <div className="relative" style={{ padding: 20 }}>
              {canvasSettings.showRulers && (
                <div
                  className="absolute -top-5 left-0 h-5 overflow-hidden"
                  style={{ width: canvasW + 2 }}
                >
                  <div
                    className="flex text-[8px] text-gray-400 font-mono h-full"
                    style={{ width: canvasW }}
                  >
                    {Array.from({ length: Math.floor(width) + 1 }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className="relative"
                          style={{ width: mmPx }}
                        >
                          {i % 5 === 0 && (
                            <span className="absolute left-0 top-0 text-[7px] leading-none">
                              {i}
                            </span>
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
              {canvasSettings.showRulers && (
                <div
                  className="absolute -left-5 top-0 w-5 overflow-hidden"
                  style={{ height: canvasH + 2 }}
                >
                  <div
                    className="flex flex-col text-[8px] text-gray-400 font-mono h-full"
                    style={{ height: canvasH }}
                  >
                    {Array.from({ length: Math.floor(height) + 1 }).map(
                      (_, i) => (
                        <span
                          key={i}
                          className="relative"
                          style={{ height: mmPx }}
                        >
                          {i % 5 === 0 && (
                            <span className="absolute left-0 top-0 text-[7px] leading-none">
                              {i}
                            </span>
                          )}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

              <div
                ref={labelRef}
                className="relative shadow-lg"
                style={{
                  width: canvasW,
                  height: canvasH,
                  background,
                  cursor: "crosshair",
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  margin: `${canvasH * (1 - zoom) + 40}px ${canvasW * (1 - zoom) + 40}px`,
                }}
                onMouseDown={handleCanvasMouseDown}
              >
                {canvasSettings.showGrid && (
                  <div
                    className="absolute inset-0 pointer-events-none canvas-grid"
                    style={{ "--grid-size": `${gridSizePx}px` }}
                  />
                )}

                {autoLayoutActive && (
                  <div className="absolute top-1 left-1 z-50 px-1.5 py-0.5 rounded-md bg-accent-500/90 text-white text-[9px] font-bold flex items-center gap-1 pointer-events-none">
                    <Sparkles className="w-3 h-3" /> AUTO
                  </div>
                )}

                {(effectiveElements || []).map((el, idx) => (
                  <div
                    key={el.id}
                    data-el-id={el.id}
                    onMouseDown={handleElementMouseDown}
                  >
                    <ElementRenderer
                      el={el}
                      data={data}
                      settings={settings}
                      elements={effectiveElements}
                      selected={el.id === selectedId}
                      onSelect={setSelectedId}
                    />
                  </div>
                ))}

                {/* Alignment guides */}
                {guides.map((g, i) =>
                  g.axis === "v" ? (
                    <div
                      key={`v-${i}`}
                      className="absolute top-0 bottom-0 w-px bg-danger z-40 pointer-events-none"
                      style={{ left: g.pos }}
                    />
                  ) : (
                    <div
                      key={`h-${i}`}
                      className="absolute left-0 right-0 h-px bg-danger z-40 pointer-events-none"
                      style={{ top: g.pos }}
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-black/40 flex items-center justify-center z-20">
              <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Right panel - Properties / Layers */}
        {rightPanelOpen ? (
          <div className="w-72 shrink-0 card p-4 overflow-y-auto hidden lg:block">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Inspector
              </h3>
              <button
                className="icon-btn"
                onClick={() => setRightPanelOpen(false)}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-white/5 rounded-xl p-1">
              <button
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  rightTab === "properties"
                    ? "bg-white dark:bg-white/10 text-accent-500 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => setRightTab("properties")}
              >
                <Settings2 className="w-3.5 h-3.5" /> Properties
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  rightTab === "layers"
                    ? "bg-white dark:bg-white/10 text-accent-500 shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                onClick={() => setRightTab("layers")}
              >
                <Layers className="w-3.5 h-3.5" /> Layers
              </button>
            </div>

            {rightTab === "properties" ? (
              <PropertyPanel
                el={selectedElement}
                onUpdate={updateElement}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
              />
            ) : (
              <LayersPanel
                elements={effectiveElements}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onToggleVisible={toggleVisible}
                onBringForward={bringForward}
                onSendBackward={sendBackward}
              />
            )}
          </div>
        ) : (
          <button
            className="icon-btn self-start mt-2 hidden lg:inline-flex"
            onClick={() => setRightPanelOpen(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile toggles */}
      <div className="lg:hidden flex gap-2 mt-3">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
        >
          <FileText className="w-4 h-4" /> Fields
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => {
            setRightPanelOpen(true);
            setRightTab(rightTab === "properties" ? "layers" : "properties");
          }}
        >
          <Settings2 className="w-4 h-4" /> Inspector
        </Button>
      </div>

      {leftPanelOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4"
          onClick={() => setLeftPanelOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-4 w-full max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <FieldPalette
              data={data}
              onDataChange={handleDataChange}
              onAddField={(f) => {
                addFieldElement(f);
                setLeftPanelOpen(false);
              }}
              onTogglePanel={() => setLeftPanelOpen(false)}
              onToggleAutoLayout={toggleAutoLayout}
              autoLayoutActive={autoLayoutActive}
              customFields={customFields}
              placedKeys={elements.map((el) => el.fieldKey).filter(Boolean)}
              onAddCustomField={() => {
                addCustomField();
                setLeftPanelOpen(false);
              }}
              onEditCustomField={editCustomField}
              onDeleteCustomField={deleteCustomField}
              onDuplicateCustomField={duplicateCustomField}
              onToggleCustomFieldVisibility={toggleCustomFieldVisibility}
            />
          </div>
        </div>
      )}

      {/* Custom Field Editor Modal */}
      <Modal
        open={showCustomFieldModal}
        onClose={() => setShowCustomFieldModal(false)}
        title={customFieldEdit ? "Edit Custom Field" : "Create Custom Field"}
        footer={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowCustomFieldModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const key =
                  document.getElementById("customFieldKey")?.value?.trim() ||
                  "";
                const label =
                  document.getElementById("customFieldLabel")?.value?.trim() ||
                  "";
                const defaultValue =
                  document.getElementById("customFieldDefault")?.value || "";
                if (!key || !label) {
                  toast.error("Key and Label are required");
                  return;
                }
                if (
                  !customFieldEdit &&
                  customFields.find((f) => f.key === key)
                ) {
                  toast.error("A field with this key already exists");
                  return;
                }
                if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) {
                  toast.error(
                    "Key must start with a letter and contain only letters, numbers, and underscores",
                  );
                  return;
                }
                saveCustomField({ key, label, defaultValue, visible: true });
              }}
            >
              {customFieldEdit ? "Update" : "Create"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            id="customFieldKey"
            label="Field Key"
            defaultValue={customFieldEdit?.key || ""}
            placeholder="e.g. location"
            disabled={!!customFieldEdit}
          />
          <Input
            id="customFieldLabel"
            label="Display Label"
            defaultValue={customFieldEdit?.label || ""}
            placeholder="e.g. Custom Part Number"
          />
          <Input
            id="customFieldDefault"
            label="Default Value"
            defaultValue={customFieldEdit?.defaultValue || ""}
            placeholder="Optional default value"
          />
          <p className="text-xs text-gray-400">
            Create a reusable custom field. The key is used to bind data, the
            label is shown in the palette.
          </p>
        </div>
      </Modal>

      {/* Save as template modal */}
      <Modal
        open={showSaveAsTemplate}
        onClose={() => setShowSaveAsTemplate(false)}
        title="Save as Template"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowSaveAsTemplate(false)}
            >
              Cancel
            </Button>
            <Button onClick={saveAsTemplate}>Save Template</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Template name"
          />
          <p className="text-xs text-gray-400">
            Saves the full layout — elements, positions, fonts, colors, grid
            settings and data bindings — as a reusable template.
          </p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Element"
        message="Are you sure you want to delete this element?"
        confirmLabel="Delete"
        onConfirm={handleDeleteElement}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
