import type {
  DashboardOverview,
  DashboardPriorityItem,
} from "@/domain/interfaces/dashboard.interface";
import type { AlertRecord } from "@/domain/interfaces/alert.interface";
import type { DocumentRecord } from "@/domain/interfaces/document.interface";
import type { RecurringPaymentRecord } from "@/domain/interfaces/recurring-payment.interface";
import type { TaxObligationItem } from "@/domain/interfaces/tax.interface";
import { DashboardRepository } from "@/infrastructure/repositories/DashboardRepository";

function isRecurringPaymentDueSoon(nextDueDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(nextDueDate);
  dueDate.setHours(0, 0, 0, 0);

  const daysUntilDueDate =
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  return daysUntilDueDate <= 30;
}

function getSeverityRank(severity: string) {
  if (severity === "HIGH") {
    return 3;
  }

  if (severity === "MEDIUM") {
    return 2;
  }

  return 1;
}

function getDocumentDetailRoute(documentId: number) {
  return `/documents/${documentId}`;
}

function buildPriorityItems(params: {
  alerts: AlertRecord[];
  documentsPendingReview: DocumentRecord[];
  nextTaxDeadlines: TaxObligationItem[];
  recurringPaymentsDueSoon: RecurringPaymentRecord[];
}) {
  const items: Array<DashboardPriorityItem & { score: number }> = [];

  params.nextTaxDeadlines.slice(0, 3).forEach((item, index) => {
    items.push({
      id: `tax-${item.id}`,
      category: "taxes",
      title: `${item.obligationType} · ${item.settlementLabel}`,
      detail: `${item.counterpartyName ?? "Sin contraparte"} · vence ${item.dueDate}`,
      urgencyLabel: "alta",
      to: getDocumentDetailRoute(item.sourceDocumentId),
      actionLabel: "Abrir documento origen",
      score: 100 - index,
    });
  });

  params.documentsPendingReview.slice(0, 3).forEach((document, index) => {
    items.push({
      id: `document-${document.id}`,
      category: "documents",
      title: document.displayName,
      detail: `${document.status} · ${document.documentDate ?? "sin fecha"}`,
      urgencyLabel: "alta",
      to: getDocumentDetailRoute(document.id),
      actionLabel: "Revisar documento",
      score: 80 - index,
    });
  });

  params.alerts.slice(0, 3).forEach((alert, index) => {
    items.push({
      id: `alert-${alert.id}`,
      category: "alerts",
      title: alert.title,
      detail: alert.message,
      urgencyLabel: getSeverityRank(alert.severity) >= 3 ? "alta" : "media",
      to:
        alert.linkedEntityType === "DOCUMENT" && alert.linkedEntityId
          ? getDocumentDetailRoute(alert.linkedEntityId)
          : "/alerts",
      actionLabel:
        alert.linkedEntityType === "DOCUMENT" && alert.linkedEntityId
          ? "Abrir registro afectado"
          : "Abrir alertas",
      score: 70 + getSeverityRank(alert.severity) * 2 - index,
    });
  });

  params.recurringPaymentsDueSoon.slice(0, 2).forEach((payment, index) => {
    items.push({
      id: `recurring-${payment.id}`,
      category: "recurring-payments",
      title: payment.title,
      detail: `${payment.nextDueDate} · ${payment.frequency}`,
      urgencyLabel: "media",
      to: "/recurring-payments",
      actionLabel: "Revisar pagos",
      score: 50 - index,
    });
  });

  const orderedItems = [...items].sort(
    (left, right) => right.score - left.score,
  );

  return orderedItems.slice(0, 6);
}

export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async loadOverview(): Promise<DashboardOverview> {
    const currentYear = new Date().getFullYear();
    const [
      user,
      incomes,
      expenses,
      alerts,
      documents,
      contracts,
      recurring,
      taxOverview,
    ] = await Promise.all([
      this.repository.getCurrentUser(),
      this.repository.getIncomeOverview(currentYear),
      this.repository.getExpenseOverview(currentYear),
      this.repository.getAlerts(),
      this.repository.getDocuments(),
      this.repository.getContracts(),
      this.repository.getRecurringPayments(),
      this.repository.getTaxOverview(currentYear),
    ]);

    const unresolvedAlerts = alerts.filter((alert) => !alert.isResolved);
    const unreadAlerts = unresolvedAlerts.filter((alert) => !alert.isRead);
    const documentsPendingReview = documents
      .filter((document) => document.status !== "VERIFIED")
      .sort((left, right) => {
        const leftDate = left.updatedAt ?? left.createdAt ?? "";
        const rightDate = right.updatedAt ?? right.createdAt ?? "";

        return rightDate.localeCompare(leftDate);
      });
    const activeContracts = contracts.filter(
      (contract) => contract.status === "ACTIVE",
    );
    const recurringPaymentsDueSoon = recurring
      .filter(
        (payment) =>
          payment.isActive && isRecurringPaymentDueSoon(payment.nextDueDate),
      )
      .sort((left, right) => left.nextDueDate.localeCompare(right.nextDueDate));
    const nextTaxDeadlines = taxOverview.items
      .slice()
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
      .slice(0, 4);
    const priorityItems = buildPriorityItems({
      alerts: unresolvedAlerts
        .slice()
        .sort(
          (left, right) =>
            getSeverityRank(right.severity) - getSeverityRank(left.severity),
        ),
      documentsPendingReview,
      nextTaxDeadlines,
      recurringPaymentsDueSoon,
    });

    return {
      currentYear,
      user,
      incomes,
      expenses,
      unreadAlerts: unreadAlerts.slice(0, 4),
      alertInbox: unresolvedAlerts,
      unresolvedAlertsCount: unresolvedAlerts.length,
      uploadedDocuments: documents.length,
      documentsPendingReviewCount: documentsPendingReview.length,
      documentsPendingReview: documentsPendingReview.slice(0, 4),
      activeContractsCount: activeContracts.length,
      recurringPaymentsDueSoonCount: recurringPaymentsDueSoon.length,
      contracts,
      recurringPayments: recurring,
      recurringPaymentsDueSoon: recurringPaymentsDueSoon.slice(0, 4),
      nextTaxDeadlines,
      priorityItems,
    };
  }
}
