import { useEffect, useMemo, useState } from "react";
import { SimulationsService } from "@/application/services/SimulationsService";
import type {
  AnnualTaxReturnEstimate,
  AnnualTaxReturnEstimateFilters,
} from "@/domain/interfaces/simulation.interface";
import { SimulationsRepository } from "@/infrastructure/repositories/SimulationsRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";
import { FormFieldInfo } from "@/shared/components/FormFieldInfo";

const simulationsService = new SimulationsService(new SimulationsRepository());

const scenarioPresets = [
  {
    id: "prudente",
    label: "Escenario prudente",
    description: "Reserva más caja y no computa gasto revisable.",
    patch: {
      applyReviewableExpenses: false,
      annualPensionContributionAmount: 0,
      annualDonationAmount: 0,
      annualHousingDeductionAmount: 0,
    },
  },
  {
    id: "optimizacion",
    label: "Optimización fiscal",
    description: "Aplica gasto revisable y añade deducciones habituales.",
    patch: {
      applyReviewableExpenses: true,
      annualPensionContributionAmount: 1500,
      annualDonationAmount: 150,
      annualHousingDeductionAmount: 0,
    },
  },
  {
    id: "familiar",
    label: "Escenario familiar",
    description: "Simula un hogar con dos hijos y declaración conjunta.",
    patch: {
      declarationMode: "JOINT" as const,
      dependentChildrenCount: 2,
      annualPensionContributionAmount: 1000,
      annualDonationAmount: 0,
      annualHousingDeductionAmount: 0,
    },
  },
];

