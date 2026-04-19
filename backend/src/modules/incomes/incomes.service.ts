import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import {
  parseStoredJson,
  toIsoDate,
  toIsoDateTime,
  toNullableNumber,
} from '../../common/serializers';
import { CreateIncomeDto } from './dto/create-income.dto';
import { GetIncomePeriodDto } from './dto/get-income-period.dto';
import { TaxService, type TaxUserIdentity } from '../tax/tax.service';
import { UpdateIncomeDto } from './dto/update-income.dto';

type NumericDatabaseValue = string | number | null;

interface IncomeRow extends RowDataPacket {
  id: number;
  userId: number;
  payerId: number;
  payerName: string | null;
  contractId: number | null;
  incomeType: string;
  periodYear: number;
  periodMonth: number | null;
  grossAmount: NumericDatabaseValue;
  netAmount: NumericDatabaseValue;
  irpfWithheld: NumericDatabaseValue;
  socialSecurityAmount: NumericDatabaseValue;
  flexibleCompensationAmount: NumericDatabaseValue;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface LatestDocumentIncomeRow extends RowDataPacket {
  documentId: number;
  documentType: string;
  originalFilename: string;
  documentDate: Date | string | null;
  parsedJson: unknown;
  processedAt: Date | string;
}

export interface IncomePeriodItem {
  id: string;
  source: 'MANUAL' | 'DOCUMENT';
  sourceId: number;
  sourceDocumentType: string | null;
  incomeType: string;
  label: string;
  counterpartyName: string | null;
  periodYear: number;
  periodMonth: number | null;
  effectiveDate: string | null;
  grossAmount: number;
  netAmount: number | null;
  vatAmount: number | null;
  irpfWithheld: number | null;
  socialSecurityAmount: number | null;
  effectiveAmount: number;
  notes: string | null;
}

export interface IncomePeriodOverview {
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
    label: string;
    fiscalYearStartDate: string;
  };
  totals: {
    totalGrossAmount: number;
    totalNetAmount: number;
    totalVatAmount: number;
    totalIrpfWithheld: number;
    totalSocialSecurityAmount: number;
    totalPeriodAmount: number;
    recordCount: number;
  };
  items: IncomePeriodItem[];
}

interface IncomeSummaryRow extends RowDataPacket {
  totalGrossAmount: NumericDatabaseValue;
  totalNetAmount: NumericDatabaseValue;
  totalIrpfWithheld: NumericDatabaseValue;
  totalSocialSecurityAmount: NumericDatabaseValue;
  recordCount: number;
}

interface IncomePayerSummaryRow extends RowDataPacket {
  payerId: number;
  payerName: string;
  totalGrossAmount: NumericDatabaseValue;
  totalNetAmount: NumericDatabaseValue;
  totalIrpfWithheld: NumericDatabaseValue;
}

