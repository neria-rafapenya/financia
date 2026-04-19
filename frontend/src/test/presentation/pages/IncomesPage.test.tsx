import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IncomesPage } from "@/presentation/pages/IncomesPage";
import { usePayers } from "@/application/contexts/PayersContext";
import type { IncomePeriodOverview } from "@/domain/interfaces/income.interface";

const mockGetPeriodOverviewFn = jest.fn();
const mockCreateIncomeFn = jest.fn();
const mockUpdateIncomeFn = jest.fn();
const mockRemoveIncomeFn = jest.fn();
const mockRemoveDocumentIncomeFn = jest.fn();

jest.mock("@/application/contexts/PayersContext", () => ({
  usePayers: jest.fn(),
}));

jest.mock("@/application/services/IncomesService", () => ({
  IncomesService: jest.fn().mockImplementation(() => ({
    getPeriodOverview: (...args: unknown[]) => mockGetPeriodOverviewFn(...args),
    createIncome: (...args: unknown[]) => mockCreateIncomeFn(...args),
    updateIncome: (...args: unknown[]) => mockUpdateIncomeFn(...args),
    removeIncome: (...args: unknown[]) => mockRemoveIncomeFn(...args),
    removeDocumentIncome: (...args: unknown[]) =>
      mockRemoveDocumentIncomeFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/IncomesRepository", () => ({
  IncomesRepository: jest.fn().mockImplementation(() => ({})),
}));

const mockedUsePayers = usePayers as jest.MockedFunction<typeof usePayers>;

function createIncomeOverview(): IncomePeriodOverview {
  return {
    period: {
      year: 2026,
      month: null,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      label: "Ejercicio 2026",
      fiscalYearStartDate: "2026-01-01",
    },
    totals: {
      totalGrossAmount: 3200,
      totalNetAmount: 2500,
      totalVatAmount: 210,
      totalIrpfWithheld: 320,
      totalSocialSecurityAmount: 120,
      totalPeriodAmount: 2710,
      recordCount: 2,
    },
    items: [
      {
        id: "manual-11",
        source: "MANUAL",
        sourceId: 11,
        sourceDocumentType: null,
        incomeType: "PAYSLIP",
        label: "Nómina abril",
        counterpartyName: "Empresa Norte",
        periodYear: 2026,
        periodMonth: 4,
        effectiveDate: "2026-04-30",
        grossAmount: 2200,
        netAmount: 1750,
        vatAmount: null,
        irpfWithheld: 250,
        socialSecurityAmount: 120,
        effectiveAmount: 1750,
        notes: "Pago mensual",
      },
      {
        id: "document-12",
        source: "DOCUMENT",
        sourceId: 12,
        sourceDocumentType: "INVOICE",
        incomeType: "FREELANCE_INVOICE",
        label: "Factura emitida abril",
        counterpartyName: "Cliente Este",
        periodYear: 2026,
        periodMonth: 4,
        effectiveDate: "2026-04-15",
        grossAmount: 1000,
        netAmount: 750,
        vatAmount: 210,
        irpfWithheld: 70,
        socialSecurityAmount: null,
        effectiveAmount: 960,
        notes: null,
      },
    ],
  };
}

function renderIncomesPage() {
  return render(<IncomesPage />);
}

describe("IncomesPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T10:00:00.000Z"));
    mockGetPeriodOverviewFn.mockReset();
    mockCreateIncomeFn.mockReset();
    mockUpdateIncomeFn.mockReset();
    mockRemoveIncomeFn.mockReset();
    mockRemoveDocumentIncomeFn.mockReset();
    mockedUsePayers.mockReset();
    mockedUsePayers.mockReturnValue({
      payers: [
        {
          id: 1,
          userId: 1,
          payerName: "Empresa Norte",
          taxId: "A12345678",
          payerType: "EMPLOYER",
          notes: null,
          createdAt: "2026-04-19T08:00:00.000Z",
          updatedAt: "2026-04-19T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refreshPayers: jest.fn().mockResolvedValue(undefined),
      createPayer: jest.fn().mockResolvedValue(undefined),
      updatePayer: jest.fn().mockResolvedValue(undefined),
      deletePayer: jest.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("crea un ingreso manual con el pagador seleccionado", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetPeriodOverviewFn.mockResolvedValue(createIncomeOverview());
    mockCreateIncomeFn.mockResolvedValue(undefined);

    renderIncomesPage();

    await screen.findByText("Nómina abril");

    fireEvent.change(screen.getByLabelText("Pagador"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Tipo de ingreso"), {
      target: { value: "BONUS" },
    });
    fireEvent.change(screen.getByLabelText("Importe bruto"), {
      target: { value: "500" },
    });
    fireEvent.change(screen.getByLabelText("Notas"), {
      target: { value: "Bonus trimestral" },
    });
    await user.click(
      screen.getByRole("button", { name: "Crear ingreso manual" }),
    );

    await waitFor(() => {
      expect(mockCreateIncomeFn).toHaveBeenCalledWith({
        payerId: 1,
        incomeType: "BONUS",
        periodYear: 2026,
        periodMonth: null,
        grossAmount: 500,
        netAmount: null,
        irpfWithheld: null,
        socialSecurityAmount: null,
        flexibleCompensationAmount: null,
        notes: "Bonus trimestral",
      });
    });
  });

  test("permite editar un ingreso manual existente", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetPeriodOverviewFn.mockResolvedValue(createIncomeOverview());
    mockUpdateIncomeFn.mockResolvedValue(undefined);

    renderIncomesPage();

    await screen.findByText("Nómina abril");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    const grossInput = screen.getByLabelText("Importe bruto");
    fireEvent.change(grossInput, {
      target: { value: "2300" },
    });
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mockUpdateIncomeFn).toHaveBeenCalledWith(11, {
        payerId: 1,
        incomeType: "PAYSLIP",
        periodYear: 2026,
        periodMonth: 4,
        grossAmount: 2300,
        netAmount: 1750,
        irpfWithheld: 250,
        socialSecurityAmount: 120,
        flexibleCompensationAmount: null,
        notes: "Pago mensual",
      });
    });
  });
});
