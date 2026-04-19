export interface IncomePeriod {
  year: number;
  month: number | null;
  startDate: string;
  endDate: string;
  label: string;
  fiscalYearStartDate: string;
}

export interface IncomePeriodTotals {
  totalGrossAmount: number;
  totalNetAmount: number;
  totalVatAmount: number;
  totalIrpfWithheld: number;
  totalSocialSecurityAmount: number;
  totalPeriodAmount: number;
  recordCount: number;
}

export interface IncomePeriodItem {
  id: string;
  source: "MANUAL" | "DOCUMENT";
  sourceId: number;
  sourceDocumentType: string | null;
  incomeType: string;
  label: string;
  counterpartyName: string | null;
  periodYear: number;
  periodMonth: number | null;
  effectiveDate: string | null;
  grossAmount: number;
  netAmount: number | null;
  vatAmount: number | null;
  irpfWithheld: number | null;
  socialSecurityAmount: number | null;
  effectiveAmount: number;
  notes: string | null;
}

export interface IncomePeriodOverview {
  period: IncomePeriod;
  totals: IncomePeriodTotals;
  items: IncomePeriodItem[];
}

export interface IncomePeriodFilters {
  year: number;
  month?: number;
}
