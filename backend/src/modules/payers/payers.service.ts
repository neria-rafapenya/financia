import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import { toIsoDateTime } from '../../common/serializers';
import { CreatePayerDto } from './dto/create-payer.dto';
import { UpdatePayerDto } from './dto/update-payer.dto';

interface PayerRow extends RowDataPacket {
  id: number;
  userId: number;
  payerName: string;
  taxId: string | null;
  payerType: 'EMPLOYER' | 'CLIENT' | 'PUBLIC_BODY' | 'OTHER';
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class PayersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<PayerRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          payer_name AS payerName,
          tax_id AS taxId,
          payer_type AS payerType,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_payers
        WHERE user_id = ?
        ORDER BY payer_name ASC
      `,
      [userId],
    );

    return rows.map((row) => this.mapPayer(row));
  }

  async create(userId: number, createPayerDto: CreatePayerDto) {
    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_payers (user_id, payer_name, tax_id, payer_type, notes)
        VALUES (?, ?, ?, ?, ?)
      `,
      [
        userId,
        createPayerDto.payerName.trim(),
        createPayerDto.taxId?.trim() ?? null,
        createPayerDto.payerType,
        createPayerDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    payerId: number,
    updatePayerDto: UpdatePayerDto,
  ) {
    const payer = await this.getById(userId, payerId);

    await this.databaseService.execute(
      `
        UPDATE finan_payers
        SET payer_name = ?,
            tax_id = ?,
            payer_type = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        updatePayerDto.payerName?.trim() ?? payer.payerName,
        updatePayerDto.taxId?.trim() ?? payer.taxId,
        updatePayerDto.payerType ?? payer.payerType,
        updatePayerDto.notes?.trim() ?? payer.notes,
        payerId,
        userId,
      ],
    );

    return this.getById(userId, payerId);
  }

  async delete(userId: number, payerId: number) {
    const result = await this.databaseService.execute(
      `DELETE FROM finan_payers WHERE id = ? AND user_id = ?`,
      [payerId, userId],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Payer not found');
    }

    return { success: true };
  }

  async getById(userId: number, payerId: number) {
    const rows = await this.databaseService.query<PayerRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          payer_name AS payerName,
          tax_id AS taxId,
          payer_type AS payerType,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_payers
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [payerId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Payer not found');
    }

    return this.mapPayer(rows[0]);
  }

  private mapPayer(row: PayerRow) {
    return {
      id: row.id,
      userId: row.userId,
      payerName: row.payerName,
      taxId: row.taxId,
      payerType: row.payerType,
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }
}
