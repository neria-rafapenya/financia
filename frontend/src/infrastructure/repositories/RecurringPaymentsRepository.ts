import type {
  CreateRecurringPaymentInput,
  RecurringPaymentRecord,
} from "@/domain/interfaces/recurring-payment.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class RecurringPaymentsRepository {
  createRecurringPayment(payload: CreateRecurringPaymentInput) {
    return fetchWithAuth<RecurringPaymentRecord>("/recurring-payments", {
      method: "POST",
      body: payload,
    });
  }
}
