import { ChartBarIcon, UsersIcon, ClipboardDocumentListIcon, CogIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ChartBarIcon, path: "dashboard" },
  { label: "Students", icon: UsersIcon, path: "students" },
  { label: "Questions", icon: ClipboardDocumentListIcon, path: "questions" },
];

export default function TopNav({ activePage, onNavigate }) {
  const { userData, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 h-16">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 bg-[#111C4A] flex items-center justify-center rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-extrabold text-gray-900 leading-tight">Admin Dashboard</h1>
            <p className="text-[10px] text-gray-400 leading-tight">Lecturer Panel</p>
          </div>
        </div>

        {/* Center: Tab Navigation */}
        <nav className="flex items-center h-full gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 px-4 h-full text-sm font-semibold transition-all relative ${
                activePage === item.path ? "text-[#111C4A]" : "text-gray-400 hover:text-gray-600"
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">{item.label}</span>
              {activePage === item.path && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#111C4A] rounded-full" />}
            </button>
          ))}
        </nav>

        {/* Right: User Info + Settings + Logout */}
        <div className="flex items-center gap-2 shrink-0">
          {userData && (
            <div className="hidden sm:flex items-center gap-2.5 mr-2 pr-2 border-r border-gray-200">
              <div className="w-8 h-8 bg-[#111C4A]/10 flex items-center justify-center text-xs font-bold text-[#111C4A] rounded-lg">
                {(userData.displayName || "L").charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800 leading-tight truncate max-w-[100px]">{userData.displayName || "Lecturer"}</p>
                {userData.course && (
                  <span className="text-[10px] font-semibold text-gray-400 leading-tight">
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
              activePage === "settings" ? "text-[#111C4A] bg-[#111C4A]/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
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
