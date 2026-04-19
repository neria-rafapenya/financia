import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useDocuments } from "@/application/contexts/DocumentsContext";
import {
  DOCUMENT_TYPE_OPTIONS,
  type DocumentFieldValue,
  type DocumentRecord,
  getDocumentFieldLabel,
  getDocumentTypeLabel,
} from "@/domain/interfaces/document.interface";
import { DocumentProcessingOverlay } from "@/presentation/components/DocumentProcessingOverlay";
import { PageHero } from "@/presentation/components/PageHero";

const AUTO_DOCUMENT_TYPE = "AUTO";
const ACCEPTED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".pages",
  ".jpeg",
  ".jpg",
  ".png",
  ".gif",
  ".webp",
  ".xml",
  ".csv",
] as const;
const DOCUMENT_ACCEPT_ATTRIBUTE = ACCEPTED_DOCUMENT_EXTENSIONS.join(",");

function toMarkdownLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split("_")
    .join(" ")
    .replace(/\b\w/g, (match: string) => match.toUpperCase());
}

function formatMarkdownValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "No disponible";
  }

  if (typeof value === "boolean") {
    return value ? "Sí" : "No";
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatObjectAsMarkdownList(
  value: Record<string, unknown>,
  indentLevel = 0,
): string[] {
  const indent = "  ".repeat(indentLevel);

  return Object.entries(value).flatMap(([key, entryValue]) => {
    const label = toMarkdownLabel(key);

    if (Array.isArray(entryValue)) {
      if (!entryValue.length) {
        return [`${indent}- **${label}:** Sin datos`];
      }

      const lines = [`${indent}- **${label}:**`];

      for (const item of entryValue) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          lines.push(
            ...formatObjectAsMarkdownList(
              item as Record<string, unknown>,
              indentLevel + 1,
            ),
          );
          continue;
        }

        lines.push(`${indent}  - ${formatMarkdownValue(item)}`);
      }

      return lines;
    }

    if (entryValue && typeof entryValue === "object") {
      return [
        `${indent}- **${label}:**`,
        ...formatObjectAsMarkdownList(
          entryValue as Record<string, unknown>,
          indentLevel + 1,
        ),
      ];
    }

    return [`${indent}- **${label}:** ${formatMarkdownValue(entryValue)}`];
  });
}

function formatDocumentInterpretationMarkdown(
  value: Record<string, unknown> | null,
) {
  if (!value) {
    return "No hay interpretación disponible todavía.";
  }

  const sections: string[] = [];
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const extractedFields =
    value.extractedFields &&
    typeof value.extractedFields === "object" &&
    !Array.isArray(value.extractedFields)
      ? (value.extractedFields as Record<string, unknown>)
      : null;
  const detectedIssues = Array.isArray(value.detectedIssues)
    ? value.detectedIssues.filter(
        (issue): issue is string => typeof issue === "string",
      )
    : [];
  const confidenceSummary =
    typeof value.confidenceSummary === "string"
      ? value.confidenceSummary.trim()
      : "";

  if (summary) {
    sections.push(summary);
  }

  if (extractedFields) {
    sections.push(
      [
        "## Campos extraídos",
        ...formatObjectAsMarkdownList(extractedFields),
      ].join("\n"),
    );
  }

  if (detectedIssues.length) {
    sections.push(
      [
        "## Incidencias detectadas",
        ...detectedIssues.map((issue) => `- ${issue}`),
      ].join("\n"),
    );
  }

  if (confidenceSummary) {
    sections.push(["## Confianza", confidenceSummary].join("\n\n"));
  }

  return sections.join("\n\n");
}

function getFieldSourceLabel(source: string) {
  const labels: Record<string, string> = {
    OCR: "OCR",
    LLM: "LLM",
    RULE: "Regla",
    MANUAL: "Manual",
  };

  return labels[source] ?? source;
}

function getFieldSourceBadgeClass(source: string) {
  const classes: Record<string, string> = {
    OCR: "documents-badge documents-badge--source-ocr",
    LLM: "documents-badge documents-badge--source-llm",
    RULE: "documents-badge documents-badge--source-rule",
    MANUAL: "documents-badge documents-badge--source-manual",
  };

  return classes[source] ?? "documents-badge documents-badge--neutral";
}

