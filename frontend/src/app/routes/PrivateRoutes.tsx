import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/application/contexts/AuthContext";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";

export function PrivateRoutes() {
  const auth = useAuth();
  const location = useLocation();

  if (auth.isInitializing) {
    return (
      <div className="container py-5">
        <LoadingPanel message="Validando sesion..." />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
