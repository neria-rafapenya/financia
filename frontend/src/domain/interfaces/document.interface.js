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
];
export const DOCUMENT_TYPE_LABELS = {
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
export const DOCUMENT_FIELD_LABELS = {
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
export function getDocumentTypeLabel(documentType) {
    return DOCUMENT_TYPE_LABELS[documentType] ?? documentType;
}
export function getDocumentFieldLabel(fieldName) {
    return DOCUMENT_FIELD_LABELS[fieldName] ?? fieldName;
}
