export interface TaxUserProfile {
  fullName: string;
  taxId: string | null;
  hasValidTaxId: boolean;
}

export interface TaxObligationItem {
  id: string;
  sourceDocumentId: number;
  obligationType: "VAT" | "IRPF";
  label: string;
  concept: string;
  counterpartyName: string | null;
  sourceDocumentType: string;
  effectiveDate: string | null;
  periodYear: number;
  periodMonth: number | null;
  amount: number;
  status: "PENDING_REVIEW";
  matchedUserTaxId: string | null;
  detectedIssuerTaxId: string | null;
  settlementYear: number;
  settlementQuarter: number;
  settlementLabel: string;
  dueDate: string;
  notes: string | null;
}

export interface TaxPeriodOverview {
  profile: TaxUserProfile;
  period: {
    year: number;
    month: number | null;
    startDate: string;
    endDate: string;
    label: string;
  };
  totals: {
    totalAmount: number;
    totalVatAmount: number;
    totalIrpfAmount: number;
    recordCount: number;
  };
  items: TaxObligationItem[];
}

export interface TaxPeriodFilters {
  year: number;
  month?: number;
}
