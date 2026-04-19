import type {
  DocumentDetail,
  DocumentRecord,
  ProcessLlmInput,
  ProcessOcrInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "@/domain/interfaces/document.interface";
import { fetchWithAuth, fetchWithAuthBlob } from "@/shared/api/api";

export class DocumentsRepository {
  list() {
    return fetchWithAuth<DocumentRecord[]>("/documents");
  }

  getById(documentId: number) {
    return fetchWithAuth<DocumentDetail>(`/documents/${documentId}`);
  }

  remove(documentId: number) {
    return fetchWithAuth<{ id: number; deleted: boolean }>(
      `/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );
  }

  update(payload: UpdateDocumentInput) {
    return fetchWithAuth<DocumentDetail>(`/documents/${payload.documentId}`, {
      method: "PATCH",
      body: {
        displayLabel: payload.displayLabel,
        notes: payload.notes,
      },
    });
  }

  upload(payload: UploadDocumentInput) {
    const formData = this.createDocumentFormData(payload);

    return fetchWithAuth<DocumentDetail>("/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  processPipeline(payload: UploadDocumentInput) {
    const formData = this.createDocumentFormData(payload);

    if (payload.instructions) {
      formData.append("instructions", payload.instructions);
    }

    if (typeof payload.autoDetectDocumentType === "boolean") {
      formData.append(
        "autoDetectDocumentType",
        String(payload.autoDetectDocumentType),
      );
    }

    return fetchWithAuth<DocumentDetail>("/documents/pipeline", {
      method: "POST",
      body: formData,
    });
  }

  private createDocumentFormData(payload: UploadDocumentInput) {
    const formData = new FormData();

    formData.append("file", payload.file);

    if (payload.documentType) {
      formData.append("documentType", payload.documentType);
    }

    if (payload.documentDate) {
      formData.append("documentDate", payload.documentDate);
    }

    if (payload.notes) {
      formData.append("notes", payload.notes);
    }

    if (payload.linkedEntityType) {
      formData.append("linkedEntityType", payload.linkedEntityType);
    }

    if (typeof payload.linkedEntityId === "number") {
      formData.append("linkedEntityId", String(payload.linkedEntityId));
    }

    return formData;
  }

  processOcr(documentId: number, payload: ProcessOcrInput = {}) {
    return fetchWithAuth<DocumentDetail>(
      `/documents/${documentId}/process-ocr`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  processLlm(documentId: number, payload: ProcessLlmInput = {}) {
    return fetchWithAuth<DocumentDetail>(
      `/documents/${documentId}/process-llm`,
      {
        method: "POST",
        body: payload,
      },
    );
  }

  getFileBlob(documentId: number) {
    return fetchWithAuthBlob(`/documents/${documentId}/file`);
  }
}
