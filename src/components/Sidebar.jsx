import { ChartBarIcon, UsersIcon, ClipboardDocumentListIcon, CogIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ChartBarIcon, path: "dashboard" },
  { label: "Students", icon: UsersIcon, path: "students" },
  { label: "Questions", icon: ClipboardDocumentListIcon, path: "questions" },
  { label: "Settings", icon: CogIcon, path: "settings" },
];

export default function Sidebar({ activePage, onNavigate, collapsed, onToggle }) {
  const { userData, logout } = useAuth();

  return (
    <aside className={`bg-primary text-white flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex-1">
            <h1 className="text-lg font-extrabold leading-tight">Admin Dashboard</h1>
            <p className="text-[10px] text-white/60 font-medium">Lecturer Panel</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all shrink-0"
          title={collapsed ? "Expand" : "Collapse"}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {collapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activePage === item.path ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}>
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        {userData && (
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 bg-white/15 flex items-center justify-center text-xs font-bold text-white shrink-0 rounded-lg">
              {(userData.displayName || "L").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{userData.displayName || "Lecturer"}</p>
                <p className="text-[10px] text-white/60 truncate">{userData.email || ""}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-300/80 hover:text-red-200 hover:bg-white/5 transition-all rounded-lg mt-1">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
