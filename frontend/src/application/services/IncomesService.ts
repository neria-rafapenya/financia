import type {
  CreateIncomeInput,
  IncomePeriodFilters,
  IncomePeriodOverview,
  UpdateIncomeInput,
} from "@/domain/interfaces/income.interface";
import { IncomesRepository } from "@/infrastructure/repositories/IncomesRepository";

export class IncomesService {
  constructor(private readonly repository: IncomesRepository) {}

  getPeriodOverview(
    filters: IncomePeriodFilters,
  ): Promise<IncomePeriodOverview> {
    return this.repository.getPeriodOverview(filters);
  }

  createIncome(payload: CreateIncomeInput) {
    return this.repository.createIncome(payload);
  }

  updateIncome(incomeId: number, payload: UpdateIncomeInput) {
    return this.repository.updateIncome(incomeId, payload);
  }

  removeIncome(incomeId: number) {
    return this.repository.removeIncome(incomeId);
  }

  removeDocumentIncome(documentId: number) {
    return this.repository.removeDocumentIncome(documentId);
  }
}
