import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDocuments } from "@/application/contexts/DocumentsContext";
import type { DocumentRecord } from "@/domain/interfaces/document.interface";
import { getDocumentTypeLabel } from "@/domain/interfaces/document.interface";
import { DocumentProcessingOverlay } from "@/presentation/components/DocumentProcessingOverlay";
import { LoadingPanel } from "@/presentation/components/LoadingPanel";
import { PageHero } from "@/presentation/components/PageHero";

const LABOR_DOCUMENT_TYPES = [
  "PAYSLIP",
  "RETENTION_CERTIFICATE",
  "CONTRACT",
] as const;

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function getTypeCount(documents: DocumentRecord[], documentType: string) {
  return documents.filter((document) => document.documentType === documentType)
    .length;
}

export function LaborDocumentsPage() {
  const {
    documents,
    isLoading,
    isAnalyzing,
    analyzingDocumentId,
    isDeleting,
    error,
    refreshDocuments,
    selectDocument,
    deleteDocument,
    analyzeDocument,
  } = useDocuments();
  const navigate = useNavigate();

  const laborDocuments = useMemo(
    () =>
      documents.filter((document) =>
        LABOR_DOCUMENT_TYPES.includes(document.documentType as never),
      ),
    [documents],
  );

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
        title="Documentos Laborales"
        description="Vista rápida de nóminas, contratos y certificados de retenciones para revisar tu trazabilidad laboral sin mezclarla con otros documentos."
        meta={`${laborDocuments.length} documentos`}
      />

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="metric-box">
                <span>Nóminas</span>
                <strong>{getTypeCount(laborDocuments, "PAYSLIP")}</strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Certificados</span>
                <strong>
                  {getTypeCount(laborDocuments, "RETENTION_CERTIFICATE")}
                </strong>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-box">
                <span>Contratos</span>
                <strong>{getTypeCount(laborDocuments, "CONTRACT")}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
            <div>
              <h2 className="h4 mb-1">Repositorio laboral</h2>
              <p className="text-secondary mb-0">
                Revisa solo la documentación vinculada a empleo y relaciones
                laborales.
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

          {error ? (
            <div className="alert alert-danger mb-3">{error}</div>
          ) : null}

          {isLoading ? (
            <LoadingPanel message="Cargando documentos laborales..." />
          ) : null}

          {!isLoading && !laborDocuments.length ? (
            <p className="mb-0 text-secondary">
              Todavía no hay nóminas, contratos o certificados clasificados en
              el repositorio.
            </p>
          ) : null}

          {laborDocuments.length ? (
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Archivo</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {laborDocuments.map((document) => (
                    <tr key={document.id}>
                      <td>{formatDate(document.documentDate)}</td>
                      <td>
                        <strong className="d-block">
                          {document.displayName}
                        </strong>
                        <small className="text-secondary">
                          {document.originalFilename}
                        </small>
                      </td>
                      <td>{getDocumentTypeLabel(document.documentType)}</td>
                      <td>{document.status}</td>
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
