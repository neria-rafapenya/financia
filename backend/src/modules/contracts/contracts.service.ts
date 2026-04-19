import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import {
  toBooleanFlag,
  toIsoDate,
  toIsoDateTime,
  toNullableNumber,
} from '../../common/serializers';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

interface ContractRow extends RowDataPacket {
  id: number;
  userId: number;
  payerId: number | null;
  contractType: string;
  title: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  grossSalaryMonthly: string | number | null;
  netSalaryMonthly: string | number | null;
  exclusivityFlag: number;
  nonCompeteFlag: number;
  workdayType: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

@Injectable()
export class ContractsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<ContractRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          payer_id AS payerId,
          contract_type AS contractType,
          title,
          start_date AS startDate,
          end_date AS endDate,
          gross_salary_monthly AS grossSalaryMonthly,
          net_salary_monthly AS netSalaryMonthly,
          exclusivity_flag AS exclusivityFlag,
          non_compete_flag AS nonCompeteFlag,
          workday_type AS workdayType,
          status,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_contracts
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapContract(row));
  }

  async getById(userId: number, contractId: number) {
    const rows = await this.databaseService.query<ContractRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          payer_id AS payerId,
          contract_type AS contractType,
          title,
          start_date AS startDate,
          end_date AS endDate,
          gross_salary_monthly AS grossSalaryMonthly,
          net_salary_monthly AS netSalaryMonthly,
          exclusivity_flag AS exclusivityFlag,
          non_compete_flag AS nonCompeteFlag,
          workday_type AS workdayType,
          status,
          notes,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM finan_contracts
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [contractId, userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('Contract not found');
    }

    return this.mapContract(rows[0]);
  }

  async create(userId: number, createContractDto: CreateContractDto) {
    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_contracts (
          user_id, payer_id, contract_type, title, start_date, end_date,
          gross_salary_monthly, net_salary_monthly, exclusivity_flag,
          non_compete_flag, workday_type, status, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        createContractDto.payerId ?? null,
        createContractDto.contractType,
        createContractDto.title.trim(),
        createContractDto.startDate ?? null,
        createContractDto.endDate ?? null,
        createContractDto.grossSalaryMonthly ?? null,
        createContractDto.netSalaryMonthly ?? null,
        createContractDto.exclusivityFlag ? 1 : 0,
        createContractDto.nonCompeteFlag ? 1 : 0,
        createContractDto.workdayType ?? null,
        createContractDto.status ?? 'ACTIVE',
        createContractDto.notes?.trim() ?? null,
      ],
    );

    return this.getById(userId, result.insertId);
  }

  async update(
    userId: number,
    contractId: number,
    updateContractDto: UpdateContractDto,
  ) {
    const current = await this.getById(userId, contractId);

    await this.databaseService.execute(
      `
        UPDATE finan_contracts
        SET payer_id = ?,
            contract_type = ?,
            title = ?,
            start_date = ?,
            end_date = ?,
            gross_salary_monthly = ?,
            net_salary_monthly = ?,
            exclusivity_flag = ?,
            non_compete_flag = ?,
            workday_type = ?,
            status = ?,
            notes = ?
        WHERE id = ? AND user_id = ?
      `,
      [
        updateContractDto.payerId ?? current.payerId,
        updateContractDto.contractType ?? current.contractType,
        updateContractDto.title?.trim() ?? current.title,
        updateContractDto.startDate ?? current.startDate,
        updateContractDto.endDate ?? current.endDate,
        updateContractDto.grossSalaryMonthly ?? current.grossSalaryMonthly,
        updateContractDto.netSalaryMonthly ?? current.netSalaryMonthly,
        updateContractDto.exclusivityFlag === undefined
          ? current.exclusivityFlag
            ? 1
            : 0
          : updateContractDto.exclusivityFlag
            ? 1
            : 0,
        updateContractDto.nonCompeteFlag === undefined
          ? current.nonCompeteFlag
            ? 1
            : 0
          : updateContractDto.nonCompeteFlag
            ? 1
            : 0,
        updateContractDto.workdayType ?? current.workdayType,
        updateContractDto.status ?? current.status,
        updateContractDto.notes?.trim() ?? current.notes,
        contractId,
        userId,
      ],
    );

    return this.getById(userId, contractId);
  }

  private mapContract(row: ContractRow) {
    return {
      id: row.id,
      userId: row.userId,
      payerId: row.payerId,
      contractType: row.contractType,
      title: row.title,
      startDate: toIsoDate(row.startDate),
      endDate: toIsoDate(row.endDate),
      grossSalaryMonthly: toNullableNumber(row.grossSalaryMonthly),
      netSalaryMonthly: toNullableNumber(row.netSalaryMonthly),
      exclusivityFlag: toBooleanFlag(row.exclusivityFlag),
      nonCompeteFlag: toBooleanFlag(row.nonCompeteFlag),
      workdayType: row.workdayType,
      status: row.status,
      notes: row.notes,
      createdAt: toIsoDateTime(row.createdAt),
      updatedAt: toIsoDateTime(row.updatedAt),
    };
  }
}
