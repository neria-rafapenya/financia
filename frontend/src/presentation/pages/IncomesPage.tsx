import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IncomesService } from "@/application/services/IncomesService";
import { usePayers } from "@/application/contexts/PayersContext";
import type {
  CreateIncomeInput,
  IncomePeriodItem,
  IncomePeriodOverview,
  IncomeType,
  UpdateIncomeInput,
} from "@/domain/interfaces/income.interface";
import { IncomesRepository } from "@/infrastructure/repositories/IncomesRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { FormFieldInfo } from "@/shared/components/FormFieldInfo";

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

const incomeTypeOptions: Array<{ value: IncomeType; label: string }> = [
  { value: "PAYSLIP", label: "Nómina" },
  { value: "FREELANCE_INVOICE", label: "Factura emitida" },
  { value: "BONUS", label: "Bonus" },
  { value: "RETENTION_CERTIFICATE", label: "Certificado de retenciones" },
  { value: "OTHER", label: "Otro" },
];

interface IncomeFormState {
  payerId: string;
  incomeType: IncomeType;
  periodYear: string;
  periodMonth: string;
  grossAmount: string;
  netAmount: string;
  irpfWithheld: string;
  socialSecurityAmount: string;
  flexibleCompensationAmount: string;
  notes: string;
}