function formatCurrency(value: number | undefined) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(value ?? 0);
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(0)} %`;
}

function getResultLabel(resultType: string) {
  if (resultType === "TO_PAY") {
    return "A ingresar";
  }

  if (resultType === "TO_REFUND") {
    return "A devolver";
  }

  return "Equilibrada";
}

function getResultBadgeClass(resultType: string) {
  if (resultType === "TO_PAY") {
    return "badge text-bg-warning";
  }

  if (resultType === "TO_REFUND") {
    return "badge text-bg-success";
  }

  return "badge text-bg-secondary";
}

function createInitialFilters(
  currentYear: number,
): AnnualTaxReturnEstimateFilters {
  return {
    year: currentYear,
    declarationMode: "INDIVIDUAL",
    dependentChildrenCount: 0,
    annualPensionContributionAmount: 0,
    annualDonationAmount: 0,
    annualHousingDeductionAmount: 0,
    applyReviewableExpenses: false,
  };
}

export function SimulationsPage() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState<AnnualTaxReturnEstimateFilters>(() =>
    createInitialFilters(currentYear),
  );
  const [estimate, setEstimate] = useState<AnnualTaxReturnEstimate | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadEstimate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextEstimate =
          await simulationsService.getAnnualTaxReturnEstimate({
            year: filters.year,
            declarationMode: filters.declarationMode,
            dependentChildrenCount: filters.dependentChildrenCount,
            annualPensionContributionAmount:
              filters.annualPensionContributionAmount,
            annualDonationAmount: filters.annualDonationAmount,
            annualHousingDeductionAmount: filters.annualHousingDeductionAmount,
            applyReviewableExpenses: filters.applyReviewableExpenses,
          });

        if (active) {
          setEstimate(nextEstimate);
        }
      } catch (caughtError) {
        if (!active) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo calcular la simulacion anual",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadEstimate();

    return () => {
      active = false;
    };
  }, [filters]);

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

  const scenarioInsight = useMemo(() => {
    if (!estimate) {
      return null;
    }

    if (estimate.calculation.resultType === "TO_PAY") {
      return "La simulación sugiere reservar caja para el cierre. Revisa gastos revisables y retenciones soportadas.";
    }

    if (estimate.calculation.resultType === "TO_REFUND") {
      return "La simulación anticipa devolución. Verifica que las deducciones y mínimos aplicados estén respaldados por documentación.";
    }

    return "La simulación está equilibrada. Mantén controlados ingresos, gastos y obligaciones antes del cierre definitivo.";
  }, [estimate]);

  return (
    <div className="page-stack">
      <PageHero
        title="Simulaciones"
        description="Estimación anual de renta con datos del ejercicio y ajustes manuales para aproximar mínimos familiares, aportaciones y deducciones aplicables."
        meta={estimate ? `Ejercicio ${estimate.fiscalYear}` : "Escenarios"}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-start gap-3">
            <div>
              <h2 className="h4 mb-1">Renta estimada del ejercicio</h2>
              <p className="text-secondary mb-0">
                Calcula un cierre fiscal orientativo para saber si vas a pagar,
                devolver o si necesitas reservar mas efectivo.
              </p>
            </div>
          </div>

          <div className="row g-3 mt-1">
            <div className="col-md-3">
              <label className="form-label mb-1" htmlFor="simulation-year">
                Ejercicio
                <FormFieldInfo text="Ejercicio sobre el que quieres calcular la simulación anual del IRPF." />
              </label>
              <select
                id="simulation-year"
                className="form-select"
                value={filters.year}
                onChange={(event) => {
                  const nextValue = Number(event.currentTarget.value);

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    year: nextValue,
                  }));
                }}
              >
                {yearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label mb-1" htmlFor="simulation-mode">
                Modalidad
                <FormFieldInfo text="Tipo de declaración a simular: individual o conjunta." />
              </label>
              <select
                id="simulation-mode"
                className="form-select"
                value={filters.declarationMode}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value as
                    | "INDIVIDUAL"
                    | "JOINT";

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    declarationMode: nextValue,
                  }));
                }}
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="JOINT">Conjunta</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label mb-1" htmlFor="simulation-children">
                Hijos
                <FormFieldInfo text="Número de hijos a considerar en la simulación fiscal." />
              </label>
              <input
                id="simulation-children"
                className="form-control"
                type="number"
                min="0"
                max="10"
                value={filters.dependentChildrenCount ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.currentTarget.value);

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    dependentChildrenCount: nextValue,
                  }));
                }}
              />
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  id="simulation-reviewable-expenses"
                  className="form-check-input"
                  type="checkbox"
                  checked={Boolean(filters.applyReviewableExpenses)}
                  onChange={(event) => {
                    const nextChecked = event.currentTarget.checked;

                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      applyReviewableExpenses: nextChecked,
                    }));
                  }}
                />
                <label
                  className="form-check-label"
                  htmlFor="simulation-reviewable-expenses"
                >
                  Incluir gastos revisables como si ya fueran deducibles
                </label>
              </div>
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="simulation-pension">
                Aportaciones a pensiones
                <FormFieldInfo text="Importe anual aportado a planes de pensiones que quieres aplicar en la simulación." />
              </label>
              <input
                id="simulation-pension"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualPensionContributionAmount ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.currentTarget.value);

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualPensionContributionAmount: nextValue,
                  }));
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="simulation-donations">
                Donativos del año
                <FormFieldInfo text="Total anual de donativos con posible impacto en deducciones fiscales." />
              </label>
              <input
                id="simulation-donations"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualDonationAmount ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.currentTarget.value);

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualDonationAmount: nextValue,
                  }));
                }}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="simulation-housing">
                Deducción de vivienda a aplicar
                <FormFieldInfo text="Importe de deducción por vivienda habitual que quieres incluir en la estimación." />
              </label>
              <input
                id="simulation-housing"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualHousingDeductionAmount ?? 0}
                onChange={(event) => {
                  const nextValue = Number(event.currentTarget.value);

                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualHousingDeductionAmount: nextValue,
                  }));
                }}
              />
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger mt-4 mb-0">{error}</div>
          ) : null}
          {isLoading ? (
            <LoadingPanel message="Calculando simulacion anual..." />
          ) : null}

          <div className="row g-3 mt-1">
            {scenarioPresets.map((preset) => (
              <div key={preset.id} className="col-12 col-lg-4">
                <article className="entity-card entity-card--stacked h-100">
                  <div>
                    <h3 className="h6 mb-1">{preset.label}</h3>
                    <p className="small text-secondary mb-3">
                      {preset.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() =>
                      setFilters((currentFilters) => ({
                        ...currentFilters,
                        ...preset.patch,
                      }))
                    }
                  >
                    Aplicar escenario
                  </button>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {estimate ? (
        <section className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1">Lectura ejecutiva</h2>
                <p className="text-secondary mb-0">
                  Resultado sintetizado para comparar caja, deducciones y
                  presión fiscal.
                </p>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <div className="metric-box">
                  <span>Presión fiscal estimada</span>
                  <strong>
                    {estimate.income.totalIncome > 0
                      ? formatPercent(
                          estimate.calculation.estimatedQuota /
                            estimate.income.totalIncome,
                        )
                      : "0 %"}
                  </strong>
                </div>
              </div>
              <div className="col-md-4">
                <div className="metric-box">
                  <span>Retenciones ya soportadas</span>
                  <strong>
                    {formatCurrency(estimate.income.irpfWithheld)}
                  </strong>
                </div>
              </div>
              <div className="col-md-4">
                <div className="metric-box">
                  <span>Gasto usado en cálculo</span>
                  <strong>
                    {formatCurrency(estimate.expenses.deductibleAmountUsed)}
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-secondary mb-0 mt-4">{scenarioInsight}</p>
          </div>
        </section>
      ) : null}

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="metric-box">
                <span>Ingresos del ejercicio</span>
                <strong>{formatCurrency(estimate?.income.totalIncome)}</strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-box">
                <span>Base estimada</span>
                <strong>
                  {formatCurrency(estimate?.calculation.estimatedTaxableBase)}
                </strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-box">
                <span>Cuota tras deducciones</span>
                <strong>
                  {formatCurrency(estimate?.calculation.estimatedQuota)}
                </strong>
              </div>
            </div>
            <div className="col-md-3">
              <div className="metric-box">
                <span>Resultado probable</span>
                <strong>
                  {formatCurrency(estimate?.calculation.estimatedResult)}
                </strong>
                {estimate ? (
                  <div className="mt-2">
                    <span
                      className={getResultBadgeClass(
                        estimate.calculation.resultType,
                      )}
                    >
                      {getResultLabel(estimate.calculation.resultType)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="row g-4">
        <div className="col-12 col-xl-7">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Desglose del ejercicio</h2>

              {!isLoading && estimate ? (
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <tbody>
                      <tr>
                        <th>Rendimientos del trabajo</th>
                        <td className="text-end">
                          {formatCurrency(estimate.income.employmentIncome)}
                        </td>
                      </tr>
                      <tr>
                        <th>Actividad economica</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.income.economicActivityIncome,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>IRPF soportado</th>
                        <td className="text-end">
                          {formatCurrency(estimate.income.irpfWithheld)}
                        </td>
                      </tr>
                      <tr>
                        <th>Seguridad Social</th>
                        <td className="text-end">
                          {formatCurrency(estimate.income.socialSecurityAmount)}
                        </td>
                      </tr>
                      <tr>
                        <th>Base previa a mínimos</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.calculation.preMinimumTaxableBase,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Gasto deducible confirmado</th>
                        <td className="text-end">
                          {formatCurrency(estimate.expenses.deductibleAmount)}
                        </td>
                      </tr>
                      <tr>
                        <th>Gasto en revision</th>
                        <td className="text-end">
                          {formatCurrency(estimate.expenses.reviewableAmount)}
                        </td>
                      </tr>
                      <tr>
                        <th>Gasto aplicado a la simulación</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.expenses.deductibleAmountUsed,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Gasto no deducible</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.expenses.nonDeductibleAmount,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Obligaciones IVA/IRPF</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.expenses.taxObligationsAmount,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Mínimo personal y familiar</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.reductions.totalPersonalAndFamilyMinimum,
                          )}
                        </td>
                      </tr>
                      <tr>
                        <th>Cuota bruta</th>
                        <td className="text-end">
                          {formatCurrency(estimate.calculation.grossQuota)}
                        </td>
                      </tr>
                      <tr>
                        <th>Deducciones aplicadas</th>
                        <td className="text-end">
                          {formatCurrency(estimate.credits.totalCreditsAmount)}
                        </td>
                      </tr>
                      <tr>
                        <th>Neto estimado tras cuota</th>
                        <td className="text-end">
                          {formatCurrency(
                            estimate.calculation.estimatedNetAfterTax,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="col-12 col-xl-5">
          <section className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <h2 className="h4 mb-3">Cobertura del calculo</h2>

              {estimate ? (
                <div className="d-grid gap-3">
                  <div className="border rounded-3 p-3 bg-light-subtle">
                    <div className="small text-secondary mb-1">Titular</div>
                    <strong>{estimate.profile.fullName}</strong>
                    <div className="small text-secondary mt-2">
                      {estimate.profile.taxId ?? "Sin NIF configurado"}
                    </div>
                  </div>

                  <div className="border rounded-3 p-3 bg-light-subtle">
                    <div className="small text-secondary mb-1">
                      Registros usados
                    </div>
                    <strong>
                      {estimate.sourceSummary.incomeRecordCount} ingresos
                    </strong>
                    <div className="small text-secondary mt-2">
                      {estimate.sourceSummary.expenseRecordCount} gastos
                      manuales y {estimate.sourceSummary.taxObligationCount}{" "}
                      obligaciones fiscales
                    </div>
                  </div>

                  <div className="border rounded-3 p-3 bg-light-subtle">
                    <div className="small text-secondary mb-1">
                      Variables aplicadas
                    </div>
                    <strong>
                      {estimate.simulationInput.declarationMode === "JOINT"
                        ? "Declaración conjunta"
                        : "Declaración individual"}
                    </strong>
                    <div className="small text-secondary mt-2">
                      {estimate.simulationInput.dependentChildrenCount} hijos,{" "}
                      {formatCurrency(
                        estimate.simulationInput
                          .annualPensionContributionAmount,
                      )}{" "}
                      en pensiones,{" "}
                      {formatCurrency(
                        estimate.simulationInput.annualDonationAmount,
                      )}{" "}
                      en donativos y{" "}
                      {formatCurrency(
                        estimate.simulationInput.annualHousingDeductionAmount,
                      )}{" "}
                      de deducción de vivienda.
                    </div>
                  </div>

                  <div>
                    <h3 className="h6 text-uppercase text-secondary mb-2">
                      Reducciones y deducciones
                    </h3>
                    <div className="table-responsive">
                      <table className="table table-sm align-middle mb-0">
                        <tbody>
                          <tr>
                            <th>Mínimo personal</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.reductions.personalMinimumAmount,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Mínimo por hijos</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.reductions.childrenMinimumAmount,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Reducción conjunta</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.reductions.declarationReductionAmount,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Aportación a pensiones aplicada</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.reductions
                                  .pensionContributionReductionAmount,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Deducción por donativos</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.credits.donationDeductionAmount,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <th>Deducción por vivienda</th>
                            <td className="text-end">
                              {formatCurrency(
                                estimate.credits.housingDeductionAmount,
                              )}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="h6 text-uppercase text-secondary mb-2">
                      Supuestos
                    </h3>
                    <ul className="mb-0 ps-3 text-secondary">
                      {estimate.assumptions.map((assumption) => (
                        <li key={assumption}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h4 mb-1">Tramos aplicados</h2>
              <p className="text-secondary mb-0">
                Escala progresiva simplificada usada para la estimacion inicial.
              </p>
            </div>
          </div>

          {!isLoading && estimate && !estimate.calculation.brackets.length ? (
            <p className="mb-0 text-secondary">
              No hay base imponible suficiente para aplicar tramos en este
              ejercicio.
            </p>
          ) : null}

          {estimate?.calculation.brackets.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Tramo</th>
                    <th>Tipo</th>
                    <th className="text-end">Base en tramo</th>
                    <th className="text-end">Cuota</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.calculation.brackets.map((bracket) => (
                    <tr
                      key={`${bracket.lowerBound}-${bracket.upperBound ?? "max"}`}
                    >
                      <td>
                        {formatCurrency(bracket.lowerBound)} -{" "}
                        {bracket.upperBound === null
                          ? "en adelante"
                          : formatCurrency(bracket.upperBound)}
                      </td>
                      <td>{formatPercent(bracket.rate)}</td>
                      <td className="text-end">
                        {formatCurrency(bracket.taxableAmount)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(bracket.quota)}
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
