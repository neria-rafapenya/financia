import { useEffect, useMemo, useState } from "react";
import { SimulationsService } from "@/application/services/SimulationsService";
import type {
  AnnualTaxReturnEstimate,
  AnnualTaxReturnEstimateFilters,
} from "@/domain/interfaces/simulation.interface";
import { SimulationsRepository } from "@/infrastructure/repositories/SimulationsRepository";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const simulationsService = new SimulationsService(new SimulationsRepository());

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
              </label>
              <select
                id="simulation-year"
                className="form-select"
                value={filters.year}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    year: Number(event.currentTarget.value),
                  }))
                }
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
              </label>
              <select
                id="simulation-mode"
                className="form-select"
                value={filters.declarationMode}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    declarationMode: event.currentTarget.value as
                      | "INDIVIDUAL"
                      | "JOINT",
                  }))
                }
              >
                <option value="INDIVIDUAL">Individual</option>
                <option value="JOINT">Conjunta</option>
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label mb-1" htmlFor="simulation-children">
                Hijos
              </label>
              <input
                id="simulation-children"
                className="form-control"
                type="number"
                min="0"
                max="10"
                value={filters.dependentChildrenCount ?? 0}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    dependentChildrenCount: Number(event.currentTarget.value),
                  }))
                }
              />
            </div>

            <div className="col-md-4 d-flex align-items-end">
              <div className="form-check mb-2">
                <input
                  id="simulation-reviewable-expenses"
                  className="form-check-input"
                  type="checkbox"
                  checked={Boolean(filters.applyReviewableExpenses)}
                  onChange={(event) =>
                    setFilters((currentFilters) => ({
                      ...currentFilters,
                      applyReviewableExpenses: event.currentTarget.checked,
                    }))
                  }
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
              </label>
              <input
                id="simulation-pension"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualPensionContributionAmount ?? 0}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualPensionContributionAmount: Number(
                      event.currentTarget.value,
                    ),
                  }))
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="simulation-donations">
                Donativos del año
              </label>
              <input
                id="simulation-donations"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualDonationAmount ?? 0}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualDonationAmount: Number(event.currentTarget.value),
                  }))
                }
              />
            </div>

            <div className="col-md-4">
              <label className="form-label mb-1" htmlFor="simulation-housing">
                Deducción de vivienda a aplicar
              </label>
              <input
                id="simulation-housing"
                className="form-control"
                type="number"
                min="0"
                step="0.01"
                value={filters.annualHousingDeductionAmount ?? 0}
                onChange={(event) =>
                  setFilters((currentFilters) => ({
                    ...currentFilters,
                    annualHousingDeductionAmount: Number(
                      event.currentTarget.value,
                    ),
                  }))
                }
              />
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger mt-4 mb-0">{error}</div>
          ) : null}
          {isLoading ? (
            <LoadingPanel message="Calculando simulacion anual..." />
          ) : null}
        </div>
      </section>

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
