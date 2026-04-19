import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import {
  toBooleanFlag,
  toIsoDate,
  toIsoDateTime,
  toNullableNumber,
} from '../../common/serializers';
import { CreateRecurringPaymentDto } from './dto/create-recurring-payment.dto';
import { UpdateRecurringPaymentDto } from './dto/update-recurring-payment.dto';

interface RecurringPaymentRow extends RowDataPacket {
  id: number;
  userId: number;
  categoryId: number | null;
  title: string;
  amount: string | number;
  frequency: string;
  nextDueDate: Date | string;
  isActive: number;
  deductibilityStatus: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class RecurringPaymentsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<RecurringPaymentRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          category_id AS categoryId,
          title,
          amount,
          frequency,
          next_due_date AS nextDueDate,
          is_active AS isActive,
          deductibility_status AS deductibilityStatus,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_recurring_payments
        WHERE user_id = ?
        ORDER BY next_due_date ASC, created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapRecurringPayment(row));
  }

  async create(
    userId: number,
    createRecurringPaymentDto: CreateRecurringPaymentDto,
  ) {
    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_recurring_payments (
          user_id, category_id, title, amount, frequency, next_due_date,
          is_active, deductibility_status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        createRecurringPaymentDto.categoryId ?? null,
        createRecurringPaymentDto.title.trim(),
        createRecurringPaymentDto.amount,
        createRecurringPaymentDto.frequency,
        createRecurringPaymentDto.nextDueDate,
        createRecurringPaymentDto.isActive === false ? 0 : 1,
        createRecurringPaymentDto.deductibilityStatus ?? 'UNKNOWN',
        createRecurringPaymentDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    recurringPaymentId: number,
    updateRecurringPaymentDto: UpdateRecurringPaymentDto,
  ) {
    const current = await this.getById(userId, recurringPaymentId);

    await this.databaseService.execute(
      `
        UPDATE finan_recurring_payments
        SET category_id = ?,
            title = ?,
            amount = ?,
            frequency = ?,
            next_due_date = ?,
            is_active = ?,
            deductibility_status = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        updateRecurringPaymentDto.categoryId ?? current.categoryId,
        updateRecurringPaymentDto.title?.trim() ?? current.title,
        updateRecurringPaymentDto.amount ?? current.amount,
        updateRecurringPaymentDto.frequency ?? current.frequency,
        updateRecurringPaymentDto.nextDueDate ?? current.nextDueDate,
        updateRecurringPaymentDto.isActive === undefined
          ? current.isActive
            ? 1
            : 0
          : updateRecurringPaymentDto.isActive
            ? 1
            : 0,
        updateRecurringPaymentDto.deductibilityStatus ??
          current.deductibilityStatus,
        updateRecurringPaymentDto.notes?.trim() ?? current.notes,
        recurringPaymentId,
        userId,
      ],
    );

    return this.getById(userId, recurringPaymentId);
  }

  private async getById(userId: number, recurringPaymentId: number) {
    const rows = await this.databaseService.query<RecurringPaymentRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          category_id AS categoryId,
          title,
          amount,
          frequency,
          next_due_date AS nextDueDate,
          is_active AS isActive,
          deductibility_status AS deductibilityStatus,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_recurring_payments
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [recurringPaymentId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Recurring payment not found');
    }

    return this.mapRecurringPayment(rows[0]);
  }

  private mapRecurringPayment(row: RecurringPaymentRow) {
    return {
      id: row.id,
      userId: row.userId,
      categoryId: row.categoryId,
      title: row.title,
      amount: toNullableNumber(row.amount) ?? 0,
      frequency: row.frequency,
      nextDueDate: toIsoDate(row.nextDueDate),
      isActive: toBooleanFlag(row.isActive),
      deductibilityStatus: row.deductibilityStatus,
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }
}
