import type {
  CreateContractInput,
  UpdateContractInput,
} from "@/domain/interfaces/contract.interface";
import { ContractsRepository } from "@/infrastructure/repositories/ContractsRepository";

export class ContractsService {
  constructor(private readonly repository: ContractsRepository) {}

  listContracts() {
    return this.repository.listContracts();
  }

  createContract(payload: CreateContractInput) {
    return this.repository.createContract(payload);
  }

  updateContract(contractId: number, payload: UpdateContractInput) {
    return this.repository.updateContract(contractId, payload);
  }
}
