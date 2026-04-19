import type {
  CreatePayerPayload,
  Payer,
  UpdatePayerPayload,
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

  update(payerId: number, payload: UpdatePayerPayload) {
    return fetchWithAuth<Payer>(`/payers/${payerId}`, {
      method: "PUT",
      body: payload,
    });
  }

  remove(payerId: number) {
    return fetchWithAuth<{ success: boolean }>(`/payers/${payerId}`, {
      method: "DELETE",
    });
  }
}