function getConfidenceBadgeClass(confidenceLevel: string) {
  const classes: Record<string, string> = {
    HIGH: "documents-badge documents-badge--confidence-high",
    MEDIUM: "documents-badge documents-badge--confidence-medium",
    LOW: "documents-badge documents-badge--confidence-low",
  };

  return classes[confidenceLevel] ?? "documents-badge documents-badge--neutral";
}

function getConfidenceLabel(confidenceLevel: string) {
  const labels: Record<string, string> = {
    HIGH: "Alta",
    MEDIUM: "Media",
    LOW: "Baja",
  };

  return labels[confidenceLevel] ?? confidenceLevel;
}

function getFileExtension(filename: string) {
  const extensionIndex = filename.lastIndexOf(".");

  if (extensionIndex < 0) {
    return "";
  }

  return filename.slice(extensionIndex).toLowerCase();
}

function validateSelectedFiles(files: FileList | File[]) {
  if (files.length !== 1) {
    return {
      file: null,
      error: "Debes seleccionar o soltar un único archivo.",
    };
  }

  const [candidateFile] = Array.from(files);
  const extension = getFileExtension(candidateFile.name);

  if (!ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension as never)) {
    return {
      file: null,
      error:
        "Tipo de archivo no válido. Formatos permitidos: PDF, DOCX, Pages, JPEG, JPG, PNG, GIF, WEBP, XML y CSV.",
    };
  }

  return {
    file: candidateFile,
    error: null,
  };
}

