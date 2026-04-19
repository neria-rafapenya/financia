import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useAuth } from "@/application/contexts/AuthContext";

var mockUpdateCurrentUser = jest.fn();
var mockChangePassword = jest.fn();

jest.mock("@/application/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/application/services/AuthService", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    updateCurrentUser: mockUpdateCurrentUser,
    changePassword: mockChangePassword,
  })),
}));

jest.mock("@/infrastructure/repositories/AuthRepository", () => ({
  AuthRepository: jest.fn().mockImplementation(() => ({})),
}));

import { ProfilePage } from "@/presentation/pages/ProfilePage";

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

function renderProfilePage() {
  return render(<ProfilePage />);
}

describe("ProfilePage", () => {
  beforeEach(() => {
    mockUpdateCurrentUser.mockReset();
    mockChangePassword.mockReset();
    mockedUseAuth.mockReset();
    mockedUseAuth.mockReturnValue({
      user: {
        id: 1,
        email: "ana@financia.es",
        fullName: "Ana Pérez",
        taxId: "12345678Z",
        createdAt: "2026-04-19T08:00:00.000Z",
        updatedAt: "2026-04-19T08:00:00.000Z",
      },
      isAuthenticated: true,
      isInitializing: false,
      login: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      refreshUser: jest.fn().mockResolvedValue(undefined),
    });
  });

  test("actualiza el perfil fiscal y refresca el usuario autenticado", async () => {
    const user = userEvent.setup();
    mockUpdateCurrentUser.mockResolvedValue(undefined);

    renderProfilePage();

    const fullNameInput = screen.getByPlaceholderText("Nombre completo");
    const taxIdInput = screen.getByPlaceholderText("NIF / NIE / CIF");

    await user.clear(fullNameInput);
    await user.type(fullNameInput, "Ana María Pérez");
    await user.clear(taxIdInput);
    await user.type(taxIdInput, "87654321X");
    await user.click(screen.getByRole("button", { name: "Guardar perfil" }));

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
        fullName: "Ana María Pérez",
        taxId: "87654321X",
      });
    });

    expect(mockedUseAuth.mock.results[0]?.value.refreshUser).toHaveBeenCalled();
    expect(
      screen.getByText("Perfil fiscal actualizado correctamente."),
    ).toBeVisible();
  });

  test("cambia la contraseña y muestra el mensaje de confirmación", async () => {
    const user = userEvent.setup();
    mockChangePassword.mockResolvedValue(undefined);

    renderProfilePage();

    await user.type(
      screen.getByPlaceholderText("Contraseña actual"),
      "anterior-segura",
    );
    await user.type(
      screen.getByPlaceholderText("Nueva contraseña"),
      "nueva-clave-2026",
    );
    await user.click(
      screen.getByRole("button", { name: "Cambiar contraseña" }),
    );

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "anterior-segura",
        newPassword: "nueva-clave-2026",
      });
    });

    expect(
      screen.getByText(
        "Contraseña actualizada. Será necesario volver a iniciar sesión en otros dispositivos.",
      ),
    ).toBeVisible();
  });
});
