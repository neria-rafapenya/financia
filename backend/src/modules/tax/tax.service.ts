import { Injectable } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { parseStoredJson, toIsoDate } from '../../common/serializers';
import { normalizeValidSpanishTaxId } from '../../common/tax-id';
import { DatabaseService } from '../../database/database.service';
import { UsersService } from '../users/users.service';
import { GetTaxPeriodDto } from './dto/get-tax-period.dto';

interface DerivedInvoiceRow extends RowDataPacket {
  documentId: number;
  documentType: string;
  originalFilename: string;
  documentDate: Date | string | null;
  parsedJson: unknown;
  processedAt: Date | string;
  notes: string | null;
}

export interface TaxUserIdentity {
  fullName: string;
  taxId: string | null;
  hasValidTaxId: boolean;
}

export interface TaxDocumentAnalysis {
  summary: string;
  sources: Record<string, unknown>[];
  issuerTaxId: string | null;
  issuerName: string | null;
  customerTaxId: string | null;
  customerName: string | null;
  isOwnIssuedInvoice: boolean;
}

export interface TaxObligationItem {
  id: string;
  sourceDocumentId: number;
  obligationType: 'VAT' | 'IRPF';
  label: string;
  concept: string;
  counterpartyName: string | null;
  sourceDocumentType: string;
  effectiveDate: string | null;
  periodYear: number;
  periodMonth: number | null;
  amount: number;
  status: 'PENDING_REVIEW';
  matchedUserTaxId: string | null;
  detectedIssuerTaxId: string | null;
  settlementYear: number;
  settlementQuarter: number;
  settlementLabel: string;
  dueDate: string;
  notes: string | null;
}

export interface TaxPeriodOverview {
  profile: TaxUserIdentity;
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
    label: string;
  };
  totals: {
    totalAmount: number;
    totalVatAmount: number;
    totalIrpfAmount: number;
    recordCount: number;
  };
  items: TaxObligationItem[];
}

