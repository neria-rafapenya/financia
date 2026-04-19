import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayersPage } from "@/presentation/pages/PayersPage";
import { usePayers } from "@/application/contexts/PayersContext";

jest.mock("@/application/contexts/PayersContext", () => ({
  usePayers: jest.fn(),
}));

const mockedUsePayers = usePayers as jest.MockedFunction<typeof usePayers>;

function renderPayersPage() {
  return render(<PayersPage />);
}

describe("PayersPage", () => {
  beforeEach(() => {
    mockedUsePayers.mockReset();
  });

  test("crea un pagador nuevo con el payload esperado", async () => {
    const user = userEvent.setup();
    const createPayer = jest.fn().mockResolvedValue(undefined);

    mockedUsePayers.mockReturnValue({
      payers: [],
      isLoading: false,
      error: null,
      refreshPayers: jest.fn().mockResolvedValue(undefined),
      createPayer,
      updatePayer: jest.fn().mockResolvedValue(undefined),
      deletePayer: jest.fn().mockResolvedValue(undefined),
    });

    renderPayersPage();

    await user.type(
      screen.getByPlaceholderText("Nombre del pagador"),
      "Cliente Sur",
    );
    await user.type(screen.getByPlaceholderText("NIF / CIF"), "B12345678");
    await user.selectOptions(screen.getByRole("combobox"), "CLIENT");
    await user.type(screen.getByPlaceholderText("Notas"), "Pagador clave");
    await user.click(screen.getByRole("button", { name: "Crear pagador" }));

    await waitFor(() => {
      expect(createPayer).toHaveBeenCalledWith({
        payerName: "Cliente Sur",
        taxId: "B12345678",
        payerType: "CLIENT",
        notes: "Pagador clave",
      });
    });

    expect(screen.getByText("Pagador creado correctamente.")).toBeVisible();
  });

  test("permite editar y eliminar un pagador existente", async () => {
    const user = userEvent.setup();
    const updatePayer = jest.fn().mockResolvedValue(undefined);
    const deletePayer = jest.fn().mockResolvedValue(undefined);
    const confirmSpy = jest.spyOn(globalThis, "confirm").mockReturnValue(true);

    mockedUsePayers.mockReturnValue({
      payers: [
        {
          id: 20,
          userId: 1,
          payerName: "Empresa Norte",
          taxId: "A12345678",
          payerType: "EMPLOYER",
          notes: "Contrato principal",
          createdAt: "2026-04-19T08:00:00.000Z",
          updatedAt: "2026-04-19T08:00:00.000Z",
        },
      ],
      isLoading: false,
      error: null,
      refreshPayers: jest.fn().mockResolvedValue(undefined),
      createPayer: jest.fn().mockResolvedValue(undefined),
      updatePayer,
      deletePayer,
    });

    renderPayersPage();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    const nameInput = screen.getByDisplayValue("Empresa Norte");
    await user.clear(nameInput);
    await user.type(nameInput, "Empresa Norte Actualizada");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(updatePayer).toHaveBeenCalledWith(20, {
        payerName: "Empresa Norte Actualizada",
        taxId: "A12345678",
        payerType: "EMPLOYER",
        notes: "Contrato principal",
      });
    });

    await user.click(screen.getByRole("button", { name: "Borrar" }));

    await waitFor(() => {
      expect(deletePayer).toHaveBeenCalledWith(20);
    });

    confirmSpy.mockRestore();
  });
});
