import { useEffect, useMemo, useState, type FormEvent } from "react";
import Swal from "sweetalert2";
import { ExpensesService } from "@/application/services/ExpensesService";
import type {
  CreateExpenseInput,
  ExpenseDeductibilityStatus,
  ExpensePeriodItem,
  ExpensePeriodOverview,
} from "@/domain/interfaces/expense.interface";
import { RecurringPaymentsService } from "@/application/services/RecurringPaymentsService";
import type { RecurringPaymentFrequency } from "@/domain/interfaces/recurring-payment.interface";
import { ExpensesRepository } from "@/infrastructure/repositories/ExpensesRepository";
import { RecurringPaymentsRepository } from "@/infrastructure/repositories/RecurringPaymentsRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { FormFieldInfo } from "@/shared/components/FormFieldInfo";

const expensesService = new ExpensesService(new ExpensesRepository());
const recurringPaymentsService = new RecurringPaymentsService(
  new RecurringPaymentsRepository(),
);

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

function getSourceLabel(source: string) {
  if (source === "DOCUMENT_TAX") {
    return "Fiscal derivado";
  }

  if (source === "DOCUMENT") {
    return "Documento interpretado";
  }

  return "Manual";
}

function getPaymentLabel(isPaid: boolean | null) {
  if (isPaid === null) {
    return "No aplica";
  }

  return isPaid ? "Pagado" : "Pendiente";
}

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

const deductibilityOptions: Array<{
  value: ExpenseDeductibilityStatus;
  label: string;
}> = [
  { value: "DEDUCTIBLE", label: "Deducible" },
  { value: "REVIEWABLE", label: "Revisable" },
  { value: "NON_DEDUCTIBLE", label: "No deducible" },
  { value: "UNKNOWN", label: "Pendiente de clasificar" },
];

const recurringFrequencyOptions: Array<{
  value: RecurringPaymentFrequency;
  label: string;
}> = [
  { value: "MONTHLY", label: "Mensual" },
  { value: "QUARTERLY", label: "Trimestral" },
  { value: "BIANNUAL", label: "Semestral" },
  { value: "YEARLY", label: "Anual" },
];

interface ExpenseFormState {
  expenseDate: string;
  concept: string;
  vendorName: string;
  amount: string;
  vatAmount: string;
  deductibilityStatus: ExpenseDeductibilityStatus;
  businessUsePercent: string;
  notes: string;
  isPaid: boolean;
  createRecurring: boolean;
  recurringFrequency: RecurringPaymentFrequency;
  recurringNextDueDate: string;
  recurringNotes: string;
}

function getCurrentDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialExpenseFormState(): ExpenseFormState {
  const today = getCurrentDateInputValue();

  return {
    expenseDate: today,
    concept: "",
    vendorName: "",
    amount: "",
    vatAmount: "",
    deductibilityStatus: "REVIEWABLE",
    businessUsePercent: "100",
    notes: "",
    isPaid: false,
    createRecurring: false,
    recurringFrequency: "MONTHLY",
    recurringNextDueDate: today,
    recurringNotes: "",
  };
}

