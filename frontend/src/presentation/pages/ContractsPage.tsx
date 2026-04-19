import { useEffect, useState } from "react";
import { ContractsService } from "@/application/services/ContractsService";
import { PayersService } from "@/application/services/PayersService";
import type {
  ContractRecord,
  ContractStatus,
  ContractType,
  ContractWorkdayType,
} from "@/domain/interfaces/contract.interface";
import type { Payer } from "@/domain/interfaces/payer.interface";
import { ContractsRepository } from "@/infrastructure/repositories/ContractsRepository";
import { PayersRepository } from "@/infrastructure/repositories/PayersRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const contractsService = new ContractsService(new ContractsRepository());
const payersService = new PayersService(new PayersRepository());

const contractTypeOptions: ContractType[] = [
  "EMPLOYMENT",
  "FREELANCE",
  "RENTAL",
  "INSURANCE",
  "OTHER",
];
const contractStatusOptions: ContractStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "EXPIRED",
  "DRAFT",
];
const workdayTypeOptions: Array<ContractWorkdayType | ""> = [
  "",
  "FULL_TIME",
  "PART_TIME",
  "OTHER",
];

interface ContractFormState {
  payerId: string;
  contractType: ContractType;
  title: string;
  startDate: string;
  endDate: string;
  grossSalaryMonthly: string;
  netSalaryMonthly: string;
  exclusivityFlag: boolean;
  nonCompeteFlag: boolean;
  workdayType: ContractWorkdayType | "";
  status: ContractStatus;
  notes: string;
}

function createInitialFormState(): ContractFormState {
  return {
    payerId: "",
    contractType: "EMPLOYMENT",
    title: "",
    startDate: "",
    endDate: "",
    grossSalaryMonthly: "",
    netSalaryMonthly: "",
    exclusivityFlag: false,
    nonCompeteFlag: false,
    workdayType: "",
    status: "ACTIVE",
    notes: "",
  };
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "No informado";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value);
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

