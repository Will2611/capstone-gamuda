import { useState } from "react";
import { NavLink } from "react-router";
import { useAuth } from "../context/AuthContext";
import BiteSccoutIcon from "@/assets/icon.svg?react";
import { Menu, X } from "lucide-react";

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();

  const navItems = [
    { label: "Home", path: "/" },
    { label: "Find Restaurants", path: "/map" },
    { label: "User Profile", path: "/profile" },
    { label: "For Owners", path: "/dashboard" },
    { label: "Dashboard", path: "/social-visibility" },
    { label: "Privacy", path: "/privacy" },
  ];

  return (
    <nav className="bg-white border-b border-bs-neutral-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <NavLink className="cursor-pointer flex items-center gap-2" to={"/"}>
            <BiteSccoutIcon width={32} />
            <span className="font-bold text-lg text-bs-neutral-900">
              BiteScouts
            </span>
          </NavLink>

          <ul className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `transition-colors text-sm font-medium ${
                      isActive
                        ? "text-bs-gold font-medium"
                        : "text-bs-neutral-700 hover:text-bs-gold"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

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
              <NavLink
                to={"/login"}
                className="text-sm text-bs-neutral-700 hover:text-bs-gold transition-colors px-3 py-2 font-medium"
              >
                Log In
              </NavLink>
            )}
            <NavLink
              className="bg-bs-gold text-bs-neutral-900 px-5 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors text-sm font-medium"
              to={"/business"}
            >
              Join Pilot
            </NavLink>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <X
                size={24}
                strokeWidth={2}
                className="transition-transform duration-200"
              />
            ) : (
              <Menu
                size={24}
                strokeWidth={2}
                className="transition-transform duration-200"
              />
            )}
            {/* Figure out animation later */}
          </button>
        </div>

        {menuOpen && (
          <ul className="md:hidden mt-4 pb-4 border-t border-bs-neutral-200 pt-4">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block w-full text-start py-2 transition-colors font-medium ${
                      isActive
                        ? "text-bs-gold font-medium"
                        : "text-bs-neutral-700 hover:text-bs-gold"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="block w-full text-start py-2 text-bs-neutral-700 hover:text-bs-red"
              >
                Log Out
              </button>
            ) : (
              <>
                <NavLink
                  to={"/login"}
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-start py-2 text-bs-neutral-700 hover:text-bs-gold font-medium"
                >
                  Log In
                </NavLink>
              </>
            )}

            <NavLink
              className="block w-full text-center mt-4 bg-bs-gold text-bs-neutral-900 px-6 py-2 rounded-lg hover:bg-[#FFE44D] transition-colors font-medium"
              onClick={() => setMenuOpen(false)}
              to={"/business"}
            >
              Join Pilot
            </NavLink>
          </ul>
        )}
      </div>
    </nav>
  );
}
