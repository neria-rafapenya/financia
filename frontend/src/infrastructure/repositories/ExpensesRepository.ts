import type {
  CreateExpenseInput,
  ExpensePeriodFilters,
  ExpensePeriodOverview,
  UpdateExpenseInput,
} from "@/domain/interfaces/expense.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class ExpensesRepository {
  createExpense(payload: CreateExpenseInput) {
    return fetchWithAuth("/expenses", {
      method: "POST",
      body: payload,
    });
  }

  updateExpense(expenseId: number, payload: UpdateExpenseInput) {
    return fetchWithAuth(`/expenses/${expenseId}`, {
      method: "PUT",
      body: payload,
    });
  }

  getPeriodOverview(filters: ExpensePeriodFilters) {
    const searchParams = new URLSearchParams({
      year: String(filters.year),
    });

    if (typeof filters.month === "number") {
      searchParams.set("month", String(filters.month));
    }

    return fetchWithAuth<ExpensePeriodOverview>(
      `/expenses/period?${searchParams.toString()}`,
    );
  }
}
