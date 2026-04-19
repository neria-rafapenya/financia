import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { normalizeValidSpanishTaxId } from '../../common/tax-id';
import { DatabaseService } from '../../database/database.service';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  taxId: string | null;
  isActive: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  fullName: string;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PublicUser {
  id: number;
  email: string;
  fullName: string;
  taxId: string | null;
  hasValidTaxId: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(input: {
    email: string;
    fullName: string;
    passwordHash: string;
  }) {
    const existingUser = await this.findByEmail(input.email);

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const result = await this.databaseService.execute(
      `
        INSERT INTO finan_users (email, password_hash, full_name, is_active)
        VALUES (?, ?, ?, 1)
      `,
      [input.email, input.passwordHash, input.fullName],
    );

    await this.databaseService.execute(
      `
        INSERT INTO finan_user_profiles (user_id)
        VALUES (?)
      `,
      [result.insertId],
    );

    return this.getUserById(result.insertId);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.databaseService.query<UserRow[]>(
      `
        SELECT
          users.id AS id,
          users.email AS email,
          users.password_hash AS passwordHash,
          users.full_name AS fullName,
          profiles.tax_id AS taxId,
          users.is_active AS isActive,
          users.created_at AS createdAt,
          users.updated_at AS updatedAt
        FROM finan_users AS users
        LEFT JOIN finan_user_profiles AS profiles
          ON profiles.user_id = users.id
        WHERE users.email = ?
        LIMIT 1
      `,
      [email],
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapUser(rows[0]);
  }

  async getUserById(userId: number): Promise<UserRecord> {
    const rows = await this.databaseService.query<UserRow[]>(
      `
        SELECT
          users.id AS id,
          users.email AS email,
          users.password_hash AS passwordHash,
          users.full_name AS fullName,
          profiles.tax_id AS taxId,
          users.is_active AS isActive,
          users.created_at AS createdAt,
          users.updated_at AS updatedAt
        FROM finan_users AS users
        LEFT JOIN finan_user_profiles AS profiles
          ON profiles.user_id = users.id
        WHERE users.id = ?
        LIMIT 1
      `,
      [userId],
    );

    if (rows.length === 0) {
      throw new NotFoundException('User not found');
    }

    return this.mapUser(rows[0]);
  }

  async getPublicUserById(userId: number) {
    const user = await this.getUserById(userId);
    return this.toPublicUser(user);
  }

  toPublicUser(user: UserRecord): PublicUser {
    const normalizedTaxId = normalizeValidSpanishTaxId(user.taxId);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      taxId: normalizedTaxId,
      hasValidTaxId: Boolean(normalizedTaxId),
      isActive: user.isActive,
      createdAt: new Date(user.createdAt).toISOString(),
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
  }

  private mapUser(row: UserRow): UserRecord {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      fullName: row.fullName,
      taxId: row.taxId,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