export function ExpensesPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");
  const [formState, setFormState] = useState<ExpenseFormState>(() =>
    createInitialExpenseFormState(),
  );
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [overview, setOverview] = useState<ExpensePeriodOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);
  const [updatingPaymentExpenseId, setUpdatingPaymentExpenseId] = useState<
    number | null
  >(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async (active = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextOverview = await expensesService.getPeriodOverview({
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
          : "No se pudieron cargar los gastos",
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

  const handleTogglePaid = async (item: ExpensePeriodItem) => {
    if (item.isPaid === null) {
      return;
    }

    const nextIsPaid = !item.isPaid;
    const confirmation = await Swal.fire({
      title: nextIsPaid
        ? "Marcar gasto como pagado"
        : "Marcar gasto como pendiente",
      text: `Vas a marcar "${item.concept}" como ${nextIsPaid ? "pagado" : "no pagado"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: nextIsPaid
        ? "Sí, marcar como pagado"
        : "Sí, marcar como pendiente",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setUpdatingPaymentExpenseId(item.sourceId);
    setError(null);

    try {
      await expensesService.updateExpense(item.sourceId, {
        isPaid: nextIsPaid,
      });
      await loadOverview(true);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el estado de pago",
      );
    } finally {
      setUpdatingPaymentExpenseId(null);
    }
  };

  const handleSubmitExpense = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const parsedAmount = Number(formState.amount);
    const parsedVatAmount = formState.vatAmount
      ? Number(formState.vatAmount)
      : null;
    const parsedBusinessUsePercent = formState.businessUsePercent
      ? Number(formState.businessUsePercent)
      : null;

    if (!formState.concept.trim()) {
      setError("Indica al menos un concepto para registrar el gasto.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("El importe debe ser un número mayor que cero.");
      return;
    }

    if (
      parsedVatAmount !== null &&
      (!Number.isFinite(parsedVatAmount) || parsedVatAmount < 0)
    ) {
      setError("El IVA debe estar vacío o ser un número positivo.");
      return;
    }

    if (
      parsedBusinessUsePercent !== null &&
      (!Number.isFinite(parsedBusinessUsePercent) ||
        parsedBusinessUsePercent < 0 ||
        parsedBusinessUsePercent > 100)
    ) {
      setError("El porcentaje de uso profesional debe estar entre 0 y 100.");
      return;
    }

    const payload: CreateExpenseInput = {
      expenseDate: formState.expenseDate,
      concept: formState.concept.trim(),
      vendorName: formState.vendorName.trim() || undefined,
      amount: parsedAmount,
      vatAmount: parsedVatAmount,
      isPaid: formState.isPaid,
      sourceType: "MANUAL",
      deductibilityStatus: formState.deductibilityStatus,
      businessUsePercent: parsedBusinessUsePercent,
      notes: formState.notes.trim() || undefined,
    };

    setIsSubmittingExpense(true);

    try {
      if (editingExpenseId) {
        await expensesService.updateExpense(editingExpenseId, {
          expenseDate: payload.expenseDate,
          concept: payload.concept,
          vendorName: payload.vendorName ?? null,
          amount: payload.amount,
          vatAmount: payload.vatAmount ?? null,
          isPaid: payload.isPaid,
          sourceType: "MANUAL",
          deductibilityStatus: payload.deductibilityStatus,
          businessUsePercent: payload.businessUsePercent ?? null,
          notes: payload.notes ?? null,
        });
        await loadOverview(true);
        setFormState(createInitialExpenseFormState());
        setEditingExpenseId(null);
        setSuccessMessage("Gasto manual actualizado correctamente.");
        return;
      }

      await expensesService.createExpense(payload);

      let nextSuccessMessage = "Gasto manual registrado correctamente.";

      if (formState.createRecurring) {
        try {
          await recurringPaymentsService.createRecurringPayment({
            title: formState.concept.trim(),
            amount: parsedAmount,
            frequency: formState.recurringFrequency,
            nextDueDate:
              formState.recurringNextDueDate || formState.expenseDate,
            isActive: true,
            deductibilityStatus: formState.deductibilityStatus,
            notes:
              formState.recurringNotes.trim() ||
              formState.notes.trim() ||
              undefined,
          });
          nextSuccessMessage =
            "Gasto manual y pago periódico registrados correctamente.";
        } catch (caughtRecurringError) {
          setError(
            caughtRecurringError instanceof Error
              ? `El gasto se guardó, pero el pago periódico no pudo crearse: ${caughtRecurringError.message}`
              : "El gasto se guardó, pero el pago periódico no pudo crearse.",
          );
        }
      }

      await loadOverview(true);
      setFormState(createInitialExpenseFormState());
      setSuccessMessage(nextSuccessMessage);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo registrar el gasto manual",
      );
    } finally {
      setIsSubmittingExpense(false);
    }
  };

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

  const handleEditExpense = (item: ExpensePeriodItem) => {
    setEditingExpenseId(item.sourceId);
    setSuccessMessage(null);
    setError(null);
    setFormState({
      expenseDate: item.expenseDate ?? getCurrentDateInputValue(),
      concept: item.concept,
      vendorName: item.vendorName ?? "",
      amount: String(item.amount),
      vatAmount: item.vatAmount === null ? "" : String(item.vatAmount),
      deductibilityStatus:
        item.deductibilityStatus as ExpenseDeductibilityStatus,
      businessUsePercent: "100",
      notes: item.notes ?? "",
      isPaid: Boolean(item.isPaid),
      createRecurring: false,
      recurringFrequency: "MONTHLY",
      recurringNextDueDate: item.expenseDate ?? getCurrentDateInputValue(),
      recurringNotes: "",
    });
  };

  const handleCancelExpenseEdit = () => {
    setEditingExpenseId(null);
    setFormState(createInitialExpenseFormState());
    setError(null);
  };

  const handleDeleteExpense = async (item: ExpensePeriodItem) => {
    const confirmation = await Swal.fire({
      title: "Eliminar gasto manual",
      text: `Se eliminará ${item.concept}. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    setDeletingExpenseId(item.sourceId);
    setError(null);
    setSuccessMessage(null);

    try {
      await expensesService.removeExpense(item.sourceId);
      if (editingExpenseId === item.sourceId) {
        handleCancelExpenseEdit();
      }
      await loadOverview(true);
      setSuccessMessage("Gasto manual eliminado correctamente.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el gasto manual",
      );
    } finally {
      setDeletingExpenseId(null);
    }
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Gastos"
        description="Consulta gastos manuales, gastos derivados de documentos interpretados y obligaciones fiscales del período seleccionado."
        meta={overview?.period.label ?? "Gastos"}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Filtros del período</h2>
              <p className="text-secondary mb-0">
                Aquí verás tanto el gasto manual como el IVA e IRPF derivados de
                tus facturas emitidas, además de tickets y justificantes ya
                interpretados.
              </p>
            </div>

            <div className="row g-2 w-100 w-lg-auto">
              <div className="col-12 col-sm-auto">
                <label className="form-label mb-1" htmlFor="expenses-year">
                  Año
                  <FormFieldInfo text="Ejercicio fiscal sobre el que quieres consultar gastos." />
                </label>
                <select
                  id="expenses-year"
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
                <label className="form-label mb-1" htmlFor="expenses-month">
                  Mes
                  <FormFieldInfo text="Mes concreto del ejercicio para acotar el listado y los totales." />
                </label>
                <select
                  id="expenses-month"
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

          {isLoading ? <LoadingPanel message="Cargando gastos..." /> : null}

          <div className="row g-3">
            <div className="col-md-6">
              <div className="metric-box metric-box--warning">
                <span>Gasto total</span>
                <strong>{formatCurrency(overview?.totals.totalAmount)}</strong>
              </div>
            </div>
            <div className="col-md-6">
              <div className="metric-box metric-box--warning">
                <span>IVA acumulado</span>
                <strong>
                  {formatCurrency(overview?.totals.totalVatAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-6">
              <div className="metric-box metric-box--warning">
                <span>IRPF acumulado</span>
                <strong>
                  {formatCurrency(overview?.totals.totalIrpfAmount)}
                </strong>
              </div>
            </div>
            <div className="col-md-6">
              <div className="metric-box metric-box--warning">
                <span>Registros del período</span>
                <strong>{overview?.totals.recordCount ?? 0}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Alta manual de gasto</h2>
              <p className="text-secondary mb-0">
                Registra alquileres cargados en banco, compras online,
                suscripciones o gastos sin ticket. Los gastos manuales nacen
                como pendientes de pago salvo que los marques expresamente como
                pagados.
              </p>
            </div>
            <span className="badge text-bg-light border">Alta rápida</span>
          </div>

          {editingExpenseId ? (
            <div className="alert alert-info mb-4">
              Estás editando un gasto manual existente. Al guardar se
              actualizará el registro seleccionado.
            </div>
          ) : null}

          {successMessage ? (
            <div className="alert alert-success mb-4">{successMessage}</div>
          ) : null}

          <form onSubmit={(event) => void handleSubmitExpense(event)}>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label" htmlFor="expense-date">
                  Fecha
                  <FormFieldInfo text="Fecha efectiva del gasto manual que estás registrando." />
                </label>
                <input
                  id="expense-date"
                  className="form-control"
                  type="date"
                  value={formState.expenseDate}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      expenseDate: nextValue,
                    }));
                  }}
                  required
                />
              </div>

              <div className="col-md-5">
                <label className="form-label" htmlFor="expense-concept">
                  Concepto
                  <FormFieldInfo text="Descripción breve y reconocible del gasto para listados, filtros y revisión posterior." />
                </label>
                <input
                  id="expense-concept"
                  className="form-control"
                  type="text"
                  placeholder="Ej. suscripcion Netflix"
                  value={formState.concept}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      concept: nextValue,
                    }));
                  }}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="expense-vendor-name">
                  Proveedor o contraparte
                  <FormFieldInfo text="Empresa o persona relacionada con el gasto. Puede dejarse vacío si no aplica." />
                </label>
                <input
                  id="expense-vendor-name"
                  className="form-control"
                  type="text"
                  placeholder="Opcional"
                  value={formState.vendorName}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      vendorName: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="expense-amount">
                  Importe total
                  <FormFieldInfo text="Importe total del gasto. Debe ser un número mayor que cero." />
                </label>
                <input
                  id="expense-amount"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formState.amount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      amount: nextValue,
                    }));
                  }}
                  required
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="expense-vat-amount">
                  IVA soportado
                  <FormFieldInfo text="Importe de IVA asociado al gasto, si existe y quieres registrarlo separadamente." />
                </label>
                <input
                  id="expense-vat-amount"
                  className="form-control"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="Opcional"
                  value={formState.vatAmount}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      vatAmount: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="expense-deductibility">
                  Estado fiscal
                  <FormFieldInfo text="Clasificación fiscal del gasto: deducible, no deducible, revisable o pendiente." />
                </label>
                <select
                  id="expense-deductibility"
                  className="form-select"
                  value={formState.deductibilityStatus}
                  onChange={(event) =>
                    setFormState((currentState) => ({
                      ...currentState,
                      deductibilityStatus: event.currentTarget
                        .value as ExpenseDeductibilityStatus,
                    }))
                  }
                >
                  {deductibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="expense-business-use">
                  Uso profesional (%)
                  <FormFieldInfo text="Porcentaje del gasto que corresponde realmente a tu actividad profesional." />
                </label>
                <input
                  id="expense-business-use"
                  className="form-control"
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formState.businessUsePercent}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      businessUsePercent: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="expense-notes">
                  Notas
                  <FormFieldInfo text="Información adicional para justificar o revisar el gasto más adelante." />
                </label>
                <textarea
                  id="expense-notes"
                  className="form-control"
                  rows={3}
                  placeholder="Describe el gasto o deja contexto para revisarlo después"
                  value={formState.notes}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((currentState) => ({
                      ...currentState,
                      notes: nextValue,
                    }));
                  }}
                />
              </div>

              <div className="col-12">
                <div className="d-flex flex-column flex-lg-row gap-3">
                  <div className="form-check">
                    <input
                      id="expense-is-paid"
                      className="form-check-input"
                      type="checkbox"
                      checked={formState.isPaid}
                      onChange={(event) => {
                        const nextChecked = event.currentTarget.checked;

                        setFormState((currentState) => ({
                          ...currentState,
                          isPaid: nextChecked,
                        }));
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="expense-is-paid"
                    >
                      Ya está pagado
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      id="expense-create-recurring"
                      className="form-check-input"
                      type="checkbox"
                      checked={formState.createRecurring}
                      onChange={(event) => {
                        const nextChecked = event.currentTarget.checked;

                        setFormState((currentState) => ({
                          ...currentState,
                          createRecurring: nextChecked,
                          recurringNextDueDate:
                            currentState.recurringNextDueDate ||
                            currentState.expenseDate,
                        }));
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="expense-create-recurring"
                    >
                      Este gasto se repite periódicamente
                    </label>
                  </div>
                </div>
              </div>

              {formState.createRecurring ? (
                <>
                  <div className="col-md-4">
                    <label className="form-label" htmlFor="recurring-frequency">
                      Frecuencia
                      <FormFieldInfo text="Periodicidad con la que se repetirá este gasto si lo conviertes en pago periódico." />
                    </label>
                    <select
                      id="recurring-frequency"
                      className="form-select"
                      value={formState.recurringFrequency}
                      onChange={(event) =>
                        setFormState((currentState) => ({
                          ...currentState,
                          recurringFrequency: event.currentTarget
                            .value as RecurringPaymentFrequency,
                        }))
                      }
                    >
                      {recurringFrequencyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label
                      className="form-label"
                      htmlFor="recurring-next-due-date"
                    >
                      Próximo cargo previsto
                      <FormFieldInfo text="Fecha estimada del siguiente cargo automático del gasto recurrente." />
                    </label>
                    <input
                      id="recurring-next-due-date"
                      className="form-control"
                      type="date"
                      value={formState.recurringNextDueDate}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value;

                        setFormState((currentState) => ({
                          ...currentState,
                          recurringNextDueDate: nextValue,
                        }));
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label" htmlFor="recurring-notes">
                      Nota del pago periódico
                      <FormFieldInfo text="Comentario opcional específico para el registro recurrente de este gasto." />
                    </label>
                    <input
                      id="recurring-notes"
                      className="form-control"
                      type="text"
                      placeholder="Opcional"
                      value={formState.recurringNotes}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value;

                        setFormState((currentState) => ({
                          ...currentState,
                          recurringNotes: nextValue,
                        }));
                      }}
                    />
                  </div>
                </>
              ) : null}

              <div className="col-12 d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 pt-2">
                <p className="small text-secondary mb-0">
                  Ejemplos válidos: alquiler del despacho, cuota de software,
                  compra online sin ticket o un recibo bancario asociado a tu
                  actividad.
                </p>
                <button
                  type="submit"
                  className="btn btn-dark"
                  disabled={isSubmittingExpense}
                >
                  {isSubmittingExpense
                    ? "Guardando gasto..."
                    : editingExpenseId
                      ? "Guardar cambios"
                      : "Guardar gasto manual"}
                </button>

                {editingExpenseId ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCancelExpenseEdit}
                  >
                    Cancelar edición
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
                Los conceptos fiscales derivados permiten controlar IVA e IRPF,
                y los tickets interpretados aparecen diferenciados del alta
                manual.
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
              No hay gastos para el período seleccionado.
            </p>
          ) : null}

          {overview?.items.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>Origen</th>
                    <th>Pago</th>
                    <th>Estado fiscal</th>
                    <th className="text-end">Importe</th>
                    <th className="text-end">IVA</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.items.map((item) => (
                    <tr key={item.id}>
                      <td>{formatDate(item.expenseDate)}</td>
                      <td>
                        <strong className="d-block">{item.concept}</strong>
                        <small className="text-secondary">
                          {item.vendorName ?? "Sin contraparte identificada"}
                        </small>
                      </td>
                      <td>{getSourceLabel(item.source)}</td>
                      <td>
                        {item.isPaid === null ? (
                          <span className="small text-secondary">
                            {getPaymentLabel(item.isPaid)}
                          </span>
                        ) : (
                          <div className="form-check form-switch m-0 d-inline-flex align-items-center gap-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={Boolean(item.isPaid)}
                              onChange={() => void handleTogglePaid(item)}
                              disabled={
                                updatingPaymentExpenseId === item.sourceId
                              }
                              aria-label={`Marcar ${item.concept} como ${item.isPaid ? "no pagado" : "pagado"}`}
                            />
                            <span className="small text-secondary">
                              {updatingPaymentExpenseId === item.sourceId
                                ? "Guardando"
                                : getPaymentLabel(item.isPaid)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>{item.deductibilityStatus}</td>
                      <td className="text-end">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(item.vatAmount ?? 0)}
                      </td>
                      <td className="text-end">
                        {item.source === "MANUAL" ? (
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-dark btn-sm"
                              onClick={() => handleEditExpense(item)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => void handleDeleteExpense(item)}
                              disabled={deletingExpenseId === item.sourceId}
                            >
                              {deletingExpenseId === item.sourceId
                                ? "Eliminando"
                                : "Borrar"}
                            </button>
                          </div>
                        ) : (
                          <span className="small text-secondary">
                            Solo lectura
                          </span>
                        )}
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
