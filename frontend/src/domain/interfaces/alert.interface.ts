export interface AlertRecord {
  id: number;
  userId: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string | null;
  resolvedAt: string | null;
}
