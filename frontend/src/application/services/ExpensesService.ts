import type {
  CreateExpenseInput,
  ExpensePeriodFilters,
  ExpensePeriodOverview,
  UpdateExpenseInput,
} from "@/domain/interfaces/expense.interface";
import { ExpensesRepository } from "@/infrastructure/repositories/ExpensesRepository";

export class ExpensesService {
  constructor(private readonly repository: ExpensesRepository) {}

  createExpense(payload: CreateExpenseInput) {
    return this.repository.createExpense(payload);
  }

  updateExpense(expenseId: number, payload: UpdateExpenseInput) {
    return this.repository.updateExpense(expenseId, payload);
  }

  getPeriodOverview(
    filters: ExpensePeriodFilters,
  ): Promise<ExpensePeriodOverview> {
    return this.repository.getPeriodOverview(filters);
  }
}
