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
import type { NotificationSubscription } from "../types/user";

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
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: (url?: NotificationSubscription | null) => void;
  addNotification: (payload: NotificationSubscription) => void;
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

  const login = useCallback(
    async (email: string, password: string, rememberMe = false) => {
      try {
        const { data: authUser } = await bitescoutApi.post<AuthUser>(
          `/user/login`,
          {
            email,
            password,
            rememberMe,
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
          return {
            success: false,
            error: detail || "Invalid email or password",
          };
        }
        return {
          success: false,
          error: "Unable to reach the server. Check your backend status.",
        };
      }
    },
    [],
  );

  const logout = useCallback(
    async (subscription?: NotificationSubscription | null) => {
      try {
        await bitescoutApi.post(
          `/user/logout`,
          subscription ? subscription : undefined,
        );
        setUser(null);
      } catch {
        setUser(null);
      }
    },
    [],
  );

  const addNotification = useCallback(
    async (payload: NotificationSubscription) => {
      if (!user) return;
      await bitescoutApi.post("/user/add-notification", { ...payload });
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      logout: withLoading(logout),
      addNotification,
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
