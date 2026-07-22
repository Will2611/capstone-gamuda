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

export type Role = "client" | "owner";

interface AuthUser {
  id: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const setter = async () => {
      try {
        const { data } = await bitescoutApi.get<{
          id?: string | null;
          role?: Role | null;
        }>("/user/ping");
        if (data?.id) {
          setUser({ id: String(data.id), role: (data.role as Role) ?? "client" });
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      }
    };
    void setter();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await bitescoutApi.post<{
        id: string;
        role: Role;
      }>(`/user/login`, {
        email,
        password,
      });

      setUser({ id: String(data.id), role: data.role });
      return { success: true, role: data.role };
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
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
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
