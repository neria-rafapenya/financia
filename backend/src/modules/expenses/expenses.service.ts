import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import {
  toIsoDate,
  toIsoDateTime,
  toNullableNumber,
} from '../../common/serializers';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { GetExpensePeriodDto } from './dto/get-expense-period.dto';
import { TaxService } from '../tax/tax.service';
import { UpdateExpenseDto } from './dto/update-expense.dto';

type NullableMoneyValue = string | number | null;

interface ExpenseRow extends RowDataPacket {
  id: number;
  userId: number;
  categoryId: number | null;
  payerId: number | null;
  expenseDate: Date | string;
  concept: string;
  vendorName: string | null;
  amount: string | number;
  vatAmount: NullableMoneyValue;
  isPaid: number;
  currency: string;
  sourceType: string;
  deductibilityStatus: string;
  businessUsePercent: NullableMoneyValue;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ExpenseTotalsRow extends RowDataPacket {
  totalAmount: NullableMoneyValue;
  totalVatAmount: NullableMoneyValue;
  recordCount: number;
}

interface ExpenseStatusRow extends RowDataPacket {
  deductibilityStatus: string;
  totalAmount: NullableMoneyValue;
  recordCount: number;
}

export interface ExpensePeriodItem {
  id: string;
  source: 'MANUAL' | 'DOCUMENT' | 'DOCUMENT_TAX';
  sourceId: number;
  expenseDate: string | null;
  concept: string;
  vendorName: string | null;
  amount: number;
  vatAmount: number | null;
  isPaid: boolean | null;
  deductibilityStatus: string;
  notes: string | null;
}

export interface ExpensePeriodOverview {
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
  items: ExpensePeriodItem[];
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly taxService: TaxService,
  ) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<ExpenseRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          category_id AS categoryId,
          payer_id AS payerId,
          expense_date AS expenseDate,
          concept,
          vendor_name AS vendorName,
          amount,
          vat_amount AS vatAmount,
          is_paid AS isPaid,
          currency,
          source_type AS sourceType,
          deductibility_status AS deductibilityStatus,
          business_use_percent AS businessUsePercent,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_expenses
        WHERE user_id = ?
        ORDER BY expense_date DESC, created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapExpense(row));
  }

  async create(userId: number, createExpenseDto: CreateExpenseDto) {
    const resolvedSourceType = createExpenseDto.sourceType ?? 'MANUAL';
    const isManualSource = resolvedSourceType === 'MANUAL';
    const resolvedIsPaid = createExpenseDto.isPaid ?? !isManualSource;

    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_expenses (
          user_id, category_id, payer_id, expense_date, concept, vendor_name,
          amount, vat_amount, is_paid, currency, source_type, deductibility_status,
          business_use_percent, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        createExpenseDto.categoryId ?? null,
        createExpenseDto.payerId ?? null,
        createExpenseDto.expenseDate,
        createExpenseDto.concept.trim(),
        createExpenseDto.vendorName?.trim() ?? null,
        createExpenseDto.amount,
        createExpenseDto.vatAmount ?? null,
        resolvedIsPaid ? 1 : 0,
        createExpenseDto.currency?.trim() ?? 'EUR',
        resolvedSourceType,
        createExpenseDto.deductibilityStatus ?? 'UNKNOWN',
        createExpenseDto.businessUsePercent ?? null,
        createExpenseDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    expenseId: number,
    updateExpenseDto: UpdateExpenseDto,
  ) {
    const current = await this.getById(userId, expenseId);

    await this.databaseService.execute(
      `
        UPDATE finan_expenses
        SET category_id = ?,
            payer_id = ?,
            expense_date = ?,
            concept = ?,
            vendor_name = ?,
            amount = ?,
            vat_amount = ?,
          is_paid = ?,
            currency = ?,
            source_type = ?,
            deductibility_status = ?,
            business_use_percent = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        updateExpenseDto.categoryId ?? current.categoryId,
        updateExpenseDto.payerId ?? current.payerId,
        updateExpenseDto.expenseDate ?? current.expenseDate,
        updateExpenseDto.concept?.trim() ?? current.concept,
        updateExpenseDto.vendorName?.trim() ?? current.vendorName,
        updateExpenseDto.amount ?? current.amount,
        updateExpenseDto.vatAmount ?? current.vatAmount,
        updateExpenseDto.isPaid === undefined
          ? current.isPaid
            ? 1
            : 0
          : updateExpenseDto.isPaid
            ? 1
            : 0,
        updateExpenseDto.currency?.trim() ?? current.currency,
        updateExpenseDto.sourceType ?? current.sourceType,
        updateExpenseDto.deductibilityStatus ?? current.deductibilityStatus,
        updateExpenseDto.businessUsePercent ?? current.businessUsePercent,
        updateExpenseDto.notes?.trim() ?? current.notes,
        expenseId,
        userId,
      ],
    );

    return this.getById(userId, expenseId);
  }

  async summary(userId: number) {
    const [totals] = await this.databaseService.query<ExpenseTotalsRow[]>(
      `
        SELECT
          COALESCE(SUM(amount), 0) AS totalAmount,
          COALESCE(SUM(vat_amount), 0) AS totalVatAmount,
          COUNT(*) AS recordCount
        FROM finan_expenses
        WHERE user_id = ?
      `,
      [userId],
    );
    const derivedTaxSummary = await this.taxService.getSummary(userId);

    const byStatus = await this.databaseService.query<ExpenseStatusRow[]>(
      `
        SELECT
          deductibility_status AS deductibilityStatus,
          COALESCE(SUM(amount), 0) AS totalAmount,
          COUNT(*) AS recordCount
        FROM finan_expenses
        WHERE user_id = ?
        GROUP BY deductibility_status
        ORDER BY totalAmount DESC
      `,
      [userId],
    );

    return {
      totals: {
        totalAmount:
          (toNullableNumber(totals?.totalAmount) ?? 0) +
          derivedTaxSummary.totalAmount,
        totalVatAmount:
          (toNullableNumber(totals?.totalVatAmount) ?? 0) +
          derivedTaxSummary.totalVatAmount,
        recordCount: (totals?.recordCount ?? 0) + derivedTaxSummary.recordCount,
      },
      byDeductibilityStatus: byStatus.map((row) => ({
        deductibilityStatus: row.deductibilityStatus,
        totalAmount: toNullableNumber(row.totalAmount) ?? 0,
        recordCount: row.recordCount,
      })),
    };
  }

  async getPeriodOverview(
    userId: number,
    filter: GetExpensePeriodDto,
  ): Promise<ExpensePeriodOverview> {
    const period = this.resolvePeriod(filter);
    const [manualItems, taxOverview] = await Promise.all([
      this.getStoredExpenseItems(userId, period),
      this.taxService.getPeriodOverview(userId, filter),
    ]);
    const derivedTaxItems: ExpensePeriodItem[] = taxOverview.items.map(
      (item) => ({
        id: item.id,
        source: 'DOCUMENT_TAX',
        sourceId: item.sourceDocumentId,
        expenseDate: item.dueDate,
        concept: `${item.label} · liquidación ${item.settlementLabel}`,
        vendorName: item.counterpartyName,
        amount: item.amount,
        vatAmount: item.obligationType === 'VAT' ? item.amount : null,
        isPaid: null,
        deductibilityStatus: 'REVIEWABLE',
        notes: item.notes
          ? `${item.notes} · Vencimiento ${item.dueDate}`
          : `Vencimiento ${item.dueDate}`,
      }),
    );
    const items = [...manualItems, ...derivedTaxItems].sort((left, right) =>
      (right.expenseDate ?? '').localeCompare(left.expenseDate ?? ''),
    );

    return {
      period: {
        year: period.year,
        month: period.month,
        startDate: period.startDate,
        endDate: period.endDate,
        label: period.month
          ? `${String(period.month).padStart(2, '0')}/${period.year}`
          : `Ejercicio ${period.year}`,
      },
      totals: {
        totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
        totalVatAmount: items.reduce(
          (sum, item) => sum + (item.vatAmount ?? 0),
          0,
        ),
        totalIrpfAmount: taxOverview.totals.totalIrpfAmount,
        recordCount: items.length,
      },
      items,
    };
  }

  private async getById(userId: number, expenseId: number) {
    const rows = await this.databaseService.query<ExpenseRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          category_id AS categoryId,
          payer_id AS payerId,
          expense_date AS expenseDate,
          concept,
          vendor_name AS vendorName,
          amount,
          vat_amount AS vatAmount,
          is_paid AS isPaid,
          currency,
          source_type AS sourceType,
          deductibility_status AS deductibilityStatus,
          business_use_percent AS businessUsePercent,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_expenses
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [expenseId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Expense not found');
    }

    return this.mapExpense(rows[0]);
  }

  private async getStoredExpenseItems(
    userId: number,
    period: { year: number; month: number | null },
  ) {
    const rows = await this.databaseService.query<ExpenseRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          category_id AS categoryId,
          payer_id AS payerId,
          expense_date AS expenseDate,
          concept,
          vendor_name AS vendorName,
          amount,
          vat_amount AS vatAmount,
          is_paid AS isPaid,
          currency,
          source_type AS sourceType,
          deductibility_status AS deductibilityStatus,
          business_use_percent AS businessUsePercent,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_expenses
        WHERE user_id = ?
          AND YEAR(expense_date) = ?
          AND (? IS NULL OR MONTH(expense_date) = ?)
        ORDER BY expense_date DESC, created_at DESC
      `,
      [userId, period.year, period.month, period.month],
    );

    return rows.map((row): ExpensePeriodItem => {
      const source = row.sourceType === 'MANUAL' ? 'MANUAL' : 'DOCUMENT';

      return {
        id: `stored-expense-${row.id}`,
        source,
        sourceId: row.id,
        expenseDate: toIsoDate(row.expenseDate),
        concept: row.concept,
        vendorName: row.vendorName,
        amount: toNullableNumber(row.amount) ?? 0,
        vatAmount: toNullableNumber(row.vatAmount),
        isPaid: Boolean(row.isPaid),
        deductibilityStatus: row.deductibilityStatus,
        notes: row.notes,
      };
    });
  }

  private resolvePeriod(filter: GetExpensePeriodDto) {
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

  private mapExpense(row: ExpenseRow) {
    return {
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      payerId: row.payerId,
      expenseDate: toIsoDate(row.expenseDate),
      concept: row.concept,
      vendorName: row.vendorName,
      amount: toNullableNumber(row.amount) ?? 0,
      vatAmount: toNullableNumber(row.vatAmount),
      isPaid: Boolean(row.isPaid),
      currency: row.currency,
      sourceType: row.sourceType,
      deductibilityStatus: row.deductibilityStatus,
      businessUsePercent: toNullableNumber(row.businessUsePercent),
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }
}
