import { useEffect, useMemo, useState } from "react";
import { IncomesService } from "@/application/services/IncomesService";
import type {
  IncomePeriodItem,
  IncomePeriodOverview,
} from "@/domain/interfaces/income.interface";
import { IncomesRepository } from "@/infrastructure/repositories/IncomesRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const incomesService = new IncomesService(new IncomesRepository());

const monthOptions = [
  { value: "", label: "Todo el ejercicio" },
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
];

function getIncomeTypeLabel(incomeType: string) {
  const labels: Record<string, string> = {
    PAYSLIP: "Nómina",
    FREELANCE_INVOICE: "Factura emitida",
    BONUS: "Bonus",
    RETENTION_CERTIFICATE: "Certificado de retenciones",
    OTHER: "Otro ingreso",
  };

  return labels[incomeType] ?? incomeType;
}

function getSourceLabel(source: string) {
  return source === "DOCUMENT" ? "Documento" : "Manual";
}

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function IncomesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");
  const [overview, setOverview] = useState<IncomePeriodOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextOverview = await incomesService.getPeriodOverview({
          year,
          month: month ? Number(month) : undefined,
        });

        if (active) {
          setOverview(nextOverview);
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudieron cargar los ingresos",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadOverview();

    return () => {
      active = false;
    };
  }, [month, year]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = globalThis.setTimeout(() => {
      setSuccessMessage(null);
    }, 3200);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => currentYear - index).map(
        (optionYear) => ({
          value: optionYear,
          label: String(optionYear),
        }),
      ),
    [currentYear],
  );

  const handleDeleteIncome = async (item: IncomePeriodItem) => {
    const confirmed = globalThis.confirm(
      item.source === "DOCUMENT"
        ? "Este ingreso proviene de un documento. Si continúas, se eliminará también el documento origen. ¿Continuar?"
        : "Se eliminará el ingreso seleccionado. ¿Continuar?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingItemId(item.id);
    setError(null);

    try {
      if (item.source === "DOCUMENT") {
        await incomesService.removeDocumentIncome(item.sourceId);
      } else {
        await incomesService.removeIncome(item.sourceId);
      }

      const nextOverview = await incomesService.getPeriodOverview({
        year,
        month: month ? Number(month) : undefined,
      });
      setOverview(nextOverview);
      setSuccessMessage(
        item.source === "DOCUMENT"
          ? "Documento origen e ingreso eliminados correctamente."
          : "Ingreso eliminado correctamente.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el ingreso",
      );
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <div className="page-stack">
      {successMessage ? (
        <div className="financia-toast" role="status" aria-live="polite">
          <div className="financia-toast__body">{successMessage}</div>
        </div>
      ) : null}

      <PageHero
        title="Ingresos"
        description="Consulta ingresos del ejercicio o de un mes concreto a partir de registros manuales y documentos procesados, incluyendo facturas emitidas y nóminas."
        meta={overview?.period.label ?? "Ingresos"}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Filtros del período</h2>
              <p className="text-secondary mb-0">
                El ejercicio fiscal español se toma desde el 1 de enero. Puedes
                afinar por mes dentro del año seleccionado.
              </p>
            </div>

            <div className="row g-2 w-100 w-lg-auto">
              <div className="col-12 col-sm-auto">
                <label className="form-label mb-1" htmlFor="incomes-year">
                  Año
                </label>
                <select
                  id="incomes-year"
                  className="form-select"
                  value={year}
                  onChange={(event) =>
                    setYear(Number(event.currentTarget.value))
                  }
                >
                  {yearOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-auto">
                <label className="form-label mb-1" htmlFor="incomes-month">
                  Mes
                </label>
                <select
                  id="incomes-month"
                  className="form-select"
                  value={month}
                  onChange={(event) => setMonth(event.currentTarget.value)}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger mb-4">{error}</div>
          ) : null}

          {isLoading ? <LoadingPanel message="Cargando ingresos..." /> : null}

          <h2 className="h4 mb-3">Indicadores del período</h2>
          <div className="row g-3">
            <div className="col-md-4">
              <div className="metric-box">
                <span>Total computable del período</span>
                <strong>
                  {formatCurrency(overview?.totals.totalPeriodAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Total bruto</span>
                <strong>
                  {formatCurrency(overview?.totals.totalGrossAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Seguridad Social</span>
                <strong>
                  {formatCurrency(overview?.totals.totalSocialSecurityAmount)}
                </strong>
              </div>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-4">
              <div className="metric-box">
                <span>IVA asociado</span>
                <strong>
                  {formatCurrency(overview?.totals.totalVatAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>IRPF retenido</span>
                <strong>
                  {formatCurrency(overview?.totals.totalIrpfWithheld)}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Registros del período</span>
                <strong>{overview?.totals.recordCount ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 small text-secondary">
            {overview
              ? `Período consultado: ${overview.period.startDate} a ${overview.period.endDate}. Inicio del ejercicio fiscal en España: ${overview.period.fiscalYearStartDate}.`
              : "Sin datos de período cargados todavía."}
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h4 mb-1">Detalle del período</h2>
              <p className="text-secondary mb-0">
                Facturas emitidas y nóminas detectadas, además de ingresos
                manuales.
              </p>
              <p className="small text-secondary mb-0 mt-2">
                En los ingresos con origen documental, el borrado elimina por
                ahora también el documento origen. La separación entre borrar el
                ingreso y conservar el archivo se abordará en una fase
                posterior.
              </p>
            </div>
            {overview ? (
              <span className="badge text-bg-light border">
                {overview.period.label}
              </span>
            ) : null}
          </div>

          {!isLoading && overview && !overview.items.length ? (
            <p className="mb-0 text-secondary">
              No hay ingresos para el período seleccionado.
            </p>
          ) : null}

          {overview?.items.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th className="text-end">Importe período</th>
                    <th className="text-end">IVA</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.effectiveDate)}</td>
                      <td>
                        <strong className="d-block">{item.label}</strong>
                        <small className="text-secondary">
                          {item.counterpartyName ??
                            "Sin contraparte identificada"}
                        </small>
                      </td>
                      <td>{getIncomeTypeLabel(item.incomeType)}</td>
                      <td>{getSourceLabel(item.source)}</td>
                      <td className="text-end">
                        {formatCurrency(item.effectiveAmount)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(item.vatAmount ?? 0)}
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => void handleDeleteIncome(item)}
                          disabled={deletingItemId === item.id}
                        >
                          {deletingItemId === item.id
                            ? "Eliminando"
                            : item.source === "DOCUMENT"
                              ? "Eliminar documento origen"
                              : "Eliminar ingreso"}
                        </button>
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
