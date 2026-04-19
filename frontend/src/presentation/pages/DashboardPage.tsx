import { useDashboard } from "@/application/contexts/DashboardContext";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { SummaryCard } from "@/presentation/components/SummaryCard";
import { Link } from "react-router-dom";

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

function getPriorityTone(urgencyLabel: "alta" | "media") {
  return urgencyLabel === "alta"
    ? "dashboard-priority-card--high"
    : "dashboard-priority-card--medium";
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
          value={String(overview?.unresolvedAlertsCount ?? 0)}
          detail="Alertas abiertas para revisión o resolución"
          accent="coral"
          actionLabel="Abrir alertas"
          actionTo="/alerts"
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

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h4 mb-1">Centro de acción</h2>
              <p className="text-secondary mb-0">
                Pendientes operativos y accesos directos para cerrar el ciclo de
                trabajo.
              </p>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-12 col-md-6 col-xl-3">
              <article className="dashboard-action-card">
                <span className="dashboard-action-card__eyebrow">
                  Documentos
                </span>
                <strong className="dashboard-action-card__value">
                  {overview?.documentsPendingReviewCount ?? 0}
                </strong>
                <p className="dashboard-action-card__detail">
                  Documentos pendientes de revisión o verificación manual.
                </p>
                <Link className="summary-card__link" to="/documents">
                  Revisar documentos
                </Link>
              </article>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <article className="dashboard-action-card">
                <span className="dashboard-action-card__eyebrow">Alertas</span>
                <strong className="dashboard-action-card__value">
                  {overview?.unresolvedAlertsCount ?? 0}
                </strong>
                <p className="dashboard-action-card__detail">
                  Avisos activos para leer, revisar o resolver.
                </p>
                <Link className="summary-card__link" to="/alerts">
                  Gestionar alertas
                </Link>
              </article>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <article className="dashboard-action-card">
                <span className="dashboard-action-card__eyebrow">
                  Contratos
                </span>
                <strong className="dashboard-action-card__value">
                  {overview?.activeContractsCount ?? 0}
                </strong>
                <p className="dashboard-action-card__detail">
                  Contratos activos visibles para trazabilidad y seguimiento.
                </p>
                <Link className="summary-card__link" to="/contracts">
                  Abrir contratos
                </Link>
              </article>
            </div>

            <div className="col-12 col-md-6 col-xl-3">
              <article className="dashboard-action-card">
                <span className="dashboard-action-card__eyebrow">
                  Periódicos
                </span>
                <strong className="dashboard-action-card__value">
                  {overview?.recurringPaymentsDueSoonCount ?? 0}
                </strong>
                <p className="dashboard-action-card__detail">
                  Pagos periódicos con próximo vencimiento en los próximos 30
                  días.
                </p>
                <Link className="summary-card__link" to="/recurring-payments">
                  Revisar pagos
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-xl-7">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Prioridades inmediatas</h2>
                  <p className="text-secondary mb-0">
                    Lo siguiente que deberías cerrar para desbloquear operativa,
                    revisión y vencimientos.
                  </p>
                </div>
              </div>

              {overview?.priorityItems.length ? (
                <div className="list-stack">
                  {overview.priorityItems.map((item) => (
                    <article
                      key={item.id}
                      className={`dashboard-priority-card ${getPriorityTone(item.urgencyLabel)}`}
                    >
                      <div>
                        <div className="dashboard-priority-card__meta">
                          <span>{item.category}</span>
                          <span>{item.urgencyLabel}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p className="mb-0 text-secondary">{item.detail}</p>
                      </div>
                      <Link className="summary-card__link" to={item.to}>
                        {item.actionLabel}
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-0 text-secondary">
                  No hay prioridades críticas abiertas ahora mismo.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Fiscalidad próxima</h2>
                  <p className="text-secondary mb-0">
                    Vencimientos derivados ya detectados para que no se te
                    acumulen en el cierre.
                  </p>
                </div>
                <Link className="btn btn-outline-dark btn-sm" to="/taxes">
                  Abrir fiscalidad
                </Link>
              </div>

              {overview?.nextTaxDeadlines.length ? (
                <div className="list-stack">
                  {overview.nextTaxDeadlines.map((item) => (
                    <article
                      key={item.id}
                      className="entity-card entity-card--stacked"
                    >
                      <div className="d-flex justify-content-between gap-3 flex-wrap">
                        <div>
                          <h3>{item.label}</h3>
                          <p className="mb-1 text-secondary">
                            {item.settlementLabel} · {item.obligationType}
                          </p>
                          <small>Vence el {item.dueDate}</small>
                        </div>
                        <strong>{formatCurrency(item.amount)}</strong>
                      </div>
                      <Link
                        className="summary-card__link"
                        to={`/documents/${item.sourceDocumentId}`}
                      >
                        Abrir documento origen
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-0 text-secondary">
                  No hay vencimientos fiscales próximos para este ejercicio.
                </p>
              )}
            </div>
          </section>
        </div>
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

      <div className="row g-3 align-items-stretch">
        <div className="col-12 col-xl-6">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Documentos a revisar</h2>
                  <p className="text-secondary mb-0">
                    Acceso directo al registro exacto que sigue pendiente de
                    verificar o revisar.
                  </p>
                </div>
                <Link
                  className="btn btn-outline-dark btn-sm"
                  to="/documents/repository"
                >
                  Ver repositorio
                </Link>
              </div>

              {overview?.documentsPendingReview.length ? (
                <div className="list-stack">
                  {overview.documentsPendingReview.map((document) => (
                    <article
                      key={document.id}
                      className="entity-card entity-card--stacked"
                    >
                      <div className="d-flex justify-content-between gap-3 flex-wrap">
                        <div>
                          <h3>{document.displayName}</h3>
                          <p className="mb-1 text-secondary">
                            {document.documentType} · {document.status}
                          </p>
                          <small>
                            {document.documentDate ?? "Sin fecha documental"}
                          </small>
                        </div>
                      </div>
                      <Link
                        className="summary-card__link"
                        to={`/documents/${document.id}`}
                      >
                        Abrir documento
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-0 text-secondary">
                  No hay documentos pendientes de revisión ahora mismo.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-6">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Pagos recurrentes próximos</h2>
                  <p className="text-secondary mb-0">
                    Compromisos cercanos para no perder control de caja ni
                    deducibilidad.
                  </p>
                </div>
                <Link
                  className="btn btn-outline-dark btn-sm"
                  to="/recurring-payments"
                >
                  Abrir pagos
                </Link>
              </div>

              {overview?.recurringPaymentsDueSoon.length ? (
                <div className="list-stack">
                  {overview.recurringPaymentsDueSoon.map((payment) => (
                    <article
                      key={payment.id}
                      className="entity-card entity-card--stacked"
                    >
                      <div className="d-flex justify-content-between gap-3 flex-wrap">
                        <div>
                          <h3>{payment.title}</h3>
                          <p className="mb-1 text-secondary">
                            {payment.frequency} · {payment.deductibilityStatus}
                          </p>
                          <small>Próximo cargo {payment.nextDueDate}</small>
                        </div>
                        <strong>{formatCurrency(payment.amount)}</strong>
                      </div>
                      <Link
                        className="summary-card__link"
                        to="/recurring-payments"
                      >
                        Revisar pago
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mb-0 text-secondary">
                  No hay pagos recurrentes cercanos en los próximos 30 días.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
