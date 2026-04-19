import type { CreateRecurringPaymentInput } from "@/domain/interfaces/recurring-payment.interface";
import { RecurringPaymentsRepository } from "@/infrastructure/repositories/RecurringPaymentsRepository";

export class RecurringPaymentsService {
  constructor(private readonly repository: RecurringPaymentsRepository) {}

  createRecurringPayment(payload: CreateRecurringPaymentInput) {
    return this.repository.createRecurringPayment(payload);
  }
}
