import { useEffect, useMemo, useState } from "react";
import { RecurringPaymentsService } from "@/application/services/RecurringPaymentsService";
import type { ExpenseDeductibilityStatus } from "@/domain/interfaces/expense.interface";
import type {
  RecurringPaymentFrequency,
  RecurringPaymentRecord,
} from "@/domain/interfaces/recurring-payment.interface";
import { RecurringPaymentsRepository } from "@/infrastructure/repositories/RecurringPaymentsRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const recurringPaymentsService = new RecurringPaymentsService(
  new RecurringPaymentsRepository(),
);

const frequencyOptions: RecurringPaymentFrequency[] = [
  "MONTHLY",
  "QUARTERLY",
  "BIANNUAL",
  "YEARLY",
];
const deductibilityOptions: ExpenseDeductibilityStatus[] = [
  "DEDUCTIBLE",
  "REVIEWABLE",
  "NON_DEDUCTIBLE",
  "UNKNOWN",
];

interface RecurringPaymentFormState {
  title: string;
  amount: string;
  frequency: RecurringPaymentFrequency;
  nextDueDate: string;
  isActive: boolean;
  deductibilityStatus: ExpenseDeductibilityStatus;
  notes: string;
}

function getCurrentDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialFormState(): RecurringPaymentFormState {
  return {
    title: "",
    amount: "",
    frequency: "MONTHLY",
    nextDueDate: getCurrentDateInputValue(),
    isActive: true,
    deductibilityStatus: "REVIEWABLE",
    notes: "",
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function isDueSoon(nextDueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);

  const days = (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  return days <= 30;
}

export function RecurringPaymentsPage() {
  const [payments, setPayments] = useState<RecurringPaymentRecord[]>([]);
  const [formState, setFormState] = useState<RecurringPaymentFormState>(() =>
    createInitialFormState(),
  );
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadPayments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextPayments =
        await recurringPaymentsService.listRecurringPayments();
      setPayments(nextPayments);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron cargar los pagos periódicos",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPayments();
  }, []);

  const dueSoonCount = useMemo(
    () =>
      payments.filter(
        (payment) => payment.isActive && isDueSoon(payment.nextDueDate),
      ).length,
    [payments],
  );

  const resetForm = () => {
    setFormState(createInitialFormState());
    setEditingPaymentId(null);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      title: formState.title,
      amount: Number(formState.amount),
      frequency: formState.frequency,
      nextDueDate: formState.nextDueDate,
      isActive: formState.isActive,
      deductibilityStatus: formState.deductibilityStatus,
      notes: formState.notes || undefined,
    };

    try {
      if (editingPaymentId) {
        await recurringPaymentsService.updateRecurringPayment(
          editingPaymentId,
          payload,
        );
      } else {
        await recurringPaymentsService.createRecurringPayment(payload);
      }

      resetForm();
      await loadPayments();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el pago periódico",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (payment: RecurringPaymentRecord) => {
    setEditingPaymentId(payment.id);
    setFormState({
      title: payment.title,
      amount: String(payment.amount),
      frequency: payment.frequency,
      nextDueDate: payment.nextDueDate,
      isActive: payment.isActive,
      deductibilityStatus: payment.deductibilityStatus,
      notes: payment.notes ?? "",
    });
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Pagos periódicos"
        description="Gestiona obligaciones recurrentes para conectar control, previsión y simulación futura en una sola vista operativa."
        meta={`${dueSoonCount} próximos`}
      />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h4 mb-0">
                  {editingPaymentId ? "Editar pago" : "Nuevo pago"}
                </h2>
                {editingPaymentId ? (
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={resetForm}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>

              <form className="d-grid gap-3" onSubmit={handleSubmit}>
                <input
                  className="form-control"
                  placeholder="Título del pago"
                  value={formState.title}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setFormState((current) => ({
                      ...current,
                      title: nextValue,
                    }));
                  }}
                  required
                />

                <input
                  className="form-control"
                  type="number"
                  step="0.01"
                  placeholder="Importe"
                  value={formState.amount}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setFormState((current) => ({
                      ...current,
                      amount: nextValue,
                    }));
                  }}
                  required
                />

                <div className="row g-2">
                  <div className="col-6">
                    <select
                      className="form-select"
                      value={formState.frequency}
                      onChange={(event) => {
                        const nextValue = event.currentTarget
                          .value as RecurringPaymentFrequency;

                        setFormState((current) => ({
                          ...current,
                          frequency: nextValue,
                        }));
                      }}
                    >
                      {frequencyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="date"
                      value={formState.nextDueDate}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setFormState((current) => ({
                          ...current,
                          nextDueDate: nextValue,
                        }));
                      }}
                      required
                    />
                  </div>
                </div>

                <select
                  className="form-select"
                  value={formState.deductibilityStatus}
                  onChange={(event) => {
                    const nextValue = event.currentTarget
                      .value as ExpenseDeductibilityStatus;

                    setFormState((current) => ({
                      ...current,
                      deductibilityStatus: nextValue,
                    }));
                  }}
                >
                  {deductibilityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <div className="form-check">
                  <input
                    id="recurring-active"
                    className="form-check-input"
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(event) => {
                      const nextChecked = event.currentTarget.checked;

                      setFormState((current) => ({
                        ...current,
                        isActive: nextChecked,
                      }));
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="recurring-active"
                  >
                    Pago activo
                  </label>
                </div>

                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Notas"
                  value={formState.notes}
                  onChange={(event) => {
                    const nextValue = event.target.value;

                    setFormState((current) => ({
                      ...current,
                      notes: nextValue,
                    }));
                  }}
                />

                {formError ? (
                  <div className="alert alert-danger mb-0">{formError}</div>
                ) : null}

                <button
                  className="btn btn-dark"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? "Guardando..."
                    : editingPaymentId
                      ? "Actualizar pago"
                      : "Crear pago"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h4 mb-0">Planificación recurrente</h2>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => void loadPayments()}
                >
                  Recargar
                </button>
              </div>

              {error ? <div className="alert alert-danger">{error}</div> : null}
              {isLoading ? (
                <LoadingPanel message="Cargando pagos periódicos..." />
              ) : null}

              {!isLoading && !payments.length ? (
                <p className="mb-0 text-secondary">
                  Todavía no hay pagos periódicos registrados.
                </p>
              ) : null}

              <div className="list-stack">
                {payments.map((payment) => (
                  <article
                    key={payment.id}
                    className="entity-card entity-card--stacked"
                  >
                    <div className="d-flex justify-content-between gap-3 flex-wrap">
                      <div>
                        <h3>{payment.title}</h3>
                        <p className="mb-1 text-secondary">
                          {payment.frequency} ·{" "}
                          {payment.isActive ? "Activo" : "Inactivo"}
                        </p>
                        <small>
                          Próximo vencimiento {formatDate(payment.nextDueDate)}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => startEditing(payment)}
                      >
                        Editar
                      </button>
                    </div>

                    <div className="row g-2 mt-1">
                      <div className="col-md-6">
                        <small className="d-block">Importe</small>
                        <strong>{formatCurrency(payment.amount)}</strong>
                      </div>
                      <div className="col-md-6">
                        <small className="d-block">Deducibilidad</small>
                        <strong>{payment.deductibilityStatus}</strong>
                      </div>
                    </div>

                    <small className="d-block mt-2 text-secondary">
                      {payment.notes ?? "Sin notas adicionales"}
                    </small>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
