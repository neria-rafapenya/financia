import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { PayersService } from "@/application/services/PayersService";
import type {
  CreatePayerPayload,
  Payer,
} from "@/domain/interfaces/payer.interface";
import { PayersRepository } from "@/infrastructure/repositories/PayersRepository";
import { useAuth } from "./AuthContext";

interface PayersContextValue {
  payers: Payer[];
  isLoading: boolean;
  error: string | null;
  refreshPayers: () => Promise<void>;
  createPayer: (payload: CreatePayerPayload) => Promise<void>;
}

const payersContext = createContext<PayersContextValue | null>(null);
const payersService = new PayersService(new PayersRepository());

export function PayersProvider({ children }: Readonly<PropsWithChildren>) {
  const auth = useAuth();
  const [payers, setPayers] = useState<Payer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPayers = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setPayers([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setPayers(await payersService.list());
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron cargar los pagadores";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated]);

  const createPayer = useCallback(
    async (payload: CreatePayerPayload) => {
      await payersService.create(payload);
      await refreshPayers();
    },
    [refreshPayers],
  );

  useEffect(() => {
    if (!auth.isInitializing && auth.isAuthenticated) {
      void refreshPayers();
      return;
    }

    if (!auth.isAuthenticated) {
      setPayers([]);
    }
  }, [auth.isAuthenticated, auth.isInitializing, refreshPayers]);

  const value = useMemo(
    () => ({ payers, isLoading, error, refreshPayers, createPayer }),
    [createPayer, error, isLoading, payers, refreshPayers],
  );

  return (
    <payersContext.Provider value={value}>{children}</payersContext.Provider>
  );
}

export function usePayers() {
  const context = useContext(payersContext);

  if (!context) {
    throw new Error("usePayers debe usarse dentro de PayersProvider");
  }

  return context;
}
