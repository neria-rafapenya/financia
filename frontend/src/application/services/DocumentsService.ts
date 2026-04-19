import type {
  AnalyzeDocumentInput,
  UpdateDocumentInput,
  UploadDocumentInput,
} from "@/domain/interfaces/document.interface";
import { DocumentsRepository } from "@/infrastructure/repositories/DocumentsRepository";

export class DocumentsService {
  constructor(private readonly repository: DocumentsRepository) {}

  list() {
    return this.repository.list();
  }

  getById(documentId: number) {
    return this.repository.getById(documentId);
  }

  remove(documentId: number) {
    return this.repository.remove(documentId);
  }

  updateDocument(payload: UpdateDocumentInput) {
    return this.repository.update(payload);
  }

  upload(payload: UploadDocumentInput) {
    return this.repository.upload(payload);
  }

  async analyzeDocument(payload: AnalyzeDocumentInput) {
    await this.repository.processOcr(payload.documentId, {
      ocrProvider: payload.ocrProvider,
    });

    return this.repository.processLlm(payload.documentId, {
      llmProvider: payload.llmProvider,
      modelName: payload.modelName,
      promptVersion: payload.promptVersion,
      instructions: payload.instructions,
      autoDetectDocumentType: payload.autoDetectDocumentType,
    });
  }

  async uploadAndAnalyze(payload: UploadDocumentInput) {
    return this.repository.processPipeline(payload);
  }

  getFileBlob(documentId: number) {
    return this.repository.getFileBlob(documentId);
  }
}
