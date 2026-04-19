import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/application/contexts/AuthContext";
import {
  getSidebarCollapsed,
  setSidebarCollapsed,
} from "@/shared/storage/localStorage";

const navigationItems = [
  { to: "/", label: "Resumen" },
  { to: "/payers", label: "Pagadores" },
  { to: "/documents", label: "Documentos" },
  { to: "/documents/labor", label: "Laborales" },
  { to: "/incomes", label: "Ingresos" },
  { to: "/expenses", label: "Gastos" },
  { to: "/taxes", label: "Fiscalidad" },
  { to: "/simulations", label: "Simulaciones" },
];

export function AppLayout() {
  const auth = useAuth();
  const [isCompactNav, setIsCompactNav] = useState(getSidebarCollapsed());

  const toggleCompactNav = () => {
    const nextValue = !isCompactNav;
    setIsCompactNav(nextValue);
    setSidebarCollapsed(nextValue);
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="container-xxl d-flex flex-column gap-3 py-3 py-lg-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <nav
              className={`app-shell__nav ${isCompactNav ? "app-shell__nav--compact" : ""}`}
            >
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `app-shell__nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="d-flex align-items-center gap-2 gap-lg-3">
              <button
                type="button"
                className="btn btn-outline-light btn-sm"
                onClick={toggleCompactNav}
              >
                {isCompactNav ? "Expandir menu" : "Compactar menu"}
              </button>
              <div className="app-shell__identity">
                <span className="app-shell__user-label">Sesion activa</span>
                <strong>
                  {auth.user?.fullName ?? auth.user?.email ?? "Usuario"}
                </strong>
              </div>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                onClick={() => void auth.logout()}
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="app-shell__main">
        <div className="container-xxl py-2 py-lg-3">
          <Outlet />
        </div>
      </main>

      <footer className="app-shell__footer">
        <div className="container-xxl d-flex flex-column flex-lg-row justify-content-between gap-2 py-3">
          <span>
            FINANCIA · Arquitectura hexagonal en frontend con React, Vite y
            TypeScript.
          </span>
          <span>
            Persistencia: cookies para auth, localStorage para estado cliente.
          </span>
        </div>
      </footer>
    </div>
  );
}
