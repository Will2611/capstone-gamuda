import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Role = "client" | "owner";
const AUTH_STORAGE_KEY = "bitescouts_auth";
const TOKEN_STORAGE_KEY = "bitescouts_token";

// 💡 Updated to include role and id from your backend schema
interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  avatarUrl?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  // 💡 Updated to return role string on success
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Load user from storage on initial application mount
  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored) as AuthUser);
        setToken(storedToken);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  // 💡 Rewritten to call your FastAPI Python backend instead of mocks
  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch("http://localhost:8000/user/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Fallback to error message from FastAPI exception detail
        return {
          success: false,
          error: data.detail || "Invalid email or password",
        };
      }

      // 📦 Transform API snake_case response to match camelCase TypeScript interface
      const authUser: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.display_name,
        role: data.user.role as Role,
        avatarUrl: data.user.avatar_url,
      };

      // Store both token string and user object locally
      setUser(authUser);
      setToken(data.access_token);

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);

      return { success: true, role: authUser.role };
    } catch (error) {
      console.error("Authentication backend error:", error);
      return {
        success: false,
        error: "Unable to reach the server. Check your backend status.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user,
      login,
      logout,
    }),
    [user, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
