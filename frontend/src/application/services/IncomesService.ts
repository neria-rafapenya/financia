import type {
  IncomePeriodFilters,
  IncomePeriodOverview,
} from "@/domain/interfaces/income.interface";
import { IncomesRepository } from "@/infrastructure/repositories/IncomesRepository";

export class IncomesService {
  constructor(private readonly repository: IncomesRepository) {}

  getPeriodOverview(
    filters: IncomePeriodFilters,
  ): Promise<IncomePeriodOverview> {
    return this.repository.getPeriodOverview(filters);
  }

  removeIncome(incomeId: number) {
    return this.repository.removeIncome(incomeId);
  }

  removeDocumentIncome(documentId: number) {
    return this.repository.removeDocumentIncome(documentId);
  }
}
