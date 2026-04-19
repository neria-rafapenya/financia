import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { useDocuments } from "@/application/contexts/DocumentsContext";
import type {
  DocumentDetail,
  DocumentRecord,
} from "@/domain/interfaces/document.interface";

const mockNavigate = jest.fn();

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

jest.mock("@/application/contexts/DocumentsContext", () => ({
  useDocuments: jest.fn(),
}));

jest.mock("@/domain/interfaces/document.interface", () => ({
  getDocumentTypeLabel: (value: string) => value,
}));

import { DocumentRepositoryPage } from "@/presentation/pages/DocumentRepositoryPage";

const mockedUseDocuments = useDocuments as jest.MockedFunction<
  typeof useDocuments
>;

function createDocuments(): DocumentRecord[] {
  return [
    {
      id: 101,
      userId: 1,
      documentType: "INVOICE",
      displayLabel: null,
      displayName: "Factura abril",
      originalFilename: "factura-abril.pdf",
      mimeType: "application/pdf",
      storagePath: "/documents/factura-abril.pdf",
      fileSizeBytes: 2048,
      documentDate: "2026-04-15",
      status: "PROCESSED",
      linkedEntityType: "INCOME",
      linkedEntityId: 12,
      notes: "Pendiente de verificación",
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: "2026-04-19T08:00:00.000Z",
    },
    {
      id: 102,
      userId: 1,
      documentType: "CONTRACT",
      displayLabel: null,
      displayName: "Contrato alquiler",
      originalFilename: "contrato-alquiler.pdf",
      mimeType: "application/pdf",
      storagePath: "/documents/contrato-alquiler.pdf",
      fileSizeBytes: 4096,
      documentDate: "2026-03-01",
      status: "VERIFIED",
      linkedEntityType: "CONTRACT",
      linkedEntityId: 44,
      notes: null,
      createdAt: "2026-04-19T08:00:00.000Z",
      updatedAt: "2026-04-19T08:00:00.000Z",
    },
  ];
}

function createDetail(documentId: number): DocumentDetail {
  const record = createDocuments().find(
    (document) => document.id === documentId,
  );

  if (!record) {
    throw new Error(`Documento no encontrado en el mock: ${documentId}`);
  }

  return {
    ...record,
    ocrResults: [],
    llmResults: [],
    fieldValues: [],
  };
}

function createDocumentsContextValue(
  overrides: Partial<ReturnType<typeof useDocuments>> = {},
) {
  return {
    documents: createDocuments(),
    selectedDocument: null,
    isLoading: false,
    isSubmitting: false,
    isAnalyzing: false,
    analyzingDocumentId: null,
    isDeleting: false,
    error: null,
    refreshDocuments: jest.fn().mockResolvedValue(undefined),
    selectDocument: jest.fn().mockResolvedValue(undefined),
    deleteDocument: jest.fn().mockResolvedValue(true),
    updateDocument: jest.fn().mockResolvedValue(createDetail(101)),
    uploadAndAnalyzeDocument: jest.fn().mockResolvedValue(null),
    analyzeDocument: jest.fn().mockResolvedValue(createDetail(101)),
    getDocumentFileBlob: jest.fn().mockResolvedValue(new Blob()),
    ...overrides,
  };
}

function renderDocumentRepositoryPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <DocumentRepositoryPage />
    </MemoryRouter>,
  );
}

describe("DocumentRepositoryPage", () => {
  beforeEach(() => {
    mockedUseDocuments.mockReset();
    mockNavigate.mockReset();
  });

  test("filtra documentos y permite renombrar el label operativo", async () => {
    const user = userEvent.setup();
    const updateDocument = jest.fn().mockResolvedValue(createDetail(101));

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({ updateDocument }),
    );

    renderDocumentRepositoryPage();

    await user.type(
      screen.getByPlaceholderText("Buscar por nombre, archivo o nota"),
      "factura",
    );

    expect(screen.getByText("Total visibles").closest("div")).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Factura abril")).toBeVisible();
    expect(screen.queryByText("Contrato alquiler")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Editar nombre de Factura abril" }),
    );

    const nameInput = screen.getByDisplayValue("Factura abril");
    await user.clear(nameInput);
    await user.type(nameInput, "Factura abril validada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => {
      expect(updateDocument).toHaveBeenCalledWith({
        documentId: 101,
        displayLabel: "Factura abril validada",
      });
    });
  });

  test("permite ir al detalle, reanalizar y eliminar un documento", async () => {
    const user = userEvent.setup();
    const selectDocument = jest.fn().mockResolvedValue(undefined);
    const analyzeDocument = jest.fn().mockResolvedValue(createDetail(101));
    const deleteDocument = jest.fn().mockResolvedValue(true);
    const confirmSpy = jest.spyOn(globalThis, "confirm").mockReturnValue(true);

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({
        selectDocument,
        analyzeDocument,
        deleteDocument,
      }),
    );

    renderDocumentRepositoryPage();

    const detailButtons = screen.getAllByRole("button", {
      name: "Ver detalle",
    });
    await user.click(detailButtons[0]);

    await waitFor(() => {
      expect(selectDocument).toHaveBeenCalledWith(101);
      expect(mockNavigate).toHaveBeenCalledWith("/documents/101");
    });

    const reanalyzeButtons = screen.getAllByRole("button", {
      name: "Reanalizar",
    });
    await user.click(reanalyzeButtons[0]);

    await waitFor(() => {
      expect(analyzeDocument).toHaveBeenCalledWith({
        documentId: 101,
        autoDetectDocumentType: false,
      });
    });

    const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" });
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteDocument).toHaveBeenCalledWith(101);
    });

    confirmSpy.mockRestore();
  });
});