function createInitialIncomeFormState(currentYear: number): IncomeFormState {
  return {
    payerId: "",
    incomeType: "PAYSLIP",
    periodYear: String(currentYear),
    periodMonth: "",
    grossAmount: "",
    netAmount: "",
    irpfWithheld: "",
    socialSecurityAmount: "",
    flexibleCompensationAmount: "",
    notes: "",
  };
}

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
  const { payers } = usePayers();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");
  const [formState, setFormState] = useState<IncomeFormState>(() =>
    createInitialIncomeFormState(currentYear),
  );
  const [editingIncomeId, setEditingIncomeId] = useState<number | null>(null);
  const [overview, setOverview] = useState<IncomePeriodOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadOverview = async (active = true) => {
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

  useEffect(() => {
    let active = true;

    void loadOverview(active);

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

  const handleSubmitIncome = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const parsedPayerId = Number(formState.payerId);
    const parsedGrossAmount = Number(formState.grossAmount);
    const parsedNetAmount = formState.netAmount
      ? Number(formState.netAmount)
      : null;
    const parsedIrpfWithheld = formState.irpfWithheld
      ? Number(formState.irpfWithheld)
      : null;
    const parsedSocialSecurityAmount = formState.socialSecurityAmount
      ? Number(formState.socialSecurityAmount)
      : null;
    const parsedFlexibleCompensationAmount =
      formState.flexibleCompensationAmount
        ? Number(formState.flexibleCompensationAmount)
        : null;

    if (
      !editingIncomeId &&
      (!Number.isInteger(parsedPayerId) || parsedPayerId <= 0)
    ) {
      setError("Selecciona un pagador para registrar el ingreso manual.");
      return;
    }

    if (!Number.isFinite(parsedGrossAmount) || parsedGrossAmount <= 0) {
      setError("El importe bruto debe ser un número mayor que cero.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingIncomeId) {
        const payload: UpdateIncomeInput = {
          incomeType: formState.incomeType,
          periodYear: Number(formState.periodYear),
          periodMonth: formState.periodMonth
            ? Number(formState.periodMonth)
            : null,
          grossAmount: parsedGrossAmount,
          netAmount: parsedNetAmount,
          irpfWithheld: parsedIrpfWithheld,
          socialSecurityAmount: parsedSocialSecurityAmount,
          flexibleCompensationAmount: parsedFlexibleCompensationAmount,
          notes: formState.notes.trim() || null,
        };

        if (Number.isInteger(parsedPayerId) && parsedPayerId > 0) {
          payload.payerId = parsedPayerId;
        }

        await incomesService.updateIncome(editingIncomeId, payload);
        setSuccessMessage("Ingreso actualizado correctamente.");
      } else {
        const payload: CreateIncomeInput = {
          payerId: parsedPayerId,
          incomeType: formState.incomeType,
          periodYear: Number(formState.periodYear),
          periodMonth: formState.periodMonth
            ? Number(formState.periodMonth)
            : null,
          grossAmount: parsedGrossAmount,
          netAmount: parsedNetAmount,
          irpfWithheld: parsedIrpfWithheld,
          socialSecurityAmount: parsedSocialSecurityAmount,
          flexibleCompensationAmount: parsedFlexibleCompensationAmount,
          notes: formState.notes.trim() || undefined,
        };

        await incomesService.createIncome(payload);
        setSuccessMessage("Ingreso manual creado correctamente.");
      }

      setEditingIncomeId(null);
      setFormState(createInitialIncomeFormState(year));
      await loadOverview(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el ingreso",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIncome = (item: IncomePeriodItem) => {
    const matchedPayer = payers.find(
      (payer) => payer.payerName === item.counterpartyName,
    );

    setEditingIncomeId(item.sourceId);
    setError(null);
    setSuccessMessage(null);
    setFormState({
      payerId: matchedPayer ? String(matchedPayer.id) : "",
      incomeType: item.incomeType as IncomeType,
      periodYear: String(item.periodYear),
      periodMonth: item.periodMonth ? String(item.periodMonth) : "",
      grossAmount: String(item.grossAmount),
      netAmount: item.netAmount === null ? "" : String(item.netAmount),
      irpfWithheld: item.irpfWithheld === null ? "" : String(item.irpfWithheld),
      socialSecurityAmount:
        item.socialSecurityAmount === null
          ? ""
          : String(item.socialSecurityAmount),
      flexibleCompensationAmount: "",
      notes: item.notes ?? "",
    });
  };

  const handleCancelEdit = () => {
    setEditingIncomeId(null);
    setFormState(createInitialIncomeFormState(year));
    setError(null);
  };

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
                  <FormFieldInfo text="Ejercicio fiscal sobre el que quieres consultar los ingresos." />
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
                  <FormFieldInfo text="Mes concreto del ejercicio para filtrar el listado de ingresos." />
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
          <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">
                {editingIncomeId
                  ? "Editar ingreso manual"
                  : "Alta manual de ingreso"}
              </h2>
              <p className="text-secondary mb-0">
                Completa aquí ingresos que no vengan de documento procesado,
                como ajustes, bonus o facturas emitidas manualmente.
              </p>
            </div>
            <span className="badge text-bg-light border">CRUD</span>
          </div>

          {payers.length === 0 ? (
            <div className="alert alert-warning mb-4">
              Necesitas al menos un pagador para registrar ingresos manuales.
            </div>
          ) : null}

          <form onSubmit={(event) => void handleSubmitIncome(event)}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label" htmlFor="income-payer">
                  Pagador
                </label>
                <select
                  id="income-payer"
                  className="form-select"
                  value={formState.payerId}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      payerId: nextValue,
                    }));
                  }}
                  required={!editingIncomeId}
                >
                  <option value="">Selecciona un pagador</option>
                  {payers.map((payer) => (
                    <option key={payer.id} value={payer.id}>
                      {payer.payerName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="income-type">
                  Tipo de ingreso
                </label>
                <select
                  id="income-type"
                  className="form-select"
                  value={formState.incomeType}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value as IncomeType;

                    setFormState((current) => ({
                      ...current,
                      incomeType: nextValue,
                    }));
                  }}
                >
                  {incomeTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="income-year">
                  Año
                </label>
                <input
                  id="income-year"
                  className="form-control"
                  type="number"
                  min="2000"
                  max="2100"
                  value={formState.periodYear}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      periodYear: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-2">
                <label className="form-label" htmlFor="income-month-manual">
                  Mes
                </label>
                <select
                  id="income-month-manual"
                  className="form-select"
                  value={formState.periodMonth}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      periodMonth: nextValue,
                    }));
                  }}
                >
                  {monthOptions.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="income-gross">
                  Importe bruto
                </label>
                <input
                  id="income-gross"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.grossAmount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      grossAmount: nextValue,
                    }));
                  }}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="income-net">
                  Neto
                </label>
                <input
                  id="income-net"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.netAmount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      netAmount: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="income-irpf">
                  IRPF retenido
                </label>
                <input
                  id="income-irpf"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.irpfWithheld}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      irpfWithheld: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="income-ss">
                  Seguridad Social
                </label>
                <input
                  id="income-ss"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.socialSecurityAmount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      socialSecurityAmount: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="income-flex">
                  Retribución flexible
                </label>
                <input
                  id="income-flex"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.flexibleCompensationAmount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      flexibleCompensationAmount: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-8">
                <label className="form-label" htmlFor="income-notes">
                  Notas
                </label>
                <input
                  id="income-notes"
                  className="form-control"
                  type="text"
                  value={formState.notes}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      notes: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={
                    isSubmitting || (!editingIncomeId && !payers.length)
                  }
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingIncomeId
                      ? "Guardar cambios"
                      : "Crear ingreso manual"}
                </button>

                {editingIncomeId ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancelEdit}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </div>
          </form>
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
                        <div className="d-inline-flex gap-2">
                          {item.source === "MANUAL" ? (
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => handleEditIncome(item)}
                            >
                              Editar
                            </button>
                          ) : null}

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