export function DocumentsPage() {
  const {
    documents,
    selectedDocument,
    isSubmitting,
    isAnalyzing,
    error,
    selectDocument,
    uploadAndAnalyzeDocument,
    getDocumentFileBlob,
  } = useDocuments();
  const { documentId } = useParams<{ documentId?: string }>();
  const isDetailPage = Boolean(documentId);
  const [file, setFile] = useState<File | null>(null);
  const [uploadValidationError, setUploadValidationError] = useState<
    string | null
  >(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [documentType, setDocumentType] = useState<string>(AUTO_DOCUMENT_TYPE);
  const [documentDate, setDocumentDate] = useState("");
  const [notes, setNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [shouldScrollToInterpretation, setShouldScrollToInterpretation] =
    useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewImageError, setPreviewImageError] = useState<string | null>(
    null,
  );
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const llmSectionRef = useRef<HTMLElement | null>(null);

  const latestLlmResult = selectedDocument?.llmResults[0] ?? null;
  const persistedFieldValues = selectedDocument?.fieldValues ?? [];
  const isUploadOverlayVisible = isSubmitting || isAnalyzing;
  const llmMarkdown = formatDocumentInterpretationMarkdown(
    latestLlmResult?.parsedJson ?? null,
  );
  const isImageDocument =
    selectedDocument?.mimeType.startsWith("image/") ?? false;
  const shouldShowImagePreview = isDetailPage && isImageDocument;

  useEffect(() => {
    if (!shouldScrollToInterpretation || !selectedDocument) {
      return;
    }

    llmSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setShouldScrollToInterpretation(false);
  }, [selectedDocument, shouldScrollToInterpretation]);

  useEffect(() => {
    if (!documentId) {
      return;
    }

    const parsedDocumentId = Number(documentId);

    if (!Number.isInteger(parsedDocumentId)) {
      return;
    }

    if (selectedDocument?.id === parsedDocumentId) {
      return;
    }

    void selectDocument(parsedDocumentId);
  }, [documentId, selectDocument, selectedDocument?.id]);

  useEffect(() => {
    if (!selectedDocument || !shouldShowImagePreview) {
      setPreviewImageError(null);
      setPreviewImageUrl((currentValue) => {
        if (currentValue) {
          URL.revokeObjectURL(currentValue);
        }

        return null;
      });
      setIsPreviewLoading(false);
      return;
    }

    let isActive = true;

    setIsPreviewLoading(true);
    setPreviewImageError(null);

    void getDocumentFileBlob(selectedDocument.id)
      .then((imageBlob) => {
        if (!isActive) {
          return;
        }

        const nextUrl = URL.createObjectURL(imageBlob);
        setPreviewImageUrl((currentValue) => {
          if (currentValue) {
            URL.revokeObjectURL(currentValue);
          }

          return nextUrl;
        });
      })
      .catch((caughtError) => {
        if (!isActive) {
          return;
        }

        setPreviewImageError(
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo cargar la previsualización de la imagen.",
        );
      })
      .finally(() => {
        if (isActive) {
          setIsPreviewLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [getDocumentFileBlob, selectedDocument, shouldShowImagePreview]);

  useEffect(() => {
    if (shouldShowImagePreview) {
      return;
    }

    setIsPreviewModalOpen(false);
  }, [shouldShowImagePreview]);

  useEffect(() => {
    if (!isPreviewModalOpen) {
      return;
    }

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPreviewModalOpen(false);
      }
    };

    globalThis.addEventListener("keydown", handleEscape);

    return () => {
      globalThis.removeEventListener("keydown", handleEscape);
    };
  }, [isPreviewModalOpen]);

  const handleFileSelection = (files: FileList | File[]) => {
    const validation = validateSelectedFiles(files);

    setUploadValidationError(validation.error);
    setFile(validation.file);

    if (!validation.file && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.currentTarget.files) {
      return;
    }

    handleFileSelection(event.currentTarget.files);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    handleFileSelection(event.dataTransfer.files);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragActive(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setUploadValidationError(
        "Selecciona un único archivo válido antes de iniciar la carga.",
      );
      return;
    }

    const detail = await uploadAndAnalyzeDocument({
      file,
      documentType:
        documentType === AUTO_DOCUMENT_TYPE ? "OTHER" : documentType,
      documentDate: documentDate || undefined,
      notes: notes || undefined,
      instructions: instructions || undefined,
      autoDetectDocumentType: documentType === AUTO_DOCUMENT_TYPE,
    });

    if (detail) {
      setShouldScrollToInterpretation(true);
      setFile(null);
      setUploadValidationError(null);
      setDocumentType(AUTO_DOCUMENT_TYPE);
      setDocumentDate("");
      setNotes("");
      setInstructions("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const detailContent = selectedDocument ? (
    <div className="d-grid gap-4">
      <div className="row g-3">
        <div className="col-12 col-md-6">
          <div className="border rounded-3 p-3 h-100 bg-light-subtle">
            <div className="small text-secondary mb-1">Referencia</div>
            <strong>{selectedDocument.displayName}</strong>
            <div className="small text-secondary mt-2">
              {selectedDocument.originalFilename}
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="border rounded-3 p-3 h-100 bg-light-subtle">
            <div className="small text-secondary mb-1">Estado</div>
            <strong>{selectedDocument.status}</strong>
            <div className="small text-secondary mt-2">
              {selectedDocument.documentDate ?? "Sin fecha documental"}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="h6 text-uppercase text-secondary mb-2">
          Campos persistidos
        </h3>
        <div className="border rounded-3 p-3 bg-body-tertiary">
          {persistedFieldValues.length ? (
            <div className="table-responsive">
              <table className="table table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th>Campo</th>
                    <th>Valor</th>
                    <th>Origen</th>
                    <th>Confianza</th>
                  </tr>
                </thead>
                <tbody>
                  {persistedFieldValues.map(
                    (fieldValue: DocumentFieldValue) => (
                      <tr key={fieldValue.id}>
                        <td>{getDocumentFieldLabel(fieldValue.fieldName)}</td>
                        <td>{fieldValue.fieldValue ?? "Sin valor"}</td>
                        <td>
                          <span
                            className={getFieldSourceBadgeClass(
                              fieldValue.source,
                            )}
                          >
                            {getFieldSourceLabel(fieldValue.source)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={getConfidenceBadgeClass(
                              fieldValue.confidenceLevel,
                            )}
                          >
                            {getConfidenceLabel(fieldValue.confidenceLevel)}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mb-0 small text-secondary">
              Todavía no hay campos persistidos para este documento.
            </p>
          )}
        </div>
      </div>

      <div className="row g-4 align-items-start">
        {shouldShowImagePreview ? (
          <div className="col-12 col-md-4">
            <section>
              <h3 className="h6 text-uppercase text-secondary mb-2">
                Preview de imagen
              </h3>
              <div className="documents-image-preview h-100">
                {isPreviewLoading ? (
                  <p className="mb-0 text-secondary">Cargando preview...</p>
                ) : null}

                {!isPreviewLoading && previewImageError ? (
                  <div className="alert alert-warning mb-0">
                    {previewImageError}
                  </div>
                ) : null}

                {!isPreviewLoading && !previewImageError && previewImageUrl ? (
                  <button
                    type="button"
                    className="documents-image-preview__button"
                    onClick={() => setIsPreviewModalOpen(true)}
                    aria-label={`Ampliar preview de ${selectedDocument.displayName}`}
                  >
                    <img
                      src={previewImageUrl}
                      alt={selectedDocument.displayName}
                      className="documents-image-preview__image"
                    />
                    <span className="documents-image-preview__hint">
                      Clic para ampliar
                    </span>
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        <div className={shouldShowImagePreview ? "col-12 col-md-8" : "col-12"}>
          <section ref={llmSectionRef} id="document-llm-interpretation">
            <h3 className="h6 text-uppercase text-secondary mb-2">
              Interpretacion LLM
            </h3>
            <div className="border rounded-3 p-3 bg-body-tertiary documents-markdown-output h-100">
              <div className="small text-secondary mb-2">
                {latestLlmResult
                  ? `${latestLlmResult.llmProvider} · ${latestLlmResult.modelName} · confianza ${latestLlmResult.confidenceSummary ?? "n/d"}`
                  : "Sin resultado LLM"}
              </div>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {llmMarkdown}
              </ReactMarkdown>
            </div>
          </section>
        </div>
      </div>
    </div>
  ) : (
    <p className="mb-0 text-secondary">
      Selecciona un documento para ver su detalle completo.
    </p>
  );

  if (isDetailPage) {
    return (
      <div className="page-stack">
        {isPreviewModalOpen && previewImageUrl ? (
          <dialog
            open
            className="documents-image-modal"
            aria-label="Vista ampliada de la imagen"
          >
            <button
              type="button"
              className="documents-image-modal__close"
              onClick={() => setIsPreviewModalOpen(false)}
              aria-label="Cerrar preview ampliado"
            >
              Cerrar
            </button>
            <div className="documents-image-modal__panel">
              <img
                src={previewImageUrl}
                alt={selectedDocument?.displayName ?? "Preview del documento"}
                className="documents-image-modal__image"
              />
            </div>
          </dialog>
        ) : null}

        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-3">
            <li className="breadcrumb-item">
              <Link to="/documents">Documentos</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              Detalle
            </li>
          </ol>
        </nav>

        {error ? <div className="alert alert-danger mb-0">{error}</div> : null}

        <section className="card border-0 shadow-sm">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1">Detalle procesado</h2>
                <p className="text-secondary mb-0">
                  OCR más reciente, clasificación inferida y JSON interpretado.
                </p>
              </div>
              {selectedDocument ? (
                <span className="badge text-bg-dark">
                  {getDocumentTypeLabel(selectedDocument.documentType)}
                </span>
              ) : null}
            </div>

            {detailContent}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {isUploadOverlayVisible ? (
        <DocumentProcessingOverlay
          title={isSubmitting ? "Subiendo documento" : "Reprocesando documento"}
          message={
            isSubmitting
              ? "Espera mientras se carga el archivo y se ejecuta el procesamiento."
              : "Espera mientras se ejecuta de nuevo el OCR y la interpretación del documento."
          }
          ariaLabel={
            isSubmitting
              ? "Subiendo y procesando documento"
              : "Reprocesando documento"
          }
        />
      ) : null}

      <PageHero
        title="Documentos"
        description="Subida, OCR, clasificación automática por LLM e interpretación documental desde la API privada."
        meta="OCR + LLM"
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
            <div>
              <h2 className="h4 mb-1">Nueva carga documental</h2>
              <p className="text-secondary mb-0">
                La carga ejecuta OCR y después interpreta el documento con
                clasificación automática cuando el tipo se deja en modo auto.
              </p>
            </div>
            <div className="text-end">
              <span className="badge text-bg-light border">OCR + LLM</span>
            </div>
          </div>

          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-12 col-lg-6">
              <label className="form-label" htmlFor="document-upload-file">
                Archivo
              </label>
              <label
                htmlFor="document-upload-file"
                className={`documents-dropzone ${isDragActive ? "documents-dropzone--active" : ""} ${uploadValidationError ? "documents-dropzone--error" : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  id="document-upload-file"
                  ref={fileInputRef}
                  type="file"
                  className="documents-dropzone__input"
                  accept={DOCUMENT_ACCEPT_ATTRIBUTE}
                  onChange={handleFileInputChange}
                  aria-invalid={uploadValidationError ? "true" : "false"}
                />
                <span className="documents-dropzone__title">
                  Arrastra un archivo aquí o haz clic para seleccionarlo
                </span>
                <span className="documents-dropzone__subtitle">
                  Formatos válidos: PDF, DOCX, Pages, JPEG, JPG, PNG, GIF, WEBP,
                  XML, CSV.
                </span>
                <span className="documents-dropzone__subtitle">
                  Solo se admite un archivo por carga.
                </span>
                {file ? (
                  <span className="documents-dropzone__file">
                    Archivo seleccionado: {file.name}
                  </span>
                ) : null}
              </label>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label" htmlFor="document-upload-type">
                Tipo documental
              </label>
              <select
                id="document-upload-type"
                className="form-select"
                value={documentType}
                onChange={(event) => setDocumentType(event.currentTarget.value)}
              >
                <option value={AUTO_DOCUMENT_TYPE}>
                  Detectar automaticamente
                </option>
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getDocumentTypeLabel(option)}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label" htmlFor="document-upload-date">
                Fecha del documento
              </label>
              <input
                id="document-upload-date"
                type="date"
                className="form-control"
                value={documentDate}
                onChange={(event) => setDocumentDate(event.currentTarget.value)}
              />
            </div>

            <div className="col-12 col-lg-6">
              <label className="form-label" htmlFor="document-upload-notes">
                Notas
              </label>
              <input
                id="document-upload-notes"
                type="text"
                className="form-control"
                value={notes}
                onChange={(event) => setNotes(event.currentTarget.value)}
                placeholder="Contexto interno, proveedor, observaciones..."
              />
            </div>

            <div className="col-12 col-lg-6">
              <label
                className="form-label"
                htmlFor="document-upload-instructions"
              >
                Instrucciones para el LLM
              </label>
              <input
                id="document-upload-instructions"
                type="text"
                className="form-control"
                value={instructions}
                onChange={(event) => setInstructions(event.currentTarget.value)}
                placeholder="Ejemplo: extrae importes y posibles incidencias fiscales"
              />
            </div>

            <div className="col-12 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-dark"
                disabled={!file || isSubmitting}
              >
                {isSubmitting ? "Procesando..." : "Subir y analizar"}
              </button>
            </div>
          </form>

          {uploadValidationError ? (
            <div className="alert alert-danger mt-4 mb-0">
              {uploadValidationError}
            </div>
          ) : null}

          {error ? (
            <div className="alert alert-danger mt-4 mb-0">{error}</div>
          ) : null}
        </div>
      </section>

      <section className="row g-4 align-items-start">
        <div className="col-12 col-xl-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Últimos documentos</h2>
                  <p className="text-secondary mb-0">
                    Acceso al listado independiente de documentos.
                  </p>
                </div>
                <span className="badge text-bg-light border">Archivo</span>
              </div>

              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Archivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <Link to="/documents/repository">
                          Abrir listado documental
                        </Link>
                      </td>
                    </tr>
                    {documents.map((document: DocumentRecord) => (
                      <tr key={document.id}>
                        <td>{document.displayName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                <div>
                  <h2 className="h4 mb-1">Detalle procesado</h2>
                  <p className="text-secondary mb-0">
                    OCR más reciente, clasificación inferida y JSON
                    interpretado.
                  </p>
                </div>
                {selectedDocument ? (
                  <span className="badge text-bg-dark">
                    {getDocumentTypeLabel(selectedDocument.documentType)}
                  </span>
                ) : null}
              </div>

              {detailContent}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
