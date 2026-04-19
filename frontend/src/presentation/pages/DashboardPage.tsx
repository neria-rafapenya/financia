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

export function DashboardPage() {
  const { overview, isLoading, error, refreshOverview } = useDashboard();
  const welcomeTitle = overview?.user?.fullName
    ? `Bienvenido, ${overview.user.fullName}`
    : "Bienvenido";

  return (
    <div className="page-stack">
      <PageHero
        title={welcomeTitle}
        description="Vista ejecutiva de tu operativa: ingresos, gastos, alertas y carga documental reciente."
        meta="Resumen"
      />

      {isLoading ? (
        <LoadingPanel message="Cargando resumen financiero..." />
      ) : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}

      <div className="dashboard-grid">
        <SummaryCard
          title="Ingreso neto acumulado"
          value={formatCurrency(overview?.incomes?.totalNetAmount)}
          detail={`${overview?.incomes?.recordCount ?? 0} registros de ingreso cargados`}
          accent="teal"
        />
        <SummaryCard
          title="Gasto total registrado"
          value={formatCurrency(overview?.expenses?.totalAmount)}
          detail={`${overview?.expenses?.recordCount ?? 0} gastos clasificados o pendientes`}
          accent="amber"
        />
        <SummaryCard
          title="Alertas pendientes"
          value={String(overview?.unreadAlerts.length ?? 0)}
          detail="Items sin leer o sin resolver en el backoffice operativo"
          accent="coral"
        />
        <SummaryCard
          title="Documentos subidos"
          value={String(overview?.uploadedDocuments ?? 0)}
          detail="Volumen documental actualmente disponible para OCR y LLM"
          accent="slate"
        />
      </div>

      <section className="card border-0 shadow-sm">
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
  );
}
