export interface DocumentRecord {
  id: number;
  userId: number;
  documentType: string;
  displayLabel: string | null;
  displayName: string;
  originalFilename: string;
  mimeType: string;
  storagePath: string;
  fileSizeBytes: number | null;
  documentDate: string | null;
  status: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DocumentOcrResult {
  id: number;
  documentId: number;
  ocrProvider: string;
  rawText: string;
  confidenceScore: number | null;
  processedAt: string | null;
}

export interface DocumentLlmResult {
  id: number;
  documentId: number;
  ocrResultId: number | null;
  llmProvider: string;
  modelName: string;
  promptVersion: string | null;
  rawResponse: string;
  parsedJson: Record<string, unknown> | null;
  confidenceSummary: string | null;
  processedAt: string | null;
}

export interface DocumentFieldValue {
  id: number;
  documentId: number;
  fieldName: string;
  fieldValue: string | null;
  source: string;
  confidenceLevel: string;
  isVerified: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface DocumentDetail extends DocumentRecord {
  ocrResults: DocumentOcrResult[];
  llmResults: DocumentLlmResult[];
  fieldValues: DocumentFieldValue[];
}

export interface UploadDocumentInput {
  file: File;
  documentType?: string;
  documentDate?: string;
  notes?: string;
  linkedEntityType?: string;
  linkedEntityId?: number | null;
  instructions?: string;
  autoDetectDocumentType?: boolean;
}

export interface UpdateDocumentInput {
  documentId: number;
  displayLabel?: string;
  notes?: string;
}

export interface ProcessOcrInput {
  ocrProvider?: string;
  rawText?: string;
  confidenceScore?: number;
}

export interface ProcessLlmInput {
  llmProvider?: string;
  modelName?: string;
  promptVersion?: string;
  rawResponse?: string;
  parsedJson?: Record<string, unknown>;
  confidenceSummary?: string;
  instructions?: string;
  autoDetectDocumentType?: boolean;
}

export interface AnalyzeDocumentInput {
  documentId: number;
  ocrProvider?: string;
  llmProvider?: string;
  modelName?: string;
  promptVersion?: string;
  instructions?: string;
  autoDetectDocumentType?: boolean;
}

export const DOCUMENT_TYPE_OPTIONS = [
  "PAYSLIP",
  "RETENTION_CERTIFICATE",
  "CONTRACT",
  "INVOICE",
  "RECEIPT",
  "RENTAL_DOCUMENT",
  "INSURANCE_DOCUMENT",
  "TAX_DOCUMENT",
  "SCREENSHOT",
  "OTHER",
] as const;

export const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  PAYSLIP: "Nómina",
  RETENTION_CERTIFICATE: "Certificado de retenciones",
  CONTRACT: "Contrato",
  INVOICE: "Factura",
  RECEIPT: "Ticket o justificante",
  RENTAL_DOCUMENT: "Documento de alquiler",
  INSURANCE_DOCUMENT: "Documento de seguro",
  TAX_DOCUMENT: "Documento fiscal",
  SCREENSHOT: "Captura o imagen",
  OTHER: "Otro documento",
};

export const DOCUMENT_FIELD_LABELS: Record<string, string> = {
  partyA: "Parte A",
  partyB: "Parte B",
  contractType: "Tipo de contrato",
  startDate: "Fecha de inicio",
  endDate: "Fecha de fin",
  salaryAmount: "Importe salarial u honorarios",
  exclusivityFlag: "Cláusula de exclusividad",
  nonCompeteFlag: "Cláusula de no competencia",
  vendorName: "Proveedor o comercio",
  expenseDate: "Fecha del gasto",
  totalAmount: "Importe total",
  vatAmount: "IVA",
  paymentMethod: "Método de pago",
  invoiceNumber: "Número de factura",
  issueDate: "Fecha de emisión",
  customerName: "Cliente o destinatario",
  subtotalAmount: "Base imponible",
  currency: "Moneda",
};

export function getDocumentTypeLabel(documentType: string) {
  return DOCUMENT_TYPE_LABELS[documentType] ?? documentType;
}

export function getDocumentFieldLabel(fieldName: string) {
  return DOCUMENT_FIELD_LABELS[fieldName] ?? fieldName;
}
