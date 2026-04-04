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

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14 px-4 max-w-5xl mx-auto">
        <button onClick={() => navigate("/")} className="text-lg font-semibold text-foreground tracking-tight">
          Vox Mentor
        </button>

        <nav className="flex items-center gap-1">
          <button
            onClick={() => navigate("/")}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg transition-colors font-medium",
              location.pathname === "/" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Home
          </button>

          <button
            onClick={() => navigate("/aptitude")}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg transition-colors font-medium",
              location.pathname === "/aptitude" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Aptitude
          </button>

          <button
            onClick={() => navigate("/programming")}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg transition-colors font-medium",
              location.pathname === "/programming" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Programming
          </button>

          <button
            onClick={() => navigate("/profile")}
            className={cn(
              "text-sm px-3 py-1.5 rounded-lg transition-colors font-medium",
              location.pathname === "/profile" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Profile
          </button>

          <button
            onClick={toggleTheme}
            className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
            className="ml-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
