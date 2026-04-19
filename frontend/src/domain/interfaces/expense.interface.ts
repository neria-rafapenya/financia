export interface ExpensePeriodItem {
  id: string;
  source: "MANUAL" | "DOCUMENT" | "DOCUMENT_TAX";
  sourceId: number;
  expenseDate: string | null;
  concept: string;
  vendorName: string | null;
  amount: number;
  vatAmount: number | null;
  isPaid: boolean | null;
  deductibilityStatus: string;
  notes: string | null;
}

export type ExpenseDeductibilityStatus =
  | "DEDUCTIBLE"
  | "NON_DEDUCTIBLE"
  | "REVIEWABLE"
  | "UNKNOWN";

export interface CreateExpenseInput {
  expenseDate: string;
  concept: string;
  vendorName?: string;
  amount: number;
  vatAmount?: number | null;
  isPaid?: boolean;
  currency?: string;
  sourceType?: "MANUAL";
  deductibilityStatus?: ExpenseDeductibilityStatus;
  businessUsePercent?: number | null;
  notes?: string;
}

export interface UpdateExpenseInput {
  categoryId?: number | null;
  payerId?: number | null;
  expenseDate?: string;
  concept?: string;
  vendorName?: string | null;
  amount?: number;
  vatAmount?: number | null;
  isPaid?: boolean;
  currency?: string;
  sourceType?: "MANUAL";
  deductibilityStatus?: ExpenseDeductibilityStatus;
  businessUsePercent?: number | null;
  notes?: string | null;
}

export interface ExpensePeriodOverview {
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
  items: ExpensePeriodItem[];
}

export interface ExpensePeriodFilters {
  year: number;
  month?: number;
}
