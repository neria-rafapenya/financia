import type { User } from "./user.interface";
import type { AlertRecord } from "./alert.interface";
import type { ContractRecord } from "./contract.interface";
import type { DocumentRecord } from "./document.interface";
import type { RecurringPaymentRecord } from "./recurring-payment.interface";
import type { TaxObligationItem } from "./tax.interface";

export interface IncomeTotals {
  totalGrossAmount: number;
  totalNetAmount: number;
  totalIrpfWithheld: number;
  totalSocialSecurityAmount: number;
  recordCount: number;
}

export interface ExpenseTotals {
  totalAmount: number;
  totalVatAmount: number;
  recordCount: number;
}

export interface AlertSummary {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  linkedEntityType: string | null;
  linkedEntityId: number | null;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string | null;
}

export interface DashboardPriorityItem {
  id: string;
  category: "taxes" | "documents" | "alerts" | "recurring-payments";
  title: string;
  detail: string;
  urgencyLabel: "alta" | "media";
  to: string;
  actionLabel: string;
}

export interface DashboardOverview {
  currentYear: number;
  user: User | null;
  incomes: IncomeTotals | null;
  expenses: ExpenseTotals | null;
  unreadAlerts: AlertSummary[];
  alertInbox: AlertRecord[];
  unresolvedAlertsCount: number;
  uploadedDocuments: number;
  documentsPendingReviewCount: number;
  documentsPendingReview: DocumentRecord[];
  activeContractsCount: number;
  recurringPaymentsDueSoonCount: number;
  contracts: ContractRecord[];
  recurringPayments: RecurringPaymentRecord[];
  recurringPaymentsDueSoon: RecurringPaymentRecord[];
  nextTaxDeadlines: TaxObligationItem[];
  priorityItems: DashboardPriorityItem[];
}
