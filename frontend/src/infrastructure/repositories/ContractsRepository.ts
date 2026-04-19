import type {
  ContractRecord,
  CreateContractInput,
  UpdateContractInput,
} from "@/domain/interfaces/contract.interface";
import { fetchWithAuth } from "@/shared/api/api";

export class ContractsRepository {
  listContracts() {
    return fetchWithAuth<ContractRecord[]>("/contracts");
  }

  createContract(payload: CreateContractInput) {
    return fetchWithAuth<ContractRecord>("/contracts", {
      method: "POST",
      body: payload,
    });
  }

  updateContract(contractId: number, payload: UpdateContractInput) {
    return fetchWithAuth<ContractRecord>(`/contracts/${contractId}`, {
      method: "PUT",
      body: payload,
    });
  }
}
