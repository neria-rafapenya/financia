import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DashboardPage } from "@/presentation/pages/DashboardPage";
import { useDashboard } from "@/application/contexts/DashboardContext";
import type { DashboardOverview } from "@/domain/interfaces/dashboard.interface";

jest.mock("@/application/contexts/DashboardContext", () => ({
  useDashboard: jest.fn(),
}));

const mockedUseDashboard = useDashboard as jest.MockedFunction<
  typeof useDashboard
>;

function createOverview(): DashboardOverview {
  return {
    currentYear: 2026,
    user: {
      id: 1,
      email: "ana@financia.es",
      fullName: "Ana Pérez",
      taxId: "12345678Z",
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: "2026-04-19T08:00:00.000Z",
    },
    incomes: {
      totalGrossAmount: 4200,
      totalNetAmount: 3275,
      totalIrpfWithheld: 600,
      totalSocialSecurityAmount: 325,
      recordCount: 3,
    },
    expenses: {
      totalAmount: 1450,
      totalVatAmount: 210,
      recordCount: 8,
    },
    unreadAlerts: [
      {
        id: 41,
        alertType: "DOCUMENT_REVIEW",
        severity: "HIGH",
        title: "Factura pendiente",
        message: "La factura de abril requiere revisión manual.",
        linkedEntityType: "DOCUMENT",
        linkedEntityId: 301,
        isRead: false,
        isResolved: false,
        createdAt: "2026-04-18T09:00:00.000Z",
      },
    ],
    alertInbox: [
      {
        id: 41,
        userId: 1,
        alertType: "DOCUMENT_REVIEW",
        severity: "HIGH",
        title: "Factura pendiente",
        message: "La factura de abril requiere revisión manual.",
        linkedEntityType: "DOCUMENT",
        linkedEntityId: 301,
        isRead: false,
        isResolved: false,
        createdAt: "2026-04-18T09:00:00.000Z",
        resolvedAt: null,
      },
    ],
    unresolvedAlertsCount: 2,
    uploadedDocuments: 14,
    documentsPendingReviewCount: 2,
    documentsPendingReview: [
      {
        id: 301,
        userId: 1,
        documentType: "INVOICE",
        displayLabel: null,
        displayName: "Factura abril",
        originalFilename: "factura-abril.pdf",
        mimeType: "application/pdf",
        storagePath: "/docs/factura-abril.pdf",
        fileSizeBytes: 1024,
        documentDate: "2026-04-11",
        status: "LLM_PROCESSED",
        linkedEntityType: "EXPENSE",
        linkedEntityId: 99,
        notes: null,
        createdAt: "2026-04-11T08:00:00.000Z",
        updatedAt: "2026-04-12T08:00:00.000Z",
      },
    ],
    activeContractsCount: 1,
    recurringPaymentsDueSoonCount: 1,
    contracts: [],
    recurringPayments: [],
    recurringPaymentsDueSoon: [
      {
        id: 71,
        userId: 1,
        categoryId: null,
        title: "Cuota software",
        amount: 39.9,
        frequency: "MONTHLY",
        nextDueDate: "2026-04-25",
        isActive: true,
        deductibilityStatus: "DEDUCTIBLE",
        notes: null,
        createdAt: "2026-04-01T08:00:00.000Z",
        updatedAt: "2026-04-01T08:00:00.000Z",
      },
    ],
    nextTaxDeadlines: [
      {
        id: "tax-1",
        sourceDocumentId: 301,
        obligationType: "VAT",
        label: "IVA trimestral",
        concept: "Liquidación Q2",
        counterpartyName: "Cliente Norte",
        sourceDocumentType: "INVOICE",
        effectiveDate: "2026-04-10",
        periodYear: 2026,
        periodMonth: 4,
        amount: 210,
        status: "PENDING_REVIEW",
        matchedUserTaxId: "12345678Z",
        detectedIssuerTaxId: "12345678Z",
        settlementYear: 2026,
        settlementQuarter: 2,
        settlementLabel: "2T 2026",
        dueDate: "2026-05-20",
        notes: null,
      },
    ],
    priorityItems: [
      {
        id: "priority-1",
        category: "documents",
        title: "Factura abril",
        detail: "LLM_PROCESSED · 2026-04-11",
        urgencyLabel: "alta",
        to: "/documents/301",
        actionLabel: "Revisar documento",
      },
    ],
  };
}

function renderDashboardPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <DashboardPage />
    </MemoryRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-04-19T10:00:00.000Z"));
    mockedUseDashboard.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("muestra prioridades, vencimientos fiscales y accesos rápidos al registro afectado", () => {
    mockedUseDashboard.mockReturnValue({
      overview: createOverview(),
      isLoading: false,
      error: null,
      refreshOverview: jest.fn().mockResolvedValue(undefined),
    });

    renderDashboardPage();

    expect(screen.getByText("Bienvenido, Ana Pérez")).toBeVisible();
    expect(screen.getByText("Prioridades inmediatas")).toBeVisible();
    expect(screen.getAllByText("Factura abril")).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Revisar documento" }),
    ).toHaveAttribute("href", "/documents/301");

    expect(screen.getByText("Fiscalidad próxima")).toBeVisible();
    expect(screen.getByText("IVA trimestral")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Abrir documento origen" }),
    ).toHaveAttribute("href", "/documents/301");

    expect(screen.getByText("Documentos a revisar")).toBeVisible();
    expect(screen.getByText("Pagos recurrentes próximos")).toBeVisible();
    expect(screen.getByText("Cuota software")).toBeVisible();
  });

  test("permite refrescar el dashboard desde alertas recientes", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const refreshOverview = jest.fn().mockResolvedValue(undefined);

    mockedUseDashboard.mockReturnValue({
      overview: createOverview(),
      isLoading: false,
      error: null,
      refreshOverview,
    });

    renderDashboardPage();

    await user.click(screen.getByRole("button", { name: "Recargar" }));

    expect(refreshOverview).toHaveBeenCalledTimes(1);
  });
});
