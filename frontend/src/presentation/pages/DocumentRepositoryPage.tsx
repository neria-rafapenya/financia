import { useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/application/contexts/DocumentsContext";
import type { DocumentRecord } from "@/domain/interfaces/document.interface";
import { getDocumentTypeLabel } from "@/domain/interfaces/document.interface";
import { DocumentProcessingOverlay } from "@/presentation/components/DocumentProcessingOverlay";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M11.7 1.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-8.8 8.8-3.4.6.6-3.4 8.6-9zM10.3 2.7 4 9l-.3 1.7 1.7-.3 6.3-6.3-1.4-1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function isKeyboardEditTrigger(event: KeyboardEvent<HTMLButtonElement>) {
  return event.key === "Enter" || event.key === " ";
}

export function DocumentRepositoryPage() {
  const {
    documents,
    isLoading,
    isSubmitting,
    isAnalyzing,
    analyzingDocumentId,
    isDeleting,
    error,
    refreshDocuments,
    selectDocument,
    deleteDocument,
    updateDocument,
    analyzeDocument,
  } = useDocuments();
  const navigate = useNavigate();
  const [editingDocumentId, setEditingDocumentId] = useState<number | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const documentTypeOptions = useMemo(
    () => [
      "ALL",
      ...Array.from(
        new Set(documents.map((document) => document.documentType)),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [documents],
  );

  const statusOptions = useMemo(
    () => [
      "ALL",
      ...Array.from(new Set(documents.map((document) => document.status))).sort(
        (left, right) => left.localeCompare(right),
      ),
    ],
    [documents],
  );

  const filteredDocuments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return documents.filter((document) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        document.displayName.toLowerCase().includes(normalizedSearch) ||
        document.originalFilename.toLowerCase().includes(normalizedSearch) ||
        (document.notes ?? "").toLowerCase().includes(normalizedSearch);
      const matchesType =
        typeFilter === "ALL" || document.documentType === typeFilter;
      const matchesStatus =
        statusFilter === "ALL" || document.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, search, statusFilter, typeFilter]);

  const startEditingDocument = (document: DocumentRecord) => {
    setEditingDocumentId(document.id);
    setEditingName(document.displayName);
  };

  const cancelEditingDocument = () => {
    setEditingDocumentId(null);
    setEditingName("");
  };

  const handleSaveDocumentName = async (document: DocumentRecord) => {
    const nextName = editingName.trim();

    if (!nextName || nextName === document.displayName) {
      cancelEditingDocument();
      return;
    }

    const updatedDocument = await updateDocument({
      documentId: document.id,
      displayLabel: nextName,
    });

    if (updatedDocument) {
      cancelEditingDocument();
    }
  };

  const handleEditingNameKeyDown = async (
    event: KeyboardEvent<HTMLInputElement>,
    document: DocumentRecord,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await handleSaveDocumentName(document);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelEditingDocument();
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    const confirmed = globalThis.confirm(
      "Se eliminará el documento y todos sus resultados OCR, LLM y campos persistidos. ¿Continuar?",
    );

    if (!confirmed) {
      return;
    }

    await deleteDocument(documentId);
  };

  return (
    <div className="page-stack">
      {isAnalyzing ? (
        <DocumentProcessingOverlay
          title="Reprocesando documento"
          message="Espera mientras se ejecuta de nuevo el OCR y la interpretación del documento."
          ariaLabel="Reprocesando documento"
        />
      ) : null}

      <PageHero
        title="Repositorio documental"
        description="Listado independiente de documentos procesados."
        meta="Listado"
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h4 mb-1">Listado documental</h2>
              <p className="text-secondary mb-0">
                Consulta los archivos disponibles y accede a su detalle desde la
                pantalla principal.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline-dark"
              onClick={() => void refreshDocuments()}
              disabled={isLoading}
            >
              Recargar listado
            </button>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-lg-5">
              <input
                type="search"
                className="form-control"
                placeholder="Buscar por nombre, archivo o nota"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </div>
            <div className="col-12 col-lg-3">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.currentTarget.value)}
              >
                {documentTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL"
                      ? "Todos los tipos"
                      : getDocumentTypeLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.currentTarget.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "ALL" ? "Todos los estados" : option}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12 col-lg-1 d-grid">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("ALL");
                  setStatusFilter("ALL");
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="metric-box">
                <span>Total visibles</span>
                <strong>{filteredDocuments.length}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Pendientes de verificar</span>
                <strong>
                  {
                    filteredDocuments.filter(
                      (document) => document.status !== "VERIFIED",
                    ).length
                  }
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Con entidad vinculada</span>
                <strong>
                  {
                    filteredDocuments.filter((document) =>
                      Boolean(document.linkedEntityType),
                    ).length
                  }
                </strong>
              </div>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger mb-3">{error}</div>
          ) : null}

          {isLoading ? <LoadingPanel message="Cargando documentos..." /> : null}

          {!isLoading && filteredDocuments.length === 0 ? (
            <p className="mb-0 text-secondary">
              No hay documentos que encajen con los filtros actuales.
            </p>
          ) : null}

          {filteredDocuments.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Trazabilidad</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((document: DocumentRecord) => (
                    <tr key={document.id}>
                      <td>
                        {editingDocumentId === document.id ? (
                          <div className="d-flex flex-column gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={editingName}
                              onChange={(event) =>
                                setEditingName(event.target.value)
                              }
                              onKeyDown={(event) =>
                                void handleEditingNameKeyDown(event, document)
                              }
                              onBlur={() => {
                                void handleSaveDocumentName(document);
                              }}
                              maxLength={255}
                              autoFocus
                            />
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-dark btn-sm"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={() =>
                                  void handleSaveDocumentName(document)
                                }
                                disabled={isSubmitting}
                              >
                                Guardar
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                }}
                                onClick={cancelEditingDocument}
                                disabled={isSubmitting}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="document-file-trigger">
                            <button
                              type="button"
                              className="document-file-trigger__label"
                              onDoubleClick={() =>
                                startEditingDocument(document)
                              }
                              onKeyDown={(event) => {
                                if (!isKeyboardEditTrigger(event)) {
                                  return;
                                }

                                event.preventDefault();
                                startEditingDocument(document);
                              }}
                              title="Doble clic para editar el label"
                              aria-label={`Editar label de ${document.displayName}`}
                            >
                              <strong className="d-block">
                                {document.displayName}
                              </strong>
                              <small className="text-secondary d-block">
                                {document.originalFilename}
                              </small>
                            </button>
                            <button
                              type="button"
                              className="document-file-trigger__edit"
                              onClick={(event) => {
                                event.stopPropagation();
                                startEditingDocument(document);
                              }}
                              title="Editar nombre"
                              aria-label={`Editar nombre de ${document.displayName}`}
                            >
                              <EditIcon />
                            </button>
                          </div>
                        )}
                        <small className="text-secondary">
                          {document.documentDate ?? "Sin fecha"}
                        </small>
                      </td>
                      <td>{getDocumentTypeLabel(document.documentType)}</td>
                      <td>{document.status}</td>
                      <td>
                        <strong className="d-block">
                          {document.linkedEntityType ?? "Sin entidad vinculada"}
                        </strong>
                        <small className="text-secondary">
                          {document.linkedEntityId
                            ? `ID ${document.linkedEntityId}`
                            : (document.notes ??
                              "Sin rastro operativo adicional")}
                        </small>
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-outline-dark btn-sm"
                            onClick={async () => {
                              await selectDocument(document.id);
                              navigate(`/documents/${document.id}`);
                            }}
                          >
                            Ver detalle
                          </button>
                          <button
                            type="button"
                            className="btn btn-dark btn-sm"
                            onClick={async () => {
                              const detail = await analyzeDocument({
                                documentId: document.id,
                                autoDetectDocumentType:
                                  document.documentType === "OTHER" ||
                                  document.documentType === "SCREENSHOT",
                              });

                              if (detail) {
                                navigate(`/documents/${document.id}`);
                              }
                            }}
                            disabled={
                              isAnalyzing && analyzingDocumentId !== document.id
                            }
                          >
                            {analyzingDocumentId === document.id
                              ? "Procesando"
                              : "Reanalizar"}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() =>
                              void handleDeleteDocument(document.id)
                            }
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Eliminando" : "Eliminar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
