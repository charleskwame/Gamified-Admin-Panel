import { ChartBarIcon, UsersIcon, ClipboardDocumentListIcon, LightBulbIcon, CogIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ChartBarIcon, path: "dashboard" },
  { label: "Students", icon: UsersIcon, path: "students" },
  { label: "Questions", icon: ClipboardDocumentListIcon, path: "questions" },
  { label: "Insights", icon: LightBulbIcon, path: "insights" },
];

export default function TopNav({ activePage, onNavigate }) {
  const { userData, logout } = useAuth();

  return (
    <header className="bg-surface border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold text-primary leading-tight">Admin Dashboard</h1>
            <p className="text-[10px] text-text-muted leading-tight">Lecturer Panel</p>
          </div>
        </div>

        {/* Center: Tab Navigation */}
        <nav className="flex items-center h-full gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 px-4 h-full text-sm font-semibold transition-all relative ${
                activePage === item.path ? "text-primary" : "text-text-muted hover:text-text-secondary"
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
              {activePage === item.path && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </nav>

        {/* Right: User Info + Settings + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {userData && (
            <div className="hidden sm:flex items-center gap-2.5 mr-2 pr-2 border-r border-border">
              <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary rounded-lg">
                {(userData.displayName || "L").charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-text-primary leading-tight truncate max-w-[100px]">{userData.displayName || "Lecturer"}</p>
                {userData.course && (
                  <span className="text-[10px] font-semibold text-text-muted leading-tight">
                    {userData.course === "computer_architecture" && "Computer Architecture"}
                    {userData.course === "computer_networking" && "Computer Networking"}
                    {userData.course === "software_engineering" && "Software Engineering"}
                  </span>
                )}
              </div>
            </div>
          )}
          <button
            onClick={() => onNavigate("settings")}
            className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
              activePage === "settings" ? "text-primary bg-primary/5" : "text-text-muted hover:text-text-secondary hover:bg-gray-50"
            }`}
            title="Settings">
            <CogIcon className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center w-9 h-9 rounded-lg transition-all text-red-400 hover:text-red-600 hover:bg-red-50"
            title="Logout">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
