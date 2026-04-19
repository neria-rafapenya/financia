import type {
  AnnualTaxReturnEstimate,
  AnnualTaxReturnEstimateFilters,
} from "@/domain/interfaces/simulation.interface";
import { SimulationsRepository } from "@/infrastructure/repositories/SimulationsRepository";

export class SimulationsService {
  constructor(private readonly repository: SimulationsRepository) {}

  getAnnualTaxReturnEstimate(
    filters: AnnualTaxReturnEstimateFilters,
  ): Promise<AnnualTaxReturnEstimate> {
    return this.repository.getAnnualTaxReturnEstimate(filters);
  }
}
