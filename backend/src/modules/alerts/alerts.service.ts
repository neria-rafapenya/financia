import { Injectable, NotFoundException } from '@nestjs/common';
import type { RowDataPacket } from 'mysql2/promise';
import { DatabaseService } from '../../database/database.service';
import { toBooleanFlag, toIsoDateTime } from '../../common/serializers';

interface AlertRow extends RowDataPacket {
  id: number;
  userId: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  isRead: number;
  isResolved: number;
  createdAt: Date | string;
  resolvedAt: Date | string | null;
}

@Injectable()
export class AlertsService {
  constructor(private readonly databaseService: DatabaseService) {}

  async list(userId: number) {
    const rows = await this.databaseService.query<AlertRow[]>(
      `
        SELECT
          id,
          user_id AS userId,
          alert_type AS alertType,
          severity,
          title,
          message,
          linked_entity_type AS linkedEntityType,
          linked_entity_id AS linkedEntityId,
          is_read AS isRead,
          is_resolved AS isResolved,
          created_at AS createdAt,
          resolved_at AS resolvedAt
        FROM finan_alerts
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      [userId],
    );

    return rows.map((row) => this.mapAlert(row));
  }

  async markAsRead(userId: number, alertId: number) {
    const result = await this.databaseService.execute(
      `
        UPDATE finan_alerts
        SET is_read = 1
        WHERE id = ? AND user_id = ?
      `,
      [alertId, userId],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Alert not found');
    }

    return { success: true };
  }

  async resolve(userId: number, alertId: number) {
    const result = await this.databaseService.execute(
      `
        UPDATE finan_alerts
        SET is_resolved = 1,
            resolved_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `,
      [alertId, userId],
    );

    if (result.affectedRows === 0) {
      throw new NotFoundException('Alert not found');
    }

    return { success: true };
  }

  private mapAlert(row: AlertRow) {
    return {
      id: row.id,
      userId: row.userId,
      alertType: row.alertType,
      severity: row.severity,
      title: row.title,
      message: row.message,
      linkedEntityType: row.linkedEntityType,
      linkedEntityId: row.linkedEntityId,
      isRead: toBooleanFlag(row.isRead),
      isResolved: toBooleanFlag(row.isResolved),
      createdAt: toIsoDateTime(row.createdAt),
      resolvedAt: toIsoDateTime(row.resolvedAt),
    };
  }
}
