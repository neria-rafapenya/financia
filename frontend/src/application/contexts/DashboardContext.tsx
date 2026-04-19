import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { DashboardService } from "@/application/services/DashboardService";
import type { DashboardOverview } from "@/domain/interfaces/dashboard.interface";
import { DashboardRepository } from "@/infrastructure/repositories/DashboardRepository";
import { useAuth } from "./AuthContext";

interface DashboardContextValue {
  overview: DashboardOverview | null;
  isLoading: boolean;
  error: string | null;
  refreshOverview: () => Promise<void>;
}

const dashboardContext = createContext<DashboardContextValue | null>(null);
const dashboardService = new DashboardService(new DashboardRepository());

export function DashboardProvider({ children }: Readonly<PropsWithChildren>) {
  const auth = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshOverview = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setOverview(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextOverview = await dashboardService.loadOverview();
      setOverview(nextOverview);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar el dashboard";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  useEffect(() => {
    if (!auth.isInitializing && auth.isAuthenticated) {
      void refreshOverview();
      return;
    }

    if (!auth.isAuthenticated) {
      setOverview(null);
    }
  }, [auth.isAuthenticated, auth.isInitializing, refreshOverview]);

  const value = useMemo(
    () => ({ overview, isLoading, error, refreshOverview }),
    [error, isLoading, overview, refreshOverview],
  );

  return (
    <dashboardContext.Provider value={value}>
      {children}
    </dashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(dashboardContext);

  if (!context) {
    throw new Error("useDashboard debe usarse dentro de DashboardProvider");
  }

  return context;
}
