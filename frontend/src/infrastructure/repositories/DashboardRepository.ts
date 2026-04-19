import type {
  AlertSummary,
  ExpenseTotals,
  IncomeTotals,
} from "@/domain/interfaces/dashboard.interface";
import type { DocumentRecord } from "@/domain/interfaces/document.interface";
import type { ExpensePeriodOverview } from "@/domain/interfaces/expense.interface";
import type { IncomePeriodOverview } from "@/domain/interfaces/income.interface";
import type { User } from "@/domain/interfaces/user.interface";
import { fetchWithAuth } from "@/shared/api/api";

interface AuthMeResponse {
  user: User;
}

export class DashboardRepository {
  getCurrentUser() {
    return fetchWithAuth<AuthMeResponse>("/auth/me").then(
      (response) => response.user,
    );
  }

  getIncomeOverview(year: number) {
    return fetchWithAuth<IncomePeriodOverview>(
      `/incomes/period?year=${year}`,
    ).then(
      (response) =>
        ({
          totalGrossAmount: response.totals.totalGrossAmount,
          totalNetAmount: response.totals.totalNetAmount,
          totalIrpfWithheld: response.totals.totalIrpfWithheld,
          totalSocialSecurityAmount: response.totals.totalSocialSecurityAmount,
          recordCount: response.totals.recordCount,
        }) satisfies IncomeTotals,
    );
  }

  getExpenseOverview(year: number) {
    return fetchWithAuth<ExpensePeriodOverview>(
      `/expenses/period?year=${year}`,
    ).then(
      (response) =>
        ({
          totalAmount: response.totals.totalAmount,
          totalVatAmount: response.totals.totalVatAmount,
          recordCount: response.totals.recordCount,
        }) satisfies ExpenseTotals,
    );
  }

  getAlerts() {
    return fetchWithAuth<AlertSummary[]>("/alerts");
  }

  getDocuments() {
    return fetchWithAuth<DocumentRecord[]>("/documents");
  }
}
