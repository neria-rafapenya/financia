import { useEffect, useMemo, useState } from "react";
import { AlertsService } from "@/application/services/AlertsService";
import type { AlertRecord } from "@/domain/interfaces/alert.interface";
import { AlertsRepository } from "@/infrastructure/repositories/AlertsRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const alertsService = new AlertsService(new AlertsRepository());

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actingAlertId, setActingAlertId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextAlerts = await alertsService.listAlerts();
      setAlerts(nextAlerts);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron cargar las alertas",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAlerts();
  }, []);

  const pendingAlerts = useMemo(
    () => alerts.filter((alert) => !alert.isResolved),
    [alerts],
  );

  const handleMarkAsRead = async (alertId: number) => {
    setActingAlertId(alertId);

    try {
      await alertsService.markAsRead(alertId);
      await loadAlerts();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la alerta",
      );
    } finally {
      setActingAlertId(null);
    }
  };

  const handleResolve = async (alertId: number) => {
    setActingAlertId(alertId);

    try {
      await alertsService.resolveAlert(alertId);
      await loadAlerts();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo resolver la alerta",
      );
    } finally {
      setActingAlertId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Alertas"
        description="Gestiona incidencias, avisos y tareas operativas para que el dashboard sea un verdadero centro de acción."
        meta={`${pendingAlerts.length} pendientes`}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Centro de alertas</h2>
              <p className="text-secondary mb-0">
                Marca como leídas o resueltas las alertas según avances en tu
                operativa.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-dark btn-sm"
              onClick={() => void loadAlerts()}
            >
              Recargar
            </button>
          </div>

          {error ? (
            <div className="alert alert-danger mb-4">{error}</div>
          ) : null}
          {isLoading ? <LoadingPanel message="Cargando alertas..." /> : null}

          {!isLoading && !alerts.length ? (
            <p className="mb-0 text-secondary">No hay alertas registradas.</p>
          ) : null}

          {alerts.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Severidad</th>
                    <th>Creada</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>
                        <strong className="d-block">{alert.title}</strong>
                        <small className="text-secondary">
                          {alert.message}
                        </small>
                      </td>
                      <td>{alert.alertType}</td>
                      <td>
                        <span
                          className={`documents-badge documents-badge--neutral alert-severity alert-severity--${alert.severity.toLowerCase()}`}
                        >
                          {alert.severity}
                        </span>
                      </td>
                      <td>{formatDateTime(alert.createdAt)}</td>
                      <td>
                        {alert.isResolved
                          ? "Resuelta"
                          : alert.isRead
                            ? "Leída"
                            : "Nueva"}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2 flex-wrap justify-content-end">
                          {alert.isRead ? null : (
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              disabled={actingAlertId === alert.id}
                              onClick={() => void handleMarkAsRead(alert.id)}
                            >
                              Marcar leída
                            </button>
                          )}
                          {alert.isResolved ? null : (
                            <button
                              type="button"
                              className="btn btn-dark btn-sm"
                              disabled={actingAlertId === alert.id}
                              onClick={() => void handleResolve(alert.id)}
                            >
                              Resolver
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
