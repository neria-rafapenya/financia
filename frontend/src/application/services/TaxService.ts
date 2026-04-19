import type {
  TaxPeriodFilters,
  TaxPeriodOverview,
} from "@/domain/interfaces/tax.interface";
import { TaxRepository } from "@/infrastructure/repositories/TaxRepository";

export class TaxService {
  constructor(private readonly repository: TaxRepository) {}

  getPeriodOverview(filters: TaxPeriodFilters): Promise<TaxPeriodOverview> {
    return this.repository.getPeriodOverview(filters);
  }
}
