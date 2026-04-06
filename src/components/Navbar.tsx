import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navbar: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Aptitude", path: "/aptitude" },
    { label: "Programming", path: "/programming" },
    { label: "Resume", path: "/resume-assessment" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between h-14 px-6">

        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="text-lg font-bold tracking-tight text-gray-900 shrink-0"
        >
          Vox Mentor
        </button>

        {/* Centered Nav */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          {navLinks.map(({ label, path }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={cn(
                  "relative text-sm font-medium pb-0.5 transition-colors duration-200 group",
                  isActive ? "text-gray-900" : "text-gray-400 hover:text-gray-900"
                )}
              >
                {label}
                {/* Animated underline */}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-[2px] rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-300",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </button>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>

          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors relative group pb-0.5"
          >
            Logout
            <span className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full rounded-full bg-red-500 transition-all duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
