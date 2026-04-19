import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ContractRecord } from "@/domain/interfaces/contract.interface";
import type { Payer } from "@/domain/interfaces/payer.interface";

const mockListContractsFn = jest.fn();
const mockCreateContractFn = jest.fn();
const mockUpdateContractFn = jest.fn();
const mockListPayersFn = jest.fn();

jest.mock("@/application/services/ContractsService", () => ({
  ContractsService: jest.fn().mockImplementation(() => ({
    listContracts: (...args: unknown[]) => mockListContractsFn(...args),
    createContract: (...args: unknown[]) => mockCreateContractFn(...args),
    updateContract: (...args: unknown[]) => mockUpdateContractFn(...args),
  })),
}));

jest.mock("@/application/services/PayersService", () => ({
  PayersService: jest.fn().mockImplementation(() => ({
    list: (...args: unknown[]) => mockListPayersFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/ContractsRepository", () => ({
  ContractsRepository: jest.fn().mockImplementation(() => ({})),
}));

jest.mock("@/infrastructure/repositories/PayersRepository", () => ({
  PayersRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ContractsPage } from "@/presentation/pages/ContractsPage";

function createContracts(): ContractRecord[] {
  return [
    {
      id: 10,
      userId: 1,
      payerId: 1,
      contractType: "EMPLOYMENT",
      title: "Contrato laboral base",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      grossSalaryMonthly: 2500,
      netSalaryMonthly: 1950,
      exclusivityFlag: true,
      nonCompeteFlag: false,
      workdayType: "FULL_TIME",
      status: "ACTIVE",
      notes: "Revisar clausula anual",
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: "2026-04-19T08:00:00.000Z",
    },
  ];
}

function createPayers(): Payer[] {
  return [
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
  ];
}

function renderContractsPage() {
  return render(<ContractsPage />);
}

describe("ContractsPage", () => {
  beforeEach(() => {
    mockListContractsFn.mockReset();
    mockCreateContractFn.mockReset();
    mockUpdateContractFn.mockReset();
    mockListPayersFn.mockReset();
    mockListContractsFn.mockResolvedValue(createContracts());
    mockListPayersFn.mockResolvedValue(createPayers());
  });

  test("crea un contrato con el payload esperado", async () => {
    const user = userEvent.setup();
    mockCreateContractFn.mockResolvedValue(undefined);

    renderContractsPage();

    await screen.findByText("Contrato laboral base");

    const form = screen
      .getByPlaceholderText("Título del contrato")
      .closest("form") as HTMLFormElement;
    const selects = within(form).getAllByRole("combobox");
    const dateInputs = Array.from(
      form.querySelectorAll('input[type="date"]'),
    ) as HTMLInputElement[];

    await user.selectOptions(selects[0], "1");
    await user.selectOptions(selects[1], "FREELANCE");
    await user.type(
      within(form).getByPlaceholderText("Título del contrato"),
      "Contrato freelance soporte",
    );
    await user.type(dateInputs[0], "2026-05-01");
    await user.type(dateInputs[1], "2026-12-31");
    await user.type(within(form).getByPlaceholderText("Bruto mensual"), "1800");
    await user.type(within(form).getByPlaceholderText("Neto mensual"), "1400");
    await user.selectOptions(selects[2], "PART_TIME");
    await user.selectOptions(selects[3], "DRAFT");
    await user.click(within(form).getByLabelText("Cláusula de no competencia"));
    await user.type(within(form).getByPlaceholderText("Notas"), "Alta inicial");
    await user.click(screen.getByRole("button", { name: "Crear contrato" }));

    await waitFor(() => {
      expect(mockCreateContractFn).toHaveBeenCalledWith({
        payerId: 1,
        contractType: "FREELANCE",
        title: "Contrato freelance soporte",
        startDate: "2026-05-01",
        endDate: "2026-12-31",
        grossSalaryMonthly: 1800,
        netSalaryMonthly: 1400,
        exclusivityFlag: false,
        nonCompeteFlag: true,
        workdayType: "PART_TIME",
        status: "DRAFT",
        notes: "Alta inicial",
      });
    });
  });

  test("permite editar un contrato existente", async () => {
    const user = userEvent.setup();
    mockUpdateContractFn.mockResolvedValue(undefined);

    renderContractsPage();

    await screen.findByText("Contrato laboral base");
    await user.click(screen.getByRole("button", { name: "Editar" }));

    const titleInput = screen.getByDisplayValue("Contrato laboral base");
    await user.clear(titleInput);
    await user.type(titleInput, "Contrato laboral actualizado");
    await user.click(
      screen.getByRole("button", { name: "Actualizar contrato" }),
    );

    await waitFor(() => {
      expect(mockUpdateContractFn).toHaveBeenCalledWith(10, {
        payerId: 1,
        contractType: "EMPLOYMENT",
        title: "Contrato laboral actualizado",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        grossSalaryMonthly: 2500,
        netSalaryMonthly: 1950,
        exclusivityFlag: true,
        nonCompeteFlag: false,
        workdayType: "FULL_TIME",
        status: "ACTIVE",
        notes: "Revisar clausula anual",
      });
    });
  });
});
