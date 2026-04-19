import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { DocumentsService } from "@/application/services/DocumentsService";
import type {
  AnalyzeDocumentInput,
  DocumentDetail,
  DocumentRecord,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "@/domain/interfaces/document.interface";
import { DocumentsRepository } from "@/infrastructure/repositories/DocumentsRepository";
import {
  clearLastSelectedDocumentId,
  getLastSelectedDocumentId,
  setLastSelectedDocumentId,
} from "@/shared/storage/localStorage";
import { useAuth } from "./AuthContext";

interface DocumentsContextValue {
  documents: DocumentRecord[];
  selectedDocument: DocumentDetail | null;
  isLoading: boolean;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  analyzingDocumentId: number | null;
  isDeleting: boolean;
  error: string | null;
  refreshDocuments: () => Promise<void>;
  selectDocument: (documentId: number) => Promise<void>;
  deleteDocument: (documentId: number) => Promise<boolean>;
  updateDocument: (
    payload: UpdateDocumentInput,
  ) => Promise<DocumentDetail | null>;
  uploadAndAnalyzeDocument: (
    payload: UploadDocumentInput,
  ) => Promise<DocumentDetail | null>;
  analyzeDocument: (
    payload: AnalyzeDocumentInput,
  ) => Promise<DocumentDetail | null>;
  getDocumentFileBlob: (documentId: number) => Promise<Blob>;
}

const documentsContext = createContext<DocumentsContextValue | null>(null);
const documentsService = new DocumentsService(new DocumentsRepository());

export function DocumentsProvider({ children }: Readonly<PropsWithChildren>) {
  const auth = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDetail | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    () => getLastSelectedDocumentId(),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingDocumentId, setAnalyzingDocumentId] = useState<number | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    if (!auth.isAuthenticated) {
      setDocuments([]);
      setSelectedDocument(null);
      setSelectedDocumentId(null);
      clearLastSelectedDocumentId();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const nextDocuments = await documentsService.list();
      setDocuments(nextDocuments);

      if (selectedDocumentId) {
        const documentStillExists = nextDocuments.some(
          (document) => document.id === selectedDocumentId,
        );

        if (!documentStillExists) {
          setSelectedDocument(null);
          setSelectedDocumentId(null);
          clearLastSelectedDocumentId();
          return;
        }

        setSelectedDocument(await documentsService.getById(selectedDocumentId));
      }
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudieron cargar los documentos";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [auth.isAuthenticated, selectedDocumentId]);

  useEffect(() => {
    if (!auth.isInitializing && auth.isAuthenticated) {
      void refreshDocuments();
      return;
    }

    if (!auth.isInitializing && !auth.isAuthenticated) {
      setDocuments([]);
      setSelectedDocument(null);
      setSelectedDocumentId(null);
      clearLastSelectedDocumentId();
    }
  }, [auth.isAuthenticated, auth.isInitializing, refreshDocuments]);

  const selectDocument = useCallback(async (documentId: number) => {
    setIsLoading(true);
    setError(null);

    try {
      setSelectedDocument(await documentsService.getById(documentId));
      setSelectedDocumentId(documentId);
      setLastSelectedDocumentId(documentId);
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar el documento";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeDocument = useCallback(async (payload: AnalyzeDocumentInput) => {
    setIsAnalyzing(true);
    setAnalyzingDocumentId(payload.documentId);
    setError(null);

    try {
      const detail = await documentsService.analyzeDocument(payload);
      setSelectedDocument(detail);
      setSelectedDocumentId(detail.id);
      setLastSelectedDocumentId(detail.id);
      setDocuments(await documentsService.list());
      return detail;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo procesar el documento";
      setError(message);
      return null;
    } finally {
      setIsAnalyzing(false);
      setAnalyzingDocumentId(null);
    }
  }, []);

  const deleteDocument = useCallback(async (documentId: number) => {
    setIsDeleting(true);
    setError(null);

    try {
      await documentsService.remove(documentId);
      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentId),
      );
      setSelectedDocument((currentDocument) => {
        if (currentDocument?.id !== documentId) {
          return currentDocument;
        }

        return null;
      });
      setSelectedDocumentId((currentDocumentId) => {
        if (currentDocumentId !== documentId) {
          return currentDocumentId;
        }

        clearLastSelectedDocumentId();
        return null;
      });
      return true;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo eliminar el documento";
      setError(message);
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const updateDocument = useCallback(async (payload: UpdateDocumentInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const detail = await documentsService.updateDocument(payload);
      setDocuments((currentDocuments) =>
        currentDocuments.map((document) =>
          document.id === detail.id ? detail : document,
        ),
      );
      setSelectedDocument((currentDocument) =>
        currentDocument?.id === detail.id ? detail : currentDocument,
      );
      return detail;
    } catch (caughtError) {
      const message =
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar el documento";
      setError(message);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const uploadAndAnalyzeDocument = useCallback(
    async (payload: UploadDocumentInput) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const detail = await documentsService.uploadAndAnalyze(payload);
        setSelectedDocument(detail);
        setSelectedDocumentId(detail.id);
        setLastSelectedDocumentId(detail.id);
        setDocuments(await documentsService.list());
        return detail;
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "No se pudo subir el documento";
        setError(message);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  const getDocumentFileBlob = useCallback((documentId: number) => {
    return documentsService.getFileBlob(documentId);
  }, []);

  const value = useMemo(
    () => ({
      documents,
      selectedDocument,
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
      uploadAndAnalyzeDocument,
      analyzeDocument,
      getDocumentFileBlob,
    }),
    [
      analyzeDocument,
      documents,
      error,
      analyzingDocumentId,
      isAnalyzing,
      isDeleting,
      isLoading,
      isSubmitting,
      deleteDocument,
      updateDocument,
      refreshDocuments,
      selectDocument,
      selectedDocument,
      uploadAndAnalyzeDocument,
      getDocumentFileBlob,
    ],
  );

  return (
    <documentsContext.Provider value={value}>
      {children}
    </documentsContext.Provider>
  );
}

export function useDocuments() {
  const context = useContext(documentsContext);

  if (!context) {
    throw new Error("useDocuments debe usarse dentro de DocumentsProvider");
  }

  return context;
}
