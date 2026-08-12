import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() =>
    localStorage.getItem("lcp_token"),
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setTokenState(null);
    };
    window.addEventListener("lcp:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("lcp:unauthorized", handleUnauthorized);
  }, []);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem("lcp_token");
    if (!t) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      api.setToken(null);
      setTokenState(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    const { token: newToken, user: newUser } = res.data;
    api.setToken(newToken);
    setTokenState(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    api.setToken(null);
    setTokenState(null);
    setUser(null);
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await api.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        changePassword,
        loadUser,
        isAdmin: user?.role === "admin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
