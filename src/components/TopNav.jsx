import { useState, useRef, useEffect } from "react";
import { ChartBarIcon, UsersIcon, ClipboardDocumentListIcon, LightBulbIcon, CogIcon, HamburgerIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", icon: ChartBarIcon, path: "dashboard" },
  { label: "Students", icon: UsersIcon, path: "students" },
  { label: "Questions", icon: ClipboardDocumentListIcon, path: "questions" },
  { label: "Insights", icon: LightBulbIcon, path: "insights" },
];

const avatarColors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500", "bg-teal-500"];

function getAvatarColor(uid) {
  let hash = 0;
  for (let i = 0; i < (uid || "").length; i++) {
    hash = uid.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function TopNav({ activePage, onNavigate }) {
  const { userData, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  // Close drawer on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  const handleNav = (path) => {
    closeDrawer();
    onNavigate(path);
  };

  const initials = (userData?.displayName || "L").charAt(0).toUpperCase();
  const colorClass = getAvatarColor(userData?.uid);

  return (
    <header className="bg-surface border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <img src="/app_icon.png" alt="App logo" className="w-9 h-9 rounded-lg object-cover shrink-0" />
          <h1 className="text-sm sm:text-base font-extrabold text-primary leading-tight">Admin Dashboard</h1>
          <p className="hidden sm:block text-[10px] text-text-muted leading-tight">Lecturer Panel</p>
        </div>

        {/* Center: Tab Navigation (Desktop only) */}
        <nav className="hidden sm:flex items-center h-full gap-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={`flex items-center gap-2 px-4 h-full text-sm font-semibold transition-all relative ${
                activePage === item.path ? "text-primary" : "text-text-muted hover:text-text-secondary"
              }`}>
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {activePage === item.path && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </nav>

        {/* Right: Desktop user area + Mobile hamburger */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Desktop: user info, settings gear, logout */}
          <div className="hidden sm:flex items-center gap-2">
            {userData && (
              <div className="flex items-center gap-2.5 mr-2 pr-2 border-r border-border">
                <div className="w-8 h-8 bg-primary/10 flex items-center justify-center text-xs font-bold text-primary rounded-lg">{initials}</div>
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

          {/* Mobile: hamburger button */}
          <button
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-all text-text-muted hover:text-text-secondary hover:bg-gray-50"
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label="Open navigation menu">
            <HamburgerIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && <div className="fixed inset-0 bg-black/40 z-40 sm:hidden" onClick={closeDrawer} />}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out sm:hidden ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}>
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary flex items-center justify-center rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-primary leading-tight">Admin Dashboard</h2>
              <p className="text-[10px] text-text-muted leading-tight">Lecturer Panel</p>
            </div>
          </div>
          <button
            onClick={closeDrawer}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all text-text-muted"
            aria-label="Close menu">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile Section */}
        {userData && (
          <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
            <div className={`w-10 h-10 ${colorClass} flex items-center justify-center text-sm font-bold text-white rounded-full shrink-0`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{userData.displayName || "Lecturer"}</p>
              {userData.course && (
                <p className="text-[11px] font-medium text-text-muted truncate">
                  {userData.course === "computer_architecture" && "Computer Architecture"}
                  {userData.course === "computer_networking" && "Computer Networking"}
                  {userData.course === "software_engineering" && "Software Engineering"}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Page Navigation */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                activePage === item.path ? "bg-primary/5 text-primary" : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
              }`}>
              <item.icon className={`w-5 h-5 shrink-0 ${activePage === item.path ? "text-primary" : "text-text-muted"}`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 border-t border-border" />

        {/* Settings & Logout */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => handleNav("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              activePage === "settings" ? "bg-primary/5 text-primary" : "text-text-secondary hover:bg-gray-50 hover:text-text-primary"
            }`}>
            <CogIcon className={`w-5 h-5 shrink-0 ${activePage === "settings" ? "text-primary" : "text-text-muted"}`} />
            Settings
          </button>
          <button
            onClick={() => {
              closeDrawer();
              logout();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all text-red-500 hover:bg-red-50">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
