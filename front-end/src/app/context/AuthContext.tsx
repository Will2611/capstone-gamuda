import { AxiosError } from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { bitescoutApi } from "../services/baseApi";
import { useLoading } from "./LoadingContext";

export type Role = "client" | "owner";

// 💡 Updated to include role and id from your backend schema
interface AuthUser {
  id: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
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
  const { withLoading } = useLoading();
  // Load user from storage on initial application mount
  useEffect(() => {
    const setter = async () => {
      try {
        const { data } = await bitescoutApi.get<AuthUser>("/user/ping");
        setUser(data);
      } catch {
        setUser(null);
      }
      // Store both token string and user object locally
    };
    withLoading(setter)();
  }, []);

  // 💡 Rewritten to call your FastAPI Python backend instead of mocks
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data: authUser } = await bitescoutApi.post<AuthUser>(
        `/user/login`,
        {
          email,
          password,
        },
      );

      setUser(authUser);

      return { success: true, role: authUser.role };
    } catch (errorRaw) {
      const error = errorRaw as AxiosError<{ detail: string }>;
      console.error("Authentication backend error:", JSON.stringify(error));
      if (error.response) {
        const {
          data: { detail },
        } = error.response;
        return { success: false, error: detail || "Invalid email or password" };
      }
      return {
        success: false,
        error: "Unable to reach the server. Check your backend status.",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await bitescoutApi.delete(`/user/logout`);
      setUser(null);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      user,

      isAuthenticated: !!user,
      login,
      logout: withLoading(logout),
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
