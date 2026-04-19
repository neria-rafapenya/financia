import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { DocumentsPage } from "@/presentation/pages/DocumentsPage";
import type { DocumentDetail } from "@/domain/interfaces/document.interface";
import { useDocuments } from "@/application/contexts/DocumentsContext";

jest.mock("@/application/contexts/DocumentsContext", () => ({
  useDocuments: jest.fn(),
}));

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: jest.fn(),
}));

type MockedUseDocuments = jest.MockedFunction<typeof useDocuments>;

const mockedUseDocuments = useDocuments as MockedUseDocuments;
const createObjectURLMock = jest.fn(() => "blob:preview-image");
const revokeObjectURLMock = jest.fn();

function createBaseDocumentDetail(
  overrides: Partial<DocumentDetail> = {},
): DocumentDetail {
  return {
    id: 101,
    userId: 1,
    documentType: "INVOICE",
    displayLabel: null,
    displayName: "Factura abril 2026",
    originalFilename: "factura-abril.pdf",
    mimeType: "application/pdf",
    storagePath: "/documents/factura-abril.pdf",
    fileSizeBytes: 2048,
    documentDate: "2026-04-19",
    status: "PROCESSED",
    linkedEntityType: null,
    linkedEntityId: null,
    notes: null,
    createdAt: "2026-04-19T10:00:00.000Z",
    updatedAt: "2026-04-19T10:00:00.000Z",
    ocrResults: [
      {
        id: 201,
        documentId: 101,
        ocrProvider: "tesseract",
        rawText: "Factura proveedor Acme. Base 100. IVA 21.",
        confidenceScore: 0.93,
        processedAt: "2026-04-19T10:00:02.000Z",
      },
    ],
    llmResults: [
      {
        id: 301,
        documentId: 101,
        ocrResultId: 201,
        llmProvider: "OpenAI",
        modelName: "gpt-4o-mini",
        promptVersion: "v1",
        rawResponse: "{}",
        parsedJson: {
          summary: "Factura detectada del proveedor Acme SA.",
          extractedFields: {
            vendorName: "Acme SA",
            totalAmount: 121,
          },
          detectedIssues: ["IVA pendiente de validacion manual."],
          confidenceSummary: "Alta",
        },
        confidenceSummary: "Alta",
        processedAt: "2026-04-19T10:00:03.000Z",
      },
    ],
    fieldValues: [],
    ...overrides,
  };
}

function createDocumentsContextValue(
  overrides: Partial<ReturnType<typeof useDocuments>> = {},
) {
  return {
    documents: [],
    selectedDocument: null,
    isLoading: false,
    isSubmitting: false,
    isAnalyzing: false,
    analyzingDocumentId: null,
    isDeleting: false,
    error: null,
    refreshDocuments: jest.fn().mockResolvedValue(undefined),
    selectDocument: jest.fn().mockResolvedValue(undefined),
    deleteDocument: jest.fn().mockResolvedValue(false),
    updateDocument: jest.fn().mockResolvedValue(null),
    uploadAndAnalyzeDocument: jest.fn().mockResolvedValue(null),
    analyzeDocument: jest.fn().mockResolvedValue(null),
    getDocumentFileBlob: jest.fn().mockResolvedValue(new Blob()),
    ...overrides,
  };
}

