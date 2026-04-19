import type { User } from "./user.interface";
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
    isRead: boolean;
    isResolved: boolean;
    createdAt: string | null;
}
export interface DashboardOverview {
    user: User | null;
    incomes: IncomeTotals | null;
    expenses: ExpenseTotals | null;
    unreadAlerts: AlertSummary[];
    uploadedDocuments: number;
}
