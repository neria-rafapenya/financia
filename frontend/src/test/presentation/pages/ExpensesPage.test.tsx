import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ExpensePeriodOverview } from "@/domain/interfaces/expense.interface";

const mockGetPeriodOverviewFn = jest.fn();
const mockCreateExpenseFn = jest.fn();
const mockUpdateExpenseFn = jest.fn();
const mockCreateRecurringPaymentFn = jest.fn();

function mockGetPeriodOverview(...args: unknown[]) {
  return mockGetPeriodOverviewFn(...args);
}

function mockCreateExpense(...args: unknown[]) {
  return mockCreateExpenseFn(...args);
}

function mockUpdateExpense(...args: unknown[]) {
  return mockUpdateExpenseFn(...args);
}

function mockCreateRecurringPayment(...args: unknown[]) {
  return mockCreateRecurringPaymentFn(...args);
}

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: {
    fire: jest.fn(),
  },
}));

jest.mock("@/application/services/ExpensesService", () => ({
  ExpensesService: jest.fn().mockImplementation(() => ({
    getPeriodOverview: mockGetPeriodOverview,
    createExpense: mockCreateExpense,
    updateExpense: mockUpdateExpense,
  })),
}));

jest.mock("@/application/services/RecurringPaymentsService", () => ({
  RecurringPaymentsService: jest.fn().mockImplementation(() => ({
    createRecurringPayment: mockCreateRecurringPayment,
  })),
}));

