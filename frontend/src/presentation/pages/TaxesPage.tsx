import { useEffect, useMemo, useState } from "react";
import { TaxService } from "@/application/services/TaxService";
import type { TaxPeriodOverview } from "@/domain/interfaces/tax.interface";
import { TaxRepository } from "@/infrastructure/repositories/TaxRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { FormFieldInfo } from "@/shared/components/FormFieldInfo";

const taxService = new TaxService(new TaxRepository());

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

function getObligationTypeLabel(value: string) {
  return value === "VAT" ? "IVA" : "IRPF";
}

function isDueDateNear(dueDate: string | null) {
  if (!dueDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDateValue = new Date(dueDate);
  dueDateValue.setHours(0, 0, 0, 0);

  const millisecondsUntilDueDate = dueDateValue.getTime() - today.getTime();
  const daysUntilDueDate = millisecondsUntilDueDate / (1000 * 60 * 60 * 24);

  return daysUntilDueDate <= 30;
}

export function TaxesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");
  const [overview, setOverview] = useState<TaxPeriodOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOverview = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextOverview = await taxService.getPeriodOverview({
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
            : "No se pudieron cargar las obligaciones fiscales",
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

  return (
    <div className="page-stack">
      <PageHero
        title="Fiscalidad"
        description="Revisa IVA e IRPF detectados en facturas emitidas por el usuario y verifica qué obligación fiscal corresponde a cada documento."
        meta={overview?.period.label ?? "Fiscalidad"}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-lg-5">
              <h2 className="h4 mb-1">Perfil fiscal activo</h2>
              <p className="text-secondary mb-0">
                La detección de factura emitida propia se basa en el NIF del
                usuario autenticado.
              </p>
            </div>

            <div className="col-12 col-lg-3">
              <div className="border rounded-3 p-3 bg-light-subtle h-100">
                <div className="small text-secondary mb-1">Titular</div>
                <strong>{overview?.profile.fullName ?? "Sin cargar"}</strong>
              </div>
            </div>

            <div className="col-12 col-lg-4">
              <div className="border rounded-3 p-3 bg-light-subtle h-100">
                <div className="small text-secondary mb-1">NIF</div>
                <strong>{overview?.profile.taxId ?? "No configurado"}</strong>
                <div className="small text-secondary mt-2">
                  {overview?.profile.hasValidTaxId
                    ? "Identificador fiscal válido"
                    : "Falta un NIF válido para detectar facturas propias con fiabilidad"}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-2 w-100 mt-3">
            <div className="col-12 col-sm-auto">
              <label className="form-label mb-1" htmlFor="tax-year">
                Año
                <FormFieldInfo text="Ejercicio fiscal para el que se calculan y muestran las obligaciones tributarias." />
              </label>
              <select
                id="tax-year"
                className="form-select"
                value={year}
                onChange={(event) => setYear(Number(event.currentTarget.value))}
              >
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-auto">
              <label className="form-label mb-1" htmlFor="tax-month">
                Mes
                <FormFieldInfo text="Mes dentro del ejercicio para centrar el detalle de fiscalidad en un período concreto." />
              </label>
              <select
                id="tax-month"
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

          {error ? (
            <div className="alert alert-danger mt-4 mb-0">{error}</div>
          ) : null}
          {isLoading ? (
            <LoadingPanel message="Cargando obligaciones fiscales..." />
          ) : null}
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="metric-box metric-box--warning">
                <span>Total obligaciones</span>
                <strong>{formatCurrency(overview?.totals.totalAmount)}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box metric-box--warning">
                <span>Total IVA</span>
                <strong>
                  {formatCurrency(overview?.totals.totalVatAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box metric-box--warning">
                <span>Total IRPF</span>
                <strong>
                  {formatCurrency(overview?.totals.totalIrpfAmount)}
                </strong>
              </div>
            </div>
          </div>

          {!isLoading && overview && !overview.items.length ? (
            <p className="mb-0 text-secondary">
              No hay obligaciones fiscales derivadas para el período
              seleccionado.
            </p>
          ) : null}

          {overview?.items.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha factura</th>
                    <th>Liquidación</th>
                    <th>Obligación</th>
                    <th>Tipo</th>
                    <th>Contraparte</th>
                    <th>NIF cotejado</th>
                    <th className="text-end">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.effectiveDate)}</td>
                      <td>
                        <strong className="d-block">
                          {item.settlementLabel}
                        </strong>
                        <small
                          className={
                            isDueDateNear(item.dueDate)
                              ? "text-danger fw-bold"
                              : "text-secondary"
                          }
                        >
                          Vence el {formatDate(item.dueDate)}
                        </small>
                      </td>
                      <td>
                        <strong className="d-block">{item.label}</strong>
                        <small className="text-secondary">{item.concept}</small>
                      </td>
                      <td>{getObligationTypeLabel(item.obligationType)}</td>
                      <td>{item.counterpartyName ?? "Sin contraparte"}</td>
                      <td>
                        <span className="d-block">
                          {item.matchedUserTaxId ?? "Sin NIF usuario"}
                        </span>
                        <small className="text-secondary">
                          Detectado en factura:{" "}
                          {item.detectedIssuerTaxId ?? "No identificado"}
                        </small>
                      </td>
                      <td className="text-end">
                        {formatCurrency(item.amount)}
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
