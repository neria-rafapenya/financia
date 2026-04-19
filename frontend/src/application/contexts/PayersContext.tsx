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
  UpdatePayerPayload,
} from "@/domain/interfaces/payer.interface";
import { PayersRepository } from "@/infrastructure/repositories/PayersRepository";
import { useAuth } from "./AuthContext";

interface PayersContextValue {
  payers: Payer[];
  isLoading: boolean;
  error: string | null;
  refreshPayers: () => Promise<void>;
  createPayer: (payload: CreatePayerPayload) => Promise<void>;
  updatePayer: (payerId: number, payload: UpdatePayerPayload) => Promise<void>;
  deletePayer: (payerId: number) => Promise<void>;
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

  const updatePayer = useCallback(
    async (payerId: number, payload: UpdatePayerPayload) => {
      await payersService.update(payerId, payload);
      await refreshPayers();
    },
    [refreshPayers],
  );

  const deletePayer = useCallback(
    async (payerId: number) => {
      await payersService.remove(payerId);
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

  const value = useMemo<PayersContextValue>(
    () => ({
      payers,
      isLoading,
      error,
      refreshPayers,
      createPayer,
      updatePayer,
      deletePayer,
    }),
    [
      createPayer,
      deletePayer,
      error,
      isLoading,
      payers,
      refreshPayers,
      updatePayer,
    ],
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