function renderDocumentsPage(
  initialEntries = ["/documents"],
  routePath = "/documents",
) {
  return render(
    <MemoryRouter
      initialEntries={initialEntries}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path={routePath} element={<DocumentsPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("DocumentsPage", () => {
  beforeEach(() => {
    mockedUseDocuments.mockReset();
    createObjectURLMock.mockClear();
    revokeObjectURLMock.mockClear();
    URL.createObjectURL = createObjectURLMock;
    URL.revokeObjectURL = revokeObjectURLMock;
  });

  test("el area de drag de documentos puede recibir y cargar un preview del documento", async () => {
    mockedUseDocuments.mockReturnValue(createDocumentsContextValue());

    renderDocumentsPage();

    const dropzone = screen
      .getByText("Arrastra un archivo aquí o haz clic para seleccionarlo")
      .closest("label");

    expect(dropzone).not.toBeNull();

    const file = new File(["contenido de factura"], "factura-prueba.pdf", {
      type: "application/pdf",
    });

    fireEvent.dragOver(dropzone as HTMLElement, {
      dataTransfer: { files: [file] },
    });

    expect(dropzone).toHaveClass("documents-dropzone--active");

    fireEvent.drop(dropzone as HTMLElement, {
      dataTransfer: { files: [file] },
    });

    expect(dropzone).not.toHaveClass("documents-dropzone--active");
    expect(
      screen.getByText("Archivo seleccionado: factura-prueba.pdf"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Subir y analizar" }),
    ).toBeEnabled();
  });

  test("muestra un error cuando se intenta cargar un archivo no permitido", async () => {
    mockedUseDocuments.mockReturnValue(createDocumentsContextValue());

    renderDocumentsPage();

    const fileInput = screen.getByLabelText("Archivo");
    const invalidFile = new File(["texto plano"], "nota.txt", {
      type: "text/plain",
    });

    fireEvent.change(fileInput, {
      target: { files: [invalidFile] },
    });

    expect(
      screen.getByText(
        "Tipo de archivo no válido. Formatos permitidos: PDF, DOCX, Pages, JPEG, JPG, PNG, GIF, WEBP, XML y CSV.",
      ),
    ).toBeVisible();
    expect(fileInput).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByRole("button", { name: "Subir y analizar" }),
    ).toBeDisabled();
  });

  test("muestra un error cuando se sueltan múltiples archivos a la vez", () => {
    mockedUseDocuments.mockReturnValue(createDocumentsContextValue());

    renderDocumentsPage();

    const dropzone = screen
      .getByText("Arrastra un archivo aquí o haz clic para seleccionarlo")
      .closest("label");

    expect(dropzone).not.toBeNull();

    const firstFile = new File(["a"], "factura-1.pdf", {
      type: "application/pdf",
    });
    const secondFile = new File(["b"], "factura-2.pdf", {
      type: "application/pdf",
    });

    fireEvent.drop(dropzone as HTMLElement, {
      dataTransfer: { files: [firstFile, secondFile] },
    });

    expect(
      screen.getByText("Debes seleccionar o soltar un único archivo."),
    ).toBeVisible();
    expect(
      screen.queryByText("Archivo seleccionado: factura-1.pdf"),
    ).not.toBeInTheDocument();
    expect(dropzone).toHaveClass("documents-dropzone--error");
  });

  test("al subir un documento aparece el estado de carga de documento que bloquea todo hasta finalizar", async () => {
    const user = userEvent.setup();
    const uploadAndAnalyzeDocument = jest.fn().mockResolvedValue(null);

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({ uploadAndAnalyzeDocument }),
    );

    const view = renderDocumentsPage();
    const fileInput = screen.getByLabelText("Archivo");
    const file = new File(["contenido"], "modelo-111.pdf", {
      type: "application/pdf",
    });

    await user.upload(fileInput, file);
    await user.click(screen.getByRole("button", { name: "Subir y analizar" }));

    expect(uploadAndAnalyzeDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        documentType: "OTHER",
        autoDetectDocumentType: true,
      }),
    );

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({
        isSubmitting: true,
        uploadAndAnalyzeDocument,
      }),
    );

    view.rerender(
      <MemoryRouter
        initialEntries={["/documents"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <DocumentsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByLabelText("Subiendo y procesando documento"),
    ).toBeVisible();
    expect(screen.getByText("Subiendo documento")).toBeVisible();
    expect(
      screen.getByText(
        "Espera mientras se carga el archivo y se ejecuta el procesamiento.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Procesando..." }),
    ).toBeDisabled();
  });

  test("al finalizar el proceso, el LLM devuelve un detalle del OCR del documento en la zona asignada", () => {
    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({
        selectedDocument: createBaseDocumentDetail(),
      }),
    );

    renderDocumentsPage();

    expect(
      screen.getByRole("heading", { name: "Detalle procesado" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Interpretacion LLM" }),
    ).toBeVisible();
    const llmSection = screen
      .getByRole("heading", { name: "Interpretacion LLM" })
      .closest("section");

    expect(llmSection).not.toBeNull();
    expect(
      screen.getByText("OpenAI · gpt-4o-mini · confianza Alta"),
    ).toBeVisible();
    expect(llmSection).toHaveTextContent(
      "Factura detectada del proveedor Acme SA.",
    );
    expect(llmSection).toHaveTextContent("Campos extraídos");
    expect(llmSection).toHaveTextContent("Vendor Name");
    expect(llmSection).toHaveTextContent("Acme SA");
    expect(llmSection).toHaveTextContent("IVA pendiente de validacion manual.");
  });

  test("muestra el detalle de imagen y permite abrir y cerrar el preview modal", async () => {
    const user = userEvent.setup();
    const imageDocument = createBaseDocumentDetail({
      mimeType: "image/png",
      originalFilename: "ticket.png",
      displayName: "Ticket supermercado",
    });
    let resolveBlob: ((value: Blob) => void) | null = null;
    const previewBlobPromise = new Promise<Blob>((resolve) => {
      resolveBlob = resolve;
    });
    const getDocumentFileBlob = jest.fn().mockReturnValue(previewBlobPromise);

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({
        selectedDocument: imageDocument,
        getDocumentFileBlob,
      }),
    );

    renderDocumentsPage(["/documents/101"], "/documents/:documentId");

    expect(
      await screen.findByRole("heading", { name: "Preview de imagen" }),
    ).toBeVisible();
    expect(screen.getByText("Cargando preview...")).toBeVisible();

    resolveBlob?.(new Blob(["image-binary"], { type: "image/png" }));

    const previewButton = await screen.findByRole("button", {
      name: "Ampliar preview de Ticket supermercado",
    });

    expect(getDocumentFileBlob).toHaveBeenCalledWith(101);
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Cargando preview...")).not.toBeInTheDocument();

    await user.click(previewButton);

    expect(
      screen.getByRole("dialog", { name: "Vista ampliada de la imagen" }),
    ).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Cerrar preview ampliado" }),
    );

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Vista ampliada de la imagen" }),
      ).not.toBeInTheDocument();
    });
  });

  test("muestra un warning cuando falla la carga del blob de preview de imagen", async () => {
    const imageDocument = createBaseDocumentDetail({
      mimeType: "image/png",
      originalFilename: "ticket-error.png",
      displayName: "Ticket con error",
    });
    const getDocumentFileBlob = jest
      .fn()
      .mockRejectedValue(new Error("Preview no disponible"));

    mockedUseDocuments.mockReturnValue(
      createDocumentsContextValue({
        selectedDocument: imageDocument,
        getDocumentFileBlob,
      }),
    );

    renderDocumentsPage(["/documents/101"], "/documents/:documentId");

    expect(
      await screen.findByRole("heading", { name: "Preview de imagen" }),
    ).toBeVisible();
    expect(screen.getByText("Cargando preview...")).toBeVisible();

    expect(await screen.findByText("Preview no disponible")).toBeVisible();
    expect(screen.queryByText("Cargando preview...")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Ampliar preview de Ticket con error",
      }),
    ).not.toBeInTheDocument();
    expect(getDocumentFileBlob).toHaveBeenCalledWith(101);
  });
});
