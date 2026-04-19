import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import {
  parseStoredJson,
  toBooleanFlag,
  toIsoDate,
  toIsoDateTime,
  toNullableNumber,
} from '../../common/serializers';
import { DocumentAiService } from './document-ai.service';
import { DocumentPromptService } from './document-prompt.service';
import { DocumentStorageService } from './document-storage.service';
import { ProcessLlmDto } from './dto/process-llm.dto';
import { ProcessDocumentPipelineDto } from './dto/process-document-pipeline.dto';
import { ProcessOcrDto } from './dto/process-ocr.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { VerifyDocumentDto } from './dto/verify-document.dto';

interface DocumentFieldWriteInput {
  fieldName: string;
  fieldValue: string | null;
  source: 'OCR' | 'LLM' | 'RULE' | 'MANUAL';
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isVerified: boolean;
}

interface DocumentRow extends RowDataPacket {
  id: number;
  userId: number;
  documentType: string;
  displayLabel: string | null;
  originalFilename: string;
  mimeType: string;
  storagePath: string;
  fileSizeBytes: number | null;
  documentDate: Date | string | null;
  status: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  notes: string | null;
  latestParsedJson: unknown;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface OcrRow extends RowDataPacket {
  id: number;
  documentId: number;
  ocrProvider: string;
  rawText: string;
  confidenceScore: string | number | null;
  processedAt: Date | string;
}

interface LlmRow extends RowDataPacket {
  id: number;
  documentId: number;
  ocrResultId: number | null;
  llmProvider: string;
  modelName: string;
  promptVersion: string | null;
  rawResponse: string;
  parsedJson: unknown;
  confidenceSummary: string | null;
  processedAt: Date | string;
}

interface FieldValueRow extends RowDataPacket {
  id: number;
  documentId: number;
  fieldName: string;
  fieldValue: string | null;
  source: string;
  confidenceLevel: string;
  isVerified: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface PayerCandidateRow extends RowDataPacket {
  id: number;
  payerName: string;
  taxId: string | null;
  payerType: string;
}

const documentTypeLabels: Record<string, string> = {
  PAYSLIP: 'Nómina',
  RETENTION_CERTIFICATE: 'Certificado de retenciones',
  CONTRACT: 'Contrato',
  INVOICE: 'Factura',
  RECEIPT: 'Ticket o justificante',
  RENTAL_DOCUMENT: 'Documento de alquiler',
  INSURANCE_DOCUMENT: 'Documento de seguro',
  TAX_DOCUMENT: 'Documento fiscal',
  SCREENSHOT: 'Captura o imagen',
  OTHER: 'Documento',
};

const spanishMonthLabels = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentAiService: DocumentAiService,
    private readonly documentPromptService: DocumentPromptService,
  ) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<DocumentRow[]>(
      `
        SELECT
          documents.id AS id,
          documents.user_id AS userId,
          documents.document_type AS documentType,
          documents.display_label AS displayLabel,
          documents.original_filename AS originalFilename,
          documents.mime_type AS mimeType,
          documents.storage_path AS storagePath,
          documents.file_size_bytes AS fileSizeBytes,
          documents.document_date AS documentDate,
          documents.status AS status,
          documents.linked_entity_type AS linkedEntityType,
          documents.linked_entity_id AS linkedEntityId,
          documents.notes AS notes,
          llm_results.parsed_json AS latestParsedJson,
          documents.created_at AS createdAt,
          documents.updated_at AS updatedAt
        FROM finan_documents AS documents
        LEFT JOIN (
          SELECT document_id, MAX(id) AS latestResultId
          FROM finan_document_llm_results
          GROUP BY document_id
        ) AS latest_llm
          ON latest_llm.document_id = documents.id
        LEFT JOIN finan_document_llm_results AS llm_results
          ON llm_results.id = latest_llm.latestResultId
        WHERE documents.user_id = ?
        ORDER BY documents.created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapDocument(row));
  }

  async getById(userId: number, documentId: number) {
    const [documentRow] = await this.databaseService.query<DocumentRow[]>(
      `
        SELECT
          documents.id AS id,
          documents.user_id AS userId,
          documents.document_type AS documentType,
          documents.display_label AS displayLabel,
          documents.original_filename AS originalFilename,
          documents.mime_type AS mimeType,
          documents.storage_path AS storagePath,
          documents.file_size_bytes AS fileSizeBytes,
          documents.document_date AS documentDate,
          documents.status AS status,
          documents.linked_entity_type AS linkedEntityType,
          documents.linked_entity_id AS linkedEntityId,
          documents.notes AS notes,
          llm_results.parsed_json AS latestParsedJson,
          documents.created_at AS createdAt,
          documents.updated_at AS updatedAt
        FROM finan_documents AS documents
        LEFT JOIN (
          SELECT document_id, MAX(id) AS latestResultId
          FROM finan_document_llm_results
          GROUP BY document_id
        ) AS latest_llm
          ON latest_llm.document_id = documents.id
        LEFT JOIN finan_document_llm_results AS llm_results
          ON llm_results.id = latest_llm.latestResultId
        WHERE documents.id = ? AND documents.user_id = ?
        LIMIT 1
      `,
      [documentId, userId],
    );

    if (!documentRow) {
      throw new NotFoundException('Document not found');
    }

    const ocrResults = await this.databaseService.query<OcrRow[]>(
      `
        SELECT
          id,
          document_id AS documentId,
          ocr_provider AS ocrProvider,
          raw_text AS rawText,
          confidence_score AS confidenceScore,
          processed_at AS processedAt
        FROM finan_document_ocr_results
        WHERE document_id = ?
        ORDER BY processed_at DESC
      `,
      [documentId],
    );

    const llmResults = await this.databaseService.query<LlmRow[]>(
      `
        SELECT
          id,
          document_id AS documentId,
          ocr_result_id AS ocrResultId,
          llm_provider AS llmProvider,
          model_name AS modelName,
          prompt_version AS promptVersion,
          raw_response AS rawResponse,
          parsed_json AS parsedJson,
          confidence_summary AS confidenceSummary,
          processed_at AS processedAt
        FROM finan_document_llm_results
        WHERE document_id = ?
        ORDER BY processed_at DESC
      `,
      [documentId],
    );

    const fieldValues = await this.databaseService.query<FieldValueRow[]>(
      `
        SELECT
          id,
          document_id AS documentId,
          field_name AS fieldName,
          field_value AS fieldValue,
          source,
          confidence_level AS confidenceLevel,
          is_verified AS isVerified,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_document_field_values
        WHERE document_id = ?
        ORDER BY updated_at DESC, created_at DESC
      `,
      [documentId],
    );

    return {
      ...this.mapDocument(documentRow),
      ocrResults: ocrResults.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        ocrProvider: row.ocrProvider,
        rawText: row.rawText,
        confidenceScore: toNullableNumber(row.confidenceScore),
        processedAt: toIsoDateTime(row.processedAt),
      })),
      llmResults: llmResults.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        ocrResultId: row.ocrResultId,
        llmProvider: row.llmProvider,
        modelName: row.modelName,
        promptVersion: row.promptVersion,
        rawResponse: row.rawResponse,
        parsedJson: parseStoredJson<Record<string, unknown>>(row.parsedJson),
        confidenceSummary: row.confidenceSummary,
        processedAt: toIsoDateTime(row.processedAt),
      })),
      fieldValues: fieldValues.map((row) => ({
        id: row.id,
        documentId: row.documentId,
        fieldName: row.fieldName,
        fieldValue: row.fieldValue,
        source: row.source,
        confidenceLevel: row.confidenceLevel,
        isVerified: toBooleanFlag(row.isVerified),
        createdAt: toIsoDateTime(row.createdAt),
        updatedAt: toIsoDateTime(row.updatedAt),
      })),
    };
  }

  async getFile(userId: number, documentId: number) {
    const document = await this.getDocumentRow(userId, documentId);
    const fileBuffer = await this.documentStorageService.readFileBuffer(
      document.storagePath,
    );

    return {
      buffer: fileBuffer,
      mimeType: document.mimeType,
      originalFilename: document.originalFilename,
      fileSizeBytes: document.fileSizeBytes ?? fileBuffer.length,
    };
  }

  async remove(userId: number, documentId: number) {
    const document = await this.getDocumentRow(userId, documentId);

    await this.databaseService.execute(
      `DELETE FROM finan_document_field_values WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_document_llm_results WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_document_ocr_results WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_documents WHERE id = ? AND user_id = ?`,
      [documentId, userId],
    );

    await this.documentStorageService.deleteFile(document.storagePath);

    return {
      id: documentId,
      deleted: true,
    };
  }

  async upload(
    userId: number,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    uploadDocumentDto: UploadDocumentDto,
  ) {
    const storedFile = await this.documentStorageService.saveUploadedFile(
      userId,
      file,
    );

    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_documents (
          user_id, document_type, original_filename, mime_type, storage_path,
          file_size_bytes, document_date, status, linked_entity_type, linked_entity_id, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'UPLOADED', ?, ?, ?)
      `,
      [
        userId,
        uploadDocumentDto.documentType ?? 'OTHER',
        storedFile.originalFilename,
        storedFile.mimeType,
        storedFile.storagePath,
        storedFile.fileSizeBytes,
        uploadDocumentDto.documentDate ?? null,
        uploadDocumentDto.linkedEntityType?.trim() ?? null,
        uploadDocumentDto.linkedEntityId ?? null,
        uploadDocumentDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    documentId: number,
    updateDocumentDto: UpdateDocumentDto,
  ) {
    await this.getDocumentRow(userId, documentId);

    await this.databaseService.execute(
      `
        UPDATE finan_documents
        SET display_label = COALESCE(?, display_label),
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
      `,
      [
        updateDocumentDto.displayLabel?.trim() || null,
        updateDocumentDto.notes?.trim() || null,
        documentId,
        userId,
      ],
    );

    return this.getById(userId, documentId);
  }

  async processUploadPipeline(
    userId: number,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    processDocumentPipelineDto: ProcessDocumentPipelineDto,
  ) {
    const uploadedDocument = await this.upload(userId, file, {
      documentType: processDocumentPipelineDto.documentType,
      documentDate: processDocumentPipelineDto.documentDate,
      linkedEntityType: processDocumentPipelineDto.linkedEntityType,
      linkedEntityId: processDocumentPipelineDto.linkedEntityId,
      notes: processDocumentPipelineDto.notes,
    });

    await this.processOcr(userId, uploadedDocument.id, {
      ocrProvider: processDocumentPipelineDto.ocrProvider,
      rawText: processDocumentPipelineDto.rawText,
      confidenceScore: processDocumentPipelineDto.confidenceScore,
    });

    try {
      return await this.processLlm(userId, uploadedDocument.id, {
        llmProvider: processDocumentPipelineDto.llmProvider,
        modelName: processDocumentPipelineDto.modelName,
        promptVersion: processDocumentPipelineDto.promptVersion,
        instructions: processDocumentPipelineDto.instructions,
        autoDetectDocumentType:
          processDocumentPipelineDto.autoDetectDocumentType,
      });
    } catch (error) {
      if (!this.isLowConfidenceDocumentError(error)) {
        throw error;
      }

      await this.cleanupDocumentArtifacts(
        userId,
        uploadedDocument.id,
        uploadedDocument.storagePath,
      );
      throw error;
    }
  }

  async processOcr(
    userId: number,
    documentId: number,
    processOcrDto: ProcessOcrDto,
  ) {
    const document = await this.getDocumentRow(userId, documentId);
    const provider =
      processOcrDto.ocrProvider ??
      this.configService.get<string>('OCR_PROVIDER', 'tesseract');
    const fileBuffer = await this.documentStorageService.readFileBuffer(
      document.storagePath,
    );
    const ocrResult = await this.documentAiService.extractText({
      provider,
      document: {
        id: document.id,
        documentType: document.documentType,
        originalFilename: document.originalFilename,
        mimeType: document.mimeType,
        storagePath: document.storagePath,
      },
      fileBuffer,
      manualRawText: processOcrDto.rawText,
    });

    await this.databaseService.execute(
      `
        INSERT INTO finan_document_ocr_results (
          document_id, ocr_provider, raw_text, confidence_score
        )
        VALUES (?, ?, ?, ?)
      `,
      [
        documentId,
        ocrResult.ocrProvider,
        ocrResult.rawText,
        processOcrDto.confidenceScore ?? ocrResult.confidenceScore,
      ],
    );

    await this.databaseService.execute(
      `UPDATE finan_documents SET status = 'OCR_PROCESSED' WHERE id = ? AND user_id = ?`,
      [documentId, userId],
    );

    return this.getById(userId, documentId);
  }

  async processLlm(
    userId: number,
    documentId: number,
    processLlmDto: ProcessLlmDto,
  ) {
    const document = await this.getDocumentRow(userId, documentId);
    const llmProvider =
      processLlmDto.llmProvider ??
      this.configService.get<string>('LLM_PROVIDER', 'mock');
    const ocrResultId =
      processLlmDto.ocrResultId ??
      (await this.getLatestOcrResultId(documentId));

    if (!ocrResultId && !processLlmDto.rawResponse) {
      throw new NotFoundException('OCR result not found for document');
    }

    const rawText = ocrResultId ? await this.getOcrRawText(ocrResultId) : null;
    const shouldAutoDetectDocumentType =
      processLlmDto.autoDetectDocumentType ??
      this.shouldAutoDetectDocumentType(document.documentType);
    const detectedDocumentType = shouldAutoDetectDocumentType
      ? await this.detectDocumentType({
          provider: llmProvider,
          modelName: processLlmDto.modelName,
          document,
          rawText: rawText ?? '',
          promptVersion: processLlmDto.promptVersion,
        })
      : null;
    const effectiveDocumentType =
      detectedDocumentType?.documentType ?? document.documentType;

    if (effectiveDocumentType !== document.documentType) {
      await this.databaseService.execute(
        `
          UPDATE finan_documents
          SET document_type = ?
          WHERE id = ? AND user_id = ?
        `,
        [effectiveDocumentType, documentId, userId],
      );
    }

    const resolvedPrompt = await this.documentPromptService.findActiveLlmPrompt(
      {
        provider: llmProvider,
        documentType: effectiveDocumentType,
        version: processLlmDto.promptVersion,
      },
    );

    const llmResult = await this.documentAiService.interpretDocument({
      provider: llmProvider,
      modelName: processLlmDto.modelName,
      document: {
        id: document.id,
        documentType: effectiveDocumentType,
        originalFilename: document.originalFilename,
        mimeType: document.mimeType,
        storagePath: document.storagePath,
      },
      rawText: rawText ?? '',
      manualRawResponse: processLlmDto.rawResponse,
      manualParsedJson: processLlmDto.parsedJson,
      manualConfidenceSummary: processLlmDto.confidenceSummary,
      instructions: processLlmDto.instructions,
      prompt: resolvedPrompt
        ? {
            systemPrompt: resolvedPrompt.systemPrompt,
            userPrompt: this.renderPromptTemplate(
              resolvedPrompt.userPromptTemplate,
              {
                documentType: effectiveDocumentType,
                currentDocumentType: document.documentType,
                allowedDocumentTypes: this.getAllowedDocumentTypesAsText(),
                originalFilename: document.originalFilename,
                rawText: rawText ?? '',
                instructions: processLlmDto.instructions?.trim() ?? '',
              },
            ),
            outputFormat: resolvedPrompt.outputFormat,
            version: resolvedPrompt.version,
          }
        : null,
    });
    const storedConfidenceSummary = this.normalizeStoredConfidenceSummary(
      llmResult.confidenceSummary,
    );

    this.ensureDocumentQualityIsProcessable(storedConfidenceSummary);

    const llmInsertResult = await this.databaseService.execute(
      `
        INSERT INTO finan_document_llm_results (
          document_id, ocr_result_id, llm_provider, model_name, prompt_version,
          raw_response, parsed_json, confidence_summary
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        documentId,
        ocrResultId,
        llmResult.llmProvider,
        llmResult.modelName,
        resolvedPrompt?.version ?? processLlmDto.promptVersion ?? null,
        llmResult.rawResponse,
        llmResult.parsedJson ? JSON.stringify(llmResult.parsedJson) : null,
        storedConfidenceSummary,
      ],
    );

    await this.persistAutoExtractedFields({
      documentId,
      documentType: effectiveDocumentType,
      parsedJson: llmResult.parsedJson,
      confidenceSummary: storedConfidenceSummary,
      llmResultId: llmInsertResult.insertId,
    });

    const inferredDocumentDate = this.resolveDocumentDateFromContent(
      effectiveDocumentType,
      llmResult.parsedJson,
      rawText ?? '',
      toIsoDate(document.documentDate),
    );

    if (
      inferredDocumentDate &&
      inferredDocumentDate !== toIsoDate(document.documentDate)
    ) {
      await this.databaseService.execute(
        `
          UPDATE finan_documents
          SET document_date = ?
          WHERE id = ? AND user_id = ?
        `,
        [inferredDocumentDate, documentId, userId],
      );
    }

    const matchedPayerId = await this.resolveLinkedPayerId({
      userId,
      document,
      effectiveDocumentType,
      rawText: rawText ?? '',
      llmProvider,
      modelName: processLlmDto.modelName,
      parsedJson: llmResult.parsedJson,
    });

    if (matchedPayerId) {
      await this.databaseService.execute(
        `
          UPDATE finan_documents
          SET linked_entity_type = 'PAYER',
              linked_entity_id = ?
          WHERE id = ? AND user_id = ?
        `,
        [matchedPayerId, documentId, userId],
      );
    }

    await this.syncDerivedExpenseFromDocument({
      userId,
      documentId,
      documentType: effectiveDocumentType,
      documentDate: inferredDocumentDate ?? toIsoDate(document.documentDate),
      parsedJson: llmResult.parsedJson,
      matchedPayerId,
      fallbackOriginalFilename: document.originalFilename,
    });

    await this.databaseService.execute(
      `UPDATE finan_documents SET status = 'LLM_PROCESSED' WHERE id = ? AND user_id = ?`,
      [documentId, userId],
    );

    return this.getById(userId, documentId);
  }

  private renderPromptTemplate(
    template: string,
    values: {
      documentType: string;
      currentDocumentType: string;
      allowedDocumentTypes: string;
      originalFilename: string;
      rawText: string;
      instructions: string;
    },
  ) {
    const instructionsBlock = values.instructions
      ? `Instrucciones: ${values.instructions}\n\n`
      : '';

    return template
      .replaceAll('{{documentType}}', values.documentType)
      .replaceAll('{{currentDocumentType}}', values.currentDocumentType)
      .replaceAll('{{allowedDocumentTypes}}', values.allowedDocumentTypes)
      .replaceAll('{{originalFilename}}', values.originalFilename)
      .replaceAll('{{rawText}}', values.rawText)
      .replaceAll('{{instructions}}', values.instructions)
      .replaceAll('{{instructionsBlock}}', instructionsBlock);
  }

  private async detectDocumentType(params: {
    provider: string;
    modelName?: string;
    document: DocumentRow;
    rawText: string;
    promptVersion?: string;
  }) {
    const classifierPrompt = await this.documentPromptService.findPromptByCode({
      provider: params.provider,
      promptCode: 'DOCUMENT_LLM_CLASSIFIER',
      version: params.promptVersion,
    });

    return this.documentAiService.classifyDocument({
      provider: params.provider,
      modelName: params.modelName,
      document: {
        id: params.document.id,
        documentType: params.document.documentType,
        originalFilename: params.document.originalFilename,
        mimeType: params.document.mimeType,
        storagePath: params.document.storagePath,
      },
      rawText: params.rawText,
      prompt: classifierPrompt
        ? {
            systemPrompt: classifierPrompt.systemPrompt,
            userPrompt: this.renderPromptTemplate(
              classifierPrompt.userPromptTemplate,
              {
                documentType: params.document.documentType,
                currentDocumentType: params.document.documentType,
                allowedDocumentTypes: this.getAllowedDocumentTypesAsText(),
                originalFilename: params.document.originalFilename,
                rawText: params.rawText,
                instructions: '',
              },
            ),
            outputFormat: classifierPrompt.outputFormat,
            version: classifierPrompt.version,
          }
        : null,
    });
  }

  private shouldAutoDetectDocumentType(documentType: string) {
    return documentType === 'OTHER' || documentType === 'SCREENSHOT';
  }

  private getAllowedDocumentTypesAsText() {
    return [
      'PAYSLIP',
      'RETENTION_CERTIFICATE',
      'CONTRACT',
      'INVOICE',
      'RECEIPT',
      'RENTAL_DOCUMENT',
      'INSURANCE_DOCUMENT',
      'TAX_DOCUMENT',
      'SCREENSHOT',
      'OTHER',
    ].join(', ');
  }

  async verify(
    userId: number,
    documentId: number,
    verifyDocumentDto: VerifyDocumentDto,
  ) {
    await this.getDocumentRow(userId, documentId);

    await this.insertDocumentFieldValues(
      documentId,
      (verifyDocumentDto.fieldValues ?? []).map((fieldValue) => ({
        fieldName: fieldValue.fieldName,
        fieldValue: fieldValue.fieldValue ?? null,
        source: fieldValue.source,
        confidenceLevel: fieldValue.confidenceLevel,
        isVerified: fieldValue.isVerified ?? false,
      })),
    );

    await this.databaseService.execute(
      `
        UPDATE finan_documents
        SET status = 'VERIFIED',
            notes = COALESCE(?, notes)
        WHERE id = ? AND user_id = ?
      `,
      [verifyDocumentDto.notes?.trim() ?? null, documentId, userId],
    );

    const document = await this.getDocumentRow(userId, documentId);
    const latestLlmResult =
      await this.getLatestDocumentLlmParsedJson(documentId);

    await this.syncDerivedExpenseFromDocument({
      userId,
      documentId,
      documentType: document.documentType,
      documentDate: toIsoDate(document.documentDate),
      parsedJson: latestLlmResult,
      matchedPayerId:
        document.linkedEntityType === 'PAYER' ? document.linkedEntityId : null,
      fallbackOriginalFilename: document.originalFilename,
    });

    return this.getById(userId, documentId);
  }

  private async getLatestDocumentLlmParsedJson(documentId: number) {
    const rows = await this.databaseService.query<
      Array<RowDataPacket & { parsedJson: unknown }>
    >(
      `
        SELECT parsed_json AS parsedJson
        FROM finan_document_llm_results
        WHERE document_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [documentId],
    );

    return parseStoredJson<Record<string, unknown>>(
      rows[0]?.parsedJson ?? null,
    );
  }

  private async syncDerivedExpenseFromDocument(params: {
    userId: number;
    documentId: number;
    documentType: string;
    documentDate: string | null;
    parsedJson: Record<string, unknown> | null;
    matchedPayerId: number | null;
    fallbackOriginalFilename: string;
  }) {
    const extractedFields = this.getExtractedFieldsObject(params.parsedJson);

    if (!extractedFields) {
      return;
    }

    const sources = this.getDocumentInterpretationSources(
      params.parsedJson,
      extractedFields,
    );
    const canSyncExpense = this.canSyncDerivedExpenseFromDocument(
      params.documentType,
      extractedFields,
    );

    if (!canSyncExpense) {
      return;
    }

    const amount = this.readNumericValueFromSources(sources, [
      'totalAmount',
      'grandTotal',
      'amount',
      'amountDue',
    ]);

    if (amount === null || amount <= 0) {
      return;
    }

    const vatAmount = this.readNumericValueFromSources(sources, [
      'vatAmount',
      'taxAmount',
      'ivaAmount',
    ]);
    const vendorName = this.readStringValueFromSources(sources, [
      'vendorName',
      'merchantName',
      'issuerName',
      'supplierName',
      'providerName',
    ]);
    const paymentMethod = this.readStringValueFromSources(sources, [
      'paymentMethod',
      'paymentType',
    ]);
    const expenseDate =
      this.readDateValueFromSources(sources, [
        'expenseDate',
        'purchaseDate',
        'operationDate',
        'issueDate',
        'invoiceDate',
        'documentDate',
        'date',
      ]) ?? params.documentDate;

    if (!expenseDate) {
      return;
    }

    const concept = this.buildDerivedExpenseConcept({
      documentType: params.documentType,
      vendorName,
      fallbackOriginalFilename: params.fallbackOriginalFilename,
    });
    const notes = [
      `Documento origen #${params.documentId}`,
      paymentMethod ? `Pago: ${paymentMethod}` : null,
    ]
      .filter(Boolean)
      .join(' · ');

    const existingRows = await this.databaseService.query<
      Array<RowDataPacket & { id: number }>
    >(
      `
        SELECT id
        FROM finan_expenses
        WHERE user_id = ?
          AND source_type = 'LLM'
          AND notes LIKE ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [params.userId, `%Documento origen #${params.documentId}%`],
    );

    if (existingRows[0]?.id) {
      await this.databaseService.execute(
        `
          UPDATE finan_expenses
          SET payer_id = ?,
              expense_date = ?,
              concept = ?,
              vendor_name = ?,
              amount = ?,
              vat_amount = ?,
              is_paid = 1,
              currency = 'EUR',
              source_type = 'LLM',
              deductibility_status = 'REVIEWABLE',
              notes = ?
          WHERE id = ? AND user_id = ?
        `,
        [
          params.matchedPayerId,
          expenseDate,
          concept,
          vendorName,
          amount,
          vatAmount,
          notes,
          existingRows[0].id,
          params.userId,
        ],
      );

      return;
    }

    await this.databaseService.execute(
      `
        INSERT INTO finan_expenses (
          user_id, payer_id, expense_date, concept, vendor_name,
          amount, vat_amount, is_paid, currency, source_type, deductibility_status,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'EUR', 'LLM', 'REVIEWABLE', ?)
      `,
      [
        params.userId,
        params.matchedPayerId,
        expenseDate,
        concept,
        vendorName,
        amount,
        vatAmount,
        notes,
      ],
    );
  }

  private canSyncDerivedExpenseFromDocument(
    documentType: string,
    extractedFields: Record<string, unknown>,
  ) {
    if (documentType === 'RECEIPT' || documentType === 'INVOICE') {
      return true;
    }

    return [
      'totalAmount',
      'grandTotal',
      'amount',
      'vatAmount',
      'taxAmount',
      'vendorName',
      'merchantName',
      'purchaseDate',
      'expenseDate',
    ].some((fieldName) => Object.hasOwn(extractedFields, fieldName));
  }

  private buildDerivedExpenseConcept(params: {
    documentType: string;
    vendorName: string | null;
    fallbackOriginalFilename: string;
  }) {
    const prefix = params.documentType === 'INVOICE' ? 'Factura' : 'Ticket';

    if (params.vendorName) {
      return `${prefix} · ${params.vendorName}`;
    }

    return `${prefix} · ${params.fallbackOriginalFilename}`;
  }

  private readNumericValue(
    source: Record<string, unknown>,
    keys: string[],
  ): number | null {
    for (const key of keys) {
      const value = source[key];

      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const normalizedValue = value
          .trim()
          .replaceAll(/\s+/g, '')
          .replaceAll('€', '')
          .replaceAll(/\.(?=\d{3}(?:\D|$))/g, '')
          .replace(',', '.');
        const parsedValue = Number(normalizedValue);

        if (Number.isFinite(parsedValue)) {
          return parsedValue;
        }
      }
    }

    return null;
  }