@Injectable()
export class TaxService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly usersService: UsersService,
  ) {}

  async getUserTaxIdentity(userId: number): Promise<TaxUserIdentity> {
    const user = await this.usersService.getPublicUserById(userId);

    return {
      fullName: user.fullName,
      taxId: user.taxId,
      hasValidTaxId: user.hasValidTaxId,
    };
  }

  async getPeriodOverview(
    userId: number,
    filter: GetTaxPeriodDto,
  ): Promise<TaxPeriodOverview> {
    const profile = await this.getUserTaxIdentity(userId);
    const period = this.resolvePeriod(filter);
    const items = (await this.listDerivedObligations(userId, profile)).filter(
      (item) => {
        if (Number(item.dueDate.slice(0, 4)) !== period.year) {
          return false;
        }

        if (period.month && Number(item.dueDate.slice(5, 7)) !== period.month) {
          return false;
        }

        return true;
      },
    );

    return {
      profile,
      period: {
        year: period.year,
        month: period.month,
        startDate: period.startDate,
        endDate: period.endDate,
        label: period.month
          ? `${String(period.month).padStart(2, '0')}/${period.year}`
          : `Ejercicio ${period.year}`,
      },
      totals: this.buildTotals(items),
      items,
    };
  }

  async getSummary(userId: number) {
    const profile = await this.getUserTaxIdentity(userId);
    const items = await this.listDerivedObligations(userId, profile);
    const totals = this.buildTotals(items);

    return {
      totalAmount: totals.totalAmount,
      totalVatAmount: totals.totalVatAmount,
      totalIrpfAmount: totals.totalIrpfAmount,
      recordCount: totals.recordCount,
    };
  }

  async listDerivedObligations(
    userId: number,
    profile?: TaxUserIdentity,
  ): Promise<TaxObligationItem[]> {
    const resolvedProfile = profile ?? (await this.getUserTaxIdentity(userId));

    if (!resolvedProfile.hasValidTaxId) {
      return [];
    }

    const rows = await this.databaseService.query<DerivedInvoiceRow[]>(
      `
        SELECT
          documents.id AS documentId,
          documents.document_type AS documentType,
          documents.original_filename AS originalFilename,
          documents.document_date AS documentDate,
          llm_results.parsed_json AS parsedJson,
          llm_results.processed_at AS processedAt,
          documents.notes AS notes
        FROM finan_documents AS documents
        INNER JOIN (
          SELECT document_id, MAX(id) AS latestResultId
          FROM finan_document_llm_results
          GROUP BY document_id
        ) AS latest_llm
          ON latest_llm.document_id = documents.id
        INNER JOIN finan_document_llm_results AS llm_results
          ON llm_results.id = latest_llm.latestResultId
        WHERE documents.user_id = ?
          AND documents.document_type = 'INVOICE'
          AND documents.status IN ('LLM_PROCESSED', 'VERIFIED')
        ORDER BY documents.document_date DESC, llm_results.processed_at DESC
      `,
      [userId],
    );

    return rows.flatMap((row) =>
      this.mapInvoiceTaxObligations(row, resolvedProfile),
    );
  }

  analyzeInvoiceDocument(
    userIdentity: TaxUserIdentity,
    parsedJson: Record<string, unknown> | null,
  ): TaxDocumentAnalysis {
    const extractedFields = this.getExtractedFieldsObject(parsedJson);
    const sources = this.getDocumentInterpretationSources(
      parsedJson,
      extractedFields,
    );
    const summary =
      typeof parsedJson?.summary === 'string' ? parsedJson.summary.trim() : '';
    const serializedDocument = JSON.stringify(parsedJson ?? {});
    const issuerTaxId = this.readTaxIdValueFromSources(sources, [
      'issuerTaxId',
      'emitterTaxId',
      'vendorTaxId',
      'supplierTaxId',
      'providerTaxId',
      'issuerNif',
      'issuerCif',
      'issuerVatId',
      'companyTaxId',
      'taxId',
      'nif',
      'cif',
    ]);
    const issuerName = this.readStringValueFromSources(sources, [
      'issuerName',
      'emitterName',
      'vendorName',
      'supplierName',
      'providerName',
      'companyName',
      'freelancerName',
      'sellerName',
    ]);
    const customerTaxId = this.readTaxIdValueFromSources(sources, [
      'customerTaxId',
      'recipientTaxId',
      'buyerTaxId',
      'clientTaxId',
      'receiverTaxId',
    ]);
    const customerName = this.readStringValueFromSources(sources, [
      'customerName',
      'recipientName',
      'buyerName',
      'clientName',
      'receiverName',
    ]);
    const matchesIssuerTaxId =
      Boolean(userIdentity.taxId) && issuerTaxId === userIdentity.taxId;
    const matchesCustomerTaxId =
      Boolean(userIdentity.taxId) && customerTaxId === userIdentity.taxId;
    const matchesIssuerName = this.namesMatch(
      userIdentity.fullName,
      issuerName,
    );
    const matchesCustomerName = this.namesMatch(
      userIdentity.fullName,
      customerName,
    );
    const normalizedUserTaxId = userIdentity.taxId;
    const appearsUserTaxIdSomewhere = normalizedUserTaxId
      ? this.textContainsTaxId(serializedDocument, normalizedUserTaxId)
      : false;
    const appearsUserNameSomewhere = this.textContainsName(
      serializedDocument,
      userIdentity.fullName,
    );

    return {
      summary,
      sources,
      issuerTaxId,
      issuerName,
      customerTaxId,
      customerName,
      isOwnIssuedInvoice:
        matchesIssuerTaxId ||
        (appearsUserTaxIdSomewhere &&
          !matchesCustomerTaxId &&
          matchesIssuerName) ||
        (appearsUserTaxIdSomewhere &&
          appearsUserNameSomewhere &&
          !matchesCustomerTaxId &&
          !matchesCustomerName) ||
        (!matchesCustomerTaxId && !issuerTaxId && matchesIssuerName) ||
        (!matchesCustomerTaxId && matchesIssuerTaxId && !matchesCustomerName),
    };
  }

  private mapInvoiceTaxObligations(
    row: DerivedInvoiceRow,
    userIdentity: TaxUserIdentity,
  ) {
    const parsedJson = parseStoredJson<Record<string, unknown>>(row.parsedJson);
    const analysis = this.analyzeInvoiceDocument(userIdentity, parsedJson);

    if (!analysis.isOwnIssuedInvoice) {
      return [];
    }

    const effectiveDate = this.resolveDocumentDate(
      analysis.sources,
      analysis.summary,
      toIsoDate(row.documentDate),
    );

    if (!effectiveDate) {
      return [];
    }

    const vatAmount =
      this.readNumericValueFromSources(analysis.sources, [
        'vatAmount',
        'taxAmount',
        'ivaAmount',
        'outputVatAmount',
      ]) ??
      this.extractNumericValueFromText(analysis.summary, [
        'iva',
        'cuota iva',
        'importe iva',
      ]);
    const irpfAmount =
      this.readNumericValueFromSources(analysis.sources, [
        'irpfWithheld',
        'incomeTaxWithheld',
        'withholdingAmount',
        'retencionIrpf',
      ]) ??
      this.extractNumericValueFromText(analysis.summary, [
        'irpf',
        'retencion',
        'retencion irpf',
      ]);
    const obligationItems: TaxObligationItem[] = [];
    const periodYear = Number(effectiveDate.slice(0, 4));
    const periodMonth = Number(effectiveDate.slice(5, 7));
    const reference = this.buildInvoiceReference(effectiveDate);
    const counterpartyName = analysis.customerName;
    const settlement = this.resolveQuarterlySettlement(effectiveDate);

    if (vatAmount && vatAmount > 0) {
      obligationItems.push({
        id: `tax-vat-${row.documentId}`,
        sourceDocumentId: row.documentId,
        obligationType: 'VAT',
        label: `IVA repercutido ${reference}`,
        concept: 'IVA derivado de factura emitida por el usuario',
        counterpartyName,
        sourceDocumentType: row.documentType,
        effectiveDate,
        periodYear,
        periodMonth,
        amount: vatAmount,
        status: 'PENDING_REVIEW',
        matchedUserTaxId: userIdentity.taxId,
        detectedIssuerTaxId: analysis.issuerTaxId,
        settlementYear: settlement.year,
        settlementQuarter: settlement.quarter,
        settlementLabel: settlement.label,
        dueDate: settlement.dueDate,
        notes: analysis.summary || row.notes,
      });
    }

    if (irpfAmount && irpfAmount > 0) {
      obligationItems.push({
        id: `tax-irpf-${row.documentId}`,
        sourceDocumentId: row.documentId,
        obligationType: 'IRPF',
        label: `IRPF factura ${reference}`,
        concept: 'IRPF retenido o asociado a factura emitida por el usuario',
        counterpartyName,
        sourceDocumentType: row.documentType,
        effectiveDate,
        periodYear,
        periodMonth,
        amount: irpfAmount,
        status: 'PENDING_REVIEW',
        matchedUserTaxId: userIdentity.taxId,
        detectedIssuerTaxId: analysis.issuerTaxId,
        settlementYear: settlement.year,
        settlementQuarter: settlement.quarter,
        settlementLabel: settlement.label,
        dueDate: settlement.dueDate,
        notes: analysis.summary || row.notes,
      });
    }

    return obligationItems;
  }

  private buildTotals(items: TaxObligationItem[]) {
    return {
      totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
      totalVatAmount: items
        .filter((item) => item.obligationType === 'VAT')
        .reduce((sum, item) => sum + item.amount, 0),
      totalIrpfAmount: items
        .filter((item) => item.obligationType === 'IRPF')
        .reduce((sum, item) => sum + item.amount, 0),
      recordCount: items.length,
    };
  }

  private resolvePeriod(filter: GetTaxPeriodDto) {
    const now = new Date();
    const year = filter.year ?? now.getUTCFullYear();
    const month = filter.month ?? null;
    const startDate = month
      ? new Date(Date.UTC(year, month - 1, 1))
      : new Date(Date.UTC(year, 0, 1));
    const endDate = month
      ? new Date(Date.UTC(year, month, 0))
      : new Date(Date.UTC(year, 11, 31));

    return {
      year,
      month,
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
  }

  private buildInvoiceReference(effectiveDate: string) {
    const [year, month, day] = effectiveDate.split('-');
    return `${day}/${month}/${year}`;
  }

  private namesMatch(leftValue: string | null, rightValue: string | null) {
    if (!leftValue || !rightValue) {
      return false;
    }

    const normalizedLeft = this.normalizeName(leftValue);
    const normalizedRight = this.normalizeName(rightValue);

    return (
      normalizedLeft === normalizedRight ||
      normalizedLeft.includes(normalizedRight) ||
      normalizedRight.includes(normalizedLeft)
    );
  }

  private normalizeName(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replaceAll(/[\u0300-\u036f]/g, '')
      .replaceAll(/[^a-z0-9]+/g, ' ')
      .replaceAll(/\s+/g, ' ')
      .trim();
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

  private resolveDocumentDate(
    sources: Record<string, unknown>[],
    summary: string,
    fallbackDate: string | null,
  ) {
    const dateFromFields = this.readDateValueFromSources(sources, [
      'issueDate',
      'invoiceDate',
      'fechaEmision',
      'fechaFactura',
      'billingPeriod',
      'servicePeriod',
      'documentDate',
      'date',
    ]);

    if (dateFromFields) {
      return dateFromFields;
    }

    const dateFromSummary = this.extractDateFromText(summary);
    return dateFromSummary ?? fallbackDate;
  }

  private readNumericValueFromSources(
    sources: Record<string, unknown>[],
    candidatePaths: string[],
  ) {
    for (const source of sources) {
      const resolvedValue = this.readNumericValue(source, candidatePaths);

      if (resolvedValue !== null) {
        return resolvedValue;
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

  private readTaxIdValueFromSources(
    sources: Record<string, unknown>[],
    candidatePaths: string[],
  ) {
    for (const source of sources) {
      const rawValue = this.readStringValue(source, candidatePaths);
      const normalizedValue = normalizeValidSpanishTaxId(rawValue);

      if (normalizedValue) {
        return normalizedValue;
      }
    }

    return null;
  }

  private textContainsTaxId(text: string, taxId: string) {
    const normalizedText = text.toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
    return normalizedText.includes(taxId);
  }

  private textContainsName(text: string, fullName: string) {
    const normalizedText = this.normalizeName(text);
    const normalizedName = this.normalizeName(fullName);
    return normalizedName.length > 4 && normalizedText.includes(normalizedName);
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

  private readNumericValue(
    source: Record<string, unknown>,
    candidatePaths: string[],
  ) {
    for (const candidatePath of candidatePaths) {
      const rawValue = source[candidatePath];

      if (rawValue === null || rawValue === undefined) {
        continue;
      }

      if (typeof rawValue === 'number') {
        return rawValue;
      }

      if (
        rawValue &&
        typeof rawValue === 'object' &&
        !Array.isArray(rawValue)
      ) {
        const nestedValue = this.readNumericValue(
          rawValue as Record<string, unknown>,
          ['amount', 'value', 'total', 'gross', 'net', 'base'],
        );

        if (nestedValue !== null) {
          return nestedValue;
        }
      }

      if (typeof rawValue === 'string') {
        const parsedValue = this.parseNumericString(rawValue);

        if (parsedValue !== null) {
          return parsedValue;
        }
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

  private extractDateFromText(value: string) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    const exactPatterns = [
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b\d{1,2}[/. -]\d{1,2}[/. -](?:\d{2}|\d{4})\b/g,
      /\b\d{2}[/-]\d{4}\b/g,
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(?:de\s+)?\d{4}\b/g,
      /\b\d{1,2}\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+\d{4}\b/g,
    ];

    for (const pattern of exactPatterns) {
      const match = pattern.exec(trimmedValue);

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

  private extractNumericValueFromText(
    value: string,
    candidateLabels: string[],
  ) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return null;
    }

    for (const label of candidateLabels) {
      const escapedLabel = label.replaceAll(
        /[.*+?^${}()|[\]\\]/g,
        String.raw`\$&`,
      );
      const labelBeforeValuePattern = new RegExp(
        String.raw`${escapedLabel}[^\d-]{0,30}(-?\d[\d.,]*)`,
        'i',
      );
      const labelBeforeValueMatch = labelBeforeValuePattern.exec(trimmedValue);

      if (labelBeforeValueMatch?.[1]) {
        const parsedValue = this.parseNumericString(labelBeforeValueMatch[1]);

        if (parsedValue !== null) {
          return parsedValue;
        }
      }
    }

    return null;
  }

  private parseNumericString(value: string) {
    const normalizedValue = value
      .replaceAll('.', '')
      .replace(',', '.')
      .replaceAll(/[^0-9.-]/g, '');
    const parsedValue = Number(normalizedValue);

    if (Number.isNaN(parsedValue)) {
      return null;
    }

    return parsedValue;
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

    const dayMonthYearPattern =
      /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2}|\d{4})$/;
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

  private resolveQuarterlySettlement(effectiveDate: string) {
    const [yearText, monthText] = effectiveDate.split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    const quarter = Math.ceil(month / 3);

    if (quarter === 4) {
      return {
        year,
        quarter,
        label: `T${quarter} ${year}`,
        dueDate: `${year + 1}-01-30`,
      };
    }

    const dueMonth = String(quarter * 3 + 1).padStart(2, '0');

    return {
      year,
      quarter,
      label: `T${quarter} ${year}`,
      dueDate: `${year}-${dueMonth}-20`,
    };
  }
}
