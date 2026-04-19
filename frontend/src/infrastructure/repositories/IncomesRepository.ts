import type {
  IncomePeriodFilters,
  IncomePeriodOverview,
} from "@/domain/interfaces/income.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class IncomesRepository {
  getPeriodOverview(filters: IncomePeriodFilters) {
    const searchParams = new URLSearchParams({
      year: String(filters.year),
    });

    if (typeof filters.month === "number") {
      searchParams.set("month", String(filters.month));
    }

    return fetchWithAuth<IncomePeriodOverview>(
      `/incomes/period?${searchParams.toString()}`,
    );
  }

  removeIncome(incomeId: number) {
    return fetchWithAuth<{ id: number; deleted: boolean }>(
      `/incomes/${incomeId}`,
      {
        method: "DELETE",
      },
    );
  }

  removeDocumentIncome(documentId: number) {
    return fetchWithAuth<{ id: number; deleted: boolean }>(
      `/documents/${documentId}`,
      {
        method: "DELETE",
      },
    );
  }
}
