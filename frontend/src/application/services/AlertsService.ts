import { AlertsRepository } from "@/infrastructure/repositories/AlertsRepository";

export class AlertsService {
  constructor(private readonly repository: AlertsRepository) {}

  listAlerts() {
    return this.repository.listAlerts();
  }

  markAsRead(alertId: number) {
    return this.repository.markAsRead(alertId);
  }

  resolveAlert(alertId: number) {
    return this.repository.resolveAlert(alertId);
  }
}
