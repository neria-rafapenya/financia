import type {
  CreatePayerPayload,
  UpdatePayerPayload,
} from "@/domain/interfaces/payer.interface";
import { PayersRepository } from "@/infrastructure/repositories/PayersRepository";

export class PayersService {
  constructor(private readonly repository: PayersRepository) {}

  list() {
    return this.repository.list();
  }

  create(payload: CreatePayerPayload) {
    return this.repository.create(payload);
  }

  update(payerId: number, payload: UpdatePayerPayload) {
    return this.repository.update(payerId, payload);
  }

  remove(payerId: number) {
    return this.repository.remove(payerId);
  }
}
