// API base URL.
// - Local dev: empty VITE_API_BASE -> "/api" (proxied by Vite to localhost:5000)
// - Production: set VITE_API_BASE to your deployed backend URL, e.g. https://your-api.onrender.com
const API_BASE =
  (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "") + "/api";

function getToken() {
  return localStorage.getItem("lcp_token");
}

function setToken(token) {
  if (token) localStorage.setItem("lcp_token", token);
  else localStorage.removeItem("lcp_token");
}

async function request(method, path, body, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const config = {
    method,
    headers,
  };

  if (body instanceof FormData) {
    config.body = body;
  } else if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE}${path}`, config);
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      data?.error?.message || data?.message || `Request failed (${res.status})`;
    const error = new Error(message);
    error.status = res.status;
    error.code = data?.error?.code || "REQUEST_FAILED";
    error.details = data?.error?.details || null;
    if (res.status === 401 && path !== "/auth/login") {
      setToken(null);
      window.dispatchEvent(new CustomEvent("lcp:unauthorized"));
    }
    throw error;
  }

  return data;
}

export const api = {
  get: (path, options) => request("GET", path, undefined, options),
  post: (path, body, options) => request("POST", path, body, options),
  put: (path, body, options) => request("PUT", path, body, options),
  delete: (path, options) => request("DELETE", path, undefined, options),
  setToken,
  getToken,
};

export function authHeader() {
  return { Authorization: `Bearer ${getToken()}` };
}
