import type { CreatePayerPayload } from "@/domain/interfaces/payer.interface";
import { PayersRepository } from "@/infrastructure/repositories/PayersRepository";

export class PayersService {
  constructor(private readonly repository: PayersRepository) {}

  list() {
    return this.repository.list();
  }

  create(payload: CreatePayerPayload) {
    return this.repository.create(payload);
  }
}
