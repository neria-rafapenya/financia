import type { ExpenseDeductibilityStatus } from "@/domain/interfaces/expense.interface";

export type RecurringPaymentFrequency =
  | "MONTHLY"
  | "QUARTERLY"
  | "BIANNUAL"
  | "YEARLY";

export interface RecurringPaymentRecord {
  id: number;
  userId: number;
  categoryId: number | null;
  title: string;
  amount: number;
  frequency: RecurringPaymentFrequency;
  nextDueDate: string;
  isActive: boolean;
  deductibilityStatus: ExpenseDeductibilityStatus;
  notes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateRecurringPaymentInput {
  categoryId?: number | null;
  title: string;
  amount: number;
  frequency: RecurringPaymentFrequency;
  nextDueDate: string;
  isActive?: boolean;
  deductibilityStatus?: ExpenseDeductibilityStatus;
  notes?: string;
}