jest.mock("@/infrastructure/repositories/ExpensesRepository", () => ({
  ExpensesRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@/infrastructure/repositories/RecurringPaymentsRepository", () => ({
  RecurringPaymentsRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ExpensesPage } from "@/presentation/pages/ExpensesPage";

function createExpenseOverview(): ExpensePeriodOverview {
  return {
    period: {
      year: 2026,
      month: null,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      label: "Ejercicio 2026",
    },
    totals: {
      totalAmount: 296.83,
      totalVatAmount: 23.33,
      totalIrpfAmount: 18,
      recordCount: 5,
    },
    items: [
      {
        id: "doc-invoice-1",
        source: "DOCUMENT",
        sourceId: 11,
        expenseDate: "2026-04-02",
        concept: "Factura proveedor software",
        vendorName: "Adobe",
        amount: 79.99,
        vatAmount: 13.88,
        isPaid: true,
        deductibilityStatus: "DEDUCTIBLE",
        notes: null,
      },
      {
        id: "doc-ticket-1",
        source: "DOCUMENT",
        sourceId: 12,
        expenseDate: "2026-04-05",
        concept: "Ticket compra material oficina",
        vendorName: "Papeleria Centro",
        amount: 54.45,
        vatAmount: 9.45,
        isPaid: true,
        deductibilityStatus: "REVIEWABLE",
        notes: null,
      },
      {
        id: "manual-subscription-1",
        source: "MANUAL",
        sourceId: 13,
        expenseDate: "2026-04-09",
        concept: "Suscripción Canva Pro",
        vendorName: null,
        amount: 15.39,
        vatAmount: null,
        isPaid: false,
        deductibilityStatus: "DEDUCTIBLE",
        notes: null,
      },
      {
        id: "manual-payment-1",
        source: "MANUAL",
        sourceId: 14,
        expenseDate: "2026-04-12",
        concept: "Pago alquiler despacho",
        vendorName: "Inmobiliaria Norte",
        amount: 120,
        vatAmount: 0,
        isPaid: true,
        deductibilityStatus: "NON_DEDUCTIBLE",
        notes: null,
      },
      {
        id: "tax-derived-1",
        source: "DOCUMENT_TAX",
        sourceId: 15,
        expenseDate: "2026-04-20",
        concept: "IRPF derivado factura emitida",
        vendorName: null,
        amount: 27,
        vatAmount: null,
        isPaid: null,
        deductibilityStatus: "NON_DEDUCTIBLE",
        notes: null,
      },
    ],
  };
}

function renderExpensesPage() {
  return render(<ExpensesPage />);
}

describe("ExpensesPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T09:00:00.000Z"));
    mockGetPeriodOverviewFn.mockReset();
    mockCreateExpenseFn.mockReset();
    mockUpdateExpenseFn.mockReset();
    mockCreateRecurringPaymentFn.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("muestra los totales exactos del período y lista todos los gastos por tipo relevante", async () => {
    mockGetPeriodOverviewFn.mockResolvedValue(createExpenseOverview());

    renderExpensesPage();

    expect(mockGetPeriodOverviewFn).toHaveBeenCalledWith({
      year: 2026,
      month: undefined,
    });

    await screen.findByText("Factura proveedor software");

    expect(screen.getByText("Gasto total").closest("div")).toHaveTextContent(
      /296,83/,
    );
    expect(screen.getByText("IVA acumulado").closest("div")).toHaveTextContent(
      /23,33/,
    );
    expect(screen.getByText("IRPF acumulado").closest("div")).toHaveTextContent(
      /18,00/,
    );
    expect(
      screen.getByText("Registros del período").closest("div"),
    ).toHaveTextContent("5");

    const invoiceRow = screen
      .getByText("Factura proveedor software")
      .closest("tr");
    expect(invoiceRow).toHaveTextContent("Documento interpretado");
    expect(invoiceRow).toHaveTextContent("Pagado");
    expect(invoiceRow).toHaveTextContent("Adobe");
    expect(invoiceRow).toHaveTextContent("DEDUCTIBLE");
    expect(invoiceRow).toHaveTextContent(/79,99/);
    expect(invoiceRow).toHaveTextContent(/13,88/);

    const ticketRow = screen
      .getByText("Ticket compra material oficina")
      .closest("tr");
    expect(ticketRow).toHaveTextContent("Documento interpretado");
    expect(ticketRow).toHaveTextContent("Pagado");
    expect(ticketRow).toHaveTextContent("Papeleria Centro");
    expect(ticketRow).toHaveTextContent("REVIEWABLE");
    expect(ticketRow).toHaveTextContent(/54,45/);
    expect(ticketRow).toHaveTextContent(/9,45/);

    const subscriptionRow = screen
      .getByText("Suscripción Canva Pro")
      .closest("tr");
    expect(subscriptionRow).toHaveTextContent("Manual");
    expect(subscriptionRow).toHaveTextContent("Pendiente");
    expect(subscriptionRow).toHaveTextContent("Sin contraparte identificada");
    expect(subscriptionRow).toHaveTextContent("DEDUCTIBLE");
    expect(subscriptionRow).toHaveTextContent(/15,39/);
    expect(subscriptionRow).toHaveTextContent(/0,00/);

    const paymentRow = screen.getByText("Pago alquiler despacho").closest("tr");
    expect(paymentRow).toHaveTextContent("Manual");
    expect(paymentRow).toHaveTextContent("Pagado");
    expect(paymentRow).toHaveTextContent("Inmobiliaria Norte");
    expect(paymentRow).toHaveTextContent("NON_DEDUCTIBLE");
    expect(paymentRow).toHaveTextContent(/120,00/);
    expect(paymentRow).toHaveTextContent(/0,00/);

    const taxRow = screen
      .getByText("IRPF derivado factura emitida")
      .closest("tr");
    expect(taxRow).toHaveTextContent("Fiscal derivado");
    expect(taxRow).toHaveTextContent("No aplica");
    expect(taxRow).toHaveTextContent("Sin contraparte identificada");
    expect(taxRow).toHaveTextContent("NON_DEDUCTIBLE");
    expect(taxRow).toHaveTextContent(/27,00/);
    expect(taxRow).toHaveTextContent(/0,00/);

    const table = screen.getByRole("table");
    const bodyRows = within(table).getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(5);
  });

  test("recarga el overview cuando se filtra por mes manteniendo el año activo", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockGetPeriodOverviewFn.mockResolvedValue(createExpenseOverview());

    renderExpensesPage();

    await screen.findByText("Factura proveedor software");

    await user.selectOptions(screen.getByLabelText("Mes"), "4");

    await waitFor(() => {
      expect(mockGetPeriodOverviewFn).toHaveBeenLastCalledWith({
        year: 2026,
        month: 4,
      });
    });
  });
});
