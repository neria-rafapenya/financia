import type {
  TaxPeriodFilters,
  TaxPeriodOverview,
} from "@/domain/interfaces/tax.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class TaxRepository {
  getPeriodOverview(filters: TaxPeriodFilters) {
    const searchParams = new URLSearchParams({
      year: String(filters.year),
    });

    if (typeof filters.month === "number") {
      searchParams.set("month", String(filters.month));
    }

    return fetchWithAuth<TaxPeriodOverview>(
      `/tax/obligations?${searchParams.toString()}`,
    );
  }
}
