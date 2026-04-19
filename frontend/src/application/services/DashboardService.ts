import type { DashboardOverview } from "@/domain/interfaces/dashboard.interface";
import { DashboardRepository } from "@/infrastructure/repositories/DashboardRepository";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async loadOverview(): Promise<DashboardOverview> {
    const currentYear = new Date().getFullYear();
    const [user, incomes, expenses, alerts, documents] = await Promise.all([
      this.repository.getCurrentUser(),
      this.repository.getIncomeOverview(currentYear),
      this.repository.getExpenseOverview(currentYear),
      this.repository.getAlerts(),
      this.repository.getDocuments(),
    ]);

    return {
      currentYear,
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
