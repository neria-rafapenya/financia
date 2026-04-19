import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RecurringPaymentRecord } from "@/domain/interfaces/recurring-payment.interface";

const mockListRecurringPaymentsFn = jest.fn();
const mockCreateRecurringPaymentFn = jest.fn();
const mockUpdateRecurringPaymentFn = jest.fn();

jest.mock("@/application/services/RecurringPaymentsService", () => ({
  RecurringPaymentsService: jest.fn().mockImplementation(() => ({
    listRecurringPayments: (...args: unknown[]) =>
      mockListRecurringPaymentsFn(...args),
    createRecurringPayment: (...args: unknown[]) =>
      mockCreateRecurringPaymentFn(...args),
    updateRecurringPayment: (...args: unknown[]) =>
      mockUpdateRecurringPaymentFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/RecurringPaymentsRepository", () => ({
  RecurringPaymentsRepository: jest.fn().mockImplementation(() => ({})),
}));

import { RecurringPaymentsPage } from "@/presentation/pages/RecurringPaymentsPage";

function createPayments(): RecurringPaymentRecord[] {
  return [
    {
      id: 31,
      userId: 1,
      categoryId: null,
      title: "Cuota gestoría",
      amount: 95,
      frequency: "MONTHLY",
      nextDueDate: "2026-05-02",
      isActive: true,
      deductibilityStatus: "DEDUCTIBLE",
      notes: "Servicio recurrente",
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: "2026-04-19T08:00:00.000Z",
    },
  ];
}

function renderRecurringPaymentsPage() {
  return render(<RecurringPaymentsPage />);
}

describe("RecurringPaymentsPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T09:00:00.000Z"));
    mockListRecurringPaymentsFn.mockReset();
    mockCreateRecurringPaymentFn.mockReset();
    mockUpdateRecurringPaymentFn.mockReset();
    mockListRecurringPaymentsFn.mockResolvedValue(createPayments());
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("crea un pago periódico con el payload esperado", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockCreateRecurringPaymentFn.mockResolvedValue(undefined);

    renderRecurringPaymentsPage();

    await screen.findByText("Cuota gestoría");
    const dateInput = screen.getByDisplayValue(
      "2026-04-19",
    ) as HTMLInputElement;

    await user.type(
      screen.getByPlaceholderText("Título del pago"),
      "Seguro RC",
    );
    await user.type(screen.getByPlaceholderText("Importe"), "220");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "YEARLY");
    await user.selectOptions(selects[1], "REVIEWABLE");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-06-30");
    await user.click(screen.getByLabelText("Pago activo"));
    await user.type(
      screen.getByPlaceholderText("Notas"),
      "Renovar antes del verano",
    );
    await user.click(screen.getByRole("button", { name: "Crear pago" }));

    await waitFor(() => {
      expect(mockCreateRecurringPaymentFn).toHaveBeenCalledWith({
        title: "Seguro RC",
        amount: 220,
        frequency: "YEARLY",
        nextDueDate: "2026-06-30",
        isActive: false,
        deductibilityStatus: "REVIEWABLE",
        notes: "Renovar antes del verano",
      });
    });
  });

  test("permite editar un pago periódico existente", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    mockUpdateRecurringPaymentFn.mockResolvedValue(undefined);

    renderRecurringPaymentsPage();

    await screen.findByText("Cuota gestoría");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    const titleInput = screen.getByDisplayValue("Cuota gestoría");
    await user.clear(titleInput);
    await user.type(titleInput, "Cuota gestoría premium");
    await user.click(screen.getByRole("button", { name: "Actualizar pago" }));

    await waitFor(() => {
      expect(mockUpdateRecurringPaymentFn).toHaveBeenCalledWith(31, {
        title: "Cuota gestoría premium",
        amount: 95,
        frequency: "MONTHLY",
        nextDueDate: "2026-05-02",
        isActive: true,
        deductibilityStatus: "DEDUCTIBLE",
        notes: "Servicio recurrente",
      });
    });
  });
});
