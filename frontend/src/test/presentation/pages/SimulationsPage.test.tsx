import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnnualTaxReturnEstimate } from "@/domain/interfaces/simulation.interface";

const mockGetAnnualTaxReturnEstimateFn = jest.fn();

jest.mock("@/application/services/SimulationsService", () => ({
  SimulationsService: jest.fn().mockImplementation(() => ({
    getAnnualTaxReturnEstimate: (...args: unknown[]) =>
      mockGetAnnualTaxReturnEstimateFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/SimulationsRepository", () => ({
  SimulationsRepository: jest.fn().mockImplementation(() => ({})),
}));

import { SimulationsPage } from "@/presentation/pages/SimulationsPage";

function createEstimate(): AnnualTaxReturnEstimate {
  return {
    profile: {
      fullName: "Ana Pérez",
      taxId: "12345678Z",
      hasValidTaxId: true,
    },
    fiscalYear: 2026,
    simulationInput: {
      declarationMode: "INDIVIDUAL",
      dependentChildrenCount: 0,
      annualPensionContributionAmount: 0,
      annualDonationAmount: 0,
      annualHousingDeductionAmount: 0,
      applyReviewableExpenses: false,
    },
    income: {
      employmentIncome: 28000,
      economicActivityIncome: 12000,
      totalIncome: 40000,
      irpfWithheld: 6500,
      socialSecurityAmount: 1500,
    },
    expenses: {
      deductibleAmount: 3200,
      reviewableAmount: 800,
      nonDeductibleAmount: 900,
      taxObligationsAmount: 2100,
      deductibleAmountUsed: 3200,
    },
    reductions: {
      socialSecurityAmount: 1500,
      pensionContributionReductionAmount: 0,
      personalMinimumAmount: 5550,
      childrenMinimumAmount: 0,
      declarationReductionAmount: 0,
      totalPersonalAndFamilyMinimum: 5550,
    },
    credits: {
      donationDeductionAmount: 0,
      housingDeductionAmount: 0,
      totalCreditsAmount: 0,
    },
    calculation: {
      preMinimumTaxableBase: 35300,
      grossQuota: 8200,
      estimatedTaxableBase: 29750,
      estimatedQuota: 7800,
      estimatedNetAfterTax: 32200,
      estimatedResult: 1300,
      resultType: "TO_PAY",
      brackets: [],
    },
    sourceSummary: {
      incomeRecordCount: 8,
      expenseRecordCount: 22,
      taxObligationCount: 4,
    },
    assumptions: [
      "Se asume estabilidad de ingresos en el resto del ejercicio.",
    ],
  };
}

function renderSimulationsPage() {
  return render(<SimulationsPage />);
}

describe("SimulationsPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T09:00:00.000Z"));
    mockGetAnnualTaxReturnEstimateFn.mockReset();
    mockGetAnnualTaxReturnEstimateFn.mockResolvedValue(createEstimate());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("muestra la lectura ejecutiva y el desglose anual", async () => {
    renderSimulationsPage();

    await screen.findByText("Lectura ejecutiva");

    expect(mockGetAnnualTaxReturnEstimateFn).toHaveBeenCalledWith({
      year: 2026,
      declarationMode: "INDIVIDUAL",
      dependentChildrenCount: 0,
      annualPensionContributionAmount: 0,
      annualDonationAmount: 0,
      annualHousingDeductionAmount: 0,
      applyReviewableExpenses: false,
    });
    expect(screen.getByText("A ingresar")).toBeVisible();
    expect(
      screen.getByText("Presión fiscal estimada").closest("div"),
    ).toHaveTextContent("20 %");
    expect(
      screen.getByText("Ingresos del ejercicio").closest("div"),
    ).toHaveTextContent(/40.000,00/);
    expect(screen.getByText("Gasto en revision")).toBeVisible();
  });

  test("recalcula la simulación al aplicar un escenario", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderSimulationsPage();

    await screen.findByText("Lectura ejecutiva");
    const familyScenario = screen
      .getByText("Escenario familiar")
      .closest("article") as HTMLElement;
    await user.click(
      within(familyScenario).getByRole("button", {
        name: "Aplicar escenario",
      }),
    );

    await waitFor(() => {
      expect(mockGetAnnualTaxReturnEstimateFn).toHaveBeenLastCalledWith({
        year: 2026,
        declarationMode: "JOINT",
        dependentChildrenCount: 2,
        annualPensionContributionAmount: 1000,
        annualDonationAmount: 0,
        annualHousingDeductionAmount: 0,
        applyReviewableExpenses: false,
      });
    });
  });
});
