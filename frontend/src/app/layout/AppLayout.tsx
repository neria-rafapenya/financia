import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/application/contexts/AuthContext";
import { FinanciaWordmark } from "@/shared/components/FinanciaWordmark";
import { LogoutIcon } from "@/shared/components/LogoutIcon";

const navigationItems = [
  { to: "/", label: "Resumen" },
  { to: "/documents", label: "Documentos" },
  { to: "/incomes", label: "Ingresos" },
  { to: "/expenses", label: "Gastos" },
  { to: "/recurring-payments", label: "Periódicos" },
  { to: "/simulations", label: "Simulaciones" },
];

const alertsItem = { to: "/alerts", label: "Alertas" };

const managementItems = [
  { to: "/contracts", label: "Contratos" },
  { to: "/taxes", label: "Fiscalidad" },
  { to: "/payers", label: "Pagadores" },
  { to: "/documents/labor", label: "Laborales" },
];

export function AppLayout() {
  const auth = useAuth();
  const location = useLocation();
  const isManagementActive = managementItems.some((item) =>
    location.pathname.startsWith(item.to),
  );

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="container-xxl py-3 py-lg-4">
          <div className="app-shell__header-bar">
            <div className="app-shell__header-left">
              <NavLink
                to="/"
                end
                className="app-shell__brand"
                aria-label="FINANCIA"
              >
                <FinanciaWordmark className="app-shell__brand-logo" />
              </NavLink>
            </div>

            <div className="app-shell__header-center">
              <nav className="app-shell__nav">
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

                <div
                  className={`app-shell__nav-group ${isManagementActive ? "is-active" : ""}`}
                >
                  <button
                    type="button"
                    className="app-shell__nav-link app-shell__nav-link--button"
                    aria-haspopup="true"
                  >
                    Gestoría
                  </button>

                  <div className="app-shell__nav-dropdown">
                    {managementItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                          `app-shell__nav-dropdown-link ${isActive ? "is-active" : ""}`
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                </div>

                <NavLink
                  to={alertsItem.to}
                  className={({ isActive }) =>
                    `app-shell__nav-link ${isActive ? "is-active" : ""}`
                  }
                >
                  {alertsItem.label}
                </NavLink>
              </nav>
            </div>

            <div className="app-shell__header-right">
              <div className="app-shell__identity">
                <NavLink to="/profile" className="app-shell__identity-link">
                  <strong>
                    {auth.user?.fullName ?? auth.user?.email ?? "Usuario"}
                  </strong>
                </NavLink>
              </div>
              <button
                type="button"
                className="btn btn-sm"
                aria-label="Cerrar sesion"
                title="Cerrar sesion"
                onClick={() => void auth.logout()}
              >
                <LogoutIcon width={18} height={18} color="#d97706" />
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
        <div className="container-xxl d-flex flex-column flex-lg-row justify-content-center gap-2 py-3 text-center">
          <span>
            &copy; {new Date().getFullYear()} FINANCIA. Todos los derechos
            reservados.
          </span>
        </div>
      </footer>
    </div>
  );
}
