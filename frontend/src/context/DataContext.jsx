import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { token } = useAuth();
  const [labels, setLabels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState({});
  const [recentLabels, setRecentLabels] = useState([]);
  const [prints, setPrints] = useState([]);
  const [printsMeta, setPrintsMeta] = useState({
    total: 0,
    limit: 12,
    offset: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchLabels = useCallback(async () => {
    const res = await api.get("/labels");
    setLabels(res.data);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const res = await api.get("/templates");
    setTemplates(res.data);
  }, []);

  const fetchCategories = useCallback(async () => {
    const res = await api.get("/categories");
    setCategories(res.data);
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await api.get("/settings");
    setSettings(res.data);
  }, []);

  const fetchRecent = useCallback(async () => {
    const res = await api.get("/labels/recent");
    setRecentLabels(res.data);
  }, []);

  const fetchPrints = useCallback(async (params = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset !== undefined) query.set("offset", String(params.offset));
    if (params.search) query.set("search", String(params.search));
    if (params.printerType)
      query.set("printerType", String(params.printerType));
    const qs = query.toString();
    const res = await api.get(`/prints${qs ? `?${qs}` : ""}`);
    setPrints(res.data || []);
    setPrintsMeta({
      total: res.meta?.total ?? 0,
      limit: res.meta?.limit ?? 12,
      offset: res.meta?.offset ?? 0,
    });
  }, []);

  const loadAll = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchLabels(),
        fetchTemplates(),
        fetchCategories(),
        fetchSettings(),
        fetchRecent(),
      ]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    fetchLabels,
    fetchTemplates,
    fetchCategories,
    fetchSettings,
    fetchRecent,
  ]);

  useEffect(() => {
    if (token) loadAll();
  }, [token, loadAll]);

  return (
    <DataContext.Provider
      value={{
        labels,
        templates,
        categories,
        settings,
        recentLabels,
        prints,
        printsMeta,
        loading,
        fetchLabels,
        fetchTemplates,
        fetchCategories,
        fetchSettings,
        fetchRecent,
        fetchPrints,
        loadAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
