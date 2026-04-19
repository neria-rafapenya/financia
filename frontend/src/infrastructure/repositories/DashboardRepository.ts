import type {
  AlertSummary,
  ExpenseTotals,
  IncomeTotals,
} from "@/domain/interfaces/dashboard.interface";
import type { DocumentRecord } from "@/domain/interfaces/document.interface";
import type { User } from "@/domain/interfaces/user.interface";
import { fetchWithAuth } from "@/shared/api/api";

interface AuthMeResponse {
  user: User;
}

interface IncomeSummaryResponse {
  totals: IncomeTotals;
}

interface ExpenseSummaryResponse {
  totals: ExpenseTotals;
}

export class DashboardRepository {
  getCurrentUser() {
    return fetchWithAuth<AuthMeResponse>("/auth/me").then(
      (response) => response.user,
    );
  }

  getIncomeSummary() {
    return fetchWithAuth<IncomeSummaryResponse>("/incomes/summary").then(
      (response) => response.totals,
    );
  }

  getExpenseSummary() {
    return fetchWithAuth<ExpenseSummaryResponse>("/expenses/summary").then(
      (response) => response.totals,
    );
  }

  getAlerts() {
    return fetchWithAuth<AlertSummary[]>("/alerts");
  }

  getDocuments() {
    return fetchWithAuth<DocumentRecord[]>("/documents");
  }
}
