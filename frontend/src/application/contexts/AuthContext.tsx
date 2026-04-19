import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type {
  AuthContextValue,
  AuthState,
  LoginRequest,
} from "@/domain/interfaces/auth.interface";
import { AuthRepository } from "@/infrastructure/repositories/AuthRepository";
import { AuthService } from "@/application/services/AuthService";
import { AUTH_SESSION_EXPIRED_EVENT } from "@/shared/config/auth";
import { getTokenRemainingMs } from "@/shared/utils/jwt";

const authContext = createContext<AuthContextValue | null>(null);
const authService = new AuthService(new AuthRepository());

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isInitializing: true,
};

export function AuthProvider({ children }: Readonly<PropsWithChildren>) {
  const navigate = useNavigate();
  const location = useLocation();
  const expiryTimeoutRef = useRef<ReturnType<
    typeof globalThis.setTimeout
  > | null>(null);
  const [state, setState] = useState<AuthState>(initialState);

  const resetExpiryTimer = useCallback(
    (accessToken: string | null) => {
      if (expiryTimeoutRef.current) {
        globalThis.clearTimeout(expiryTimeoutRef.current);
        expiryTimeoutRef.current = null;
      }

      if (!accessToken) {
        return;
      }

      const remainingMs = getTokenRemainingMs(accessToken);

      if (remainingMs <= 0) {
        authService.clearSession();
        setState((current) => ({
          ...current,
          user: null,
          tokens: null,
          isAuthenticated: false,
        }));

        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }

        return;
      }

      expiryTimeoutRef.current = globalThis.setTimeout(() => {
        authService.clearSession();
        setState((current) => ({
          ...current,
          user: null,
          tokens: null,
          isAuthenticated: false,
        }));
        navigate("/login", { replace: true });
      }, remainingMs);
    },
    [location.pathname, navigate],
  );

  const handleSessionExpiration = useCallback(() => {
    authService.clearSession();
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isInitializing: false,
    });

    if (location.pathname !== "/login") {
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      const hydratedSession = authService.hydrateSession();

      if (!hydratedSession) {
        if (active) {
          setState({
            user: null,
            tokens: null,
            isAuthenticated: false,
            isInitializing: false,
          });
        }
        return;
      }

      if (active) {
        setState({
          user: hydratedSession.user,
          tokens: hydratedSession.tokens,
          isAuthenticated: true,
          isInitializing: false,
        });
        resetExpiryTimer(hydratedSession.tokens.accessToken);
      }

      try {
        const user = await authService.fetchCurrentUser();

        if (active) {
          setState((current) => ({
            ...current,
            user,
          }));
        }
      } catch {
        if (active) {
          handleSessionExpiration();
        }
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [handleSessionExpiration, resetExpiryTimer]);

  useEffect(() => {
    const listener = () => handleSessionExpiration();

    globalThis.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);

    return () => {
      globalThis.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
    };
  }, [handleSessionExpiration]);

  useEffect(() => {
    return () => {
      if (expiryTimeoutRef.current) {
        globalThis.clearTimeout(expiryTimeoutRef.current);
      }
    };
  }, []);

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await authService.login(payload);

      setState({
        user: response.user,
        tokens: response.tokens,
        isAuthenticated: true,
        isInitializing: false,
      });

      resetExpiryTimer(response.tokens.accessToken);

      const nextPath =
        (location.state as { from?: string } | null)?.from ?? "/";
      navigate(nextPath, { replace: true });
    },
    [location.state, navigate, resetExpiryTimer],
  );

  const logout = useCallback(async () => {
    await authService.logout();

    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isInitializing: false,
    });

    if (expiryTimeoutRef.current) {
      globalThis.clearTimeout(expiryTimeoutRef.current);
      expiryTimeoutRef.current = null;
    }

    navigate("/login", { replace: true });
  }, [navigate]);

  const refreshUser = useCallback(async () => {
    const user = await authService.fetchCurrentUser();

    setState((current) => ({
      ...current,
      user,
    }));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshUser,
    }),
    [login, logout, refreshUser, state],
  );

  return <authContext.Provider value={value}>{children}</authContext.Provider>;
}

export function useAuth() {
  const context = useContext(authContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
