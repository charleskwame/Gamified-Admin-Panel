import { ChartBarIcon, UsersIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ChartBarIcon, path: "dashboard" },
  { label: "Students", icon: UsersIcon, path: "students" },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  const { userData, logout } = useAuth();

  return (
    <aside
      className={`bg-[#111C4A] text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex-1">
            <h1 className="text-lg font-extrabold leading-tight">Quiz Admin</h1>
            <p className="text-xs text-blue-200/70">Lecturer Panel</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          title={collapsed ? "Expand" : "Collapse"}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={collapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${
              activePage === item.path
                ? "bg-white/15 text-white"
                : "text-blue-200/70 hover:bg-white/5 hover:text-white"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User info & logout */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && userData && (
          <div className="mb-2 px-1">
            <p className="text-sm font-semibold truncate">{userData.displayName || "Lecturer"}</p>
            <p className="text-xs text-blue-200/60 truncate">{userData.email || ""}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium text-red-300/80 hover:bg-white/5 hover:text-red-200 transition-all"
          title="Logout"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
