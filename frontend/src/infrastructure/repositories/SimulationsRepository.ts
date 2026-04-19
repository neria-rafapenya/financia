import type {
  AnnualTaxReturnEstimate,
  AnnualTaxReturnEstimateFilters,
} from "@/domain/interfaces/simulation.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class SimulationsRepository {
  getAnnualTaxReturnEstimate(filters: AnnualTaxReturnEstimateFilters) {
    const searchParams = new URLSearchParams({
      year: String(filters.year),
    });

    if (filters.declarationMode) {
      searchParams.set("declarationMode", filters.declarationMode);
    }

    if (typeof filters.dependentChildrenCount === "number") {
      searchParams.set(
        "dependentChildrenCount",
        String(filters.dependentChildrenCount),
      );
    }

    if (typeof filters.annualPensionContributionAmount === "number") {
      searchParams.set(
        "annualPensionContributionAmount",
        String(filters.annualPensionContributionAmount),
      );
    }

    if (typeof filters.annualDonationAmount === "number") {
      searchParams.set(
        "annualDonationAmount",
        String(filters.annualDonationAmount),
      );
    }

    if (typeof filters.annualHousingDeductionAmount === "number") {
      searchParams.set(
        "annualHousingDeductionAmount",
        String(filters.annualHousingDeductionAmount),
      );
    }

    if (typeof filters.applyReviewableExpenses === "boolean") {
      searchParams.set(
        "applyReviewableExpenses",
        String(filters.applyReviewableExpenses),
      );
    }

    return fetchWithAuth<AnnualTaxReturnEstimate>(
      `/simulations/annual-tax-return-estimate?${searchParams.toString()}`,
    );
  }
}
