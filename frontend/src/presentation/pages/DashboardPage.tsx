import { useDashboard } from "@/application/contexts/DashboardContext";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { SummaryCard } from "@/presentation/components/SummaryCard";

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

function formatToday(value: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(value);
}

export function DashboardPage() {
  const { overview, isLoading, error, refreshOverview } = useDashboard();
  const currentYear = overview?.currentYear ?? new Date().getFullYear();
  const todayLabel = formatToday(new Date());
  const welcomeTitle = overview?.user?.fullName
    ? `Bienvenido, ${overview.user.fullName}`
    : "Bienvenido";

  return (
    <div className="page-stack">
      <PageHero
        title={welcomeTitle}
        description="Vista ejecutiva de tu operativa: ingresos, gastos, alertas y carga documental reciente."
        meta={`Resumen ${currentYear}`}
      />

      {isLoading ? (
        <LoadingPanel message="Cargando resumen financiero..." />
      ) : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="card border-0 shadow-sm">
        <div className="card-body py-3 px-4 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-2">
          <div>
            <strong className="d-block">
              Ejercicio vigente del dashboard: {currentYear}
            </strong>
            <span className="text-secondary">
              Los importes de ingresos y gastos se calculan sobre el ejercicio
              fiscal actual.
            </span>
          </div>
          <span className="badge text-bg-light border">
            Fecha de hoy: <strong>{todayLabel}</strong>
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        <SummaryCard
          title="Ingreso neto del ejercicio"
          value={formatCurrency(overview?.incomes?.totalNetAmount)}
          detail={`${overview?.incomes?.recordCount ?? 0} ingresos contabilizados en ${currentYear}`}
          accent="teal"
          actionLabel="Ir a ingresos"
          actionTo="/incomes"
        />
        <SummaryCard
          title="Gasto total del ejercicio"
          value={formatCurrency(overview?.expenses?.totalAmount)}
          detail={`${overview?.expenses?.recordCount ?? 0} gastos clasificados o pendientes en ${currentYear}`}
          accent="amber"
          actionLabel="Ir a gastos"
          actionTo="/expenses"
        />
        <SummaryCard
          title="Alertas pendientes"
          value={String(overview?.unreadAlerts.length ?? 0)}
          detail="Alertas sin leer ni resolver en este momento"
          accent="coral"
        />
        <SummaryCard
          title="Documentos subidos"
          value={String(overview?.uploadedDocuments ?? 0)}
          detail="Total documental disponible actualmente en el repositorio"
          accent="slate"
          actionLabel="Abrir listado documental"
          actionTo="/documents/repository"
        />
      </div>

      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-lg-6">
          <section className="card border-0 shadow-sm h-100 dashboard-intro-card">
            <div className="card-body p-4 d-flex flex-column">
              <h2 className="h4 mb-2 dashboard-intro-card__title">
                Qué es FINANCIA
              </h2>
              <h6 className="mb-3 dashboard-intro-card__text">
                Esta herramienta centraliza tu operativa financiera personal y
                profesional en un único panel.
              </h6>
              <h6 className="mb-0 dashboard-intro-card__text">
                Desde aquí puedes revisar ingresos, gastos, fiscalidad,
                simulaciones y documentos procesados para tener una visión
                rápida y accionable del estado actual.
              </h6>
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-6">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Alertas recientes</h2>
                  <p className="text-secondary mb-0">
                    Lo más relevante para revisión rápida.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => void refreshOverview()}
                >
                  Recargar
                </button>
              </div>

              {overview?.unreadAlerts.length ? (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Título</th>
                        <th>Severidad</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.unreadAlerts.map((alert) => (
                        <tr key={alert.id}>
                          <td>
                            <strong className="d-block">{alert.title}</strong>
                            <small className="text-secondary">
                              {alert.message}
                            </small>
                          </td>
                          <td>{alert.severity}</td>
                          <td>{alert.isResolved ? "Resuelta" : "Pendiente"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-0 text-secondary">
                  No hay alertas pendientes ahora mismo.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
