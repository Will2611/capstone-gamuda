import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Find Restaurants", path: "/map" },
    { label: "User Profile", path: "/profile" },
    { label: "For Owners", path: "/dashboard" },
    { label: "Dashboard", path: "/social-visibility" },
    { label: "Privacy", path: "/privacy" },
  ];

  const isActive = (path: string) => {
    if (path === "/map") {
      return location.pathname === "/map" || location.pathname === "/search";
    }
    return location.pathname === path;
  };

  const handleNav = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-bs-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div
            className="cursor-pointer flex items-center gap-2"
            onClick={() => navigate("/")}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="#FFD700"
                stroke="#FF4C4C"
                strokeWidth="2"
              />
              <path
                d="M12 12L16 8L20 12M12 16H20M14 20L16 22L18 20"
                stroke="#FF4C4C"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-bold text-lg text-bs-neutral-900">
              BiteScouts
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`transition-colors text-sm ${
                  isActive(item.path)
                    ? "text-bs-gold font-medium"
                    : "text-bs-neutral-700 hover:text-bs-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-bs-neutral-600">
                  Hi, {user?.displayName?.split(" ")[0] ?? "there"}
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-bs-neutral-700 hover:text-bs-red transition-colors px-3 py-2"
                >
                  Log Out
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="text-sm text-bs-neutral-700 hover:text-bs-gold transition-colors px-3 py-2"
              >
                Log In
              </button>
            )}
            <button
              className="bg-bs-gold text-bs-neutral-900 px-5 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors text-sm"
              onClick={() => navigate("/business")}
            >
              Join Pilot
            </button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {menuOpen ? (
                <path
                  d="M6 6L18 18M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ) : (
                <>
                  <path
                    d="M3 6H21M3 12H21M3 18H21"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-bs-neutral-200 pt-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`block w-full text-left py-2 transition-colors ${
                  isActive(item.path)
                    ? "text-bs-gold font-medium"
                    : "text-bs-neutral-700 hover:text-bs-gold"
                }`}
              >
                {item.label}
              </button>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-bs-neutral-700 hover:text-bs-red"
              >
                Log Out
              </button>
            ) : (
              <button
                onClick={() => handleNav("/login")}
                className="block w-full text-left py-2 text-bs-neutral-700 hover:text-bs-gold"
              >
                Log In
              </button>
            )}
            <button
              className="w-full mt-4 bg-bs-gold text-bs-neutral-900 px-6 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors"
              onClick={() => handleNav("/business")}
            >
              Join Pilot
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
