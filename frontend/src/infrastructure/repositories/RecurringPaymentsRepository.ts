import type {
  CreateRecurringPaymentInput,
  RecurringPaymentRecord,
  UpdateRecurringPaymentInput,
} from "@/domain/interfaces/recurring-payment.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class RecurringPaymentsRepository {
  listRecurringPayments() {
    return fetchWithAuth<RecurringPaymentRecord[]>("/recurring-payments");
  }

  createRecurringPayment(payload: CreateRecurringPaymentInput) {
    return fetchWithAuth<RecurringPaymentRecord>("/recurring-payments", {
      method: "POST",
      body: payload,
    });
  }

  updateRecurringPayment(
    recurringPaymentId: number,
    payload: UpdateRecurringPaymentInput,
  ) {
    return fetchWithAuth<RecurringPaymentRecord>(
      `/recurring-payments/${recurringPaymentId}`,
      {
        method: "PUT",
        body: payload,
      },
    );
  }
}
