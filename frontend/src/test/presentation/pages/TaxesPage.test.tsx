import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { TaxPeriodOverview } from "@/domain/interfaces/tax.interface";

const mockGetPeriodOverviewFn = jest.fn();

jest.mock("@/application/services/TaxService", () => ({
  TaxService: jest.fn().mockImplementation(() => ({
    getPeriodOverview: (...args: unknown[]) => mockGetPeriodOverviewFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/TaxRepository", () => ({
  TaxRepository: jest.fn().mockImplementation(() => ({})),
}));

import { TaxesPage } from "@/presentation/pages/TaxesPage";

function createTaxOverview(): TaxPeriodOverview {
  return {
    profile: {
      fullName: "Ana Pérez",
      taxId: "12345678Z",
      hasValidTaxId: true,
    },
    period: {
      year: 2026,
      month: null,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      label: "Ejercicio 2026",
    },
    totals: {
      totalAmount: 1280,
      totalVatAmount: 840,
      totalIrpfAmount: 440,
      recordCount: 2,
    },
    items: [
      {
        id: "tax-1",
        sourceDocumentId: 12,
        obligationType: "VAT",
        label: "Modelo Q2 IVA",
        concept: "Factura emitida abril",
        counterpartyName: "Cliente Este",
        sourceDocumentType: "INVOICE",
        effectiveDate: "2026-04-15",
        periodYear: 2026,
        periodMonth: 4,
        amount: 840,
        status: "PENDING_REVIEW",
        matchedUserTaxId: "12345678Z",
        detectedIssuerTaxId: "12345678Z",
        settlementYear: 2026,
        settlementQuarter: 2,
        settlementLabel: "2T 2026",
        dueDate: "2026-05-20",
        notes: null,
      },
      {
        id: "tax-2",
        sourceDocumentId: 13,
        obligationType: "IRPF",
        label: "Modelo Q2 IRPF",
        concept: "Retención factura abril",
        counterpartyName: "Cliente Norte",
        sourceDocumentType: "INVOICE",
        effectiveDate: "2026-04-22",
        periodYear: 2026,
        periodMonth: 4,
        amount: 440,
        status: "PENDING_REVIEW",
        matchedUserTaxId: "12345678Z",
        detectedIssuerTaxId: "12345678Z",
        settlementYear: 2026,
        settlementQuarter: 2,
        settlementLabel: "2T 2026",
        dueDate: "2026-07-20",
        notes: null,
      },
    ],
  };
}

function renderTaxesPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <TaxesPage />
    </MemoryRouter>,
  );
}

describe("TaxesPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T09:00:00.000Z"));
    mockGetPeriodOverviewFn.mockReset();
    mockGetPeriodOverviewFn.mockResolvedValue(createTaxOverview());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("muestra el cierre fiscal operativo y las obligaciones del periodo", async () => {
    renderTaxesPage();

    await screen.findByText("Modelo Q2 IVA");

    expect(mockGetPeriodOverviewFn).toHaveBeenCalledWith({
      year: 2026,
      month: undefined,
    });
    expect(screen.getByText("Ana Pérez")).toBeVisible();
    expect(screen.getAllByText("12345678Z")[0]).toBeVisible();
    expect(screen.getByText("Vencen pronto").closest("div")).toHaveTextContent(
      "0",
    );
    expect(
      screen.getByText("Liquidaciones de IVA").closest("div"),
    ).toHaveTextContent("1");
    expect(
      screen.getByText("Liquidaciones de IRPF").closest("div"),
    ).toHaveTextContent("1");
    expect(screen.getByText("Modelo Q2 IRPF")).toBeVisible();
    expect(screen.getByText("Cliente Este")).toBeVisible();
  });

  test("recarga el overview al filtrar por mes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderTaxesPage();

    await screen.findByText("Modelo Q2 IVA");
    await user.selectOptions(screen.getAllByRole("combobox")[1], "4");

    await waitFor(() => {
      expect(mockGetPeriodOverviewFn).toHaveBeenLastCalledWith({
        year: 2026,
        month: 4,
      });
    });
  });
});
