import { createContext, useContext, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
interface LoadingValue {
  isLoading: boolean;
  setLoading: Dispatch<SetStateAction<boolean>>;
  withLoading: <T extends (...args: any[]) => Promise<any>>(
    action: T,
  ) => (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>>;
}
const LoadingContext = createContext<LoadingValue | null>(null);
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setLoading] = useState(true);
  // The non-class function decorator
  const withLoading = <T extends (...args: any[]) => Promise<any>>(
    action: T,
  ) => {
    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      setLoading(true); // 1. Sets loading True before function starts
      try {
        await setTimeout(() => {}, 100);
        return await action(...args); // 2. Does the normal function run
      } catch (error) {
        console.error("Decorated function error caught:", error);
        throw error; // Passes the error up to your component UI if needed
      } finally {
        await setTimeout(() => {}, 100);
        setLoading(false); // 3. Finally sets loading False
      }
    };
  };
  const value = useMemo(
    () => ({
      isLoading,
      setLoading,
      withLoading,
    }),
    [isLoading],
  );
  return (
    <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>
  );
}
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}