export function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [payers, setPayers] = useState<Payer[]>([]);
  const [formState, setFormState] = useState<ContractFormState>(() =>
    createInitialFormState(),
  );
  const [editingContractId, setEditingContractId] = useState<number | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextContracts, nextPayers] = await Promise.all([
        contractsService.listContracts(),
        payersService.list(),
      ]);

      setContracts(nextContracts);
      setPayers(nextPayers);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron cargar los contratos",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const resetForm = () => {
    setFormState(createInitialFormState());
    setEditingContractId(null);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const payload = {
      payerId: formState.payerId ? Number(formState.payerId) : null,
      contractType: formState.contractType,
      title: formState.title,
      startDate: formState.startDate || undefined,
      endDate: formState.endDate || undefined,
      grossSalaryMonthly: formState.grossSalaryMonthly
        ? Number(formState.grossSalaryMonthly)
        : null,
      netSalaryMonthly: formState.netSalaryMonthly
        ? Number(formState.netSalaryMonthly)
        : null,
      exclusivityFlag: formState.exclusivityFlag,
      nonCompeteFlag: formState.nonCompeteFlag,
      workdayType: formState.workdayType || null,
      status: formState.status,
      notes: formState.notes || undefined,
    };

    try {
      if (editingContractId) {
        await contractsService.updateContract(editingContractId, payload);
      } else {
        await contractsService.createContract(payload);
      }

      resetForm();
      await loadData();
    } catch (caughtError) {
      setFormError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo guardar el contrato",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (contract: ContractRecord) => {
    setEditingContractId(contract.id);
    setFormState({
      payerId: contract.payerId ? String(contract.payerId) : "",
      contractType: contract.contractType,
      title: contract.title,
      startDate: contract.startDate ?? "",
      endDate: contract.endDate ?? "",
      grossSalaryMonthly:
        contract.grossSalaryMonthly === null
          ? ""
          : String(contract.grossSalaryMonthly),
      netSalaryMonthly:
        contract.netSalaryMonthly === null
          ? ""
          : String(contract.netSalaryMonthly),
      exclusivityFlag: contract.exclusivityFlag,
      nonCompeteFlag: contract.nonCompeteFlag,
      workdayType: contract.workdayType ?? "",
      status: contract.status,
      notes: contract.notes ?? "",
    });
  };

  return (
    <div className="page-stack">
      <PageHero
        title="Contratos"
        description="Activa y mantén visibles los contratos vinculados a tu operativa para conectar pagadores, condiciones y seguimiento documental."
        meta="Contratos"
      />

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h4 mb-0">
                  {editingContractId ? "Editar contrato" : "Nuevo contrato"}
                </h2>
                {editingContractId ? (
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
                <select
                  className="form-select"
                  value={formState.payerId}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value;

                    setFormState((current) => ({
                      ...current,
                      payerId: nextValue,
                    }));
                  }}
                >
                  <option value="">Sin pagador vinculado</option>
                  {payers.map((payer) => (
                    <option key={payer.id} value={payer.id}>
                      {payer.payerName}
                    </option>
                  ))}
                </select>

                <select
                  className="form-select"
                  value={formState.contractType}
                  onChange={(event) => {
                    const nextValue = event.currentTarget.value as ContractType;

                    setFormState((current) => ({
                      ...current,
                      contractType: nextValue,
                    }));
                  }}
                >
                  {contractTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                <input
                  className="form-control"
                  placeholder="Título del contrato"
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

                <div className="row g-2">
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="date"
                      value={formState.startDate}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setFormState((current) => ({
                          ...current,
                          startDate: nextValue,
                        }));
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="date"
                      value={formState.endDate}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setFormState((current) => ({
                          ...current,
                          endDate: nextValue,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      placeholder="Bruto mensual"
                      value={formState.grossSalaryMonthly}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setFormState((current) => ({
                          ...current,
                          grossSalaryMonthly: nextValue,
                        }));
                      }}
                    />
                  </div>
                  <div className="col-6">
                    <input
                      className="form-control"
                      type="number"
                      step="0.01"
                      placeholder="Neto mensual"
                      value={formState.netSalaryMonthly}
                      onChange={(event) => {
                        const nextValue = event.target.value;

                        setFormState((current) => ({
                          ...current,
                          netSalaryMonthly: nextValue,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="row g-2">
                  <div className="col-6">
                    <select
                      className="form-select"
                      value={formState.workdayType}
                      onChange={(event) => {
                        const nextValue = event.currentTarget.value as
                          | ContractWorkdayType
                          | "";

                        setFormState((current) => ({
                          ...current,
                          workdayType: nextValue,
                        }));
                      }}
                    >
                      {workdayTypeOptions.map((option) => (
                        <option key={option || "none"} value={option}>
                          {option || "Jornada no indicada"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <select
                      className="form-select"
                      value={formState.status}
                      onChange={(event) => {
                        const nextValue = event.currentTarget
                          .value as ContractStatus;

                        setFormState((current) => ({
                          ...current,
                          status: nextValue,
                        }));
                      }}
                    >
                      {contractStatusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-check">
                  <input
                    id="contract-exclusivity"
                    className="form-check-input"
                    type="checkbox"
                    checked={formState.exclusivityFlag}
                    onChange={(event) => {
                      const nextChecked = event.currentTarget.checked;

                      setFormState((current) => ({
                        ...current,
                        exclusivityFlag: nextChecked,
                      }));
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="contract-exclusivity"
                  >
                    Cláusula de exclusividad
                  </label>
                </div>

                <div className="form-check">
                  <input
                    id="contract-non-compete"
                    className="form-check-input"
                    type="checkbox"
                    checked={formState.nonCompeteFlag}
                    onChange={(event) => {
                      const nextChecked = event.currentTarget.checked;

                      setFormState((current) => ({
                        ...current,
                        nonCompeteFlag: nextChecked,
                      }));
                    }}
                  />
                  <label
                    className="form-check-label"
                    htmlFor="contract-non-compete"
                  >
                    Cláusula de no competencia
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
                    : editingContractId
                      ? "Actualizar contrato"
                      : "Crear contrato"}
                </button>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-8">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <h2 className="h4 mb-0">Contratos activos y trazables</h2>
                <button
                  type="button"
                  className="btn btn-outline-dark btn-sm"
                  onClick={() => void loadData()}
                >
                  Recargar
                </button>
              </div>

              {isLoading ? (
                <LoadingPanel message="Cargando contratos..." />
              ) : null}
              {error ? <div className="alert alert-danger">{error}</div> : null}

              {!isLoading && !contracts.length ? (
                <p className="mb-0 text-secondary">
                  Todavía no hay contratos registrados.
                </p>
              ) : null}

              <div className="list-stack">
                {contracts.map((contract) => (
                  <article
                    key={contract.id}
                    className="entity-card entity-card--stacked"
                  >
                    <div className="d-flex justify-content-between gap-3 flex-wrap">
                      <div>
                        <h3>{contract.title}</h3>
                        <p className="mb-1 text-secondary">
                          {contract.contractType} · {contract.status}
                        </p>
                        <small>
                          Inicio {formatDate(contract.startDate)} · Fin{" "}
                          {formatDate(contract.endDate)}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-sm"
                        onClick={() => startEditing(contract)}
                      >
                        Editar
                      </button>
                    </div>

                    <div className="row g-2 mt-1">
                      <div className="col-md-6">
                        <small className="d-block">Bruto mensual</small>
                        <strong>
                          {formatCurrency(contract.grossSalaryMonthly)}
                        </strong>
                      </div>
                      <div className="col-md-6">
                        <small className="d-block">Neto mensual</small>
                        <strong>
                          {formatCurrency(contract.netSalaryMonthly)}
                        </strong>
                      </div>
                    </div>

                    <small className="d-block mt-2 text-secondary">
                      {contract.notes ?? "Sin notas adicionales"}
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
