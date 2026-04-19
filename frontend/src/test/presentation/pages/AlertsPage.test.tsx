import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockListAlertsFn = jest.fn();
const mockMarkAsReadFn = jest.fn();
const mockResolveAlertFn = jest.fn();

jest.mock("@/application/services/AlertsService", () => ({
  AlertsService: jest.fn().mockImplementation(() => ({
    listAlerts: (...args: unknown[]) => mockListAlertsFn(...args),
    markAsRead: (...args: unknown[]) => mockMarkAsReadFn(...args),
    resolveAlert: (...args: unknown[]) => mockResolveAlertFn(...args),
  })),
}));

jest.mock("@/infrastructure/repositories/AlertsRepository", () => ({
  AlertsRepository: jest.fn().mockImplementation(() => ({})),
}));

import { AlertsPage } from "@/presentation/pages/AlertsPage";

function createUnreadAlerts() {
  return [
    {
      id: 41,
      userId: 1,
      alertType: "DOCUMENT_REVIEW",
      severity: "HIGH",
      title: "Factura sin verificar",
      message: "Falta validar los campos persistidos del documento.",
      linkedEntityType: "DOCUMENT",
      linkedEntityId: 91,
      isRead: false,
      isResolved: false,
      createdAt: "2026-04-18T09:00:00.000Z",
      resolvedAt: null,
    },
  ];
}

function renderAlertsPage() {
  return render(<AlertsPage />);
}

describe("AlertsPage", () => {
  beforeEach(() => {
    mockListAlertsFn.mockReset();
    mockMarkAsReadFn.mockReset();
    mockResolveAlertFn.mockReset();
  });

  test("muestra las alertas cargadas con su estado y severidad", async () => {
    mockListAlertsFn.mockResolvedValue(createUnreadAlerts());

    renderAlertsPage();

    await screen.findByText("Factura sin verificar");

    expect(screen.getByText("DOCUMENT_REVIEW")).toBeVisible();
    expect(screen.getByText("HIGH")).toBeVisible();
    expect(screen.getByText("Nueva")).toBeVisible();
    expect(
      screen.getByText("Falta validar los campos persistidos del documento."),
    ).toBeVisible();
  });

  test("permite marcar una alerta como leida y resolverla", async () => {
    const user = userEvent.setup();
    mockMarkAsReadFn.mockResolvedValue(undefined);
    mockResolveAlertFn.mockResolvedValue(undefined);
    mockListAlertsFn
      .mockResolvedValueOnce(createUnreadAlerts())
      .mockResolvedValueOnce([{ ...createUnreadAlerts()[0], isRead: true }])
      .mockResolvedValueOnce([
        { ...createUnreadAlerts()[0], isRead: true, isResolved: true },
      ]);

    renderAlertsPage();

    await screen.findByText("Factura sin verificar");
    await user.click(screen.getByRole("button", { name: "Marcar leída" }));

    await waitFor(() => {
      expect(mockMarkAsReadFn).toHaveBeenCalledWith(41);
    });

    await user.click(screen.getByRole("button", { name: "Resolver" }));

    await waitFor(() => {
      expect(mockResolveAlertFn).toHaveBeenCalledWith(41);
    });
  });
});