  private async getDocumentRow(userId: number, documentId: number) {
    const [documentRow] = await this.databaseService.query<DocumentRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          document_type AS documentType,
          display_label AS displayLabel,
          original_filename AS originalFilename,
          mime_type AS mimeType,
          storage_path AS storagePath,
          file_size_bytes AS fileSizeBytes,
          document_date AS documentDate,
          status,
          linked_entity_type AS linkedEntityType,
          linked_entity_id AS linkedEntityId,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_documents
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [documentId, userId],
    );

    if (!documentRow) {
      throw new NotFoundException('Document not found');
    }

    return documentRow;
  }

  private async getLatestOcrResultId(documentId: number) {
    const rows = await this.databaseService.query<OcrRow[]>(
      `
        SELECT
          id,
          document_id AS documentId,
          ocr_provider AS ocrProvider,
          raw_text AS rawText,
          confidence_score AS confidenceScore,
          processed_at AS processedAt
        FROM finan_document_ocr_results
        WHERE document_id = ?
        ORDER BY processed_at DESC
        LIMIT 1
      `,
      [documentId],
    );

    return rows[0]?.id ?? null;
  }

  private async resolveLinkedPayerId(params: {
    userId: number;
    document: DocumentRow;
    effectiveDocumentType: string;
    rawText: string;
    llmProvider: string;
    modelName?: string;
    parsedJson: Record<string, unknown> | null;
  }) {
    if (
      params.document.linkedEntityType &&
      params.document.linkedEntityId &&
      params.document.linkedEntityType === 'PAYER'
    ) {
      return params.document.linkedEntityId;
    }

    const payers = await this.getUserPayers(params.userId);

    if (!payers.length) {
      return null;
    }

    const payerMatch = await this.documentAiService.matchPayer({
      provider: params.llmProvider,
      modelName: params.modelName,
      document: {
        id: params.document.id,
        documentType: params.effectiveDocumentType,
        originalFilename: params.document.originalFilename,
        mimeType: params.document.mimeType,
        storagePath: params.document.storagePath,
      },
      rawText: params.rawText,
      parsedJson: params.parsedJson,
      payers,
    });

    return payerMatch.payerId;
  }

  private async getUserPayers(userId: number) {
    const rows = await this.databaseService.query<PayerCandidateRow[]>(
      `
        SELECT
          id,
          payer_name AS payerName,
          tax_id AS taxId,
          payer_type AS payerType
        FROM finan_payers
        WHERE user_id = ?
        ORDER BY payer_name ASC
      `,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      payerName: row.payerName,
      taxId: row.taxId,
      payerType: row.payerType,
    }));
  }

  private async getOcrRawText(ocrResultId: number) {
    const rows = await this.databaseService.query<OcrRow[]>(
      `
        SELECT
          id,
          document_id AS documentId,
          ocr_provider AS ocrProvider,
          raw_text AS rawText,
          confidence_score AS confidenceScore,
          processed_at AS processedAt
        FROM finan_document_ocr_results
        WHERE id = ?
        LIMIT 1
      `,
      [ocrResultId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('OCR result not found');
    }

    return rows[0].rawText;
  }

  private async persistAutoExtractedFields(params: {
    documentId: number;
    documentType: string;
    parsedJson: Record<string, unknown> | null;
    confidenceSummary?: string | null;
    llmResultId: number;
  }) {
    const extractedFields = this.getExtractedFieldsObject(params.parsedJson);
    const mappings = this.getPersistedFieldMappings(params.documentType);

    if (!extractedFields || mappings.length === 0) {
      return;
    }

    const fieldValues: DocumentFieldWriteInput[] = mappings
      .map((mapping) => {
        const rawValue = this.readMappedValue(extractedFields, mapping.paths);
        const normalizedValue = this.normalizeStoredFieldValue(rawValue);

        if (normalizedValue === null) {
          return null;
        }

        return {
          fieldName: mapping.fieldName,
          fieldValue: normalizedValue,
          source: 'LLM' as const,
          confidenceLevel: this.normalizeConfidenceLevel(
            params.confidenceSummary,
          ),
          isVerified: false,
        };
      })
      .filter((fieldValue) => fieldValue !== null);

    if (!fieldValues.length) {
      return;
    }

    await this.databaseService.execute(
      `
        DELETE FROM finan_document_field_values
        WHERE document_id = ?
          AND source = 'LLM'
          AND field_name IN (${fieldValues.map(() => '?').join(', ')})
      `,
      [
        params.documentId,
        ...fieldValues.map((fieldValue) => fieldValue.fieldName),
      ],
    );

    await this.insertDocumentFieldValues(params.documentId, fieldValues);
  }

  private getExtractedFieldsObject(parsedJson: Record<string, unknown> | null) {
    if (!parsedJson) {
      return null;
    }

    const extractedFields = parsedJson.extractedFields;

    if (!extractedFields || Array.isArray(extractedFields)) {
      return null;
    }

    return extractedFields as Record<string, unknown>;
  }

  private resolveDocumentDateFromContent(
    documentType: string,
    parsedJson: Record<string, unknown> | null,
    rawText: string,
    fallbackDate: string | null,
  ) {
    const extractedFields = this.getExtractedFieldsObject(parsedJson);
    const sources = this.getDocumentInterpretationSources(
      parsedJson,
      extractedFields,
    );
    const summary =
      typeof parsedJson?.summary === 'string' ? parsedJson.summary.trim() : '';

    const dateFromParsedJson = this.readDateValueFromSources(
      sources,
      this.getDocumentDateCandidatePaths(documentType),
    );

    if (dateFromParsedJson) {
      return dateFromParsedJson;
    }

    const dateFromSummary = this.extractDateFromFreeText(summary);

    if (dateFromSummary) {
      return dateFromSummary;
    }

    const dateFromRawText = this.readDateFromRawText(documentType, rawText);

    if (dateFromRawText) {
      return dateFromRawText;
    }

    return fallbackDate;
  }

  private getDocumentDateCandidatePaths(documentType: string) {
    const pathsByType: Record<string, string[]> = {
      PAYSLIP: [
        'period',
        'periodo',
        'periodoLiquidacion',
        'settlementPeriod',
        'payrollPeriod',
        'salaryPeriod',
        'periodMonth',
        'paymentDate',
        'payDate',
        'fechaPago',
        'fechaNomina',
        'fechaDevengo',
        'issueDate',
      ],
      INVOICE: [
        'issueDate',
        'fechaEmision',
        'invoiceDate',
        'expenseDate',
        'documentDate',
        'date',
      ],
      RECEIPT: [
        'expenseDate',
        'purchaseDate',
        'issueDate',
        'fechaOperacion',
        'documentDate',
        'date',
      ],
      CONTRACT: [
        'startDate',
        'effectiveDate',
        'signatureDate',
        'documentDate',
        'date',
      ],
      RENTAL_DOCUMENT: [
        'issueDate',
        'startDate',
        'effectiveDate',
        'documentDate',
        'date',
      ],
      INSURANCE_DOCUMENT: [
        'issueDate',
        'effectiveDate',
        'documentDate',
        'date',
      ],
      TAX_DOCUMENT: ['issueDate', 'documentDate', 'date'],
      RETENTION_CERTIFICATE: ['issueDate', 'documentDate', 'date'],
      SCREENSHOT: ['documentDate', 'date'],
      OTHER: [
        'documentDate',
        'date',
        'issueDate',
        'expenseDate',
        'paymentDate',
      ],
    };

    return pathsByType[documentType] ?? pathsByType.OTHER;
  }

  private readDateFromRawText(documentType: string, rawText: string) {
    const trimmedText = rawText.trim();

    if (!trimmedText) {
      return null;
    }

    const normalizedText = trimmedText
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '');

    const keywordPatterns =
      documentType === 'PAYSLIP'
        ? [
            /(?:periodo|periodo de liquidacion|liquidacion|devengo|nomina|fecha de pago|fecha pago|fecha nomina)[:\s-]*([^\n]+)/i,
          ]
        : [
            /(?:fecha de emision|fecha emision|fecha factura|invoice date|issue date|fecha operacion|fecha)[:\s-]*([^\n]+)/i,
          ];

    for (const pattern of keywordPatterns) {
      const match = pattern.exec(normalizedText);

      if (!match?.[1]) {
        continue;
      }

      const resolvedDate = this.extractDateFromFreeText(match[1]);

      if (resolvedDate) {
        return resolvedDate;
      }
    }

    return this.extractDateFromFreeText(normalizedText);
  }

  private extractDateFromFreeText(value: string) {
    const exactPatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{1,2}[/. -]\d{1,2}[/. -](?:\d{2}|\d{4})\b/g,
      /\b\d{2}[/-]\d{4}\b/g,
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+\d{4}\b/g,
      /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/g,
    ];

    for (const pattern of exactPatterns) {
      const match = pattern.exec(value);

      if (!match?.[0]) {
        continue;
      }

      const normalizedDate = this.normalizeDateString(match[0]);

      if (normalizedDate) {
        return normalizedDate;
      }
    }

    return null;
  }

  private getPersistedFieldMappings(documentType: string) {
    const mappings: Record<
      string,
      Array<{ fieldName: string; paths: string[] }>
    > = {
      CONTRACT: [
        {
          fieldName: 'partyA',
          paths: ['partyA', 'employerName', 'clientName'],
        },
        {
          fieldName: 'partyB',
          paths: ['partyB', 'employeeName', 'contractorName'],
        },
        { fieldName: 'contractType', paths: ['contractType', 'type'] },
        { fieldName: 'startDate', paths: ['startDate', 'effectiveDate'] },
        { fieldName: 'endDate', paths: ['endDate', 'expirationDate'] },
        {
          fieldName: 'salaryAmount',
          paths: ['salaryAmount', 'grossSalary', 'feesAmount'],
        },
        { fieldName: 'exclusivityFlag', paths: ['exclusivityFlag'] },
        { fieldName: 'nonCompeteFlag', paths: ['nonCompeteFlag'] },
      ],
      RECEIPT: [
        { fieldName: 'vendorName', paths: ['vendorName', 'merchantName'] },
        { fieldName: 'expenseDate', paths: ['expenseDate', 'purchaseDate'] },
        { fieldName: 'totalAmount', paths: ['totalAmount'] },
        { fieldName: 'vatAmount', paths: ['vatAmount', 'taxAmount'] },
        { fieldName: 'paymentMethod', paths: ['paymentMethod'] },
      ],
      INVOICE: [
        {
          fieldName: 'invoiceNumber',
          paths: ['invoiceNumber', 'documentNumber'],
        },
        { fieldName: 'issueDate', paths: ['issueDate', 'invoiceDate'] },
        { fieldName: 'vendorName', paths: ['vendorName', 'issuerName'] },
        { fieldName: 'customerName', paths: ['customerName', 'recipientName'] },
        {
          fieldName: 'subtotalAmount',
          paths: ['subtotalAmount', 'baseAmount'],
        },
        { fieldName: 'vatAmount', paths: ['vatAmount', 'taxAmount'] },
        { fieldName: 'totalAmount', paths: ['totalAmount'] },
        { fieldName: 'currency', paths: ['currency'] },
      ],
    };

    return mappings[documentType] ?? [];
  }

  private readMappedValue(
    extractedFields: Record<string, unknown>,
    paths: string[],
  ) {
    for (const path of paths) {
      if (Object.hasOwn(extractedFields, path)) {
        return extractedFields[path];
      }
    }

    return null;
  }

  private readStringValue(
    source: Record<string, unknown>,
    candidatePaths: string[],
  ) {
    for (const candidatePath of candidatePaths) {
      const rawValue = source[candidatePath];

      if (typeof rawValue !== 'string') {
        continue;
      }

      const normalizedValue = rawValue.trim();

      if (normalizedValue) {
        return normalizedValue;
      }
    }

    return null;
  }

  private readStringValueFromSources(
    sources: Record<string, unknown>[],
    candidatePaths: string[],
  ) {
    for (const source of sources) {
      const resolvedValue = this.readStringValue(source, candidatePaths);

      if (resolvedValue) {
        return resolvedValue;
      }
    }

    return null;
  }

  private readNumericValueFromSources(
    sources: Record<string, unknown>[],
    keys: string[],
  ) {
    for (const source of sources) {
      const resolvedValue = this.readNumericValue(source, keys);

      if (resolvedValue !== null) {
        return resolvedValue;
      }
    }

    return null;
  }

  private getDocumentInterpretationSources(
    parsedJson: Record<string, unknown> | null,
    extractedFields: Record<string, unknown> | null,
  ) {
    const sources: Record<string, unknown>[] = [];

    if (extractedFields) {
      sources.push(extractedFields);
      this.appendNestedObjectSources(sources, extractedFields);
    }

    if (parsedJson) {
      sources.push(parsedJson);
      this.appendNestedObjectSources(sources, parsedJson);
    }

    return sources;
  }

  private appendNestedObjectSources(
    target: Record<string, unknown>[],
    source: Record<string, unknown>,
  ) {
    const nestedKeys = [
      'issuer',
      'emitter',
      'vendor',
      'supplier',
      'provider',
      'customer',
      'recipient',
      'client',
      'buyer',
      'seller',
      'invoice',
      'document',
      'amounts',
      'totals',
      'taxes',
      'period',
      'dates',
    ];

    for (const nestedKey of nestedKeys) {
      const nestedValue = source[nestedKey];

      if (
        nestedValue &&
        typeof nestedValue === 'object' &&
        !Array.isArray(nestedValue)
      ) {
        target.push(nestedValue as Record<string, unknown>);
      }
    }
  }

  private readDateValueFromSources(
    sources: Record<string, unknown>[],
    candidatePaths: string[],
  ) {
    for (const source of sources) {
      const resolvedValue = this.readDateValue(source, candidatePaths);

      if (resolvedValue) {
        return resolvedValue;
      }
    }

    return null;
  }

  private readDateValue(
    source: Record<string, unknown>,
    candidatePaths: string[],
  ) {
    for (const candidatePath of candidatePaths) {
      const rawValue = source[candidatePath];

      if (typeof rawValue === 'string') {
        const normalizedValue = this.normalizeDateString(rawValue);

        if (normalizedValue) {
          return normalizedValue;
        }
      }

      if (
        rawValue &&
        typeof rawValue === 'object' &&
        !Array.isArray(rawValue)
      ) {
        const nestedRangeStart = this.readDateValue(
          rawValue as Record<string, unknown>,
          ['start', 'from', 'startDate', 'date', 'issueDate'],
        );

        if (nestedRangeStart) {
          return nestedRangeStart;
        }

        const year = Number((rawValue as Record<string, unknown>).year);
        const month = Number((rawValue as Record<string, unknown>).month);

        if (Number.isInteger(year) && Number.isInteger(month)) {
          return `${year}-${String(month).padStart(2, '0')}-01`;
        }
      }
    }

    return null;
  }

  private normalizeDateString(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    if (/^\d{4}-\d{2}$/.test(trimmedValue)) {
      return `${trimmedValue}-01`;
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedValue)) {
      return trimmedValue;
    }

    if (/^\d{2}\/\d{4}$/.test(trimmedValue)) {
      const [month, year] = trimmedValue.split('/');
      return `${year}-${month}-01`;
    }

    if (/^\d{2}-\d{4}$/.test(trimmedValue)) {
      const [month, year] = trimmedValue.split('-');
      return `${year}-${month}-01`;
    }

    const dayMonthYearPattern = /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2}|\d{4})$/;
    const dayMonthYearMatch = dayMonthYearPattern.exec(trimmedValue);

    if (dayMonthYearMatch) {
      const [, day, month, year] = dayMonthYearMatch;
      return `${this.normalizeYearFragment(year)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const normalizedValue = trimmedValue
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .replaceAll(/\s+de\s+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
    const monthNames: Record<string, string> = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      setiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    };

    const monthYearPattern =
      /^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})$/;
    const monthYearMatch = monthYearPattern.exec(normalizedValue);

    if (monthYearMatch) {
      const [, monthName, year] = monthYearMatch;
      return `${year}-${monthNames[monthName]}-01`;
    }

    const fullTextDatePattern =
      /^(\d{1,2})\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})$/;
    const fullTextDateMatch = fullTextDatePattern.exec(normalizedValue);

    if (fullTextDateMatch) {
      const [, day, monthName, year] = fullTextDateMatch;
      return `${year}-${monthNames[monthName]}-${day.padStart(2, '0')}`;
    }

    const parsedDate = new Date(trimmedValue);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toISOString().slice(0, 10);
  }

  private normalizeYearFragment(value: string) {
    if (value.length === 4) {
      return value;
    }

    const numericYear = Number(value);

    if (!Number.isInteger(numericYear)) {
      return value;
    }

    return String(numericYear >= 70 ? 1900 + numericYear : 2000 + numericYear);
  }

  private normalizeStoredFieldValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      return trimmedValue.length ? trimmedValue : null;
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value) || typeof value === 'object') {
      return JSON.stringify(value);
    }

    return null;
  }

  private normalizeConfidenceLevel(
    confidenceSummary?: string | null,
  ): DocumentFieldWriteInput['confidenceLevel'] {
    if (confidenceSummary === 'HIGH' || confidenceSummary === 'LOW') {
      return confidenceSummary;
    }

    return 'MEDIUM' as const;
  }

  private normalizeStoredConfidenceSummary(confidenceSummary?: string | null) {
    const normalizedValue = confidenceSummary?.trim();

    if (!normalizedValue) {
      return 'MEDIUM';
    }

    const uppercaseValue = normalizedValue.toUpperCase();

    if (uppercaseValue === 'MANUAL') {
      return 'MANUAL';
    }

    if (
      uppercaseValue.includes('HIGH') ||
      uppercaseValue.includes('ALTA') ||
      uppercaseValue.includes('ALTO')
    ) {
      return 'HIGH';
    }

    if (
      uppercaseValue.includes('LOW') ||
      uppercaseValue.includes('BAJA') ||
      uppercaseValue.includes('BAJO')
    ) {
      return 'LOW';
    }

    if (
      uppercaseValue.includes('MEDIUM') ||
      uppercaseValue.includes('MEDIA') ||
      uppercaseValue.includes('MEDIO')
    ) {
      return 'MEDIUM';
    }

    return normalizedValue.slice(0, 50);
  }

  private ensureDocumentQualityIsProcessable(
    confidenceSummary?: string | null,
  ) {
    if (confidenceSummary !== 'LOW') {
      return;
    }

    throw new UnprocessableEntityException(
      'El documento no puede ser procesado debido a su calidad.',
    );
  }

  private isLowConfidenceDocumentError(error: unknown) {
    return (
      error instanceof UnprocessableEntityException &&
      error.message ===
        'El documento no puede ser procesado debido a su calidad.'
    );
  }

  private async cleanupDocumentArtifacts(
    userId: number,
    documentId: number,
    storagePath: string,
  ) {
    await this.databaseService.execute(
      `DELETE FROM finan_document_field_values WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_document_llm_results WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_document_ocr_results WHERE document_id = ?`,
      [documentId],
    );
    await this.databaseService.execute(
      `DELETE FROM finan_documents WHERE id = ? AND user_id = ?`,
      [documentId, userId],
    );

    await this.documentStorageService.deleteFile(storagePath);
  }

  private async insertDocumentFieldValues(
    documentId: number,
    fieldValues: DocumentFieldWriteInput[],
  ) {
    for (const fieldValue of fieldValues) {
      await this.databaseService.execute(
        `
          INSERT INTO finan_document_field_values (
            document_id, field_name, field_value, source, confidence_level, is_verified
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          documentId,
          fieldValue.fieldName,
          fieldValue.fieldValue,
          fieldValue.source,
          fieldValue.confidenceLevel,
          fieldValue.isVerified ? 1 : 0,
        ],
      );
    }
  }

  private mapDocument(row: DocumentRow) {
    const documentDate = toIsoDate(row.documentDate);
    const latestParsedJson = parseStoredJson<Record<string, unknown>>(
      row.latestParsedJson,
    );

    return {
      id: row.id,
      userId: row.userId,
      documentType: row.documentType,
      displayLabel: row.displayLabel,
      displayName:
        row.displayLabel?.trim() ||
        this.buildDocumentDisplayName(
          row.documentType,
          documentDate,
          latestParsedJson,
        ),
      originalFilename: row.originalFilename,
      mimeType: row.mimeType,
      storagePath: row.storagePath,
      fileSizeBytes: row.fileSizeBytes,
      documentDate,
      status: row.status,
      linkedEntityType: row.linkedEntityType,
      linkedEntityId: row.linkedEntityId,
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }

  private buildDocumentDisplayName(
    documentType: string,
    documentDate: string | null,
    latestParsedJson: Record<string, unknown> | null,
  ) {
    const documentTypeTag = this.buildDocumentTypeTag(documentType);
    const llmReference = this.resolveDocumentDisplayReference(
      documentType,
      latestParsedJson,
    );

    if (llmReference) {
      return `${documentTypeTag} ${llmReference}`;
    }

    if (!documentDate) {
      return `${documentTypeTag} sin fecha documental`;
    }

    return `${documentTypeTag} ${this.formatDocumentDateReference(documentType, documentDate)}`;
  }

  private buildDocumentTypeTag(documentType: string) {
    const typeLabel = documentTypeLabels[documentType] ?? 'Documento';
    return `[${typeLabel}]`;
  }

  private resolveDocumentDisplayReference(
    documentType: string,
    latestParsedJson: Record<string, unknown> | null,
  ) {
    if (!latestParsedJson) {
      return null;
    }

    const extractedFields = this.getExtractedFieldsObject(latestParsedJson);
    const sources = this.getDocumentInterpretationSources(
      latestParsedJson,
      extractedFields,
    );
    const summary =
      typeof latestParsedJson.summary === 'string'
        ? latestParsedJson.summary.trim()
        : '';

    const structuredReference = this.readTemporalReferenceValueFromSources(
      sources,
      this.getDocumentDisplayReferencePaths(documentType),
    );

    if (structuredReference) {
      return structuredReference;
    }

    if (summary) {
      const summaryReference = this.extractTemporalReferenceFromText(summary);

      if (summaryReference) {
        return summaryReference;
      }
    }

    return null;
  }

  private getDocumentDisplayReferencePaths(documentType: string) {
    const pathsByType: Record<string, string[]> = {
      PAYSLIP: [
        'period',
        'periodo',
        'periodLabel',
        'periodoLiquidacion',
        'settlementPeriod',
        'payrollPeriod',
        'salaryPeriod',
        'paymentPeriod',
        'month',
        'periodMonth',
        'fechaPago',
        'payDate',
        'paymentDate',
        'fechaNomina',
        'fechaDevengo',
      ],
      INVOICE: [
        'invoiceDate',
        'issueDate',
        'fechaEmision',
        'fechaFactura',
        'billingPeriod',
        'servicePeriod',
        'period',
        'periodo',
        'documentDate',
        'date',
      ],
      RECEIPT: [
        'expenseDate',
        'purchaseDate',
        'issueDate',
        'fechaOperacion',
        'documentDate',
        'date',
      ],
      CONTRACT: [
        'effectiveDate',
        'signatureDate',
        'startDate',
        'contractDate',
        'documentDate',
        'date',
      ],
      RENTAL_DOCUMENT: [
        'period',
        'periodo',
        'rentPeriod',
        'issueDate',
        'effectiveDate',
        'documentDate',
        'date',
      ],
      INSURANCE_DOCUMENT: [
        'coveragePeriod',
        'period',
        'periodo',
        'issueDate',
        'effectiveDate',
        'documentDate',
        'date',
      ],
      TAX_DOCUMENT: [
        'taxPeriod',
        'period',
        'periodo',
        'issueDate',
        'documentDate',
        'date',
      ],
      RETENTION_CERTIFICATE: [
        'taxYear',
        'fiscalYear',
        'period',
        'periodo',
        'issueDate',
        'documentDate',
        'date',
      ],
      SCREENSHOT: ['capturedAt', 'documentDate', 'date'],
      OTHER: [
        'period',
        'periodo',
        'issueDate',
        'expenseDate',
        'paymentDate',
        'documentDate',
        'date',
      ],
    };

    return pathsByType[documentType] ?? pathsByType.OTHER;
  }

  private readTemporalReferenceValue(
    source: Record<string, unknown>,
    candidatePaths: string[],
  ) {
    for (const candidatePath of candidatePaths) {
      const normalizedValue = this.normalizeTemporalReferenceValue(
        source[candidatePath],
      );

      if (normalizedValue) {
        return normalizedValue;
      }
    }

    return null;
  }

  private readTemporalReferenceValueFromSources(
    sources: Record<string, unknown>[],
    candidatePaths: string[],
  ) {
    for (const source of sources) {
      const resolvedValue = this.readTemporalReferenceValue(
        source,
        candidatePaths,
      );

      if (resolvedValue) {
        return resolvedValue;
      }
    }

    return null;
  }

  private normalizeTemporalReferenceValue(value: unknown): string | null {
    if (typeof value === 'string') {
      return this.extractTemporalReferenceFromText(value);
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const startValue = this.normalizeTemporalReferenceValue(
      (value as Record<string, unknown>).start ??
        (value as Record<string, unknown>).from,
    );
    const endValue = this.normalizeTemporalReferenceValue(
      (value as Record<string, unknown>).end ??
        (value as Record<string, unknown>).to,
    );

    if (startValue && endValue) {
      return `del ${startValue} al ${endValue}`;
    }

    const year = Number((value as Record<string, unknown>).year);
    const month = Number((value as Record<string, unknown>).month);

    if (Number.isInteger(year) && Number.isInteger(month)) {
      return this.formatMonthYearReference(year, month);
    }

    return null;
  }

  private extractTemporalReferenceFromText(value: string) {
    const normalizedValue = value.replaceAll(/\s+/g, ' ').trim();

    if (!normalizedValue) {
      return null;
    }

    const exactRangePattern =
      /del\s+\d{1,2}\s+al\s+\d{1,2}\s+de\s+[a-záéíóúüñ]+\s+de\s+\d{4}/i;
    const exactRangeMatch = exactRangePattern.exec(normalizedValue);

    if (exactRangeMatch?.[0]) {
      return exactRangeMatch[0].trim();
    }

    const textualDatePattern =
      /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/i;
    const textualDateMatch = textualDatePattern.exec(normalizedValue);

    if (textualDateMatch?.[0]) {
      return textualDateMatch[0].trim();
    }

    const fullDatePatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/,
      /\b\d{1,2}[/. -]\d{1,2}[/. -](?:\d{2}|\d{4})\b/,
    ];
    const fullDateMatch = fullDatePatterns
      .map((pattern) => pattern.exec(normalizedValue))
      .find((match) => match?.[0]);

    if (fullDateMatch?.[0]) {
      return this.formatFreeDateReference(fullDateMatch[0]);
    }

    const monthYearTextPattern =
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de)?\s+\d{4}\b/i;
    const monthYearTextMatch = monthYearTextPattern.exec(normalizedValue);

    if (monthYearTextMatch?.[0]) {
      return this.normalizeMonthYearText(monthYearTextMatch[0]);
    }

    const monthYearNumericPattern = /\b\d{2}[/-]\d{4}\b|\b\d{4}-\d{2}\b/;
    const monthYearNumericMatch = monthYearNumericPattern.exec(normalizedValue);

    if (monthYearNumericMatch?.[0]) {
      return this.formatFreeMonthYearReference(monthYearNumericMatch[0]);
    }

    return null;
  }

  private formatFreeDateReference(value: string) {
    const normalizedDate = this.normalizeDateString(value);

    if (!normalizedDate) {
      return value.trim();
    }

    const [year, month, day] = normalizedDate.split('-');
    return `${day}/${month}/${year}`;
  }

  private formatFreeMonthYearReference(value: string) {
    const trimmedValue = value.trim();

    if (/^\d{4}-\d{2}$/.test(trimmedValue)) {
      const [year, month] = trimmedValue.split('-');
      return this.formatMonthYearReference(Number(year), Number(month));
    }

    if (/^\d{2}[/-]\d{4}$/.test(trimmedValue)) {
      const [month, year] = trimmedValue.split(/[/-]/);
      return this.formatMonthYearReference(Number(year), Number(month));
    }

    return trimmedValue;
  }

  private normalizeMonthYearText(value: string) {
    const normalizedValue = value
      .trim()
      .toLowerCase()
      .replaceAll(/\s+/g, ' ')
      .replace(/^(\S+)\s+(\d{4})$/, '$1 de $2');

    return normalizedValue;
  }

  private formatMonthYearReference(year: number, month: number) {
    if (!Number.isInteger(year) || !Number.isInteger(month)) {
      return null;
    }

    if (month < 1 || month > 12) {
      return null;
    }

    return `${spanishMonthLabels[month - 1]} de ${year}`;
  }

  private formatDocumentDateReference(
    documentType: string,
    documentDate: string,
  ) {
    const [year, month, day] = documentDate.split('-');

    if (documentType === 'PAYSLIP') {
      return `${month}/${year}`;
    }

    return `${day}/${month}/${year}`;
  }
}
