import type {
  CreateRecurringPaymentInput,
  UpdateRecurringPaymentInput,
} from "@/domain/interfaces/recurring-payment.interface";
import { RecurringPaymentsRepository } from "@/infrastructure/repositories/RecurringPaymentsRepository";

export class RecurringPaymentsService {
  constructor(private readonly repository: RecurringPaymentsRepository) {}

  listRecurringPayments() {
    return this.repository.listRecurringPayments();
  }

  createRecurringPayment(payload: CreateRecurringPaymentInput) {
    return this.repository.createRecurringPayment(payload);
  }

  updateRecurringPayment(
    recurringPaymentId: number,
    payload: UpdateRecurringPaymentInput,
  ) {
    return this.repository.updateRecurringPayment(recurringPaymentId, payload);
  }
}
