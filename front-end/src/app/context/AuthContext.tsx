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

  // Load user from storage on initial application mount
  useEffect(() => {
    const setter = async () => {
      const { data } = await bitescoutApi.get<AuthUser>("/user/ping");
      console.log(data)
      // Store both token string and user object locally
      setUser(data);
    };
    setter()
  }, []);

  // 💡 Rewritten to call your FastAPI Python backend instead of mocks
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await bitescoutApi.post<AuthUser>(
        `/user/login`,
        {
          email,
          password,
        },
      );
      // const response = await fetch("http://localhost:8000/user/login", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ email, password }),
      // });

      // const data = await response.json();

      // 📦 Transform API snake_case response to match camelCase TypeScript interface
      const authUser = data;

      // Store both token string and user object locally
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
    return bitescoutApi.delete(`/user/logout`);
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