@Injectable()
export class IncomesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly taxService: TaxService,
  ) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<IncomeRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          payer_id AS payerId,
          contract_id AS contractId,
          income_type AS incomeType,
          period_year AS periodYear,
          period_month AS periodMonth,
          gross_amount AS grossAmount,
          net_amount AS netAmount,
          irpf_withheld AS irpfWithheld,
          social_security_amount AS socialSecurityAmount,
          flexible_compensation_amount AS flexibleCompensationAmount,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_income_records
        WHERE user_id = ?
        ORDER BY period_year DESC, period_month DESC, created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapIncome(row));
  }

  async create(userId: number, createIncomeDto: CreateIncomeDto) {
    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_income_records (
          user_id, payer_id, contract_id, income_type, period_year, period_month,
          gross_amount, net_amount, irpf_withheld, social_security_amount,
          flexible_compensation_amount, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        createIncomeDto.payerId,
        createIncomeDto.contractId ?? null,
        createIncomeDto.incomeType,
        createIncomeDto.periodYear,
        createIncomeDto.periodMonth ?? null,
        createIncomeDto.grossAmount,
        createIncomeDto.netAmount ?? null,
        createIncomeDto.irpfWithheld ?? null,
        createIncomeDto.socialSecurityAmount ?? null,
        createIncomeDto.flexibleCompensationAmount ?? null,
        createIncomeDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    incomeId: number,
    updateIncomeDto: UpdateIncomeDto,
  ) {
    const current = await this.getById(userId, incomeId);

    await this.databaseService.execute(
      `
        UPDATE finan_income_records
        SET payer_id = ?,
            contract_id = ?,
            income_type = ?,
            period_year = ?,
            period_month = ?,
            gross_amount = ?,
            net_amount = ?,
            irpf_withheld = ?,
            social_security_amount = ?,
            flexible_compensation_amount = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        updateIncomeDto.payerId ?? current.payerId,
        updateIncomeDto.contractId ?? current.contractId,
        updateIncomeDto.incomeType ?? current.incomeType,
        updateIncomeDto.periodYear ?? current.periodYear,
        updateIncomeDto.periodMonth ?? current.periodMonth,
        updateIncomeDto.grossAmount ?? current.grossAmount,
        updateIncomeDto.netAmount ?? current.netAmount,
        updateIncomeDto.irpfWithheld ?? current.irpfWithheld,
        updateIncomeDto.socialSecurityAmount ?? current.socialSecurityAmount,
        updateIncomeDto.flexibleCompensationAmount ??
          current.flexibleCompensationAmount,
        updateIncomeDto.notes?.trim() ?? current.notes,
        incomeId,
        userId,
      ],
    );

    return this.getById(userId, incomeId);
  }

  async remove(userId: number, incomeId: number) {
    await this.getById(userId, incomeId);

    await this.databaseService.execute(
      `
        DELETE FROM finan_income_records
        WHERE id = ? AND user_id = ?
      `,
      [incomeId, userId],
    );

    return {
      id: incomeId,
      deleted: true,
    };
  }

  async summary(userId: number) {
    const [summaryRow] = await this.databaseService.query<IncomeSummaryRow[]>(
      `
        SELECT
          COALESCE(SUM(gross_amount), 0) AS totalGrossAmount,
          COALESCE(SUM(net_amount), 0) AS totalNetAmount,
          COALESCE(SUM(irpf_withheld), 0) AS totalIrpfWithheld,
          COALESCE(SUM(social_security_amount), 0) AS totalSocialSecurityAmount,
          COUNT(*) AS recordCount
        FROM finan_income_records
        WHERE user_id = ?
      `,
      [userId],
    );

    const payerBreakdown = await this.databaseService.query<
      IncomePayerSummaryRow[]
    >(
      `
        SELECT
          payers.id AS payerId,
          payers.payer_name AS payerName,
          COALESCE(SUM(income_records.gross_amount), 0) AS totalGrossAmount,
          COALESCE(SUM(income_records.net_amount), 0) AS totalNetAmount,
          COALESCE(SUM(income_records.irpf_withheld), 0) AS totalIrpfWithheld
        FROM finan_income_records AS income_records
        INNER JOIN finan_payers AS payers
          ON payers.id = income_records.payer_id
        WHERE income_records.user_id = ?
        GROUP BY payers.id, payers.payer_name
        ORDER BY totalGrossAmount DESC
      `,
      [userId],
    );

    return {
      totals: {
        totalGrossAmount: toNullableNumber(summaryRow?.totalGrossAmount) ?? 0,
        totalNetAmount: toNullableNumber(summaryRow?.totalNetAmount) ?? 0,
        totalIrpfWithheld: toNullableNumber(summaryRow?.totalIrpfWithheld) ?? 0,
        totalSocialSecurityAmount:
          toNullableNumber(summaryRow?.totalSocialSecurityAmount) ?? 0,
        recordCount: summaryRow?.recordCount ?? 0,
      },
      byPayer: payerBreakdown.map((row) => ({
        payerId: row.payerId,
        payerName: row.payerName,
        totalGrossAmount: toNullableNumber(row.totalGrossAmount) ?? 0,
        totalNetAmount: toNullableNumber(row.totalNetAmount) ?? 0,
        totalIrpfWithheld: toNullableNumber(row.totalIrpfWithheld) ?? 0,
      })),
    };
  }

  async getPeriodOverview(
    userId: number,
    filter: GetIncomePeriodDto,
  ): Promise<IncomePeriodOverview> {
    const period = this.resolvePeriod(filter);
    const [storedIncomeItems, documentIncomeItems] = await Promise.all([
      this.getStoredIncomeItems(userId, period),
      this.getDocumentIncomeItems(userId, period),
    ]);
    const items: IncomePeriodItem[] = [
      ...storedIncomeItems,
      ...documentIncomeItems,
    ].sort((leftItem, rightItem) => {
      const leftDate = leftItem.effectiveDate ?? '';
      const rightDate = rightItem.effectiveDate ?? '';

      if (leftDate !== rightDate) {
        return rightDate.localeCompare(leftDate);
      }

      return rightItem.id.localeCompare(leftItem.id);
    });

    return {
      period: {
        year: period.year,
        month: period.month,
        startDate: period.startDate,
        endDate: period.endDate,
        label: period.month
          ? `${String(period.month).padStart(2, '0')}/${period.year}`
          : `Ejercicio ${period.year}`,
        fiscalYearStartDate: `${period.year}-01-01`,
      },
      totals: {
        totalGrossAmount: items.reduce(
          (sum, item) => sum + item.grossAmount,
          0,
        ),
        totalNetAmount: items.reduce(
          (sum, item) => sum + (item.netAmount ?? item.effectiveAmount),
          0,
        ),
        totalVatAmount: items.reduce(
          (sum, item) => sum + (item.vatAmount ?? 0),
          0,
        ),
        totalIrpfWithheld: items.reduce(
          (sum, item) => sum + (item.irpfWithheld ?? 0),
          0,
        ),
        totalSocialSecurityAmount: items.reduce(
          (sum, item) => sum + (item.socialSecurityAmount ?? 0),
          0,
        ),
        totalPeriodAmount: items.reduce(
          (sum, item) => sum + item.effectiveAmount,
          0,
        ),
        recordCount: items.length,
      },
      items,
    };
  }

  private async getById(userId: number, incomeId: number) {
    const rows = await this.databaseService.query<IncomeRow[]>(
      `
        SELECT
          finan_income_records.id AS id,
          finan_income_records.user_id AS userId,
          finan_income_records.payer_id AS payerId,
          payers.payer_name AS payerName,
          finan_income_records.contract_id AS contractId,
          finan_income_records.income_type AS incomeType,
          finan_income_records.period_year AS periodYear,
          finan_income_records.period_month AS periodMonth,
          finan_income_records.gross_amount AS grossAmount,
          finan_income_records.net_amount AS netAmount,
          finan_income_records.irpf_withheld AS irpfWithheld,
          finan_income_records.social_security_amount AS socialSecurityAmount,
          finan_income_records.flexible_compensation_amount AS flexibleCompensationAmount,
          finan_income_records.notes AS notes,
          finan_income_records.created_at AS createdAt,
          finan_income_records.updated_at AS updatedAt
        FROM finan_income_records
        LEFT JOIN finan_payers AS payers
          ON payers.id = finan_income_records.payer_id
        WHERE finan_income_records.id = ? AND finan_income_records.user_id = ?
        LIMIT 1
      `,
      [incomeId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Income record not found');
    }

    return this.mapIncome(rows[0]);
  }

  private mapIncome(row: IncomeRow) {
    return {
      id: row.id,
      userId: row.userId,
      payerId: row.payerId,
      payerName: row.payerName,
      contractId: row.contractId,
      incomeType: row.incomeType,
      periodYear: row.periodYear,
      periodMonth: row.periodMonth,
      grossAmount: toNullableNumber(row.grossAmount) ?? 0,
      netAmount: toNullableNumber(row.netAmount),
      irpfWithheld: toNullableNumber(row.irpfWithheld),
      socialSecurityAmount: toNullableNumber(row.socialSecurityAmount),
      flexibleCompensationAmount: toNullableNumber(
        row.flexibleCompensationAmount,
      ),
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }

  private async getStoredIncomeItems(
    userId: number,
    period: { year: number; month: number | null },
  ) {
    const rows = await this.databaseService.query<IncomeRow[]>(
      `
        SELECT
          income_records.id AS id,
          income_records.user_id AS userId,
          income_records.payer_id AS payerId,
          payers.payer_name AS payerName,
          income_records.contract_id AS contractId,
          income_records.income_type AS incomeType,
          income_records.period_year AS periodYear,
          income_records.period_month AS periodMonth,
          income_records.gross_amount AS grossAmount,
          income_records.net_amount AS netAmount,
          income_records.irpf_withheld AS irpfWithheld,
          income_records.social_security_amount AS socialSecurityAmount,
          income_records.flexible_compensation_amount AS flexibleCompensationAmount,
          income_records.notes AS notes,
          income_records.created_at AS createdAt,
          income_records.updated_at AS updatedAt
        FROM finan_income_records AS income_records
        LEFT JOIN finan_payers AS payers
          ON payers.id = income_records.payer_id
        WHERE income_records.user_id = ?
          AND income_records.period_year = ?
          AND (? IS NULL OR income_records.period_month = ?)
        ORDER BY income_records.period_year DESC,
                 income_records.period_month DESC,
                 income_records.created_at DESC
      `,
      [userId, period.year, period.month, period.month],
    );

    return rows.map((row) => {
      const grossAmount = toNullableNumber(row.grossAmount) ?? 0;
      const netAmount = toNullableNumber(row.netAmount);
      const irpfWithheld = toNullableNumber(row.irpfWithheld);
      const socialSecurityAmount = toNullableNumber(row.socialSecurityAmount);

      return {
        id: `manual-${row.id}`,
        source: 'MANUAL' as const,
        sourceId: row.id,
        sourceDocumentType: null,
        incomeType: row.incomeType,
        label: row.payerName ?? this.getIncomeTypeLabel(row.incomeType),
        counterpartyName: row.payerName,
        periodYear: row.periodYear,
        periodMonth: row.periodMonth,
        effectiveDate: this.resolveStoredIncomeDate(
          row.periodYear,
          row.periodMonth,
        ),
        grossAmount,
        netAmount,
        vatAmount: null,
        irpfWithheld,
        socialSecurityAmount,
        effectiveAmount: netAmount ?? grossAmount,
        notes: row.notes,
      } satisfies IncomePeriodItem;
    });
  }

  private async getDocumentIncomeItems(
    userId: number,
    period: { year: number; month: number | null },
  ) {
    const userTaxIdentity = await this.taxService.getUserTaxIdentity(userId);
    const rows = await this.databaseService.query<LatestDocumentIncomeRow[]>(
      `
        SELECT
          documents.id AS documentId,
          documents.document_type AS documentType,
          documents.original_filename AS originalFilename,
          documents.document_date AS documentDate,
          llm_results.parsed_json AS parsedJson,
          llm_results.processed_at AS processedAt
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
          AND documents.document_type IN ('PAYSLIP', 'INVOICE')
          AND documents.status IN ('LLM_PROCESSED', 'VERIFIED')
      `,
      [userId],
    );

    return rows
      .flatMap((row) => {
        const item = this.mapDocumentIncomeRow(row, userTaxIdentity);

        return item ? [item] : [];
      })
      .filter((item) => {
        if (item.periodYear !== period.year) {
          return false;
        }

        if (period.month && item.periodMonth !== period.month) {
          return false;
        }

        return true;
      });
  }

  private mapDocumentIncomeRow(
    row: LatestDocumentIncomeRow,
    userTaxIdentity: TaxUserIdentity,
  ) {
    const parsedJson = parseStoredJson<Record<string, unknown>>(row.parsedJson);
    const extractedFields = this.getExtractedFieldsObject(parsedJson);
    const summary =
      typeof parsedJson?.summary === 'string' ? parsedJson.summary.trim() : '';
    const sources = this.getDocumentInterpretationSources(
      parsedJson,
      extractedFields,
    );
    const invoiceAnalysis =
      row.documentType === 'INVOICE'
        ? this.taxService.analyzeInvoiceDocument(userTaxIdentity, parsedJson)
        : null;

    if (
      row.documentType === 'INVOICE' &&
      !invoiceAnalysis?.isOwnIssuedInvoice
    ) {
      return null;
    }

    const resolvedDate = this.resolveDocumentIncomeDate(
      row.documentType,
      sources,
      summary,
      toIsoDate(row.documentDate),
    );

    if (!resolvedDate) {
      return null;
    }

    const grossAmount = this.resolveDocumentGrossAmount(
      row.documentType,
      sources,
      summary,
    );

    if (grossAmount === null) {
      return null;
    }

    const netAmount =
      this.readNumericValueFromSources(sources, [
        'netAmount',
        'netSalary',
        'takeHomePay',
        'liquidAmount',
        'liquidoAPercibir',
        'salarioNeto',
        'importeNeto',
      ]) ??
      this.extractNumericValueFromText(summary, [
        'neto',
        'salario neto',
        'importe neto',
        'liquido',
        'liquido a percibir',
      ]);
    const vatAmount =
      this.readNumericValueFromSources(sources, ['vatAmount', 'taxAmount']) ??
      this.extractNumericValueFromText(summary, [
        'iva',
        'cuota iva',
        'importe iva',
      ]);
    const irpfWithheld =
      this.readNumericValueFromSources(sources, [
        'irpfWithheld',
        'incomeTaxWithheld',
        'withholdingAmount',
        'retencionIrpf',
      ]) ??
      this.extractNumericValueFromText(summary, [
        'irpf',
        'retencion',
        'retencion irpf',
      ]);
    const normalizedGrossAmount =
      row.documentType === 'INVOICE'
        ? this.resolveSelfIssuedInvoiceIncomeAmount({
            grossAmount,
            vatAmount,
            irpfWithheld,
            sources,
          })
        : grossAmount;

    if (normalizedGrossAmount === null) {
      return null;
    }
    const socialSecurityAmount =
      this.readNumericValueFromSources(sources, [
        'socialSecurityAmount',
        'employeeSocialSecurity',
        'seguridadSocial',
        'cotizacionSeguridadSocial',
      ]) ??
      this.extractNumericValueFromText(summary, [
        'seguridad social',
        'cotizacion',
        'cotizacion seguridad social',
      ]);

    return {
      id: `document-${row.documentId}`,
      source: 'DOCUMENT' as const,
      sourceId: row.documentId,
      sourceDocumentType: row.documentType,
      incomeType:
        row.documentType === 'INVOICE' ? 'FREELANCE_INVOICE' : 'PAYSLIP',
      label: this.buildDocumentIncomeLabel(row.documentType, resolvedDate),
      counterpartyName: this.resolveDocumentCounterparty(
        row.documentType,
        sources,
      ),
      periodYear: Number(resolvedDate.slice(0, 4)),
      periodMonth: Number(resolvedDate.slice(5, 7)),
      effectiveDate: resolvedDate,
      grossAmount: normalizedGrossAmount,
      netAmount,
      vatAmount,
      irpfWithheld,
      socialSecurityAmount,
      effectiveAmount:
        row.documentType === 'PAYSLIP'
          ? (netAmount ?? normalizedGrossAmount)
          : normalizedGrossAmount,
      notes: summary || null,
    } satisfies IncomePeriodItem;
  }

  private resolveSelfIssuedInvoiceIncomeAmount(params: {
    grossAmount: number | null;
    vatAmount: number | null;
    irpfWithheld: number | null;
    sources: Record<string, unknown>[];
  }) {
    const baseAmount = this.readNumericValueFromSources(params.sources, [
      'subtotalAmount',
      'baseAmount',
      'taxableBase',
      'invoiceBaseAmount',
    ]);

    if (baseAmount !== null) {
      return baseAmount;
    }

    if (params.grossAmount === null) {
      return null;
    }

    if (params.vatAmount !== null || params.irpfWithheld !== null) {
      return (
        params.grossAmount -
        (params.vatAmount ?? 0) +
        (params.irpfWithheld ?? 0)
      );
    }

    return params.grossAmount;
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

  private resolvePeriod(filter: GetIncomePeriodDto) {
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

  private resolveStoredIncomeDate(year: number, month: number | null) {
    if (!month) {
      return `${year}-01-01`;
    }

    return `${year}-${String(month).padStart(2, '0')}-01`;
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

  private resolveDocumentIncomeDate(
    documentType: string,
    sources: Record<string, unknown>[],
    summary: string,
    fallbackDate: string | null,
  ) {
    const candidatePaths =
      documentType === 'INVOICE'
        ? [
            'issueDate',
            'invoiceDate',
            'expenseDate',
            'fechaEmision',
            'fechaFactura',
            'billingPeriod',
            'servicePeriod',
            'documentDate',
            'date',
          ]
        : [
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
            'issueDate',
            'paymentDate',
            'payDate',
            'fechaPago',
            'fechaNomina',
            'fechaDevengo',
            'documentDate',
            'date',
          ];

    const dateFromFields = this.readDateValueFromSources(
      sources,
      candidatePaths,
    );

    if (dateFromFields) {
      return dateFromFields;
    }

    const dateFromSummary = this.extractDateFromText(summary);
    return dateFromSummary ?? fallbackDate;
  }

  private resolveDocumentGrossAmount(
    documentType: string,
    sources: Record<string, unknown>[],
    summary: string,
  ) {
    if (documentType === 'INVOICE') {
      return (
        this.readNumericValueFromSources(sources, [
          'subtotalAmount',
          'baseAmount',
          'grossAmount',
          'totalAmount',
        ]) ??
        this.extractNumericValueFromText(summary, [
          'base imponible',
          'subtotal',
          'importe total',
          'total',
        ])
      );
    }

    return (
      this.readNumericValueFromSources(sources, [
        'grossAmount',
        'grossSalary',
        'grossSalaryAmount',
        'grossPay',
        'salarioBruto',
        'importeBruto',
        'totalAmount',
      ]) ??
      this.extractNumericValueFromText(summary, [
        'bruto',
        'salario bruto',
        'importe bruto',
        'devengo',
        'total devengado',
      ])
    );
  }

  private resolveDocumentCounterparty(
    documentType: string,
    sources: Record<string, unknown>[],
  ) {
    const candidatePaths =
      documentType === 'INVOICE'
        ? ['customerName', 'vendorName', 'issuerName']
        : [
            'employerName',
            'companyName',
            'employer',
            'empresa',
            'pagador',
            'vendorName',
          ];

    return this.readStringValueFromSources(sources, candidatePaths);
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
        const normalizedValue = rawValue
          .replaceAll('.', '')
          .replace(',', '.')
          .replaceAll(/[^0-9.-]/g, '');
        const parsedValue = Number(normalizedValue);

        if (!Number.isNaN(parsedValue)) {
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
        /[|\\{}()[\]^$+*?.]/g,
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

    const rangePattern =
      /(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{4})/;
    const rangeMatch = rangePattern.exec(normalizedValue);

    if (rangeMatch) {
      const [, monthName, year] = rangeMatch;
      return `${year}-${monthNames[monthName]}-01`;
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

  private getIncomeTypeLabel(incomeType: string) {
    const labels: Record<string, string> = {
      PAYSLIP: 'Nómina',
      BONUS: 'Bonus',
      FREELANCE_INVOICE: 'Factura emitida',
      RETENTION_CERTIFICATE: 'Certificado de retenciones',
      OTHER: 'Otro ingreso',
    };

    return labels[incomeType] ?? incomeType;
  }

  private buildDocumentIncomeLabel(documentType: string, documentDate: string) {
    if (documentType === 'PAYSLIP') {
      const [year, month] = documentDate.split('-');
      return `Nómina ${month}/${year}`;
    }

    const [year, month, day] = documentDate.split('-');
    return `Factura ${day}/${month}/${year}`;
  }
}
