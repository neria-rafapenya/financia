import type {
  CreatePayerPayload,
  Payer,
} from "@/domain/interfaces/payer.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class PayersRepository {
  list() {
    return fetchWithAuth<Payer[]>("/payers");
  }

  create(payload: CreatePayerPayload) {
    return fetchWithAuth<Payer>("/payers", {
      method: "POST",
      body: payload,
    });
  }
}
