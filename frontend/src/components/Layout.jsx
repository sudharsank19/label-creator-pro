import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  PenTool,
  LayoutTemplate,
  Upload,
  Printer,
  History,
  Settings as SettingsIcon,
  Users,
  LogOut,
  Sun,
  Moon,
  Tag,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/designer", label: "Label Designer", icon: PenTool },
  { to: "/templates", label: "Templates", icon: LayoutTemplate },
  { to: "/import", label: "Batch Import", icon: Upload },
  { to: "/history", label: "Print History", icon: History },
];

const bottomItems = [
  { to: "/settings", label: "Settings", icon: SettingsIcon, adminOnly: false },
  { to: "/users", label: "User Management", icon: Users, adminOnly: true },
];

function SidebarContent({ collapsed, onNavigate }) {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-accent-500 text-white flex items-center justify-center shadow-btn shrink-0">
          <Tag className="w-5 h-5" />
        </div>
        <div className={collapsed ? "hidden" : "block"}>
          <p className="font-bold text-gray-900 dark:text-white leading-tight">
            Label Creator Pro
          </p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
            Spare Parts & Service
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-idle"} ${collapsed ? "justify-center px-0" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        <div className="pt-3 mt-2 border-t border-gray-100 dark:border-white/10 space-y-0.5">
          {bottomItems
            .filter((i) => !i.adminOnly || isAdmin)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : "sidebar-link-idle"} ${collapsed ? "justify-center px-0" : ""}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 dark:border-white/10">
        <div
          className={`flex items-center gap-3 px-2 py-2 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-8 h-8 rounded-full bg-accent-500/15 text-accent-500 flex items-center justify-center font-bold text-sm shrink-0">
            {user?.fullName?.[0]?.toUpperCase() || "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                {user?.fullName || user?.username}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize">
                {user?.role}
              </p>
            </div>
          )}
          {!collapsed && (
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="icon-btn"
                title="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="icon-btn text-danger hover:text-danger"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-[#1c1c1e]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-gray-100 dark:border-white/10 glass-sm sticky top-0 h-screen">
        <SidebarContent collapsed={false} />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 glass animate-slide-in-right">
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 glass-sm flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="icon-btn">
              {mobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
            <div className="w-7 h-7 rounded-lg bg-accent-500 text-white flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">
              Label Creator Pro
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="icon-btn">
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => navigate("/settings")}
              className="w-8 h-8 rounded-full bg-accent-500/15 text-accent-500 flex items-center justify-center font-bold text-sm"
            >
              {user?.fullName?.[0]?.toUpperCase() || "U"}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
