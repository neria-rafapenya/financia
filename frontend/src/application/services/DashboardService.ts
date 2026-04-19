import type { DashboardOverview } from "@/domain/interfaces/dashboard.interface";
import { DashboardRepository } from "@/infrastructure/repositories/DashboardRepository";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async loadOverview(): Promise<DashboardOverview> {
    const [user, incomes, expenses, alerts, documents] = await Promise.all([
      this.repository.getCurrentUser(),
      this.repository.getIncomeSummary(),
      this.repository.getExpenseSummary(),
      this.repository.getAlerts(),
      this.repository.getDocuments(),
    ]);

    return {
      user,
      incomes,
      expenses,
      unreadAlerts: alerts
        .filter((alert) => !alert.isRead && !alert.isResolved)
        .slice(0, 4),
      uploadedDocuments: documents.length,
    };
  }
}
